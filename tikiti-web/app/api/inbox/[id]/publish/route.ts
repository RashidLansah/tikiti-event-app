// POST /api/inbox/[id]/publish — create a real Tikiti event from a reviewed inbox item (admin only)
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { inboxCollection, isAdminResponse, requireAdmin, serializeInbox } from '@/lib/inbox/admin';
import { eventCategories } from '@/lib/data/categories';

export const DEFAULT_COMMUNITY_ORG_ID = 'mebjt1Jt38b0c5ePVsl7';

// Mirrors the default registration form eventService.create sets
const DEFAULT_REGISTRATION_FORM = {
  fields: [
    { id: 'firstName', type: 'text', label: 'First Name', placeholder: 'Enter your first name', required: true },
    { id: 'lastName', type: 'text', label: 'Last Name', placeholder: 'Enter your last name', required: true },
    { id: 'email', type: 'email', label: 'Email Address', placeholder: 'Enter your email address', required: true },
    { id: 'phone', type: 'phone', label: 'Phone Number', placeholder: 'Enter your phone number', required: true },
    { id: 'gender', type: 'dropdown', label: 'Gender', placeholder: 'Select gender', required: true, options: ['Male', 'Female', 'Other'] },
  ],
  consentRequired: false,
};

const str = (v: any) => (v == null ? '' : String(v).trim());

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (isAdminResponse(admin)) return admin;
  try {
    const { id } = await params;
    const body = await req.json();
    const ref = inboxCollection().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Inbox item not found' }, { status: 404 });
    const inbox = snap.data()!;
    if (inbox.status === 'published' && inbox.publishedEventId) {
      return NextResponse.json({ error: 'Already published', eventId: inbox.publishedEventId }, { status: 409 });
    }

    const f = { ...(inbox.extracted || {}), ...(body || {}) };
    const name = str(f.name);
    const date = str(f.date);
    const location = str(f.location);
    if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 });
    if (!location) return NextResponse.json({ error: 'location is required' }, { status: 400 });

    const organizationId = str(body?.organizationId) || DEFAULT_COMMUNITY_ORG_ID;
    const priceNum = Number(f.price);
    const price = Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 0;
    const isFree = typeof f.isFree === 'boolean' ? f.isFree : price === 0;
    const registrationUrl = str(f.registrationUrl);
    const category = eventCategories.some((c) => c.id === f.category) ? f.category : 'other';
    const startTime = str(f.startTime);
    const endDate = str(f.endDate) || date;
    const ticketingDisabled = !isFree && !registrationUrl;

    const event: Record<string, any> = {
      name,
      description: str(f.description),
      venueType: 'in_person',
      location,
      date,
      time: startTime,
      startTime,
      startDate: date,
      endDate,
      category,
      type: isFree ? 'free' : 'paid',
      price: isFree ? 0 : price,
      totalTickets: 100,
      availableTickets: 100,
      soldTickets: 0,
      organizerId: admin.uid,
      organizationId,
      organizerName: 'Tikiti Community',
      imageUrl: inbox.imageUrl,
      status: 'active',
      isActive: true,
      registrationForm: DEFAULT_REGISTRATION_FORM,
      source: 'community',
      communityContact: { phone: str(f.contactPhone), organiserName: str(f.organiserName) },
      inboxId: id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      publishedAt: FieldValue.serverTimestamp(),
    };
    if (str(f.address)) event.address = str(f.address);
    if (str(f.city)) event.city = str(f.city);
    if (str(f.endTime)) event.endTime = str(f.endTime);
    if (registrationUrl) event.registrationUrl = registrationUrl;
    if (str(f.contactPhone)) event.organizerPhone = str(f.contactPhone);
    if (ticketingDisabled) event.ticketingDisabled = true;

    const db = getAdminFirestore();
    const eventRef = db.collection('events').doc();
    const batch = db.batch();
    batch.set(eventRef, event);
    batch.update(ref, {
      status: 'published',
      publishedEventId: eventRef.id,
      publishedBy: admin.uid,
      extracted: {
        ...(inbox.extracted || {}),
        name, description: str(f.description), category, date, endDate, startTime, endTime: str(f.endTime),
        location, address: str(f.address), city: str(f.city), price: isFree ? 0 : price, isFree,
        registrationUrl, contactPhone: str(f.contactPhone), organiserName: str(f.organiserName),
      },
      organizationId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    const updated = await ref.get();
    return NextResponse.json({ eventId: eventRef.id, ticketingDisabled, item: serializeInbox(id, updated.data()!) });
  } catch (e: any) {
    console.error('inbox publish error', e);
    return NextResponse.json({ error: e.message || 'Failed to publish' }, { status: 500 });
  }
}
