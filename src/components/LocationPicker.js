import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../styles/designSystem';

const LocationPicker = ({ 
  selectedLocation, 
  onSelectLocation, 
  placeholder = "Enter location or select from map" 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Mock search results - in real implementation, this would use Google Places API
  const mockSearchResults = [
    {
      id: '1',
      name: 'Tamale Cultural Centre',
      address: 'Sports Stadium Road, Tamale, Ghana',
      coordinates: { latitude: 9.4035, longitude: -0.8433 }
    },
    {
      id: '2',
      name: 'University for Development Studies',
      address: 'Main Campus, Tamale, Ghana',
      coordinates: { latitude: 9.4035, longitude: -0.8433 }
    },
    {
      id: '3',
      name: 'Centre for National Culture',
      address: 'Cultural Square, Tamale, Ghana',
      coordinates: { latitude: 9.4035, longitude: -0.8433 }
    },
  ];

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      setIsSearching(true);
      // Simulate API call delay
      setTimeout(() => {
        const filtered = mockSearchResults.filter(item =>
          item.name.toLowerCase().includes(query.toLowerCase()) ||
          item.address.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
        setIsSearching(false);
      }, 500);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectLocation = (location) => {
    onSelectLocation(location);
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleOpenMap = () => {
    // In a real implementation, this would open Google Maps
    Alert.alert(
      'Google Maps Integration',
      'This would open Google Maps for location selection. For now, you can manually enter the location.',
      [{ text: 'OK' }]
    );
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleSelectLocation(item)}
    >
      <View style={styles.searchResultIcon}>
        <Feather name="map-pin" size={16} color={Colors.primary[500]} />
      </View>
      <View style={styles.searchResultContent}>
        <Text style={styles.searchResultName}>{item.name}</Text>
        <Text style={styles.searchResultAddress}>{item.address}</Text>
      </View>
      <Feather name="chevron-right" size={16} color={Colors.text.tertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.locationButton}
        onPress={() => setIsOpen(true)}
      >
        <View style={styles.locationButtonContent}>
          <Feather name="map-pin" size={18} color={Colors.text.primary} />
          <Text style={styles.locationButtonText}>
            {selectedLocation ? selectedLocation.name : placeholder}
          </Text>
        </View>
        <Feather name="chevron-right" size={20} color={Colors.text.tertiary} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsOpen(false)}>
              <Feather name="arrow-left" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Location</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Feather name="search" size={18} color={Colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a location..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={18} color={Colors.text.tertiary} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.mapButton}
              onPress={handleOpenMap}
            >
              <Feather name="map" size={18} color={Colors.white} />
              <Text style={styles.mapButtonText}>Open Map</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.searchResults}
            ListEmptyComponent={
              searchQuery.length > 2 && !isSearching ? (
                <View style={styles.emptyState}>
                  <Feather name="search" size={48} color={Colors.text.tertiary} />
                  <Text style={styles.emptyStateText}>No locations found</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Try a different search term or use the map
                  </Text>
                </View>
              ) : null
            }
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  locationButton: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  locationButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginLeft: Spacing[3],
    fontWeight: Typography.fontWeight.medium,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingTop: 50,
    paddingBottom: Spacing[4],
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  searchContainer: {
    padding: Spacing[4],
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.tertiary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    marginBottom: Spacing[3],
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginLeft: Spacing[3],
  },
  mapButton: {
    backgroundColor: Colors.primary[500],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.lg,
  },
  mapButtonText: {
    color: Colors.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    marginLeft: Spacing[2],
  },
  searchResults: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchResultIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing[1],
  },
  searchResultAddress: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing[20],
  },
  emptyStateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginTop: Spacing[4],
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing[2],
    paddingHorizontal: Spacing[5],
  },
});

export default LocationPicker; 