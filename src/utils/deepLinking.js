import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

// Deep linking configuration
export const linkingConfig = {
  prefixes: [
    'tikiti://',
    'https://gettikiti.com',
    'https://www.gettikiti.com',
    'https://tikiti-7u2hl0aum-lansahs-projects-ff07a47b.vercel.app' // Fallback URL
  ],
  config: {
    screens: {
      // Auth
      Welcome: 'welcome',
      SignIn: 'signin',
      CreateAccount: 'create-account',
      
      // Web Event View
      EventWeb: {
        path: 'events/:eventId',
        parse: {
          eventId: (eventId) => eventId,
        },
      },
      
      // App Flows
      UserFlow: {
        screens: {
          Events: 'user/events',
          MyTickets: 'user/tickets',
          Profile: 'user/profile',
        },
      },
      OrganiserFlow: {
        screens: {
          Dashboard: 'organiser/dashboard',
          Scanner: 'organiser/scanner',
          Profile: 'organiser/profile',
        },
      },
    },
  },
};

// Handle incoming links
export const handleDeepLink = (url, navigation) => {
  if (!url) return;

  console.log('Deep link received:', url);

  // Parse the URL
  const parsed = Linking.parse(url);
  const { hostname, path, queryParams } = parsed;

  // Check if it's an event link
  const eventMatch = path?.match(/^\/events\/(.+)$/);
  if (eventMatch) {
    // Extract event ID from the path - handle both formats:
    // 1. /events/event-name-abc123 (SEO-friendly)
    // 2. /events/abc123 (simple)
    const pathPart = eventMatch[1];
    const eventIdMatch = pathPart.match(/-([a-zA-Z0-9]+)$/);
    const eventId = eventIdMatch ? eventIdMatch[1] : pathPart;
    console.log('🔍 Deep linking event details:', {
      pathPart,
      eventIdMatch,
      extractedEventId: eventId
    });
    
    // For web, navigate to web view
    if (Platform.OS === 'web') {
      navigation.navigate('EventWeb', { eventId });
    } else {
      // For mobile, check if user is logged in
      // If not logged in, show onboarding first
      // If logged in, navigate to appropriate event detail
      navigation.navigate('UserFlow', {
        screen: 'Events',
        params: { eventId },
      });
    }
    return;
  }

  // Handle other deep links as needed
  console.log('Unhandled deep link:', url);
};

// Generate shareable event link
export const generateEventLink = (eventId, eventName = null) => {
  // Use custom domain
  const domain = 'https://gettikiti.com';
  
  if (eventName) {
    // Create SEO-friendly URL slug
    const slug = eventName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
    
    return `${domain}/events/${slug}-${eventId}`;
  }
  
  return `${domain}/events/${eventId}`;
};

// Share event function
export const shareEvent = async (event) => {
  const eventUrl = generateEventLink(event.id, event.name);
  console.log('🔗 Generated share URL:', {
    eventId: event.id,
    eventName: event.name,
    generatedUrl: eventUrl
  });
  
  // Create event description with details
  // Handle location object properly
  let locationText = 'Location TBA';
  if (event.location) {
    if (typeof event.location === 'object') {
      locationText = event.location.name || event.location.address || 'Location TBA';
    } else {
      locationText = event.location;
    }
  } else if (event.address) {
    locationText = event.address;
  }

  const eventDetails = `📅 ${event.date || 'Date TBA'}
📍 ${locationText}
${event.type === 'free' ? '🎟️ Free Event' : `💰 ${event.price || 'Price TBA'}`}

${event.description || 'Join us for this amazing event!'}`;

  const shareData = {
    title: event.name,
    text: `🎉 ${event.name}\n\n${eventDetails}\n\n🔗 Register here:`,
    url: eventUrl,
  };

  try {
    console.log('🔗 Sharing event:', {
      title: shareData.title,
      text: shareData.text,
      url: shareData.url,
      finalMessage: `${shareData.text} ${shareData.url}`
    });

    // Web Share API (modern browsers) - supports images
    if (Platform.OS === 'web' && navigator.share) {
      const webShareData = {
        title: shareData.title,
        text: `${shareData.text} ${shareData.url}`,
      };
      
      // Add image if available (Web Share API Level 2)
      if (event.imageBase64 && navigator.canShare) {
        try {
          // Convert base64 to blob for web sharing
          const base64Data = event.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'image/jpeg' });
          const file = new File([blob], `${event.name}-poster.jpg`, { type: 'image/jpeg' });
          
          if (navigator.canShare({ files: [file] })) {
            webShareData.files = [file];
          }
        } catch (imageError) {
          console.log('Could not add image to share:', imageError);
        }
      }
      
      await navigator.share(webShareData);
    } 
    // Mobile sharing
    else if (Platform.OS !== 'web') {
      const { Share } = require('react-native');
      
      const shareOptions = {
        message: `${shareData.text} ${shareData.url}`,
        title: shareData.title,
        // Don't add separate URL field to avoid duplication
      };
      
      await Share.share(shareOptions);
    }
    // Fallback: copy to clipboard
    else {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        return { success: true, message: 'Event details copied to clipboard!' };
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sharing:', error);
    return { success: false, error };
  }
};

// Check if running on web
export const isWeb = Platform.OS === 'web';

// Get appropriate initial route based on platform and URL
export const getInitialRoute = () => {
  if (isWeb) {
    // Check if current URL is an event link
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      console.log('🔍 Checking web path for deep linking:', path);
      
      const eventMatch = path.match(/^\/events\/(.+)$/);
      if (eventMatch) {
        const eventId = eventMatch[1];
        console.log('✅ Event deep link detected:', eventId);
        return {
          name: 'EventWeb',
          params: { eventId },
        };
      }
      
      console.log('⚠️ No event match found for path:', path);
    }
  }
  
  // Default to welcome
  console.log('🔍 Using default route: Welcome');
  return { name: 'Welcome' };
};