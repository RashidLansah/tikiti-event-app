import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/emailService';
import { ticketService } from '@/lib/services/ticketService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      attendeeName,
      eventName,
      eventDate,
      eventTime,
      eventLocation,
      ticketType,
      quantity,
      bookingId,
      eventId,
    } = body;

    // Validate required fields
    if (!email || !eventName || !bookingId || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate ticket ID
    const ticketId = ticketService.generateTicketId();

    // Send ticket email
    const success = await emailService.sendTicketEmail({
      email,
      attendeeName: attendeeName || 'Guest',
      eventName,
      eventDate: eventDate || 'TBD',
      eventTime: eventTime || 'TBD',
      eventLocation: eventLocation || 'TBD',
      ticketType: ticketType || 'General Admission',
      quantity: quantity || 1,
      ticketId,
      bookingId,
      eventId,
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Ticket email sent successfully',
        ticketId,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to send ticket email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending ticket email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
