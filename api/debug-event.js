// Debug API to check event data structure
export default async function handler(req, res) {
  const { eventId } = req.query;
  
  if (!eventId) {
    return res.status(400).json({ error: 'Event ID is required' });
  }
  
  try {
    // Fetch event data from Firebase using REST API
    const firebaseUrl = `https://firestore.googleapis.com/v1/projects/tikiti-45ac4/databases/(default)/documents/events/${eventId}`;
    console.log('Debug: Fetching event from:', firebaseUrl);
    
    const response = await fetch(firebaseUrl);
    
    if (!response.ok) {
      console.log('Debug: Event not found:', eventId, 'Status:', response.status);
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const data = await response.json();
    const event = convertFirestoreData(data.fields);
    
    // Return debug information
    const debugInfo = {
      eventId,
      eventName: event.name,
      hasImageBase64: !!event.imageBase64,
      imageBase64Length: event.imageBase64 ? event.imageBase64.length : 0,
      imageBase64Start: event.imageBase64 ? event.imageBase64.substring(0, 100) : null,
      imageBase64Type: event.imageBase64 ? (event.imageBase64.startsWith('data:') ? 'data-url' : 'raw-base64') : 'none',
      allFields: Object.keys(event),
      rawFirestoreData: data.fields
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(debugInfo);
    
  } catch (error) {
    console.error('Debug: Error fetching event:', error);
    res.status(500).json({ error: error.message });
  }
}

function convertFirestoreData(fields) {
  const event = {};
  
  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) {
      event[key] = value.stringValue;
    } else if (value.integerValue !== undefined) {
      event[key] = parseInt(value.integerValue);
    } else if (value.doubleValue !== undefined) {
      event[key] = parseFloat(value.doubleValue);
    } else if (value.booleanValue !== undefined) {
      event[key] = value.booleanValue;
    } else if (value.nullValue !== undefined) {
      event[key] = null;
    } else if (value.arrayValue !== undefined) {
      event[key] = value.arrayValue.values || [];
    } else if (value.mapValue !== undefined) {
      event[key] = convertFirestoreData(value.mapValue.fields || {});
    }
  }
  
  return event;
}
