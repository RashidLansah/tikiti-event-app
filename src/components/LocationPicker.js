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
  ActivityIndicator,
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
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualLocation, setManualLocation] = useState({ name: '', address: '' });

  // Google Places API configuration
  const GOOGLE_PLACES_API_KEY = 'AIzaSyCQkHC-01AhA_LsgrIU6g4NhA46dkINrZQ';
  const GOOGLE_PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

  // Search for places using Google Places API
  const searchPlaces = async (query) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      return;
    }

    console.log('🔍 Searching for:', query);
    console.log('🔑 API Key:', GOOGLE_PLACES_API_KEY ? 'Present' : 'Missing');
    
    setIsSearching(true);
    try {
      const url = `${GOOGLE_PLACES_BASE_URL}/textsearch/json?query=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&region=gh`;
      console.log('🌐 API URL:', url);
      
      const response = await fetch(url);
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 API Response:', data);
      
      if (data.status === 'OK' && data.results) {
        const places = data.results.map(place => ({
          id: place.place_id,
          name: place.name,
          address: place.formatted_address,
          coordinates: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng
          }
        }));
        console.log('✅ Found places:', places.length);
        setSearchResults(places);
      } else if (data.status === 'ZERO_RESULTS') {
        console.log('❌ No results found');
        setSearchResults([]);
      } else {
        console.log('❌ API Error:', data.status, data.error_message);
        setSearchResults([]);
        Alert.alert('Search Error', `API Error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('💥 Error searching places:', error);
      setSearchResults([]);
      Alert.alert('Network Error', `Failed to search locations: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (text.length >= 3) {
      searchPlaces(text);
    } else {
      setSearchResults([]);
    }
  };

  // Fallback sample locations for Ghana
  const sampleLocations = [
    {
      id: 'sample-1',
      name: 'Tamale Cultural Centre',
      address: 'Sports Stadium Road, Tamale, Ghana',
      coordinates: { latitude: 9.4008, longitude: -0.8393 }
    },
    {
      id: 'sample-2', 
      name: 'Accra International Conference Centre',
      address: 'Independence Avenue, Accra, Ghana',
      coordinates: { latitude: 5.6037, longitude: -0.1870 }
    },
    {
      id: 'sample-3',
      name: 'Kumasi Cultural Centre',
      address: 'Prempeh II Street, Kumasi, Ghana', 
      coordinates: { latitude: 6.6885, longitude: -1.6244 }
    }
  ];

  // Handle place selection
  const handlePlaceSelect = (place) => {
    onSelectLocation(place);
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle manual location entry
  const handleManualEntry = () => {
    if (!manualLocation.name.trim()) {
      Alert.alert('Error', 'Please enter a location name');
      return;
    }

    const location = {
      id: `manual-${Date.now()}`,
      name: manualLocation.name.trim(),
      address: manualLocation.address.trim() || manualLocation.name.trim(),
      coordinates: {
        latitude: 0,
        longitude: 0
      }
    };

    onSelectLocation(location);
    setIsOpen(false);
    setManualLocation({ name: '', address: '' });
    setShowManualEntry(false);
  };

  // Format selected location for display
  const formatSelectedLocation = () => {
    if (!selectedLocation) return '';
    return `${selectedLocation.name}${selectedLocation.address ? `, ${selectedLocation.address}` : ''}`;
  };

  const renderSearchResult = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handlePlaceSelect(item)}
    >
      <View style={styles.searchResultIcon}>
        <Feather name="map-pin" size={16} color={Colors.primary[500]} />
      </View>
      <View style={styles.searchResultContent}>
        <Text style={styles.searchResultName}>{item.name}</Text>
        <Text style={styles.searchResultAddress}>{item.address}</Text>
      </View>
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
            {selectedLocation ? formatSelectedLocation() : placeholder}
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
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsOpen(false)}
            >
              <Feather name="x" size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Location</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Feather name="search" size={18} color={Colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search for a location..."
                placeholderTextColor={Colors.text.tertiary}
                autoFocus
              />
              {isSearching && (
                <ActivityIndicator size="small" color={Colors.primary[500]} />
              )}
            </View>
          </View>

          {!showManualEntry ? (
            <View style={styles.resultsContainer}>
              {searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.id}
                  renderItem={renderSearchResult}
                  style={styles.resultsList}
                  showsVerticalScrollIndicator={false}
                />
              ) : searchQuery.length >= 3 && !isSearching ? (
                <View style={styles.noResultsContainer}>
                  <Feather name="search" size={48} color={Colors.text.tertiary} />
                  <Text style={styles.noResultsText}>No locations found</Text>
                  <Text style={styles.sampleLocationsText}>Try these popular venues:</Text>
                  <FlatList
                    data={sampleLocations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSearchResult}
                    style={styles.sampleResultsList}
                    showsVerticalScrollIndicator={false}
                  />
                  <TouchableOpacity
                    style={styles.manualEntryButton}
                    onPress={() => setShowManualEntry(true)}
                  >
                    <Text style={styles.manualEntryButtonText}>Add manually</Text>
                  </TouchableOpacity>
                </View>
              ) : searchQuery.length === 0 ? (
                <View style={styles.placeholderContainer}>
                  <Feather name="map-pin" size={48} color={Colors.text.tertiary} />
                  <Text style={styles.placeholderText}>
                    Start typing to search for locations
                  </Text>
                  <Text style={styles.sampleLocationsText}>Or try these popular venues:</Text>
                  <FlatList
                    data={sampleLocations}
                    keyExtractor={(item) => item.id}
                    renderItem={renderSearchResult}
                    style={styles.sampleResultsList}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              ) : (
                <View style={styles.placeholderContainer}>
                  <ActivityIndicator size="small" color={Colors.primary[500]} />
                  <Text style={styles.placeholderText}>
                    Searching...
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.manualEntryContainer}>
              <Text style={styles.manualEntryTitle}>Add Location Manually</Text>
              
              <View style={styles.manualInputGroup}>
                <Text style={styles.manualLabel}>Location Name *</Text>
                <TextInput
                  style={styles.manualInput}
                  value={manualLocation.name}
                  onChangeText={(text) => setManualLocation(prev => ({ ...prev, name: text }))}
                  placeholder="e.g., Tamale Cultural Centre"
                  placeholderTextColor={Colors.text.tertiary}
                />
              </View>

              <View style={styles.manualInputGroup}>
                <Text style={styles.manualLabel}>Address (Optional)</Text>
                <TextInput
                  style={styles.manualInput}
                  value={manualLocation.address}
                  onChangeText={(text) => setManualLocation(prev => ({ ...prev, address: text }))}
                  placeholder="e.g., Sports Stadium Road, Tamale, Ghana"
                  placeholderTextColor={Colors.text.tertiary}
                  multiline
                />
              </View>

              <View style={styles.manualEntryButtons}>
                <TouchableOpacity
                  style={styles.cancelManualButton}
                  onPress={() => setShowManualEntry(false)}
                >
                  <Text style={styles.cancelManualButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmManualButton}
                  onPress={handleManualEntry}
                >
                  <Text style={styles.confirmManualButtonText}>Add Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.background.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
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
    flex: 1,
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  closeButton: {
    padding: Spacing[2],
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginLeft: Spacing[3],
  },
  resultsContainer: {
    flex: 1,
  },
  resultsList: {
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
    borderRadius: 16,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  searchResultAddress: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[5],
  },
  noResultsText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginTop: Spacing[3],
    marginBottom: Spacing[2],
  },
  sampleLocationsText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.tertiary,
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  sampleResultsList: {
    maxHeight: 200,
    marginBottom: Spacing[4],
  },
  manualEntryButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderRadius: BorderRadius.md,
  },
  manualEntryButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  placeholderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[5],
  },
  placeholderText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginTop: Spacing[3],
    textAlign: 'center',
  },
  manualEntryContainer: {
    flex: 1,
    paddingHorizontal: Spacing[5],
    paddingTop: Spacing[5],
  },
  manualEntryTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing[5],
  },
  manualInputGroup: {
    marginBottom: Spacing[4],
  },
  manualLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginBottom: Spacing[2],
  },
  manualInput: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  manualEntryButtons: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[6],
  },
  cancelManualButton: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  cancelManualButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
  },
  confirmManualButton: {
    flex: 1,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    alignItems: 'center',
  },
  confirmManualButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
});

export default LocationPicker;