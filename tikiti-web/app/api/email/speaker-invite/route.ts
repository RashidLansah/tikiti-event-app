import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const {
      email,
      speakerName,
      eventName,
      sessionTitle,
      organizationName,
      inviterName,
      role,
      inviteToken,
      personalMessage,
    } = await request.json();

    // Validate required fields
    if (!email || !eventName || !organizationName || !inviterName || !role || !inviteToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Send the speaker invitation email
    const success = await emailService.sendSpeakerInvitationEmail({
      email,
      speakerName,
      eventName,
      sessionTitle,
      organizationName,
      inviterName,
      role,
      inviteToken,
      personalMessage,
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Speaker invitation email sent successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error sending speaker invitation email:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
