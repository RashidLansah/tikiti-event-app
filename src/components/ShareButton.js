import React from 'react';
import { TouchableOpacity, Alert, Platform, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { generateEventLink } from '../utils/deepLinking';

const ShareButton = ({ event, style, iconSize = 24, iconColor = '#6366F1' }) => {
  const handleShare = async () => {
    try {
      // Use the same simple URL generation as CopyLinkButton
      const eventUrl = generateEventLink(event.id);
      
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

      const shareData = {
        title: event.name,
        message: `🎉 ${event.name}\n\n${eventDetails}\n\n🔗 Register here: ${eventUrl}`,
        url: eventUrl,
      };

      if (Platform.OS === 'web') {
        // Web sharing
        if (navigator.share) {
          await navigator.share({
            title: shareData.title,
            text: shareData.message,
          });
        } else {
          // Fallback: copy to clipboard
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareData.message);
            Alert.alert('Success', 'Event details copied to clipboard!');
          }
        }
      } else {
        // Mobile sharing
        await Share.share(shareData);
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