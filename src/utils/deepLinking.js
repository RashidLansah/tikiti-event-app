import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

// Deep linking configuration
export const linkingConfig = {
  prefixes: [
    'tikiti://',
    'https://tikiti.com',
    'https://www.tikiti.com'
  ],
  config: {
    screens: {
      // Onboarding & Auth
      Onboarding: 'onboarding',
      Welcome: 'welcome',
      Login: 'login',
      Register: 'register',
      
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
    const eventId = eventMatch[1];
    
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
export const generateEventLink = (eventId) => {
  // For testing: use IP address for phone access, for production: use tikiti.com
  const isProduction = false; // Change to true for production
  const domain = isProduction ? 'https://tikiti.com' : 'http://172.20.10.4:8082';
  return `${domain}/events/${eventId}`;
};

// Share event function
export const shareEvent = async (event) => {
  const eventUrl = generateEventLink(event.id);
  const shareData = {
    title: event.name,
    text: `Check out this event: ${event.name}`,
    url: eventUrl,
  };

  try {
    // Web Share API (modern browsers)
    if (Platform.OS === 'web' && navigator.share) {
      await navigator.share(shareData);
    } 
    // Mobile sharing
    else if (Platform.OS !== 'web') {
      const { Share } = require('react-native');
      await Share.share({
        message: `${shareData.text}\n\n${shareData.url}`,
        url: shareData.url,
        title: shareData.title,
      });
    }
    // Fallback: copy to clipboard
    else {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(eventUrl);
        return { success: true, message: 'Link copied to clipboard!' };
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
      const eventMatch = path.match(/^\/events\/(.+)$/);
      if (eventMatch) {
        return {
          name: 'EventWeb',
          params: { eventId: eventMatch[1] },
        };
      }
    }
  }
  
  // Default to onboarding
  return { name: 'Onboarding' };
};