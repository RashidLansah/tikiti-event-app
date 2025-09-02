/**
 * Sharing Utilities for Tikiti
 * 
 * This utility helps generate proper sharing URLs using the custom domain
 */

// Base URLs for different environments
const BASE_URLS = {
  production: 'https://gettikiti.com',
  development: 'https://tikiti-7u2hl0aum-lansahs-projects-ff07a47b.vercel.app',
  local: 'http://localhost:19006'
};

// Get the appropriate base URL based on environment
const getBaseUrl = () => {
  if (__DEV__) {
    return BASE_URLS.development;
  }
  return BASE_URLS.production;
};

/**
 * Generate a shareable event URL
 * @param {string} eventId - The event ID
 * @param {string} eventName - The event name (optional, for SEO-friendly URLs)
 * @returns {string} - The shareable URL
 */
export const generateEventShareUrl = (eventId, eventName = null) => {
  const baseUrl = getBaseUrl();
  
  if (eventName) {
    // Create SEO-friendly URL slug
    const slug = eventName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
    
    return `${baseUrl}/events/${slug}-${eventId}`;
  }
  
  return `${baseUrl}/events/${eventId}`;
};

/**
 * Generate a shareable organizer profile URL
 * @param {string} organizerId - The organizer ID
 * @param {string} organizerName - The organizer name (optional)
 * @returns {string} - The shareable URL
 */
export const generateOrganizerShareUrl = (organizerId, organizerName = null) => {
  const baseUrl = getBaseUrl();
  
  if (organizerName) {
    const slug = organizerName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    return `${baseUrl}/organizer/${slug}-${organizerId}`;
  }
  
  return `${baseUrl}/organizer/${organizerId}`;
};

/**
 * Generate a shareable ticket URL
 * @param {string} ticketId - The ticket ID
 * @returns {string} - The shareable URL
 */
export const generateTicketShareUrl = (ticketId) => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/ticket/${ticketId}`;
};

/**
 * Generate app download URL
 * @returns {string} - The app download URL
 */
export const generateAppDownloadUrl = () => {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/download`;
};

/**
 * Generate share text for events
 * @param {Object} event - The event object
 * @returns {string} - The share text
 */
export const generateEventShareText = (event) => {
  const url = generateEventShareUrl(event.id, event.name);
  return `Check out this event: ${event.name}\n\n${event.description}\n\nRSVP here: ${url}`;
};

/**
 * Generate share text for organizers
 * @param {Object} organizer - The organizer object
 * @returns {string} - The share text
 */
export const generateOrganizerShareText = (organizer) => {
  const url = generateOrganizerShareUrl(organizer.id, organizer.name);
  return `Check out ${organizer.name}'s events on Tikiti!\n\n${url}`;
};

/**
 * Validate if a URL is a valid Tikiti event URL
 * @param {string} url - The URL to validate
 * @returns {Object} - { isValid: boolean, eventId: string | null }
 */
export const validateEventUrl = (url) => {
  try {
    const urlObj = new URL(url);
    
    // Check if it's a Tikiti domain
    const tikitiDomains = [
      'gettikiti.com',
      'www.gettikiti.com',
      'tikiti-7u2hl0aum-lansahs-projects-ff07a47b.vercel.app'
    ];
    
    if (!tikitiDomains.includes(urlObj.hostname)) {
      return { isValid: false, eventId: null };
    }
    
    // Check if it's an event URL
    const eventMatch = urlObj.pathname.match(/^\/events\/(.+)$/);
    if (eventMatch) {
      // Extract event ID from the end of the path
      const pathPart = eventMatch[1];
      const eventIdMatch = pathPart.match(/-([a-zA-Z0-9]+)$/);
      const eventId = eventIdMatch ? eventIdMatch[1] : pathPart;
      
      return { isValid: true, eventId };
    }
    
    return { isValid: false, eventId: null };
  } catch (error) {
    return { isValid: false, eventId: null };
  }
};

export default {
  generateEventShareUrl,
  generateOrganizerShareUrl,
  generateTicketShareUrl,
  generateAppDownloadUrl,
  generateEventShareText,
  generateOrganizerShareText,
  validateEventUrl,
  getBaseUrl
};
