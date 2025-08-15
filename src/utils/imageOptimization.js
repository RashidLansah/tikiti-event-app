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
    
    // Recommend keeping under 700KB to stay well within Firestore limits
    return sizeInKB < 700;
  },

  // Get image size warning message
  getSizeWarning: (base64String) => {
    if (!base64String) return null;
    
    const sizeInBytes = Math.ceil((base64String.length * 3) / 4);
    const sizeInKB = sizeInBytes / 1024;
    
    if (sizeInKB > 700) {
      return `⚠️ Image is large (${sizeInKB.toFixed(1)} KB). Consider using a smaller image to avoid Firestore limits.`;
    } else if (sizeInKB > 500) {
      return `ℹ️ Image size: ${sizeInKB.toFixed(1)} KB. This is acceptable but consider smaller images for better performance.`;
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