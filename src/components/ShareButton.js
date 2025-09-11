import React from 'react';
import { TouchableOpacity, Alert, Platform, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { generateEventShareUrl } from '../utils/sharingUtils';

const ShareButton = ({ event, style, iconSize = 24, iconColor = '#6366F1' }) => {
  const handleShare = async () => {
    try {
      // Use the proper sharing utility for consistent URL generation
      const eventUrl = generateEventShareUrl(event.id, event.name);
      
      // Create event description with details
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

      if (Platform.OS === 'web') {
        // Web sharing
        const webMessage = `🎉 ${event.name}\n\n${eventDetails}\n\n🔗 Register here: ${eventUrl}`;
        
        if (navigator.share) {
          await navigator.share({
            title: event.name,
            text: webMessage,
          });
        } else {
          // Fallback: copy to clipboard
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(webMessage);
            Alert.alert('Success', 'Event details copied to clipboard!');
          }
        }
      } else {
        // Mobile sharing - don't include URL in message as Share.share adds it automatically
        const mobileMessage = `🎉 ${event.name}\n\n${eventDetails}\n\n🔗 Register here:`;
        
        await Share.share({
          title: event.name,
          message: mobileMessage,
          url: eventUrl,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Could not share event');
    }
  };

  return (
    <TouchableOpacity style={style} onPress={handleShare}>
      <Feather name="share-2" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
};

export default ShareButton;