import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, inviteeName, orgName, inviterName, role, inviteToken } = body;

    if (!email || !orgName || !inviterName || !role || !inviteToken) {
      return NextResponse.json(
        { error: 'Missing required fields: email, orgName, inviterName, role, inviteToken' },
        { status: 400 }
      );
    }

    const success = await emailService.sendInvitationEmail({
      email,
      inviteeName,
      orgName,
      inviterName,
      role,
      inviteToken,
    });

    if (success) {
      return NextResponse.json({ message: 'Invitation email sent successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in invite email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
