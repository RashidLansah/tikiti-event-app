// Shared helpers for the community event inbox (server side only)
import { NextRequest, NextResponse } from 'next/server';
import { getStorage } from 'firebase-admin/storage';
import { getAdminFirestore, verifyRequestUser } from '@/lib/firebase/admin';

/** Must match the admin allowlist in ../firestore.rules and components/layout/AdminLayout.tsx */
export const ADMIN_EMAILS = ['gettikiti@gmail.com', 'rashid@tikiti.com', 'admin@tikiti.com', 'pesewabrands@gmail.com'];

export const INBOX_COLLECTION = 'event_inbox';
export const INBOX_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'tikiti-45ac4.firebasestorage.app';

export type InboxStatus = 'pending' | 'published' | 'rejected';
export type InboxSource = 'upload' | 'whatsapp' | 'email';

export interface ExtractedSpeaker {
  name: string;
  title?: string;
  organisation?: string;
  /** e.g. "Speaker", "Moderator", "Discussant", "Research Fellow" */
  role?: string;
}

export interface ExtractedEvent {
  name: string;
  description: string;
  category: string;
  date: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  address: string;
  city: string;
  price: number;
  isFree: boolean;
  registrationUrl: string;
  contactPhone: string;
  organiserName: string;
  speakers: ExtractedSpeaker[];
  confidence: number;
  missingFields: string[];
}

export interface InboxItem {
  id: string;
  status: InboxStatus;
  imagePath: string;
  imageUrl: string;
  caption: string;
  source: InboxSource;
  submittedBy: string;
  /** WhatsApp profile name of the sender (source = 'whatsapp') */
  senderName?: string | null;
  /** True for text-only WhatsApp submissions that still need a flyer image */
  needsImage?: boolean;
  /** Follow-up WhatsApp text messages merged into this item */
  extraTexts?: string[];
  extracted: ExtractedEvent;
  confidence: number;
  missingFields: string[];
  publishedEventId: string | null;
  extractionError?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export type AdminUser = { uid: string; email: string };

/** Verifies the bearer token and enforces the admin email allowlist. */
export async function requireAdmin(req: NextRequest): Promise<AdminUser | NextResponse> {
  const user = await verifyRequestUser(req.headers.get('authorization'));
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const email = (user.email || '').toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
  }
  return { uid: user.uid, email };
}

export function isAdminResponse(v: AdminUser | NextResponse): v is NextResponse {
  return v instanceof NextResponse;
}

export function inboxCollection() {
  return getAdminFirestore().collection(INBOX_COLLECTION);
}

export function inboxBucket() {
  // Ensure the admin app is initialised before touching storage
  getAdminFirestore();
  return getStorage().bucket(INBOX_BUCKET);
}

/** Uploads a flyer to inbox/{id}.{ext}, makes it public and returns path + URL. */
export async function storeFlyer(id: string, buffer: Buffer, mimeType: string): Promise<{ imagePath: string; imageUrl: string }> {
  const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
  const imagePath = `inbox/${id}.${ext}`;
  const file = inboxBucket().file(imagePath);
  await file.save(buffer, { contentType: mimeType, resumable: false, metadata: { cacheControl: 'public, max-age=31536000' } });
  await file.makePublic();
  const imageUrl = `https://storage.googleapis.com/${INBOX_BUCKET}/${imagePath}`;
  return { imagePath, imageUrl };
}

function tsToIso(v: any): string | null {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return null;
}

export function serializeInbox(id: string, data: FirebaseFirestore.DocumentData): InboxItem {
  return {
    id,
    status: data.status,
    imagePath: data.imagePath || '',
    imageUrl: data.imageUrl || '',
    caption: data.caption || '',
    source: data.source || 'upload',
    submittedBy: data.submittedBy || '',
    senderName: data.senderName || null,
    needsImage: !!data.needsImage,
    extraTexts: Array.isArray(data.extraTexts) ? data.extraTexts : [],
    extracted: { speakers: [], ...(data.extracted || {}) },
    confidence: data.confidence ?? 0,
    missingFields: data.missingFields || [],
    publishedEventId: data.publishedEventId || null,
    extractionError: data.extractionError || null,
    createdAt: tsToIso(data.createdAt),
    updatedAt: tsToIso(data.updatedAt),
  };
}
