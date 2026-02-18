// Test endpoint to debug SMS sending
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const phoneNumber = searchParams.get('phone') || '233501234567'; // Default test number
  const message = searchParams.get('message') || 'Test SMS from Tikiti';
  
  const arkeselApiKey = process.env.ARKESEL_API_KEY || 'OjdpMG0zVThlOVJMOHBJWmM=';
  const arkeselSenderId = process.env.ARKESEL_SENDER_ID || 'Tikiti';
  const arkeselBaseUrl = 'https://sms.arkesel.com/sms/api';
  
  // Format phone number
  let formattedPhone = phoneNumber.replace(/\s/g, '').replace(/\+/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '233' + formattedPhone.substring(1);
  } else if (!formattedPhone.startsWith('233')) {
    formattedPhone = '233' + formattedPhone;
  }
  
  const encodedMessage = encodeURIComponent(message);
  const arkeselUrl = `${arkeselBaseUrl}?action=send-sms&api_key=${encodeURIComponent(arkeselApiKey)}&to=${formattedPhone}&from=${encodeURIComponent(arkeselSenderId)}&sms=${encodedMessage}`;
  
  try {
    console.log('🧪 TEST SMS REQUEST:');
    console.log('URL:', arkeselUrl.replace(arkeselApiKey, '***'));
    console.log('Phone:', formattedPhone);
    console.log('Sender ID:', arkeselSenderId);
    console.log('Message:', message);
    
    const response = await fetch(arkeselUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Tikiti-Events/1.0',
      },
    });
    
    const responseText = await response.text();
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }
    
    return NextResponse.json({
      success: response.ok,
      httpStatus: response.status,
      phoneNumber: formattedPhone,
      senderId: arkeselSenderId,
      message: message,
      arkeselResponse: responseData,
      rawResponse: responseText,
      url: arkeselUrl.replace(arkeselApiKey, '***'),
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'SMS test failed. Please try again.',
      phoneNumber: formattedPhone,
      senderId: arkeselSenderId,
      message: message,
    }, { status: 500 });
  }
}
