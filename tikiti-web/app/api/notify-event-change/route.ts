import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/services/emailService';
import { serverDb } from '@/lib/firebase/server-config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface RequestBody {
  eventId: string;
  changeType: string;
  eventName: string;
  customMessage: string;
  customTitle: string;
  sendEmail: boolean;
  sendSMS: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { eventId, eventName, customMessage, customTitle, sendEmail, sendSMS } = body;

    if (!eventId || !eventName) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, eventName' },
        { status: 400 }
      );
    }

    if (!sendEmail && !sendSMS) {
      return NextResponse.json({
        success: true,
        message: 'No notification channels selected',
        emailsSent: 0,
      });
    }

    // Get event details for the email template
    let eventDate = '';
    let eventTime = '';
    let eventLocation = '';
    let organizationName = '';

    try {
      const eventRef = doc(serverDb, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        const eventData = eventSnap.data();
        eventDate = eventData.date || eventData.startDate || '';
        eventTime = eventData.time || eventData.startTime || '';
        eventLocation = eventData.location || eventData.venue || '';

        // Get organization name
        if (eventData.organizationId) {
          const orgRef = doc(serverDb, 'organizations', eventData.organizationId);
          const orgSnap = await getDoc(orgRef);
          if (orgSnap.exists()) {
            organizationName = orgSnap.data().name || '';
          }
        }
      }
    } catch (err) {
      console.error('Error fetching event details:', err);
    }

    // Get all attendees from bookings and rsvps
    const attendees: Array<{ email: string; name: string }> = [];

    // Query bookings (mobile app registrations)
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
          email,
          name: booking.name || booking.userName || email.split('@')[0],
        });
      }
    });

    // Query rsvps (web registrations)
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
          email,
          name: rsvp.userName || rsvp.name || email.split('@')[0],
        });
      }
    });

    // Deduplicate by email
    const uniqueAttendees = attendees.filter(
      (attendee, index, self) =>
        index === self.findIndex((a) => a.email === attendee.email)
    );

    if (uniqueAttendees.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No attendees to notify',
        emailsSent: 0,
      });
    }

    let emailsSent = 0;
    let emailsFailed = 0;

    // Send email notifications
    if (sendEmail) {
      const emailPromises = uniqueAttendees.map((attendee) =>
        emailService.sendEventUpdateEmail({
          email: attendee.email,
          attendeeName: attendee.name,
          eventName,
          organizationName,
          changes: [
            {
              field: customTitle || 'Event Update',
              oldValue: '',
              newValue: customMessage || '',
            },
          ],
          eventDate,
          eventTime,
          eventLocation,
          eventId,
        })
      );

      const results = await Promise.allSettled(emailPromises);
      emailsSent = results.filter(
        (r) => r.status === 'fulfilled' && r.value === true
      ).length;
      emailsFailed = results.length - emailsSent;
    }

    console.log(
      `Event change notifications: ${emailsSent} emails sent, ${emailsFailed} failed, ${uniqueAttendees.length} total attendees`
    );

    return NextResponse.json({
      success: true,
      message: 'Notifications sent',
      emailsSent,
      emailsFailed,
      totalAttendees: uniqueAttendees.length,
    });
  } catch (error: any) {
    console.error('Error sending event change notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notifications' },
      { status: 500 }
    );
  }
}
