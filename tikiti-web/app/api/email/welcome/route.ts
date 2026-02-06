import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, orgName } = body;

    if (!email || !name || !orgName) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, orgName' },
        { status: 400 }
      );
    }

    const success = await emailService.sendWelcomeEmail({
      email,
      name,
      orgName,
    });

    if (success) {
      return NextResponse.json({ message: 'Welcome email sent successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to send welcome email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in welcome email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
