import React from 'react';
import { TouchableOpacity, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { generateEventLink } from '../utils/deepLinking';

const CopyLinkButton = ({ event, style, iconSize = 24, iconColor = '#6366F1' }) => {
  const handleCopyLink = async () => {
    try {
      const eventUrl = generateEventLink(event.id);
      
      if (Platform.OS === 'web') {
        // Web platform - use clipboard API
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(eventUrl);
          Alert.alert('Success', 'Event link copied to clipboard!');
        } else {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = eventUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          Alert.alert('Success', 'Event link copied to clipboard!');
        }
      } else {
        // Mobile platform - use Expo Clipboard
        await Clipboard.setStringAsync(eventUrl);
        Alert.alert('Success', 'Event link copied to clipboard!');
      }
    } catch (error) {
      console.error('Copy link error:', error);
      Alert.alert('Error', 'Could not copy event link');
    }
  };

  return (
    <TouchableOpacity style={style} onPress={handleCopyLink}>
      <Feather name="link" size={iconSize} color={iconColor} />
    </TouchableOpacity>
  );
};

export default CopyLinkButton;
