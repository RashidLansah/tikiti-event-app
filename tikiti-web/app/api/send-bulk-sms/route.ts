// Next.js API route handler for sending bulk SMS via Arkesel
// This route proxies to the Vercel serverless function
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipients, message, eventName } = body;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients provided' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if Arkesel is configured
    const arkeselApiKey = process.env.ARKESEL_API_KEY || 'OjdpMG0zVThlOVJMOHBJWmM=';
    const arkeselSenderId = process.env.ARKESEL_SENDER_ID || 'Tikiti';

    if (!arkeselApiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'SMS service not configured. Please configure ARKESEL_API_KEY environment variable.',
        },
        { status: 503 }
      );
    }

    // Format message with event name if provided
    const fullMessage = eventName 
      ? `${eventName}: ${message}`.substring(0, 1600) // SMS character limit
      : message.substring(0, 1600);

    // Arkesel API endpoint - uses GET with query parameters
    const arkeselBaseUrl = 'https://sms.arkesel.com/sms/api';
    
    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
      messageIds: [] as Array<{ phone: string; messageId: string }>,
    };

    // Format recipients for Arkesel
    // Arkesel expects phone numbers in international format without + (e.g., 233501234567)
    const formattedRecipients = recipients.map((recipient: any) => {
      let phoneNumber = recipient.phone.replace(/\s/g, '').replace(/\+/g, '');
      
      // Format phone number for Ghana (Arkesel is primarily for Ghana)
      if (phoneNumber.startsWith('0')) {
        // Convert 0244123456 to 233244123456
        phoneNumber = '233' + phoneNumber.substring(1);
      } else if (!phoneNumber.startsWith('233')) {
        // Assume Ghana number if no country code
        phoneNumber = '233' + phoneNumber;
      }
      
      return {
        phone: phoneNumber,
        name: recipient.name || 'Guest',
      };
    });

    // Send SMS to each recipient (Arkesel API requires one request per recipient)
    for (const recipient of formattedRecipients) {
      try {
        // Build URL manually to ensure proper encoding
        // Format: https://sms.arkesel.com/sms/api?action=send-sms&api_key=...&to=...&from=...&sms=...
        const encodedMessage = encodeURIComponent(fullMessage);
        const arkeselUrl = `${arkeselBaseUrl}?action=send-sms&api_key=${encodeURIComponent(arkeselApiKey)}&to=${recipient.phone}&from=${encodeURIComponent(arkeselSenderId)}&sms=${encodedMessage}`;
        
        // Log the request (without full URL for security)
        console.log(`📤 Sending SMS to ${recipient.phone} via Arkesel...`);
        console.log(`📤 URL preview: ${arkeselBaseUrl}?action=send-sms&api_key=***&to=${recipient.phone}&from=${arkeselSenderId}&sms=[${fullMessage.length} chars]`);

        const response = await fetch(arkeselUrl, {
          method: 'GET', // Arkesel API uses GET with query parameters
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Tikiti-Events/1.0',
          },
        });

        const responseText = await response.text();
        
        // Log response for debugging - FULL DETAILS
        console.log(`📥 Arkesel HTTP Status: ${response.status}`);
        console.log(`📥 Arkesel Response Headers:`, JSON.stringify(Object.fromEntries(response.headers.entries())));
        console.log(`📥 Arkesel Full Response Text:`, responseText);
        console.log(`📥 Phone Number Sent To: ${recipient.phone}`);
        console.log(`📥 Sender ID Used: ${arkeselSenderId}`);
        console.log(`📥 Message Length: ${fullMessage.length} characters`);
        
        // Arkesel typically returns JSON or plain text
        let responseData;
        let isSuccess = false;
        
        try {
          // Try to parse as JSON first
          responseData = JSON.parse(responseText);
          
          // Check for success indicators in JSON response
          // Arkesel v1 returns: { "code": "ok", "message": "Successfully Sent", "balance": 520, ... }
          // Arkesel v2 might return: { "status": "success", "data": [{ "id": "...", ... }] }
          if (responseData.status === 'success' || 
              responseData.code === 200 || 
              responseData.code === 'ok' || // Arkesel v1 uses "ok" as code
              responseData.status === 'ok' ||
              responseData.status === 'Success' ||
              (responseData.message && responseData.message.toLowerCase().includes('success')) ||
              (responseData.message && responseData.message.toLowerCase().includes('sent'))) {
            isSuccess = true;
            console.log(`✅ Arkesel confirmed success for ${recipient.phone}`);
            
            // Log balance info if available (Arkesel v1 format)
            if (responseData.balance !== undefined) {
              console.log(`💰 SMS Credits Balance: ${responseData.balance}`);
            }
            if (responseData.main_balance !== undefined) {
              console.log(`💰 Main Account Balance: ${responseData.main_balance}`);
            }
          } else {
            console.warn(`⚠️ Arkesel response indicates failure for ${recipient.phone}:`, responseData);
          }
        } catch (parseError) {
          // If not JSON, check if it's HTML (error page)
          if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
            console.error(`❌ Arkesel returned HTML error page for ${recipient.phone}`);
            responseData = { 
              message: 'Arkesel API returned an error page. Check API endpoint and parameters.',
              status: 'error',
              htmlResponse: responseText.substring(0, 200) // First 200 chars for debugging
            };
          } else {
            // Plain text response - check for success keywords
            const lowerText = responseText.toLowerCase();
            console.log(`📝 Arkesel plain text response for ${recipient.phone}:`, responseText);
            if (lowerText.includes('success') || 
                lowerText.includes('sent') || 
                lowerText.includes('ok') ||
                lowerText.includes('message sent') ||
                lowerText.includes('delivered')) {
              isSuccess = true;
              responseData = { message: responseText, status: 'success' };
              console.log(`✅ Arkesel plain text indicates success for ${recipient.phone}`);
            } else {
              responseData = { message: responseText, status: 'error' };
              console.warn(`⚠️ Arkesel plain text indicates failure for ${recipient.phone}:`, responseText);
            }
          }
        }

        if (response.ok && isSuccess) {
          results.sent++;
          console.log(`✅ SMS marked as sent to ${recipient.phone}`);
          console.log(`📋 Arkesel Response Data:`, JSON.stringify(responseData, null, 2));
          
          // Extract message ID from various possible response formats
          // Arkesel v2 returns: { status: "success", data: [{ recipient: "...", id: "..." }] }
          // Arkesel v1 might return: { status: "success", id: "..." } or plain text
          let messageId = null;
          
          // Check for nested data array (v2 format)
          if (responseData.data && Array.isArray(responseData.data)) {
            const recipientData = responseData.data.find((item: any) => 
              item.recipient === recipient.phone || 
              item.to === recipient.phone ||
              item.phone === recipient.phone
            );
            if (recipientData) {
              messageId = recipientData.id || recipientData.messageId || recipientData.message_id;
            }
          }
          
          // Check top-level ID fields
          if (!messageId) {
            messageId = responseData.messageId || 
                       responseData.id || 
                       responseData.bulk_id || 
                       responseData.bulkId ||
                       responseData.message_id ||
                       responseData.sms_id ||
                       responseData.smsId;
          }
          
          if (messageId) {
            console.log(`📨 Message ID for ${recipient.phone}: ${messageId}`);
            // Store message ID in results for tracking
            if (!results.messageIds) {
              results.messageIds = [];
            }
            results.messageIds.push({
              phone: recipient.phone,
              messageId: messageId,
            });
          } else {
            // Arkesel v1 API doesn't return message IDs - this is normal
            // The response format is: { "code": "ok", "message": "Successfully Sent", "balance": 520, ... }
            console.log(`ℹ️ Arkesel v1 API response - no message ID provided (this is normal for v1 API)`);
            console.log(`   Response indicates: ${responseData.message || responseData.code || 'Success'}`);
            
            // Only log full structure in debug mode or if there's an error
            if (process.env.NODE_ENV === 'development') {
              const allKeys = Object.keys(responseData);
              console.log(`   Response keys: ${allKeys.join(', ')}`);
            }
          }
        } else {
          console.error(`❌ Failed to send SMS to ${recipient.phone}`);
          console.error(`📋 Full Error Details:`, JSON.stringify(responseData, null, 2));
          console.error(`📋 HTTP Status: ${response.status}`);
          console.error(`📋 Response Text: ${responseText}`);
          results.failed++;
          const errorMsg = responseData.message || responseData.error || responseText || 'Failed to send SMS';
          results.errors.push(`${recipient.name || recipient.phone}: ${errorMsg}`);
        }
      } catch (error: any) {
        console.error(`Error sending SMS to ${recipient.phone}:`, error);
        results.failed++;
        results.errors.push(`${recipient.name || recipient.phone}: ${error.message}`);
      }
    }

    if (results.sent > 0) {
      return NextResponse.json({
        success: true,
        message: `SMS sent to ${results.sent} recipient(s)`,
        sent: results.sent,
        failed: results.failed,
        errors: results.errors.length > 0 ? results.errors : undefined,
        messageIds: results.messageIds.length > 0 ? results.messageIds : undefined,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to send SMS to any recipients',
        errors: results.errors,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error sending bulk SMS:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to send messages. Please try again.',
    }, { status: 500 });
  }
}
