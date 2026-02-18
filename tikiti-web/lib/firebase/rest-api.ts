// Server-side Firebase REST API utility for fetching event data
// Used by generateMetadata() and OG image API route — no Firebase SDK required

const FIREBASE_PROJECT_ID = 'tikiti-45ac4';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

export interface EventData {
  name?: string;
  description?: string;
  date?: string;
  time?: string;
  startTime?: string;
  location?: string | { name?: string; address?: string };
  address?: string;
  type?: string;
  price?: string | number;
  category?: string;
  imageBase64?: string;
  status?: string;
  isActive?: boolean;
  availableTickets?: number;
  [key: string]: unknown;
}

/**
 * Fetch event data from Firestore via REST API (no SDK needed).
 * Returns null if event not found or request fails.
 */
export async function fetchEventFromFirebase(eventId: string): Promise<EventData | null> {
  try {
    const url = `${FIRESTORE_BASE_URL}/events/${eventId}`;
    const response = await fetch(url, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      console.log(`[rest-api] Event not found: ${eventId} (status ${response.status})`);
      return null;
    }

    const data = await response.json();
    if (!data.fields) {
      return null;
    }

    return convertFirestoreData(data.fields) as EventData;
  } catch (error) {
    console.error('[rest-api] Error fetching event:', error);
    return null;
  }
}

/**
 * Convert Firestore REST API field format to plain JS object.
 * Ported from api/og.js convertFirestoreData().
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertFirestoreData(fields: Record<string, any>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) {
      result[key] = value.stringValue;
    } else if (value.integerValue !== undefined) {
      result[key] = parseInt(value.integerValue, 10);
    } else if (value.doubleValue !== undefined) {
      result[key] = parseFloat(value.doubleValue);
    } else if (value.booleanValue !== undefined) {
      result[key] = value.booleanValue;
    } else if (value.nullValue !== undefined) {
      result[key] = null;
    } else if (value.arrayValue !== undefined) {
      result[key] = value.arrayValue.values || [];
    } else if (value.mapValue !== undefined) {
      result[key] = convertFirestoreData(value.mapValue.fields || {});
    }
  }

  return result;
}

/**
 * Extract a human-readable location string from the event's location field.
 * Handles both string and nested object formats.
 */
export function extractLocationText(location: EventData['location'], address?: string): string {
  if (location) {
    if (typeof location === 'object') {
      return location.name || location.address || 'Location TBA';
    }
    return location;
  }
  if (address) {
    return address;
  }
  return 'Location TBA';
}
