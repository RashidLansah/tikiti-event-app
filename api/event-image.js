// Vercel function to serve event images for Open Graph sharing
export default async function handler(req, res) {
  const { eventId } = req.query;
  
  console.log('Image API called with eventId:', eventId);
  
  if (!eventId) {
    console.log('No eventId provided for image');
    return res.status(400).json({ error: 'Event ID is required' });
  }
  
  try {
    // Fetch event data from Firebase using REST API
    const firebaseUrl = `https://firestore.googleapis.com/v1/projects/tikiti-45ac4/databases/(default)/documents/events/${eventId}`;
    console.log('Fetching event image from:', firebaseUrl);
    
    const response = await fetch(firebaseUrl);
    
    if (!response.ok) {
      console.log('Event not found for image:', eventId, 'Status:', response.status);
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const data = await response.json();
    const event = convertFirestoreData(data.fields);
    
    console.log('Event image data:', {
      name: event.name,
      hasImage: !!event.imageBase64,
      imageLength: event.imageBase64 ? event.imageBase64.length : 0,
      imageStart: event.imageBase64 ? event.imageBase64.substring(0, 50) : 'none',
      imageType: event.imageBase64 ? (event.imageBase64.startsWith('data:') ? 'data-url' : 'raw-base64') : 'none'
    });
    
    if (!event.imageBase64) {
      console.log('No image found, redirecting to default');
      // Get the current domain dynamically
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      // Return default image if no event image
      return res.redirect(302, `${baseUrl}/tikiti-og.svg`);
    }
    
    // Convert base64 to buffer
    let imageBuffer;
    let contentType = 'image/jpeg'; // Default
    
    try {
      if (event.imageBase64.startsWith('data:')) {
        // Extract content type from data URL
        const [header, base64Data] = event.imageBase64.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        if (mimeMatch) {
          contentType = mimeMatch[1];
        }
        imageBuffer = Buffer.from(base64Data, 'base64');
        console.log('Converted data URL image:', {
          header: header.substring(0, 50),
          base64DataLength: base64Data.length,
          contentType
        });
      } else {
        // Assume it's raw base64 (default to JPEG)
        imageBuffer = Buffer.from(event.imageBase64, 'base64');
        console.log('Converted raw base64 image:', {
          base64Length: event.imageBase64.length,
          contentType
        });
      }
      
      console.log('Serving image:', {
        contentType,
        bufferLength: imageBuffer.length,
        bufferStart: imageBuffer.toString('hex', 0, 10)
      });
    } catch (conversionError) {
      console.error('Image conversion error:', conversionError);
      throw new Error(`Failed to convert image: ${conversionError.message}`);
    }
    
    // Set appropriate headers for image serving
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Content-Length', imageBuffer.length);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow cross-origin requests
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    // Send the image
    res.status(200).send(imageBuffer);
    
  } catch (error) {
    console.error('Error serving event image:', error);
    // Get the current domain dynamically
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;
    // Fallback to default image
    return res.redirect(302, `${baseUrl}/tikiti-og.svg`);
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
