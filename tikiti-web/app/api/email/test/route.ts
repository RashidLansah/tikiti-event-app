import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/emailService';

export async function GET(request: NextRequest) {
  try {
    const isConnected = await emailService.testConnection();

    if (isConnected) {
      return NextResponse.json({
        status: 'connected',
        message: 'Brevo API connection successful'
      });
    } else {
      return NextResponse.json(
        {
          status: 'disconnected',
          message: 'Brevo API connection failed. Check your API key.'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error testing email connection:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Test sending an email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, type } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    let success = false;

    if (type === 'welcome') {
      success = await emailService.sendWelcomeEmail({
        email,
        name: 'Test User',
        orgName: 'Test Organization',
      });
    } else if (type === 'invite') {
      success = await emailService.sendInvitationEmail({
        email,
        inviteeName: 'Test Invitee',
        orgName: 'Test Organization',
        inviterName: 'Test Admin',
        role: 'project_manager',
        inviteToken: 'test-token-123',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Use "welcome" or "invite"' },
        { status: 400 }
      );
    }

    if (success) {
      return NextResponse.json({
        message: `Test ${type} email sent successfully to ${email}`
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send test email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
