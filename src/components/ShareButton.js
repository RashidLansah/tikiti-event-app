import React from 'react';
import { TouchableOpacity, Alert, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { shareEvent } from '../utils/deepLinking';

const ShareButton = ({ event, style, iconSize = 24, iconColor = '#6366F1' }) => {
  const handleShare = async () => {
    try {
      const result = await shareEvent(event);
      
      if (result.success) {
        if (result.message) {
          Alert.alert('Success', result.message);
        }
      } else {
        Alert.alert('Error', 'Could not share event');
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