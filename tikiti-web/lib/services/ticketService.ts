// Ticket service for generating and validating tickets
import { db } from '../firebase/config';
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';

export interface TicketData {
  bookingId: string;
  eventId: string;
  ticketId: string;
  attendeeName: string;
  attendeeEmail: string;
  quantity: number;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  ticketType: string;
}

export interface QRCodeData {
  bookingId: string;
  eventId: string;
  ticketId: string;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  attendee?: {
    id: string;
    name: string;
    email: string;
    quantity: number;
    checkedIn: boolean;
    checkedInAt?: Date;
  };
  alreadyCheckedIn?: boolean;
}

export const ticketService = {
  /**
   * Generate a unique ticket ID
   */
  generateTicketId: (): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `TK-${timestamp}-${random}`.toUpperCase();
  },

  /**
   * Generate QR code data for a ticket
   */
  generateQRCodeData: (bookingId: string, eventId: string, ticketId?: string): string => {
    const qrData: QRCodeData = {
      bookingId,
      eventId,
      ticketId: ticketId || ticketService.generateTicketId(),
    };
    return JSON.stringify(qrData);
  },

  /**
   * Generate QR code URL (using external API)
   */
  getQRCodeUrl: (data: string, size: number = 200): string => {
    const encodedData = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
  },

  /**
   * Generate ticket PDF URL
   */
  getTicketPdfUrl: (ticketData: TicketData): string => {
    const data = {
      event: {
        name: ticketData.eventName,
        date: ticketData.eventDate,
        time: ticketData.eventTime,
        location: ticketData.eventLocation,
      },
      user: {
        name: ticketData.attendeeName,
      },
      ticket: {
        ticketId: ticketData.ticketId,
        bookingId: ticketData.bookingId,
        eventId: ticketData.eventId,
        quantity: ticketData.quantity,
      },
    };

    const encodedData = encodeURIComponent(JSON.stringify(data));
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    return `${baseUrl}/ticket-pdf.html?data=${encodedData}`;
  },

  /**
   * Validate a QR code and check if the ticket is valid
   */
  validateQRCode: async (
    qrData: string,
    expectedEventId: string
  ): Promise<ValidationResult> => {
    try {
      // Parse QR code data
      let ticketInfo: QRCodeData;
      try {
        ticketInfo = JSON.parse(qrData);
      } catch {
        return {
          valid: false,
          message: 'Invalid QR code format',
        };
      }

      const { bookingId, eventId } = ticketInfo;

      // Validate event ID matches
      if (eventId !== expectedEventId) {
        return {
          valid: false,
          message: 'This ticket is for a different event',
        };
      }

      // Get booking from Firestore
      const bookingRef = doc(db, 'bookings', bookingId);
      const bookingSnap = await getDoc(bookingRef);

      if (!bookingSnap.exists()) {
        return {
          valid: false,
          message: 'Ticket not found in system',
        };
      }

      const bookingData = bookingSnap.data();

      // Check booking status
      if (bookingData.status === 'cancelled') {
        return {
          valid: false,
          message: 'This ticket has been cancelled',
        };
      }

      // Check if already checked in
      if (bookingData.checkedIn) {
        const checkedInAt = bookingData.checkedInAt?.toDate?.() || bookingData.checkedInAt;
        return {
          valid: false,
          message: 'Already checked in',
          alreadyCheckedIn: true,
          attendee: {
            id: bookingSnap.id,
            name: bookingData.userName || `${bookingData.firstName || ''} ${bookingData.lastName || ''}`.trim(),
            email: bookingData.userEmail,
            quantity: bookingData.quantity || 1,
            checkedIn: true,
            checkedInAt,
          },
        };
      }

      // Valid ticket, ready for check-in
      return {
        valid: true,
        message: 'Valid ticket',
        attendee: {
          id: bookingSnap.id,
          name: bookingData.userName || `${bookingData.firstName || ''} ${bookingData.lastName || ''}`.trim(),
          email: bookingData.userEmail,
          quantity: bookingData.quantity || 1,
          checkedIn: false,
        },
      };
    } catch (error) {
      console.error('Error validating QR code:', error);
      return {
        valid: false,
        message: 'Error validating ticket',
      };
    }
  },

  /**
   * Perform check-in via QR code
   */
  checkInWithQR: async (
    qrData: string,
    expectedEventId: string,
    checkedInBy: string
  ): Promise<ValidationResult> => {
    // First validate the QR code
    const validation = await ticketService.validateQRCode(qrData, expectedEventId);

    if (!validation.valid || !validation.attendee) {
      return validation;
    }

    try {
      // Perform check-in
      const bookingRef = doc(db, 'bookings', validation.attendee.id);
      await updateDoc(bookingRef, {
        checkedIn: true,
        checkedInAt: Timestamp.now(),
        checkedInBy,
        checkInMethod: 'qr',
        updatedAt: Timestamp.now(),
      });

      return {
        valid: true,
        message: 'Check-in successful!',
        attendee: {
          ...validation.attendee,
          checkedIn: true,
          checkedInAt: new Date(),
        },
      };
    } catch (error) {
      console.error('Error checking in:', error);
      return {
        valid: false,
        message: 'Error processing check-in',
      };
    }
  },
};

export default ticketService;
