import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/emailService';
import { serverDb } from '@/lib/firebase/server-config';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface RequestBody {
  eventId: string;
  eventName: string;
  organizationName: string;
  eventDate: string;
  eventLocation: string;
  refundInfo?: string;
  contactEmail?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const {
      eventId,
      eventName,
      organizationName,
      eventDate,
      eventLocation,
      refundInfo,
      contactEmail,
    } = body;

    if (!eventId || !eventName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get all attendees for this event from both bookings and rsvps collections
    const attendees: Array<{ email: string; name: string }> = [];

    // Query bookings collection (mobile app registrations)
    const bookingsRef = collection(serverDb, 'bookings');
    const bookingsQuery = query(
      bookingsRef,
      where('eventId', '==', eventId),
      where('status', '==', 'confirmed')
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);

    bookingsSnapshot.forEach((doc) => {
      const booking = doc.data();
      const email = booking.email || booking.userEmail;
      if (email) {
        attendees.push({
          email: email,
          name: booking.name || booking.userName || email.split('@')[0],
        });
      }
    });

    // Query rsvps collection (web registrations)
    const rsvpsRef = collection(serverDb, 'rsvps');
    const rsvpsQuery = query(
      rsvpsRef,
      where('eventId', '==', eventId),
      where('status', '==', 'confirmed')
    );
    const rsvpsSnapshot = await getDocs(rsvpsQuery);

    rsvpsSnapshot.forEach((doc) => {
      const rsvp = doc.data();
      const email = rsvp.userEmail || rsvp.email;
      if (email) {
        attendees.push({
          email: email,
          name: rsvp.userName || rsvp.name || email.split('@')[0],
        });
      }
    });

    if (attendees.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No attendees to notify',
        emailsSent: 0,
      });
    }

    // Send emails to all attendees
    const emailPromises: Promise<boolean>[] = [];

    // Remove duplicates (same person might have multiple bookings)
    const uniqueAttendees = attendees.filter(
      (attendee, index, self) =>
        index === self.findIndex((a) => a.email === attendee.email)
    );

    for (const attendee of uniqueAttendees) {
      emailPromises.push(
        emailService.sendEventCancellationEmail({
          email: attendee.email,
          attendeeName: attendee.name,
          eventName,
          organizationName,
          eventDate,
          eventLocation,
          refundInfo,
          contactEmail,
        })
      );
    }

    // Wait for all emails to be sent
    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value === true
    ).length;
    const failCount = results.length - successCount;

    console.log(
      `Event cancellation notifications sent: ${successCount} success, ${failCount} failed`
    );

    return NextResponse.json({
      success: true,
      message: `Event cancellation notifications sent`,
      emailsSent: successCount,
      emailsFailed: failCount,
      totalAttendees: uniqueAttendees.length,
    });
  } catch (error: any) {
    console.error('Error sending event cancellation notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
