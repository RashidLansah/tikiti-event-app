// Vercel function to generate dynamic HTML with proper meta tags for social sharing
export default async function handler(req, res) {
  const { eventId } = req.query;
  
  if (!eventId) {
    return redirectToHome(res);
  }
  
  try {
    // Fetch event data from Firebase using REST API
    const firebaseUrl = `https://firestore.googleapis.com/v1/projects/tikiti-45ac4/databases/(default)/documents/events/${eventId}`;
    const response = await fetch(firebaseUrl);
    
    if (!response.ok) {
      console.log('Event not found:', eventId);
      return redirectToHome(res);
    }
    
    const data = await response.json();
    const event = convertFirestoreData(data.fields);
    
    // Generate HTML with proper meta tags
    const html = generateEventHTML(event, eventId);
    
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

function generateEventHTML(event, eventId) {
  // Prepare event data
  const eventName = event.name || 'Amazing Event';
  const eventDescription = event.description || `Join us for ${eventName} on ${event.date || 'soon'}`;
  const eventDate = event.date || 'Date TBA';
  const eventLocation = event.location || event.address || 'Location TBA';
  const eventType = event.type === 'free' ? 'Free Event' : (event.price || 'Paid Event');
  
  // Handle event image
  let eventImage = 'https://tikiti-ozrqqbnjt-lansahs-projects-ff07a47b.vercel.app/tikiti-og.svg';
  if (event.imageBase64) {
    if (event.imageBase64.startsWith('data:')) {
      eventImage = event.imageBase64;
    } else {
      eventImage = `data:image/jpeg;base64,${event.imageBase64}`;
    }
  }
  
  const eventUrl = `https://tikiti-ozrqqbnjt-lansahs-projects-ff07a47b.vercel.app/events/${eventId}`;
  
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
    
    <!-- Twitter Card meta tags -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${eventName}">
    <meta name="twitter:description" content="${eventDescription}">
    <meta name="twitter:image" content="${eventImage}">
    
    <!-- WhatsApp specific meta tags -->
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:alt" content="${eventName} - Event Poster">
    
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
        ${event.imageBase64 ? `<img src="${eventImage}" alt="${eventName}" class="event-image">` : ''}
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
