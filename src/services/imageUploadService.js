// Helper function to convert image URI to base64
const uriToBase64 = async (uri) => {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting URI to base64:', error);
    throw new Error(`Failed to convert image to base64: ${error.message}`);
  }
};

export const imageUploadService = {
  // Convert image to base64 for Firestore storage
  uploadImage: async (uri, path) => {
    try {
      console.log('🚀 Starting image conversion...');
      console.log('📁 Path:', path);
      console.log('🔗 URI:', uri);
      
      // Convert image to base64
      console.log('🔄 Converting URI to base64...');
      const base64String = await uriToBase64(uri);
      console.log('✅ Base64 conversion successful, length:', base64String.length);
      
      // For Firestore, we return the base64 string directly
      // The path parameter is kept for future Firebase Storage implementation
      console.log('✅ Image ready for Firestore storage');
      
      return base64String;
    } catch (error) {
      console.error('❌ Error converting image:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      // Provide more specific error messages
      if (error.message.includes('blob')) {
        throw new Error('Image conversion failed: Please try a different image format.');
      } else if (error.message.includes('HTTP error')) {
        throw new Error('Image conversion failed: Network error. Please try again.');
      } else {
        throw new Error(`Image conversion failed: ${error.message}`);
      }
    }
  },

  // Convert event image to base64 for Firestore storage
  uploadEventImage: async (uri, userId, eventId = null) => {
    try {
      const timestamp = Date.now();
      const filename = eventId 
        ? `event-images/${userId}/${eventId}/${timestamp}.jpg`
        : `event-images/${userId}/temp/${timestamp}.jpg`;
      
      console.log('📸 Converting event image for Firestore...');
      console.log('👤 User ID:', userId);
      console.log('🎯 Event ID:', eventId || 'temp');
      console.log('📁 Filename:', filename);
      
      const base64String = await imageUploadService.uploadImage(uri, filename);
      console.log('✅ Event image conversion successful, length:', base64String.length);
      
      return base64String;
    } catch (error) {
      console.error('❌ Event image conversion failed:', error);
      throw error;
    }
  },

  // Delete image from Firebase Storage
  deleteImage: async (path) => {
    try {
      const storageRef = ref(storage, path);
      // Note: deleteObject is not imported above, but this is the pattern
      // await deleteObject(storageRef);
      console.log('Image deletion would happen here:', path);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  // Move temporary image to permanent location
  moveTempImage: async (tempPath, permanentPath) => {
    try {
      console.log('🔄 Moving temporary image...');
      console.log('📁 From:', tempPath);
      console.log('📁 To:', permanentPath);
      
      // For now, we'll just return the temp path since moving requires additional Firebase operations
      // In a production app, you'd want to implement proper file moving
      console.log('⚠️ Note: File moving not implemented yet. Using temporary path.');
      
      return tempPath;
    } catch (error) {
      console.error('❌ Error moving image:', error);
      throw error;
    }
  }
}; 