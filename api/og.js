// Vercel function to generate dynamic HTML with proper meta tags for social sharing
export default async function handler(req, res) {
  const { eventId } = req.query;
  
  console.log('OG API called with eventId:', eventId);
  
  if (!eventId) {
    console.log('No eventId provided, redirecting to home');
    return redirectToHome(res);
  }
  
  try {
    // Fetch event data from Firebase using REST API
    const firebaseUrl = `https://firestore.googleapis.com/v1/projects/tikiti-45ac4/databases/(default)/documents/events/${eventId}`;
    console.log('Fetching event from:', firebaseUrl);
    
    const response = await fetch(firebaseUrl);
    
    if (!response.ok) {
      console.log('Event not found:', eventId, 'Status:', response.status);
      return redirectToHome(res);
    }
    
    const data = await response.json();
    const event = convertFirestoreData(data.fields);
    
    console.log('Event data:', {
      name: event.name,
      hasImage: !!event.imageBase64,
      imageLength: event.imageBase64 ? event.imageBase64.length : 0,
      imageStart: event.imageBase64 ? event.imageBase64.substring(0, 50) : 'none'
    });
    
    // Generate HTML with proper meta tags
    const html = generateEventHTML(event, eventId, req);
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    res.status(200).send(html);
    
  } catch (error) {
    console.error('Error fetching event:', error);
    return redirectToHome(res);
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

function redirectToHome(res) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Tikiti - Discover Amazing Events</title>
      <meta property="og:title" content="Tikiti - Discover Amazing Events">
      <meta property="og:description" content="Join amazing events and connect with your community">
      <meta property="og:image" content="https://tikiti-ozrqqbnjt-lansahs-projects-ff07a47b.vercel.app/tikiti-og.svg">
      <script>window.location.href = '/';</script>
    </head>
    <body>
      <p>Loading...</p>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}

function generateEventHTML(event, eventId, req) {
  // Get the current domain dynamically
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  const baseUrl = `${protocol}://${host}`;
  
  // Prepare event data
  const eventName = event.name || 'Amazing Event';
  const eventDescription = event.description || `Join us for ${eventName} on ${event.date || 'soon'}`;
  const eventDate = event.date || 'Date TBA';
  
  // Handle location object properly
  let eventLocation = 'Location TBA';
  if (event.location) {
    if (typeof event.location === 'object') {
      eventLocation = event.location.name || event.location.address || 'Location TBA';
    } else {
      eventLocation = event.location;
    }
  } else if (event.address) {
    eventLocation = event.address;
  }
  
  const eventType = event.type === 'free' ? 'Free Event' : (event.price || 'Paid Event');
  
  // Handle event image - use a dedicated image endpoint for OG tags
  let eventImage = `${baseUrl}/tikiti-og.svg`;
  if (event.imageBase64) {
    // Create a URL that points to our image endpoint
    eventImage = `${baseUrl}/api/event-image/${eventId}`;
    console.log('OG: Using event image URL:', eventImage);
  } else {
    console.log('OG: No image found, using default image');
  }
  
  const eventUrl = `${baseUrl}/events/${eventId}`;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${eventName} - Tikiti</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎫</text></svg>">
    
    <!-- Open Graph meta tags for social sharing -->
    <meta property="og:site_name" content="Tikiti">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${eventName}">
    <meta property="og:description" content="${eventDescription}">
    <meta property="og:image" content="${eventImage}">
    <meta property="og:url" content="${eventUrl}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:alt" content="${eventName} - Event Poster">
    
    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${eventName}">
    <meta name="twitter:description" content="${eventDescription}">
    <meta name="twitter:image" content="${eventImage}">
    <meta name="twitter:image:alt" content="${eventName} - Event Poster">
    
    <!-- Additional meta tags for better sharing -->
    <meta name="description" content="${eventDescription}">
    <meta name="keywords" content="event, ${eventName}, tikiti, tickets, ${eventLocation}">
    
    <!-- WhatsApp specific meta tags -->
    <meta property="og:image:secure_url" content="${eventImage}">
    <meta property="og:image:type" content="${event.imageBase64 && event.imageBase64.startsWith('data:') ? event.imageBase64.split(';')[0].split(':')[1] : 'image/jpeg'}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 50px 20px;
            margin: 0;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }
        
        .event-preview {
            background: white;
            color: #333;
            border-radius: 20px;
            padding: 30px;
            max-width: 500px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            margin-bottom: 30px;
        }
        
        .event-image {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 15px;
            margin-bottom: 20px;
        }
        
        .event-title {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .event-details {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 15px;
        }
        
        .continue-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border: none;
            border-radius: 10px;
            font-size: 1.1rem;
            font-weight: bold;
            text-decoration: none;
            display: inline-block;
            transition: transform 0.2s;
        }
        
        .continue-btn:hover {
            transform: translateY(-2px);
        }
        
        .loading-text {
            margin-top: 20px;
            opacity: 0.9;
        }
    </style>
    
    <!-- Auto-redirect to main page -->
    <script>
        // Redirect after a short delay to allow crawlers to read meta tags
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    </script>
</head>
<body>
    <div class="event-preview">
        ${event.imageBase64 ? `<img src="data:image/jpeg;base64,${event.imageBase64.startsWith('data:') ? event.imageBase64.split(',')[1] : event.imageBase64}" alt="${eventName}" class="event-image">` : ''}
        <div class="event-title">🎫 ${eventName}</div>
        <div class="event-details">
            📅 ${eventDate}<br>
            📍 ${eventLocation}<br>
            🎟️ ${eventType}
        </div>
    </div>
    
    <a href="/" class="continue-btn">View Event Details</a>
    <div class="loading-text">Redirecting to event page...</div>
</body>
</html>`;
}
