// Image optimization utilities for Firestore storage
// Since we're storing images as base64 in Firestore, we need to be mindful of size

export const imageOptimization = {
  // Check if image size is reasonable for Firestore
  // Firestore has a 1MB document size limit, so we need to keep images under ~700KB
  isImageSizeReasonable: (base64String) => {
    if (!base64String) return true;
    
    // Calculate approximate size in bytes
    // Base64 encoding increases size by ~33%
    const sizeInBytes = Math.ceil((base64String.length * 3) / 4);
    const sizeInKB = sizeInBytes / 1024;
    
    console.log(`📏 Image size: ${sizeInKB.toFixed(2)} KB`);
    
    // Firestore limit is 1MB, but we'll be more conservative at 800KB
    return sizeInKB < 800;
  },

  // Check if image exceeds Firestore hard limit
  exceedsFirestoreLimit: (base64String) => {
    if (!base64String) return false;
    
    const sizeInBytes = Math.ceil((base64String.length * 3) / 4);
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    // Firestore hard limit is 1MB
    return sizeInMB > 1;
  },

  // Get image size warning message
  getSizeWarning: (base64String) => {
    if (!base64String) return null;
    
    const sizeInBytes = Math.ceil((base64String.length * 3) / 4);
    const sizeInKB = sizeInBytes / 1024;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    if (sizeInMB > 1) {
      return {
        type: 'error',
        title: 'Image Too Large',
        message: `Your image is ${sizeInMB.toFixed(2)} MB, which exceeds Firestore's 1MB limit. Please choose a smaller image or compress it before uploading.`,
        canProceed: false
      };
    } else if (sizeInKB > 800) {
      return {
        type: 'warning',
        title: 'Large Image',
        message: `Your image is ${sizeInKB.toFixed(1)} KB. While it will work, consider using a smaller image (under 500KB) for better performance.`,
        canProceed: true
      };
    } else if (sizeInKB > 500) {
      return {
        type: 'info',
        title: 'Image Size',
        message: `Image size: ${sizeInKB.toFixed(1)} KB. This is acceptable but smaller images load faster.`,
        canProceed: true
      };
    }
    
    return null;
  },

  // Recommendations for image optimization
  getOptimizationTips: () => [
    'Use JPEG format for photos (smaller than PNG)',
    'Resize images to 800x600 or smaller',
    'Use 70-80% quality for good balance of size and quality',
    'Avoid very high resolution images (they increase file size significantly)',
    'Consider using web-optimized images'
  ]
}; 