import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import ShareButton from '../../components/ShareButton';
import CopyLinkButton from '../../components/CopyLinkButton';
import PillTabBar from '../../components/PillTabBar';
import { eventService, bookingService, eventUpdateService, eventSurveyService } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import notificationService from '../../services/notificationService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { useTheme } from '../../context/ThemeContext';
import { EventDetailSkeleton } from '../../components/Skeleton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const EventDetailScreen = ({ navigation, route }) => {
  const { event: eventParam } = route.params;
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [event, setEvent] = useState(eventParam);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [userBooking, setUserBooking] = useState(null);
  const [checkingBooking, setCheckingBooking] = useState(true);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [activeEventTab, setActiveEventTab] = useState('ticket');
  const [eventUpdates, setEventUpdates] = useState([]);
  const [eventSurveys, setEventSurveys] = useState([]);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [loadingSurveys, setLoadingSurveys] = useState(false);

  // Tabs for the registered/post-RSVP view
  const eventTabs = [
    { key: 'ticket', label: 'Ticket', icon: 'tag' },
    { key: 'program', label: 'Program', icon: 'menu' },
    { key: 'updates', label: 'Updates', icon: 'bell' },
    { key: 'messages', label: 'Messages', icon: 'message-square' },
    { key: 'feedback', label: 'Feedback', icon: 'message-circle' },
  ];

  // Per-tab empty state content
  const tabEmptyStates = {
    program: {
      icon: 'calendar',
      title: 'No program yet',
      subtitle: 'The event program hasn\'t been published yet. Check back closer to the event date.',
    },
    updates: {
      icon: 'bell',
      title: 'No updates yet',
      subtitle: 'The organizer hasn\'t posted any updates. You\'ll be notified when they do.',
    },
    messages: {
      icon: 'message-square',
      title: 'No messages yet',
      subtitle: 'No messages from the organizer or other attendees yet.',
    },
    feedback: {
      icon: 'message-circle',
      title: 'Feedback not available',
      subtitle: 'Feedback will be available after the event ends. Share your experience then!',
    },
  };

  // Calculate days left until event
  const getDaysLeft = () => {
    if (!event.date) return null;
    try {
      const eventDate = new Date(event.date);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const diffTime = eventDay - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return null;
    }
  };

  const getDaysLeftLabel = () => {
    const daysLeft = getDaysLeft();
    if (daysLeft === null) return '';
    if (daysLeft < 0) return 'Event has passed';
    if (daysLeft === 0) return 'Today!';
    if (daysLeft === 1) return 'Tomorrow';
    return `${daysLeft} days left`;
  };

  // Note: RSVP form removed - app users use their existing profile data

  // Fetch real-time attendee count
  const fetchAttendeeCount = async () => {
    if (!event?.id || !user) {
      console.log('⚠️ Skipping attendee fetch: no event ID or user not authenticated');
      return;
    }
    
    try {
      setLoadingAttendees(true);
      const attendees = await bookingService.getEventAttendees(event.id);
      setAttendeeCount(attendees?.length || 0);
    } catch (error) {
      console.error('Error fetching attendee count:', error);
      // Don't show error to user, just set count to 0
      setAttendeeCount(0);
    } finally {
      setLoadingAttendees(false);
    }
  };

  useEffect(() => {
    fetchAttendeeCount();
  }, [event?.id, user]);

  // Handle opening directions in Google Maps
  const handleGetDirections = () => {
    console.log('🗺️ Get Directions clicked');
    console.log('📍 Event location:', event.location);
    
    if (!event.location) {
      console.log('❌ No location data');
      Alert.alert('Error', 'Location information is not available for this event.');
      return;
    }

    let locationString = '';
    let coordinates = null;

    // Handle different location formats
    if (typeof event.location === 'object') {
      locationString = event.location.address || event.location.name || '';
      coordinates = event.location.coordinates;
      console.log('📍 Object location - String:', locationString, 'Coordinates:', coordinates);
    } else {
      locationString = event.location;
      console.log('📍 String location:', locationString);
    }

    if (!locationString && !coordinates) {
      console.log('❌ No valid location data');
      Alert.alert('Error', 'Location information is not available for this event.');
      return;
    }

    // Create Google Maps URL
    let mapsUrl = '';
    
    if (coordinates && coordinates.latitude && coordinates.longitude) {
      // Use coordinates if available (more accurate)
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`;
      console.log('🗺️ Using coordinates URL:', mapsUrl);
    } else {
      // Use address string
      mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(locationString)}`;
      console.log('🗺️ Using address URL:', mapsUrl);
    }

    // Try to open in Google Maps app first, then fallback to web
    const googleMapsUrl = Platform.OS === 'ios' 
      ? `comgooglemaps://?daddr=${coordinates ? `${coordinates.latitude},${coordinates.longitude}` : encodeURIComponent(locationString)}&directionsmode=driving`
      : `google.navigation:q=${coordinates ? `${coordinates.latitude},${coordinates.longitude}` : encodeURIComponent(locationString)}`;

    console.log('📱 Platform:', Platform.OS);
    console.log('🔗 Google Maps URL:', googleMapsUrl);

    Linking.canOpenURL(googleMapsUrl)
      .then((supported) => {
        console.log('📱 Can open Google Maps app:', supported);
        if (supported) {
          console.log('✅ Opening Google Maps app');
          return Linking.openURL(googleMapsUrl);
        } else {
          console.log('🌐 Opening web version');
          // Fallback to web version
          return Linking.openURL(mapsUrl);
        }
      })
      .catch((err) => {
        console.error('💥 Error opening maps:', err);
        // Final fallback to web version
        Linking.openURL(mapsUrl).catch((webErr) => {
          console.error('💥 Error opening web maps:', webErr);
          Alert.alert('Error', 'Unable to open maps. Please try again.');
        });
      });
  };

  // Load real-time event data
  useEffect(() => {
    if (event?.id) {
      const unsubscribe = eventService.subscribe(event.id, (doc) => {
        if (doc.exists()) {
          setEvent({ id: doc.id, ...doc.data() });
        }
      });

      return () => unsubscribe();
    }
  }, [event?.id]);

  // Check if user has already booked/RSVP'd for this event
  useEffect(() => {
    const checkUserBooking = async () => {
      if (user && event?.id) {
        setCheckingBooking(true);
        try {
          const existingBooking = await bookingService.getUserBookingForEvent(user.uid, event.id);
          setUserBooking(existingBooking);
        } catch (error) {
          console.error('Error checking user booking:', error);
        } finally {
          setCheckingBooking(false);
        }
      }
    };

    checkUserBooking();
  }, [user, event?.id]);

  // Load event updates (subcollection) when registered
  useEffect(() => {
    if (userBooking && event?.id) {
      setLoadingUpdates(true);
      const unsubscribe = eventUpdateService.subscribe(event.id, (updates) => {
        setEventUpdates(updates);
        setLoadingUpdates(false);
      });
      return () => { if (unsubscribe) unsubscribe(); };
    }
  }, [userBooking, event?.id]);

  // Load event surveys (subcollection) when registered
  useEffect(() => {
    if (userBooking && event?.id) {
      setLoadingSurveys(true);
      eventSurveyService.getByEvent(event.id).then((surveys) => {
        setEventSurveys(surveys);
        setLoadingSurveys(false);
      }).catch(() => setLoadingSurveys(false));
    }
  }, [userBooking, event?.id]);

  const handleCancelBooking = async () => {
    if (!userBooking) return;

    const actionText = event.type === 'free' ? 'withdraw your RSVP' : 'cancel your booking';
    const confirmText = event.type === 'free' ? 'Withdraw RSVP' : 'Cancel Booking';
    
    Alert.alert(
      'Confirm Cancellation',
      `Are you sure you want to ${actionText} for this event?`,
      [
        { text: 'Keep Registration', style: 'cancel' },
        {
          text: confirmText,
          style: 'destructive',
          onPress: async () => {
            setBooking(true);
            try {
              await bookingService.cancelBooking(
                userBooking.id,
                event.id,
                userBooking.quantity
              );
              
              setUserBooking(null);
              
              const successMessage = event.type === 'free' 
                ? 'Your RSVP has been withdrawn successfully.'
                : 'Your booking has been cancelled successfully.';
              
              Alert.alert('Success', successMessage);
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel. Please try again.');
            } finally {
              setBooking(false);
            }
          }
        }
      ]
    );
  };

  const handleBookTicket = async () => {
    if (!user) {
      const actionText = event.type === 'free' ? 'register for this event' : 'book tickets';
      Alert.alert('Login Required', `Please login to ${actionText}`, [
        { text: 'Cancel' },
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
      return;
    }

    if (!event) {
      Alert.alert('Error', 'Event information not available');
      return;
    }

    // Check if event is full
    if (event.availableTickets <= 0) {
      Alert.alert('Event Full', 'Sorry, this event is fully booked. No more spots are available.');
      return;
    }

    // Check if event is active
    if (event.status !== 'active' && event.isActive !== true) {
      Alert.alert('Event Not Available', 'This event is no longer accepting bookings.');
      return;
    }

    if (event.type !== 'free' && event.availableTickets < ticketQuantity) {
      Alert.alert('Not Enough Tickets', `Only ${event.availableTickets} spots remaining. Cannot book ${ticketQuantity} tickets.`);
      return;
    }

    // For app users, proceed directly since we already have their details
    await processBooking();
  };

  // Form handlers removed - direct RSVP for app users

  const processBooking = async () => {
    setBooking(true);

    try {
      console.log('🚀 Starting booking process...');
      const finalQuantity = event.type === 'free' ? 1 : ticketQuantity;
      const bookingData = {
        eventId: event.id,
        userId: user.uid,
        quantity: finalQuantity,
        totalPrice: event.type === 'free' ? 0 : (event.price * finalQuantity),
        eventName: event.name,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        userEmail: user.email,
        userName: user.displayName || 'Guest',
        registrationType: event.type === 'free' ? 'rsvp' : 'purchase',
        // For app users, we use their existing profile information
        firstName: user.displayName?.split(' ')[0] || '',
        lastName: user.displayName?.split(' ').slice(1).join(' ') || '',
        phoneNumber: user.phoneNumber || '',
        gender: user.gender || '',
      };

      console.log('📝 Creating booking with data:', bookingData);
      const bookingResult = await bookingService.create(bookingData);
      console.log('✅ Booking created successfully:', bookingResult);
      
      // If we get here, the booking was successful - no need to continue if there are errors
      console.log('🎯 Core booking process completed successfully');

      const successTitle = event.type === 'free' ? 'RSVP Confirmed!' : 'Booking Confirmed!';
      const successMessage = event.type === 'free' 
        ? `You have successfully registered for ${event.name}`
        : `Successfully booked ${finalQuantity} ticket(s) for ${event.name}`;
      
      // Send RSVP confirmation notification (non-blocking)
      if (event.type === 'free') {
        notificationService.sendRSVPConfirmation(user.uid, event.name, event.id).catch(error => {
          console.warn('Failed to send RSVP confirmation notification:', error);
        });
        // Schedule event reminder notification (non-blocking)
        notificationService.scheduleEventReminder(user.uid, event.name, event.id, event.date, event.time).catch(error => {
          console.warn('Failed to schedule event reminder notification:', error);
        });
      }
      
      // Send new RSVP notification to organizer (non-blocking)
      if (event.organizerId) {
        const attendeeName = user?.displayName || user?.email || 'Someone';
        notificationService.sendNewRSVPNotification(event.organizerId, event.name, attendeeName, event.id).catch(error => {
          console.warn('Failed to send new RSVP notification to organizer:', error);
        });
      }
      
      // Refresh user booking status (non-blocking)
      bookingService.getUserBookingForEvent(user.uid, event.id).then(newBooking => {
        setUserBooking(newBooking);
      }).catch(error => {
        console.warn('Failed to refresh user booking status:', error);
      });
      
      // Update the event state to reflect new booking numbers (non-blocking)
      if (event?.id) {
        eventService.getById(event.id).then(updatedEvent => {
          if (updatedEvent) {
            setEvent(updatedEvent);
          }
        }).catch(error => {
          console.warn('Failed to refresh event data:', error);
        });
      }

      console.log('🎉 Showing success alert:', successTitle, successMessage);
      
      // Always show success alert - the booking was successful
      Alert.alert(
        successTitle,
        successMessage,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('❌ Booking error:', error);
      
      // Handle specific error messages
      if (error.message.includes('spots remaining') || error.message.includes('spots available')) {
        Alert.alert('Event Full', error.message);
      } else if (error.message.includes('no longer accepting')) {
        Alert.alert('Event Not Available', error.message);
      } else {
        Alert.alert('Booking Failed', error.message || 'Please try again later');
      }
    } finally {
      setBooking(false);
    }
  };


  const handleBuyTicket = () => {
    const priceValue = parseFloat(event.price.replace('₵', ''));
    const total = (priceValue * ticketQuantity).toFixed(2);
    
    Alert.alert(
      'Purchase Confirmation',
      `Buy ${ticketQuantity} ticket(s) for ${event.name}?\n\nTotal: ₵${total}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Buy Now',
          onPress: () => {
            navigation.navigate('Ticket', { 
              event,
              quantity: ticketQuantity,
              purchaseId: 'TKT-' + Date.now()
            });
          },
        },
      ]
    );
  };




  const adjustQuantity = (delta) => {
    const newQuantity = ticketQuantity + delta;
    if (newQuantity >= 1 && newQuantity <= 10) {
      setTicketQuantity(newQuantity);
    }
  };

  // Format event date/time for display
  const getFormattedDateTime = () => {
    if (!event.date) return '';
    try {
      const eventDate = new Date(event.date);
      const now = new Date();
      const isToday = eventDate.toDateString() === now.toDateString();
      const time = event.startTime || event.time || '';
      if (isToday && time) return `${time} Today`;
      if (time) return `${time} · ${eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      return eventDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    } catch {
      return event.date;
    }
  };

  // Format date for the registered card view (e.g., "Fri.14 May 2026")
  const getFormattedDate = () => {
    if (!event.date) return '';
    try {
      const eventDate = new Date(event.date);
      const weekday = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
      const day = eventDate.getDate();
      const month = eventDate.toLocaleDateString('en-US', { month: 'short' });
      const year = eventDate.getFullYear();
      return `${weekday}.${day} ${month} ${year}`;
    } catch {
      return event.date;
    }
  };

  // Format time for the registered card view (e.g., "6 PM")
  const getFormattedTime = () => {
    return event.startTime || event.time || '';
  };

  // Get location string
  const getLocationString = () => {
    if (!event.location) return 'Location TBA';
    if (typeof event.location === 'object') {
      return event.location.name || event.location.address || 'Location TBA';
    }
    return event.location;
  };

  // Generate QR code data for the ticket tab
  const generateQRData = () => {
    const ticketData = {
      ticketId: userBooking?.qrCode || `TKT${(userBooking?.id || '').slice(-8).toUpperCase()}`,
      eventId: event?.id || 'unknown-event',
      eventName: event?.name || 'Unknown Event',
      userId: user?.uid || 'unknown-user',
      userName: user?.displayName || user?.email || 'Unknown User',
      purchaseId: userBooking?.id || `booking-${Date.now()}`,
      quantity: userBooking?.quantity || 1,
      status: 'confirmed',
      timestamp: Date.now(),
    };
    return JSON.stringify(ticketData);
  };

  // Render the QR code / Ticket tab content
  const renderTicketTabContent = () => {
    const daysLeft = getDaysLeft();
    const daysLeftLabel = getDaysLeftLabel();
    const ticketId = userBooking?.qrCode || `TKT${(userBooking?.id || '').slice(-8).toUpperCase()}`;

    return (
      <View style={registeredStyles.ticketTabContainer}>
        {/* Days left counter */}
        {daysLeft !== null && daysLeft >= 0 && (
          <View style={registeredStyles.daysLeftCard}>
            <View style={registeredStyles.daysLeftIconContainer}>
              <Feather name="clock" size={20} color={Colors.primary[500]} />
            </View>
            <View style={registeredStyles.daysLeftContent}>
              <Text style={registeredStyles.daysLeftValue}>
                {daysLeft === 0 ? 'Today' : daysLeft === 1 ? '1 day' : `${daysLeft} days`}
              </Text>
              <Text style={registeredStyles.daysLeftLabel}>
                {daysLeft === 0 ? 'Event is happening today!' : 'until the event'}
              </Text>
            </View>
          </View>
        )}

        {/* QR Code Section */}
        <View style={registeredStyles.qrSection}>
          <Text style={registeredStyles.qrSectionTitle}>Your Ticket</Text>
          <Text style={registeredStyles.qrSectionSubtitle}>Show this QR code at the venue entrance</Text>

          <View style={registeredStyles.qrCodeWrapper}>
            <QRCode
              value={generateQRData()}
              size={200}
              color="black"
              backgroundColor="white"
              logoBackgroundColor="transparent"
            />
          </View>

          <View style={registeredStyles.qrLabelContainer}>
            <Feather name="camera" size={16} color={Colors.text.tertiary} style={{ marginRight: 8 }} />
            <Text style={registeredStyles.qrLabel}>Scan at venue entrance</Text>
          </View>

          {/* Ticket ID */}
          <View style={registeredStyles.ticketIdContainer}>
            <Feather name="hash" size={12} color={Colors.text.tertiary} style={{ marginRight: 4 }} />
            <Text style={registeredStyles.ticketIdText}>{ticketId}</Text>
          </View>
        </View>

        {/* Ticket details */}
        <View style={registeredStyles.ticketDetails}>
          <View style={registeredStyles.ticketDetailRow}>
            <Text style={registeredStyles.ticketDetailLabel}>Attendee</Text>
            <Text style={registeredStyles.ticketDetailValue}>
              {user?.displayName || user?.email || 'Attendee'}
            </Text>
          </View>
          <View style={registeredStyles.ticketDetailRow}>
            <Text style={registeredStyles.ticketDetailLabel}>Quantity</Text>
            <Text style={registeredStyles.ticketDetailValue}>
              {userBooking?.quantity || 1} ticket{(userBooking?.quantity || 1) > 1 ? 's' : ''}
            </Text>
          </View>
          <View style={registeredStyles.ticketDetailRow}>
            <Text style={registeredStyles.ticketDetailLabel}>Type</Text>
            <Text style={registeredStyles.ticketDetailValue}>
              {userBooking?.registrationType === 'rsvp' ? 'Free RSVP' : 'Paid Ticket'}
            </Text>
          </View>
          <View style={registeredStyles.ticketDetailRow}>
            <Text style={registeredStyles.ticketDetailLabel}>Status</Text>
            <Text style={[registeredStyles.ticketDetailValue, { color: Colors.success[500] }]}>
              Confirmed
            </Text>
          </View>
        </View>

        {/* Share ticket button */}
        <TouchableOpacity
          style={registeredStyles.shareTicketButton}
          onPress={() => {
            Share.share({
              message: `🎫 ${event.name}\n📅 ${event.date}\n⏰ ${event.startTime || event.time || 'TBA'}\n📍 ${getLocationString()}\n🎟️ Ticket: ${ticketId}\n\nGenerated by Tikiti App`,
              title: `${event.name} Ticket`,
            });
          }}
        >
          <Feather name="share-2" size={18} color={Colors.white} />
          <Text style={registeredStyles.shareTicketButtonText}>Share Ticket</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ──── Program Tab Content ────────────────────────────
  const renderProgramContent = () => {
    const program = event?.program;
    if (!program || !program.sessions || program.sessions.length === 0) {
      return renderEmptyState('program');
    }

    // Group sessions by date
    const sessionsByDate = {};
    program.sessions.forEach((session) => {
      const dateKey = session.date || event.date || 'Schedule';
      if (!sessionsByDate[dateKey]) sessionsByDate[dateKey] = [];
      sessionsByDate[dateKey].push(session);
    });

    // Sort sessions within each date by startTime
    Object.keys(sessionsByDate).forEach((dateKey) => {
      sessionsByDate[dateKey].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    });

    return (
      <View style={registeredStyles.programContainer}>
        {Object.entries(sessionsByDate).map(([dateKey, sessions]) => (
          <View key={dateKey}>
            <Text style={registeredStyles.programDateHeader}>{dateKey}</Text>
            {sessions.map((session, index) => (
              <View key={session.id || index} style={registeredStyles.sessionCard}>
                {/* Time column */}
                <View style={registeredStyles.sessionTimeColumn}>
                  <Text style={registeredStyles.sessionTime}>
                    {session.startTime || 'TBA'}
                  </Text>
                  {session.endTime && (
                    <Text style={registeredStyles.sessionEndTime}>
                      {session.endTime}
                    </Text>
                  )}
                </View>

                {/* Session details */}
                <View style={registeredStyles.sessionContent}>
                  {/* Type badge */}
                  {session.type && session.type !== 'session' && (
                    <View style={registeredStyles.sessionTypeBadge}>
                      <Text style={registeredStyles.sessionTypeBadgeText}>
                        {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                      </Text>
                    </View>
                  )}
                  <Text style={registeredStyles.sessionTitle}>{session.title}</Text>
                  {session.description ? (
                    <Text style={registeredStyles.sessionDescription} numberOfLines={2}>
                      {session.description}
                    </Text>
                  ) : null}
                  {/* Speaker info */}
                  {session.speaker?.name && (
                    <View style={registeredStyles.sessionSpeaker}>
                      <Feather name="user" size={12} color={Colors.text.tertiary} />
                      <Text style={registeredStyles.sessionSpeakerText}>
                        {session.speaker.name}
                      </Text>
                    </View>
                  )}
                  {/* Location */}
                  {session.location?.name && (
                    <View style={registeredStyles.sessionSpeaker}>
                      <Feather name="map-pin" size={12} color={Colors.text.tertiary} />
                      <Text style={registeredStyles.sessionSpeakerText}>
                        {session.location.name}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  // ──── Updates Tab Content ──────────────────────────────
  const renderUpdatesContent = () => {
    if (loadingUpdates) {
      return (
        <View style={registeredStyles.emptyState}>
          <ActivityIndicator size="small" color={Colors.primary[500]} />
          <Text style={registeredStyles.emptyStateTitle}>Loading updates...</Text>
        </View>
      );
    }

    if (!eventUpdates || eventUpdates.length === 0) {
      return renderEmptyState('updates');
    }

    return (
      <View style={registeredStyles.updatesContainer}>
        {eventUpdates.map((update) => {
          const createdAt = update.createdAt?.toDate?.() || (update.createdAt ? new Date(update.createdAt) : null);
          const timeAgo = createdAt ? getTimeAgo(createdAt) : '';

          return (
            <View key={update.id} style={registeredStyles.updateCard}>
              <View style={registeredStyles.updateHeader}>
                <View style={registeredStyles.updateIconCircle}>
                  <Feather
                    name={update.type === 'important' ? 'alert-circle' : 'bell'}
                    size={14}
                    color={update.type === 'important' ? Colors.error[500] : Colors.primary[500]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={registeredStyles.updateTitle}>{update.title}</Text>
                  {timeAgo ? <Text style={registeredStyles.updateTime}>{timeAgo}</Text> : null}
                </View>
              </View>
              {update.content ? (
                <Text style={registeredStyles.updateContent}>{update.content}</Text>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  };

  // Helper: time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  // ──── Feedback Tab Content ─────────────────────────────
  const renderFeedbackContent = () => {
    const daysLeft = getDaysLeft();

    // If event hasn't passed, show "coming soon" state
    if (daysLeft !== null && daysLeft > 0) {
      return (
        <View style={registeredStyles.emptyState}>
          <Feather name="message-circle" size={24} color={Colors.text.tertiary} />
          <View style={registeredStyles.emptyStateText}>
            <Text style={registeredStyles.emptyStateTitle}>Feedback opens after the event</Text>
            <Text style={registeredStyles.emptyStateSubtitle}>
              You'll be able to share your experience once the event has concluded.
            </Text>
          </View>
        </View>
      );
    }

    if (loadingSurveys) {
      return (
        <View style={registeredStyles.emptyState}>
          <ActivityIndicator size="small" color={Colors.primary[500]} />
          <Text style={registeredStyles.emptyStateTitle}>Loading feedback...</Text>
        </View>
      );
    }

    if (!eventSurveys || eventSurveys.length === 0) {
      return (
        <View style={registeredStyles.emptyState}>
          <Feather name="message-circle" size={24} color={Colors.text.tertiary} />
          <View style={registeredStyles.emptyStateText}>
            <Text style={registeredStyles.emptyStateTitle}>No feedback forms</Text>
            <Text style={registeredStyles.emptyStateSubtitle}>
              The organizer hasn't created any feedback surveys for this event yet.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={registeredStyles.updatesContainer}>
        {eventSurveys.map((survey) => (
          <TouchableOpacity key={survey.id} style={registeredStyles.surveyCard}>
            <View style={registeredStyles.surveyHeader}>
              <Feather name="clipboard" size={18} color={Colors.primary[500]} />
              <View style={{ flex: 1 }}>
                <Text style={registeredStyles.surveyTitle}>{survey.title || 'Event Feedback'}</Text>
                <Text style={registeredStyles.surveySubtitle}>
                  {survey.questions?.length || 0} questions
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.text.tertiary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ──── Empty state helper ──────────────────────────────
  const renderEmptyState = (tabKey) => {
    const emptyState = tabEmptyStates[tabKey] || tabEmptyStates.program;
    return (
      <View style={registeredStyles.emptyState}>
        <Feather name={emptyState.icon} size={24} color={Colors.text.tertiary} />
        <View style={registeredStyles.emptyStateText}>
          <Text style={registeredStyles.emptyStateTitle}>{emptyState.title}</Text>
          <Text style={registeredStyles.emptyStateSubtitle}>{emptyState.subtitle}</Text>
        </View>
        <TouchableOpacity
          style={registeredStyles.refreshButton}
          onPress={() => {
            if (event?.id) {
              eventService.getById(event.id).then(updatedEvent => {
                if (updatedEvent) setEvent(updatedEvent);
              });
            }
          }}
        >
          <Feather name="refresh-cw" size={18} color={Colors.white} />
          <Text style={registeredStyles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ──── Main tab content router ──────────────────────────
  const renderTabContent = () => {
    switch (activeEventTab) {
      case 'ticket':
        return renderTicketTabContent();
      case 'program':
        return renderProgramContent();
      case 'updates':
        return renderUpdatesContent();
      case 'feedback':
        return renderFeedbackContent();
      case 'messages':
        // Messages are sent via email/SMS from dashboard — no persistent storage
        return renderEmptyState('messages');
      default:
        return renderEmptyState('program');
    }
  };

  // ──────────────────────────────────────────────────────
  // LOADING STATE — Show skeleton while checking booking
  // ──────────────────────────────────────────────────────
  if (checkingBooking) {
    return <EventDetailSkeleton />;
  }

  // ──────────────────────────────────────────────────────
  // REGISTERED VIEW — Card layout matching Figma 45:584
  // ──────────────────────────────────────────────────────
  if (userBooking) {
    return (
      <View style={[registeredStyles.container, { backgroundColor: colors.background.primary }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background.primary} />

        {/* Header */}
        <View style={registeredStyles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={registeredStyles.backButton}>
            <Feather name="arrow-left" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={registeredStyles.headerTitle}>Events details</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={registeredStyles.scrollContent}
        >
          {/* Event Card */}
          <View style={registeredStyles.eventCard}>
            {/* Event Image */}
            <View style={registeredStyles.imageContainer}>
              {event.imageBase64 ? (
                <Image
                  source={{
                    uri: event.imageBase64.startsWith('data:')
                      ? event.imageBase64
                      : `data:image/jpeg;base64,${event.imageBase64}`,
                  }}
                  style={registeredStyles.eventImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={[registeredStyles.eventImage, { backgroundColor: colors.primary[200], justifyContent: 'center', alignItems: 'center' }]}>
                  <Feather name="image" size={32} color={colors.primary[400]} />
                </View>
              )}

              {/* Going badge */}
              <View style={registeredStyles.goingBadge}>
                <Text style={registeredStyles.goingBadgeText}>Going</Text>
              </View>
            </View>

            {/* Event Title */}
            <Text style={registeredStyles.eventTitle}>{event.name}</Text>

            {/* Date, Time, Location pills */}
            <View style={registeredStyles.pillsContainer}>
              <View style={registeredStyles.pillRow}>
                <View style={registeredStyles.pill}>
                  <Text style={registeredStyles.pillText}>{getFormattedDate()}</Text>
                </View>
                <View style={registeredStyles.pill}>
                  <Text style={registeredStyles.pillText}>{getFormattedTime()}</Text>
                </View>
              </View>
              <View style={registeredStyles.pill}>
                <Text style={registeredStyles.pillText}>{getLocationString()}</Text>
              </View>
            </View>
          </View>

          {/* Meeting link for virtual/hybrid events */}
          {(event.venueType === 'virtual' || event.venueType === 'hybrid') && (
            <View style={registeredStyles.meetingLinkCard}>
              <View style={registeredStyles.meetingLinkHeader}>
                <Feather name="video" size={18} color={Colors.primary[500]} />
                <Text style={registeredStyles.meetingLinkTitle}>
                  {event.venueType === 'hybrid' ? 'Join Online (Hybrid)' : 'Join Virtual Event'}
                </Text>
              </View>
              <Text style={registeredStyles.meetingPlatform}>
                {event.meetingPlatform === 'google_meet' ? 'Google Meet' :
                 event.meetingPlatform === 'zoom' ? 'Zoom' :
                 event.meetingPlatform === 'teams' ? 'Microsoft Teams' :
                 event.meetingPlatform || 'Online Meeting'}
              </Text>
              {event.meetingLink ? (
                <TouchableOpacity
                  style={registeredStyles.joinMeetingButton}
                  onPress={() => Linking.openURL(event.meetingLink)}
                >
                  <Feather name="external-link" size={16} color={Colors.white} />
                  <Text style={registeredStyles.joinMeetingButtonText}>Join Meeting</Text>
                </TouchableOpacity>
              ) : (
                <Text style={registeredStyles.meetingLinkPending}>
                  Meeting link will be shared by the organizer
                </Text>
              )}
            </View>
          )}

          {/* Days left indicator */}
          {getDaysLeft() !== null && getDaysLeft() >= 0 && (
            <View style={registeredStyles.daysLeftPill}>
              <Feather name="clock" size={14} color={Colors.primary[500]} />
              <Text style={registeredStyles.daysLeftPillText}>{getDaysLeftLabel()}</Text>
            </View>
          )}

          {/* PillTabBar — Ticket, Program, Updates, Messages, Feedback */}
          <View style={registeredStyles.tabBarContainer}>
            <PillTabBar
              tabs={eventTabs}
              activeTab={activeEventTab}
              onTabPress={setActiveEventTab}
            />
          </View>

          {/* Tab content area */}
          {renderTabContent()}

          {/* Cancel registration option */}
          <TouchableOpacity
            style={registeredStyles.cancelRegistration}
            onPress={handleCancelBooking}
            disabled={booking}
          >
            {booking ? (
              <ActivityIndicator size="small" color={colors.error[500]} />
            ) : (
              <>
                <Feather name="x-circle" size={16} color={colors.error[500]} />
                <Text style={[registeredStyles.cancelRegistrationText, { color: colors.error[500] }]}>
                  {userBooking.registrationType === 'rsvp' ? 'Withdraw RSVP' : 'Cancel Booking'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  // ──────────────────────────────────────────────────────
  // UNREGISTERED VIEW — Hero layout (pre-registration)
  // ──────────────────────────────────────────────────────
  return (
    <View style={styles.modalContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero Image Section — Full bleed with gradient overlay */}
        <View style={styles.heroSection}>
          {event.imageBase64 ? (
            <Image
              source={{
                uri: event.imageBase64.startsWith('data:')
                  ? event.imageBase64
                  : `data:image/jpeg;base64,${event.imageBase64}`,
              }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.heroImage, { backgroundColor: colors.primary[700] }]}>
              <Feather name="image" size={48} color="rgba(255,255,255,0.3)" />
            </View>
          )}

          {/* Gradient overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            locations={[0.35, 0.85]}
            style={styles.heroGradient}
          />

          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="x" size={16} color={Colors.black} />
          </TouchableOpacity>

          {/* Content overlaid on hero */}
          <View style={styles.heroContent}>
            {/* Live badge */}
            {event.category && (
              <View style={styles.liveBadge}>
                <Feather name="video" size={16} color={Colors.black} />
                <Text style={styles.liveBadgeText}>{event.category}</Text>
              </View>
            )}

            {/* Event title */}
            <Text style={styles.heroTitle}>{event.name}</Text>

            {/* Date/time */}
            <Text style={styles.heroDateTime}>{getFormattedDateTime()}</Text>
          </View>
        </View>

        {/* Bottom white content section */}
        <View style={[styles.contentSection, { backgroundColor: colors.background.primary }]}>
          {/* Description */}
          <Text style={[styles.descriptionTitle, { color: colors.text.primary }]}>
            {event.description?.substring(0, 80) || 'No description available.'}
          </Text>
          <Text style={[styles.descriptionBody, { color: colors.text.secondary }]}>
            {event.description?.substring(80) || ''}
          </Text>

          {/* Attendee count */}
          <View style={styles.attendeeRow}>
            <Feather name="users" size={16} color={colors.text.tertiary} />
            <Text style={[styles.attendeeText, { color: colors.text.tertiary }]}>
              {loadingAttendees ? '...' : `${attendeeCount} attending`}
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.registerButton, booking && { opacity: 0.6 }]}
              onPress={handleBookTicket}
              disabled={booking}
            >
              {booking ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.registerButtonText}>
                  {event.type === 'free' ? 'Register' : `Buy · ₵${event.price}`}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => {
                Share.share({
                  message: `Check out ${event.name}!`,
                  title: event.name,
                });
              }}
            >
              <Feather name="share" size={20} color={Colors.black} />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Ticket quantity for paid events */}
          {event.type !== 'free' && (
            <View style={[styles.quantitySection, { borderColor: colors.border.light }]}>
              <Text style={[styles.quantityLabel, { color: colors.text.secondary }]}>Quantity</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={[styles.quantityButton, ticketQuantity <= 1 && { backgroundColor: colors.gray[300] }]}
                  onPress={() => adjustQuantity(-1)}
                  disabled={ticketQuantity <= 1}
                >
                  <Feather name="minus" size={16} color={Colors.white} />
                </TouchableOpacity>
                <Text style={[styles.quantityValue, { color: colors.text.primary }]}>{ticketQuantity}</Text>
                <TouchableOpacity
                  style={[styles.quantityButton, ticketQuantity >= 10 && { backgroundColor: colors.gray[300] }]}
                  onPress={() => adjustQuantity(1)}
                  disabled={ticketQuantity >= 10}
                >
                  <Feather name="plus" size={16} color={Colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Event details cards */}
          <View style={styles.detailCards}>
            <View style={[styles.detailCard, { borderColor: colors.border.light }]}>
              <Feather name="calendar" size={18} color={colors.primary[500]} />
              <View style={styles.detailCardContent}>
                <Text style={[styles.detailCardLabel, { color: colors.text.tertiary }]}>Date & Time</Text>
                <Text style={[styles.detailCardValue, { color: colors.text.primary }]}>{event.date}</Text>
                <Text style={[styles.detailCardSub, { color: colors.text.tertiary }]}>
                  {event.startTime || event.time || 'Time TBA'}{event.endTime ? ` - ${event.endTime}` : ''}
                </Text>
              </View>
            </View>

            <View style={[styles.detailCard, { borderColor: colors.border.light }]}>
              <Feather name="map-pin" size={18} color={colors.success[500]} />
              <View style={styles.detailCardContent}>
                <Text style={[styles.detailCardLabel, { color: colors.text.tertiary }]}>Location</Text>
                <Text style={[styles.detailCardValue, { color: colors.text.primary }]}>
                  {typeof event.location === 'object' ? (event.location.name || event.location.address || 'Location TBA') : (event.location || 'Location TBA')}
                </Text>
                <TouchableOpacity onPress={handleGetDirections} style={styles.directionsLink}>
                  <Feather name="navigation" size={14} color={colors.primary[500]} />
                  <Text style={[styles.directionsText, { color: colors.primary[500] }]}>Get Directions</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Meeting link for virtual/hybrid events */}
            {(event.venueType === 'virtual' || event.venueType === 'hybrid') && (
              <View style={[styles.detailCard, { borderColor: colors.border.light }]}>
                <Feather name="video" size={18} color={colors.info[500]} />
                <View style={styles.detailCardContent}>
                  <Text style={[styles.detailCardLabel, { color: colors.text.tertiary }]}>
                    {event.venueType === 'hybrid' ? 'Online (Hybrid)' : 'Virtual Event'}
                  </Text>
                  <Text style={[styles.detailCardValue, { color: colors.text.primary }]}>
                    {event.meetingPlatform === 'google_meet' ? 'Google Meet' :
                     event.meetingPlatform === 'zoom' ? 'Zoom' :
                     event.meetingPlatform === 'teams' ? 'Microsoft Teams' :
                     event.meetingPlatform || 'Online Meeting'}
                  </Text>
                  {event.meetingLink ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(event.meetingLink)}
                      style={styles.directionsLink}
                    >
                      <Feather name="external-link" size={14} color={colors.primary[500]} />
                      <Text style={[styles.directionsText, { color: colors.primary[500] }]}>Join Meeting</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={[styles.detailCardSub, { color: colors.text.tertiary }]}>
                      Link will be shared after registration
                    </Text>
                  )}
                </View>
              </View>
            )}

            <View style={[styles.detailCard, { borderColor: colors.border.light }]}>
              <Feather name="user" size={18} color={colors.primary[500]} />
              <View style={styles.detailCardContent}>
                <Text style={[styles.detailCardLabel, { color: colors.text.tertiary }]}>Organizer</Text>
                <Text style={[styles.detailCardValue, { color: colors.text.primary }]}>{event.organizerName || 'Event Organizer'}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  // ─── Modal container ─────────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scrollView: {
    flex: 1,
  },

  // ─── Hero section ────────────────────────────────────
  heroSection: {
    height: SCREEN_HEIGHT * 0.72,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    position: 'absolute',
    top: 34,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  heroContent: {
    paddingHorizontal: 33,
    paddingBottom: 26,
    gap: 16,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 10,
  },
  liveBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16,
    color: Colors.black,
  },
  heroTitle: {
    fontFamily: Typography.fontFamily.extrabold,
    fontSize: 40,
    color: Colors.white,
    lineHeight: 44,
  },
  heroDateTime: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 20,
    color: Colors.white,
  },

  // ─── Content section ─────────────────────────────────
  contentSection: {
    paddingHorizontal: 33,
    paddingTop: 26,
  },
  descriptionTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 20,
    color: Colors.text.primary,
    marginBottom: 16,
    lineHeight: 26,
  },
  descriptionBody: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  attendeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  attendeeText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,
    color: Colors.text.tertiary,
  },

  // ─── Action buttons (Figma: two side-by-side) ───────
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  registerButton: {
    flex: 1,
    backgroundColor: '#060606',
    height: 47,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.white,
  },
  registerButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: Colors.white,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    height: 47,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.white,
    gap: 9,
  },
  shareButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: Colors.black,
  },

  // ─── Quantity section (paid events) ──────────────────
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.text.primary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.text.primary,
    minWidth: 30,
    textAlign: 'center',
  },

  // ─── Detail cards ────────────────────────────────────
  detailCards: {
    gap: 12,
  },
  detailCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: BorderRadius['3xl'],
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    gap: 14,
  },
  detailCardContent: {
    flex: 1,
  },
  detailCardLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  detailCardValue: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 15,
  },
  detailCardSub: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    marginTop: 2,
  },
  directionsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  directionsText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 13,
  },

});

// ════════════════════════════════════════════════════════
// Registered / Post-RSVP styles (Figma 45:584)
// ════════════════════════════════════════════════════════
const registeredStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.extrabold,
    fontSize: 24,
    color: Colors.text.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // ─── Event card ─────────────────────────────────────
  eventCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    padding: 14,
    paddingBottom: 15,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 161,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 17,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  goingBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  goingBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 12,
    color: Colors.black,
  },
  eventTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 24,
    color: Colors.black,
    marginBottom: 17,
  },
  pillsContainer: {
    gap: 8,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 7,
  },
  pill: {
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 16,
    color: Colors.black,
  },

  // ─── Tab bar ────────────────────────────────────────
  tabBarContainer: {
    marginTop: 20,
    marginBottom: 16,
  },

  // ─── Empty state ────────────────────────────────────
  emptyState: {
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    paddingHorizontal: 62,
    paddingVertical: 64,
    alignItems: 'center',
    gap: 40,
  },
  emptyStateText: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  emptyStateTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#060606',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 30,
    gap: 9,
    width: 167,
  },
  refreshButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: Colors.white,
  },

  // ─── Meeting link card (for virtual/hybrid) ────────
  meetingLinkCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    gap: 8,
  },
  meetingLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  meetingLinkTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16,
    color: Colors.text.primary,
  },
  meetingPlatform: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 28,
  },
  joinMeetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#060606',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 30,
    gap: 8,
    marginTop: 8,
  },
  joinMeetingButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: Colors.white,
  },
  meetingLinkPending: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
    color: Colors.text.tertiary,
    marginLeft: 28,
    fontStyle: 'italic',
  },

  // ─── Days left pill (below card, above tabs) ──────
  daysLeftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    gap: 6,
    marginTop: 16,
  },
  daysLeftPillText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: Colors.primary[500],
  },

  // ─── Ticket tab content ──────────────────────────────
  ticketTabContainer: {
    gap: 16,
  },
  daysLeftCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  daysLeftIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysLeftContent: {
    flex: 1,
  },
  daysLeftValue: {
    fontFamily: Typography.fontFamily.extrabold,
    fontSize: 24,
    color: Colors.text.primary,
  },
  daysLeftLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  qrSection: {
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  qrSectionTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 18,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  qrSectionSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: 24,
  },
  qrCodeWrapper: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  qrLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  qrLabel: {
    fontSize: 13,
    color: Colors.text.tertiary,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  ticketIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ticketIdText: {
    fontSize: 11,
    color: Colors.text.tertiary,
    fontFamily: Typography.fontFamily.mono,
  },
  ticketDetails: {
    backgroundColor: '#f0f0f0',
    borderRadius: 24,
    padding: 20,
    gap: 16,
  },
  ticketDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDetailLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    color: Colors.text.tertiary,
  },
  ticketDetailValue: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: Colors.text.primary,
  },
  shareTicketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#060606',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 9,
  },
  shareTicketButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: Colors.white,
  },

  // ─── Program tab ──────────────────────────────────────
  programContainer: {
    gap: 16,
  },
  programDateHeader: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
    color: Colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  sessionTimeColumn: {
    width: 52,
    alignItems: 'center',
    paddingTop: 2,
  },
  sessionTime: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: Colors.primary[500],
  },
  sessionEndTime: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 11,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  sessionContent: {
    flex: 1,
    gap: 4,
  },
  sessionTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  sessionTypeBadgeText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 10,
    color: Colors.primary[500],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 15,
    color: Colors.text.primary,
  },
  sessionDescription: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  sessionSpeaker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sessionSpeakerText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: Colors.text.tertiary,
  },

  // ─── Updates tab ──────────────────────────────────────
  updatesContainer: {
    gap: 12,
  },
  updateCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  updateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  updateIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 15,
    color: Colors.text.primary,
  },
  updateTime: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  updateContent: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginLeft: 42,
  },

  // ─── Surveys/Feedback tab ────────────────────────────
  surveyCard: {
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    padding: 16,
  },
  surveyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  surveyTitle: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 15,
    color: Colors.text.primary,
  },
  surveySubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },

  // ─── Cancel registration ────────────────────────────
  cancelRegistration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
  },
  cancelRegistrationText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
  },
});

export default EventDetailScreen;