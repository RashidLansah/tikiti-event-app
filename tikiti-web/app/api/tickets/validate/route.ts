import { NextRequest, NextResponse } from 'next/server';
import { ticketService } from '@/lib/services/ticketService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrData, eventId, checkIn, checkedInBy } = body;

    if (!qrData || !eventId) {
      return NextResponse.json(
        { error: 'Missing required fields: qrData, eventId' },
        { status: 400 }
      );
    }

    let result;

    if (checkIn) {
      // Validate and check-in
      result = await ticketService.checkInWithQR(
        qrData,
        eventId,
        checkedInBy || 'api'
      );
    } else {
      // Just validate
      result = await ticketService.validateQRCode(qrData, eventId);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in ticket validation API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
