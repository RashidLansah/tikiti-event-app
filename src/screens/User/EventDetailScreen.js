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
  Modal,
  TextInput,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import ShareButton from '../../components/ShareButton';
import { generateEventShareUrl } from '../../utils/sharingUtils';
import CopyLinkButton from '../../components/CopyLinkButton';
import PillTabBar from '../../components/PillTabBar';
import { eventService, bookingService, eventUpdateService, eventSurveyService } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as ExpoLinking from 'expo-linking';
import { paymentsApi } from '../../services/paymentsApi';
import notificationService from '../../services/notificationService';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../styles/designSystem';
import { useTheme } from '../../context/ThemeContext';
import { EventDetailSkeleton } from '../../components/Skeleton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Mirrors eventCta() in tikiti-web/lib/events/links.ts for the book bar (Africa/Accra is UTC+0, so wall-clock = UTC).
const getExternalCta = (event, now = new Date()) => {
  if (!event || event.registrationUrl || !event.meetingLink) return null;
  const day = (d) => {
    const m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
  };
  const start = day(event.date);
  let live = false;
  if (start != null) {
    const last = Math.max(day(event.endDate) ?? start, start);
    const t = String(event.endTime || '').match(/^(\d{1,2}):(\d{2})/);
    const end = t ? last + (Number(t[1]) * 60 + Number(t[2]) + 120) * 60000 : last + 24 * 3600000;
    live = now.getTime() >= start && now.getTime() < end;
  }
  const dateLabel = start != null
    ? new Date(start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    : String(event.date || '');
  return live
    ? { kind: 'join_now', label: 'Join now' }
    : { kind: 'join_later', label: 'Join link', leftLabel: 'GOES LIVE', leftValue: dateLabel };
};

// Organiser contacts (event.contacts) — mirrors tikiti-web/lib/events/contact.ts. These are ONLY numbers printed on the
// flyer / written in the caption; never show the submitter's (WhatsApp sender's) number.
const contactDigits = (phone) => String(phone || '').replace(/\D/g, '');
const getEventContacts = (event) =>
  (Array.isArray(event?.contacts) ? event.contacts : [])
    .filter((c) => c && contactDigits(c.phone).length >= 8)
    .slice(0, 4);
const formatContactPhone = (phone) => {
  const d = contactDigits(phone);
  return d.startsWith('233') && d.length === 12 ? `+233 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8)}` : `+${d}`;
};
const callContact = (contact) => Linking.openURL(`tel:+${contactDigits(contact.phone)}`).catch(() => {});
const whatsappContact = (contact, eventName) =>
  Linking.openURL(
    `https://wa.me/${contactDigits(contact.phone)}?text=${encodeURIComponent(`Hi, I saw "${eventName || 'your event'}" on Tikiti and would like more details.`)}`
  ).catch(() => {});
// Book-bar contact case: no registrationUrl, no meetingLink, contacts present and the organiser handles registration.
const getContactCta = (event) => {
  if (!event || event.registrationUrl || event.meetingLink) return null;
  const contacts = getEventContacts(event);
  if (!contacts.length || !(event.registrationMethod === 'contact' || event.ticketingDisabled)) return null;
  const isMobileNumber = (c) => {
    const d = String(c.phone || '').replace(/\D/g, '');
    return d.startsWith('233') ? /^233[25]\d{8}$/.test(d) : d.length >= 8;
  };
  const wa = contacts.find((c) => c.whatsapp) || contacts.find(isMobileNumber);
  return { contact: wa || contacts[0], whatsapp: !!wa };
};

const EventDetailScreen = ({ navigation, route }) => {
  const { event: eventParam } = route.params;
  const { user, userProfile, updateUserProfile } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [event, setEvent] = useState(eventParam);
  const isSaved = !!event?.id && (userProfile?.savedEvents || []).includes(event.id);
  const toggleSave = async () => {
    if (!user || !event?.id) return;
    const current = userProfile?.savedEvents || [];
    const next = current.includes(event.id) ? current.filter((id) => id !== event.id) : [...current, event.id];
    try { await updateUserProfile({ savedEvents: next }); } catch (_) {}
  };
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
  const [selectedSpeaker, setSelectedSpeaker] = useState(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [submittingRegistration, setSubmittingRegistration] = useState(false);
  const [detailTab, setDetailTab] = useState('About');

  // Tabs for the registered/post-RSVP view
  const eventTabs = [
    { key: 'ticket', label: 'Ticket', icon: 'tag' },
    { key: 'program', label: 'Program', icon: 'menu' },
    { key: 'updates', label: 'Updates', icon: 'bell' },
    { key: 'moments', label: 'Moments', icon: 'camera' },
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
      setAttendeeCount((attendees || []).filter((a) => a.status !== 'cancelled').length);
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

    // Open in-app registration bottom sheet
    setFormValues(initializeFormValues());
    setSelectedCohort(null);
    setShowRegistrationModal(true);
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

      // Multi-day: show date range
      if (event.endDate && event.endDate !== event.date) {
        const endDate = new Date(event.endDate);
        const startStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (time) return `${time} · ${startStr} - ${endStr}`;
        return `${startStr} - ${endStr}`;
      }

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

      // Multi-day: show date range
      if (event.endDate && event.endDate !== event.date) {
        const endDate = new Date(event.endDate);
        const startStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        return `${startStr} - ${endStr}`;
      }

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

  // ──── Registration Form Helpers ─────────────────────────
  const getFormFields = () => {
    // If organizer customized the form, use their fields
    if (event.registrationForm?.fields?.length > 0) {
      return event.registrationForm.fields.map(field => {
        // Determine if this field can be pre-filled from user profile
        const preFillMap = {
          'firstName': user?.displayName?.split(' ')[0] || '',
          'first_name': user?.displayName?.split(' ')[0] || '',
          'lastName': user?.displayName?.split(' ').slice(1).join(' ') || '',
          'last_name': user?.displayName?.split(' ').slice(1).join(' ') || '',
          'email': user?.email || '',
          'name': user?.displayName || '',
          'fullName': user?.displayName || '',
          'full_name': user?.displayName || '',
        };
        const fieldId = field.id?.toLowerCase() || '';
        const fieldLabel = field.label?.toLowerCase() || '';
        const isPreFilled = preFillMap[field.id] !== undefined ||
          fieldLabel.includes('first name') || fieldLabel.includes('last name') ||
          fieldLabel.includes('email') || fieldLabel.includes('full name');

        let defaultValue = preFillMap[field.id] || '';
        if (!defaultValue && fieldLabel.includes('first name')) defaultValue = user?.displayName?.split(' ')[0] || '';
        if (!defaultValue && fieldLabel.includes('last name')) defaultValue = user?.displayName?.split(' ').slice(1).join(' ') || '';
        if (!defaultValue && (fieldLabel.includes('email'))) defaultValue = user?.email || '';
        if (!defaultValue && (fieldLabel.includes('full name') || fieldLabel.includes('name'))) defaultValue = user?.displayName || '';

        return {
          ...field,
          readOnly: false,
          defaultValue,
        };
      });
    }

    // Default fields: firstName, lastName, email (pre-filled), phone, gender
    const nameParts = (user?.displayName || '').split(' ');
    return [
      { id: 'firstName', label: 'First Name', type: 'text', required: true, readOnly: false, defaultValue: nameParts[0] || '' },
      { id: 'lastName', label: 'Last Name', type: 'text', required: true, readOnly: false, defaultValue: nameParts.slice(1).join(' ') || '' },
      { id: 'email', label: 'Email', type: 'email', required: true, readOnly: false, defaultValue: user?.email || '' },
      { id: 'phone', label: 'Phone Number', type: 'phone', required: true, readOnly: false, defaultValue: '' },
      { id: 'gender', label: 'Gender', type: 'radio', required: false, readOnly: false, defaultValue: '', options: ['Male', 'Female', 'Other'] },
    ];
  };

  const initializeFormValues = () => {
    const fields = getFormFields();
    const values = {};
    fields.forEach(field => {
      values[field.id] = field.defaultValue || '';
    });
    return values;
  };

  // Re-populate form with user data once user loads (handles async auth timing)
  useEffect(() => {
    if (showRegistrationModal && user) {
      setFormValues(prev => {
        const updated = { ...prev };
        if (!updated.email && user.email) updated.email = user.email;
        if (!updated.firstName && user.displayName) {
          const parts = user.displayName.split(' ');
          updated.firstName = parts[0] || '';
          if (!updated.lastName) updated.lastName = parts.slice(1).join(' ') || '';
        }
        return updated;
      });
    }
  }, [user, showRegistrationModal]);

  const unitPrice = (() => {
    const raw = event?.price;
    if (raw == null) return 0;
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? n : 0;
  })();
  const isPaidEvent = unitPrice > 0 && !event?.registrationUrl;

  const finishRegistration = async (bookingRecord) => {
    setUserBooking({ ...bookingRecord, status: 'confirmed' });
    const isFree = !isPaidEvent;
    let ticketCount = 1;
    try {
      const all = await bookingService.getUserBookings(user.uid);
      ticketCount = all.filter((b) => b.status !== 'cancelled').length || 1;
    } catch (_) {}
    setShowRegistrationModal(false);
    navigation.navigate('RegistrationSuccess', { event, booking: bookingRecord, isFree, ticketCount });
  };

  const payForTickets = async (attendee) => {
    const init = await paymentsApi.initializeTicket({
      eventId: event.id,
      quantity: ticketQuantity,
      email: attendee.userEmail,
      attendee,
    });
    // Plain in-app browser (no iOS "Sign In" consent prompt); the return deep link closes it
    const sub = ExpoLinking.addEventListener('url', ({ url }) => {
      if (url && url.includes('pay/done')) WebBrowser.dismissBrowser();
    });
    try {
      await WebBrowser.openBrowserAsync(init.authorizationUrl, { dismissButtonStyle: 'close', presentationStyle: 'pageSheet' });
    } finally {
      sub.remove();
    }
    for (let attempt = 0; attempt < 6; attempt++) {
      const v = await paymentsApi.verifyTicket(init.reference);
      if (v.status === 'paid') return v.booking;
      if (v.status === 'failed') throw new Error('Payment failed. You have not been charged.');
      await new Promise((r) => setTimeout(r, attempt < 2 ? 2000 : 5000));
    }
    throw new Error('We could not confirm your payment yet. If you approved the MoMo prompt, your ticket will appear in Tickets shortly.');
  };

  const submitRegistration = async () => {
    const fields = getFormFields();

    // Validate required fields
    for (const field of fields) {
      if (field.required && !formValues[field.id]?.toString().trim()) {
        Alert.alert('Required Field', `Please fill in ${field.label}`);
        return;
      }
    }

    // Validate cohort selection if event has cohorts
    if (event.hasCohorts && event.cohorts && Object.keys(event.cohorts).length > 0) {
      if (!selectedCohort) {
        Alert.alert('Select a Session', 'Please select a session/cohort to register for.');
        return;
      }
      // Check if selected cohort is full
      const cohort = event.cohorts[selectedCohort];
      if (cohort && cohort.maxAttendees && (cohort.soldTickets || 0) >= cohort.maxAttendees) {
        Alert.alert('Session Full', 'The selected session is fully booked. Please choose another one.');
        return;
      }
    }

    // Validate consent if required
    if (event.registrationForm?.consentRequired && !formValues._consent) {
      Alert.alert('Consent Required', 'Please accept the terms to continue.');
      return;
    }

    setSubmittingRegistration(true);

    try {
      const nameParts = (user?.displayName || '').split(' ');
      const firstName = formValues.firstName || formValues.first_name || nameParts[0] || '';
      const lastName = formValues.lastName || formValues.last_name || nameParts.slice(1).join(' ') || '';

      const bookingData = {
        eventId: event.id,
        userId: user.uid,
        quantity: 1,
        totalPrice: 0,
        registrationType: 'rsvp',
        userEmail: formValues.email || user?.email || '',
        userName: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        phoneNumber: formValues.phone || formValues.phoneNumber || '',
        gender: formValues.gender || '',
        source: 'app',
        eventName: event.name,
        eventDate: event.date,
        eventTime: event.startTime || event.time,
        eventLocation: typeof event.location === 'object'
          ? (event.location.name || event.location.address || '')
          : (event.location || ''),
      };

      // Include cohort data if selected
      if (selectedCohort && event.cohorts?.[selectedCohort]) {
        bookingData.cohortId = selectedCohort;
        bookingData.cohortName = event.cohorts[selectedCohort].name;
      }

      // Include any extra custom fields
      fields.forEach(field => {
        if (!bookingData[field.id] && formValues[field.id]) {
          bookingData[field.id] = formValues[field.id];
        }
      });

      if (isPaidEvent) {
        const paid = await payForTickets({
          userEmail: bookingData.userEmail,
          userName: bookingData.userName,
          firstName, lastName,
          phoneNumber: bookingData.phoneNumber,
          gender: bookingData.gender,
          cohortId: bookingData.cohortId || null,
          cohortName: bookingData.cohortName || null,
        });
        try {
          await notificationService.sendRSVPConfirmation(user.uid, event.name, event.date, event.startTime || event.time);
        } catch (_) {}
        await finishRegistration(paid);
        return;
      }

      const docRef = await bookingService.create(bookingData);

      // Send RSVP confirmation notification
      try {
        await notificationService.sendRSVPConfirmation(
          user.uid,
          event.name,
          event.date,
          event.startTime || event.time
        );
      } catch (notifError) {
        console.log('Notification error (non-critical):', notifError);
      }

      // Send organizer notification
      try {
        if (event.organizerId) {
          await notificationService.sendOrganizerNotification(
            event.organizerId,
            `${bookingData.userName} just registered for ${event.name}`,
            'New Registration'
          );
        }
      } catch (notifError) {
        console.log('Organizer notification error (non-critical):', notifError);
      }

      // Schedule event reminder
      try {
        await notificationService.scheduleEventReminder(
          event.id,
          event.name,
          event.date,
          event.startTime || event.time
        );
      } catch (notifError) {
        console.log('Reminder scheduling error (non-critical):', notifError);
      }

      // Schedule post-event moments notification (fires 30 min after event ends)
      try {
        await notificationService.scheduleMomentsNotification(
          event.id,
          event.name,
          event.date,
          event.endTime || event.time
        );
      } catch (notifError) {
        console.log('Moments notification scheduling error (non-critical):', notifError);
      }

      paymentsApi.emailTicket(docRef.id).catch(() => {});
      await finishRegistration({ id: docRef.id, ...bookingData });

    } catch (error) {
      console.error('Registration error:', error);
      let errorMsg = error.message || 'Failed to complete registration. Please try again.';
      if (error.message?.includes('no longer accepting')) {
        errorMsg = 'This event is no longer accepting registrations.';
      } else if (error.message?.includes('spots remaining')) {
        errorMsg = error.message;
      }
      Alert.alert(isPaidEvent ? 'Payment not completed' : 'Registration Failed', errorMsg);
    } finally {
      setSubmittingRegistration(false);
    }
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
    const qty = userBooking?.quantity || 1;
    const refId = (userBooking?.id || '').slice(-8).toUpperCase();
    const attendee = userBooking?.userName
      || [userBooking?.firstName, userBooking?.lastName].filter(Boolean).join(' ')
      || user?.displayName || user?.email || '';

    return (
      <View style={registeredStyles.ticketTabContainer}>
        <View style={registeredStyles.ticketCard}>
          <View style={registeredStyles.ticketTop}>
            <Text style={registeredStyles.ticketCategory}>TIKITI / {(event.category || 'EVENT').toUpperCase()}</Text>
            <Text style={registeredStyles.ticketName}>{event.name}</Text>
            <Text style={registeredStyles.ticketVenue}>{getLocationString()}</Text>
          </View>
          <View style={registeredStyles.ticketMiddle}>
            <View>
              <Text style={registeredStyles.ticketFieldLabel}>DATE</Text>
              <Text style={registeredStyles.ticketFieldValue}>{event.date || 'Date TBA'}</Text>
            </View>
            {!!attendee && (
              <View style={{ flex: 1, paddingHorizontal: 12 }}>
                <Text style={registeredStyles.ticketFieldLabel}>ATTENDEE</Text>
                <Text style={registeredStyles.ticketFieldValue} numberOfLines={1}>{attendee}</Text>
              </View>
            )}
            <View>
              <Text style={registeredStyles.ticketFieldLabel}>ADMISSION</Text>
              <Text style={registeredStyles.ticketFieldValue}>{qty} {qty === 1 ? 'person' : 'people'}</Text>
            </View>
          </View>
          <View style={registeredStyles.ticketBottom}>
            <View style={registeredStyles.ticketQrWrap}>
              <QRCode value={generateQRData()} size={160} color="#202220" backgroundColor="#fff" />
            </View>
            <Text style={registeredStyles.ticketRef}>{refId}{'\n'}Scan at the door</Text>
          </View>
        </View>

        <TouchableOpacity
          style={registeredStyles.secondaryBtn}
          onPress={() => navigation.navigate('PostEventVideo', { event, booking: userBooking })}
          activeOpacity={0.8}
        >
          <Feather name="camera" size={16} color="#202220" />
          <Text style={registeredStyles.secondaryBtnText}>Share a photo or video</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={registeredStyles.cancelRegistration}
          onPress={handleCancelBooking}
          disabled={booking}
        >
          {booking ? (
            <ActivityIndicator size="small" color="#f44929" />
          ) : (
            <>
              <Feather name="x-circle" size={16} color="#f44929" />
              <Text style={[registeredStyles.cancelRegistrationText, { color: '#f44929' }]}>
                {userBooking.registrationType === 'rsvp' ? 'Withdraw RSVP' : 'Cancel booking'}
              </Text>
            </>
          )}
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
            <Text style={[registeredStyles.programDateHeader, { color: colors.text.tertiary }]}>{dateKey}</Text>
            {sessions.map((session, index) => (
              <View key={session.id || index} style={[registeredStyles.sessionCard, { backgroundColor: colors.background.secondary }]}>
                {/* Time column */}
                <View style={registeredStyles.sessionTimeColumn}>
                  <Text style={[registeredStyles.sessionTime, { color: colors.primary[500] }]}>
                    {session.startTime || 'TBA'}
                  </Text>
                  {session.endTime && (
                    <Text style={[registeredStyles.sessionEndTime, { color: colors.text.tertiary }]}>
                      {session.endTime}
                    </Text>
                  )}
                </View>

                {/* Session details */}
                <View style={registeredStyles.sessionContent}>
                  {/* Type badge */}
                  {session.type && session.type !== 'session' && (
                    <View style={[registeredStyles.sessionTypeBadge, { backgroundColor: colors.background.primary }]}>
                      <Text style={[registeredStyles.sessionTypeBadgeText, { color: colors.primary[500] }]}>
                        {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                      </Text>
                    </View>
                  )}
                  <Text style={[registeredStyles.sessionTitle, { color: colors.text.primary }]}>{session.title}</Text>
                  {session.description ? (
                    <Text style={[registeredStyles.sessionDescription, { color: colors.text.secondary }]} numberOfLines={2}>
                      {session.description}
                    </Text>
                  ) : null}
                  {/* Speaker info */}
                  {session.speaker?.name && (
                    <TouchableOpacity
                      style={registeredStyles.sessionSpeaker}
                      onPress={() => setSelectedSpeaker(session.speaker)}
                      activeOpacity={0.7}
                    >
                      <Feather name="user" size={12} color={colors.primary[500]} />
                      <Text style={[registeredStyles.sessionSpeakerText, { color: colors.primary[500] }]}>
                        {session.speaker.name}
                      </Text>
                      <Feather name="chevron-right" size={12} color={colors.primary[500]} />
                    </TouchableOpacity>
                  )}
                  {/* Location */}
                  {session.location?.name && (
                    <View style={registeredStyles.sessionSpeaker}>
                      <Feather name="map-pin" size={12} color={colors.text.tertiary} />
                      <Text style={[registeredStyles.sessionSpeakerText, { color: colors.text.tertiary }]}>
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
        <View style={[registeredStyles.emptyState, { backgroundColor: colors.background.secondary }]}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
          <Text style={[registeredStyles.emptyStateTitle, { color: colors.text.primary }]}>Loading updates...</Text>
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
            <View key={update.id} style={[registeredStyles.updateCard, { backgroundColor: colors.background.secondary }]}>
              <View style={registeredStyles.updateHeader}>
                <View style={[registeredStyles.updateIconCircle, { backgroundColor: colors.background.primary }]}>
                  <Feather
                    name={update.type === 'important' ? 'alert-circle' : 'bell'}
                    size={14}
                    color={update.type === 'important' ? Colors.error[500] : colors.primary[500]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[registeredStyles.updateTitle, { color: colors.text.primary }]}>{update.title}</Text>
                  {timeAgo ? <Text style={[registeredStyles.updateTime, { color: colors.text.tertiary }]}>{timeAgo}</Text> : null}
                </View>
              </View>
              {(update.message || update.content) ? (
                <Text style={[registeredStyles.updateContent, { color: colors.text.secondary }]}>{update.message || update.content}</Text>
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
        <View style={[registeredStyles.emptyState, { backgroundColor: colors.background.secondary }]}>
          <Feather name="message-circle" size={24} color={colors.text.tertiary} />
          <View style={registeredStyles.emptyStateText}>
            <Text style={[registeredStyles.emptyStateTitle, { color: colors.text.primary }]}>Feedback opens after the event</Text>
            <Text style={[registeredStyles.emptyStateSubtitle, { color: colors.text.primary }]}>
              You'll be able to share your experience once the event has concluded.
            </Text>
          </View>
        </View>
      );
    }

    if (loadingSurveys) {
      return (
        <View style={[registeredStyles.emptyState, { backgroundColor: colors.background.secondary }]}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
          <Text style={[registeredStyles.emptyStateTitle, { color: colors.text.primary }]}>Loading feedback...</Text>
        </View>
      );
    }

    if (!eventSurveys || eventSurveys.length === 0) {
      return (
        <View style={[registeredStyles.emptyState, { backgroundColor: colors.background.secondary }]}>
          <Feather name="message-circle" size={24} color={colors.text.tertiary} />
          <View style={registeredStyles.emptyStateText}>
            <Text style={[registeredStyles.emptyStateTitle, { color: colors.text.primary }]}>No feedback forms</Text>
            <Text style={[registeredStyles.emptyStateSubtitle, { color: colors.text.primary }]}>
              The organizer hasn't created any feedback surveys for this event yet.
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={registeredStyles.updatesContainer}>
        {eventSurveys.map((survey) => (
          <TouchableOpacity key={survey.id} style={[registeredStyles.surveyCard, { backgroundColor: colors.background.secondary }]}>
            <View style={registeredStyles.surveyHeader}>
              <Feather name="clipboard" size={18} color={colors.primary[500]} />
              <View style={{ flex: 1 }}>
                <Text style={[registeredStyles.surveyTitle, { color: colors.text.primary }]}>{survey.title || 'Event Feedback'}</Text>
                <Text style={[registeredStyles.surveySubtitle, { color: colors.text.tertiary }]}>
                  {survey.questions?.length || 0} questions
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.text.tertiary} />
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
      <View style={[registeredStyles.emptyState, { backgroundColor: colors.background.secondary }]}>
        <Feather name={emptyState.icon} size={24} color={colors.text.tertiary} />
        <View style={registeredStyles.emptyStateText}>
          <Text style={[registeredStyles.emptyStateTitle, { color: colors.text.primary }]}>{emptyState.title}</Text>
          <Text style={[registeredStyles.emptyStateSubtitle, { color: colors.text.primary }]}>{emptyState.subtitle}</Text>
        </View>
        <TouchableOpacity
          style={[registeredStyles.refreshButton, { backgroundColor: colors.primary[500] }]}
          onPress={() => {
            if (event?.id) {
              eventService.getById(event.id).then(updatedEvent => {
                if (updatedEvent) setEvent(updatedEvent);
              });
            }
          }}
        >
          <Feather name="refresh-cw" size={18} color={isDarkMode ? Colors.black : Colors.white} />
          <Text style={[registeredStyles.refreshButtonText, { color: isDarkMode ? Colors.black : Colors.white }]}>Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ──── Moments Tab — navigates to full EventMomentsScreen ──────────────────
  const renderMomentsTab = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 24, gap: 16 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center' }}>
        <Feather name="camera" size={28} color={Colors.white} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: '700', fontFamily: 'PlusJakartaSans-Bold', color: colors.text?.primary || Colors.primary[800], textAlign: 'center' }}>
        Event Moments
      </Text>
      <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Regular', color: colors.text?.tertiary || Colors.secondary[600], textAlign: 'center', lineHeight: 20 }}>
        Photos and videos shared by everyone who attended this event.
      </Text>
      <TouchableOpacity
        style={{ backgroundColor: colors.primary[500], paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}
        onPress={() => navigation.navigate('EventMoments', { event })}
      >
        <Feather name="grid" size={16} color={Colors.white} />
        <Text style={{ color: Colors.white, fontSize: 14, fontFamily: 'PlusJakartaSans-SemiBold', fontWeight: '600' }}>
          View Moments
        </Text>
      </TouchableOpacity>
    </View>
  );

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
      case 'moments':
        return renderMomentsTab();
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
    const regTabs = eventTabs.filter((t) => ['ticket', 'program', 'updates', 'moments'].includes(t.key));
    const heroUri = event.imageBase64
      ? (event.imageBase64.startsWith('data:') ? event.imageBase64 : `data:image/jpeg;base64,${event.imageBase64}`)
      : (event.coverImage || event.imageUrl || null);
    const shareEvent = () => {
      const eventUrl = generateEventShareUrl(event.id, event.name);
      Share.share({ message: `${event.name}\n\n${eventUrl}`, title: event.name });
    };

    return (
      <View style={styles.modalContainer}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 110 }}
        >
          <View style={styles.detailImage}>
            {heroUri ? (
              <Image source={{ uri: heroUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#6256e8' }]} />
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFill} pointerEvents="none" />

            <View style={styles.detailToolbar}>
              <TouchableOpacity style={styles.toolbarBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                <Feather name="chevron-left" size={20} color="#202220" />
              </TouchableOpacity>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.toolbarBtn} onPress={shareEvent} activeOpacity={0.8}>
                  <Feather name="share" size={18} color="#202220" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.toolbarBtn, isSaved && { backgroundColor: '#f44929' }]} onPress={toggleSave} activeOpacity={0.8}>
                  <Feather name="heart" size={18} color={isSaved ? '#fff' : '#202220'} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={registeredStyles.goingBadge}>
              <Feather name="check" size={12} color="#1a8c4e" />
              <Text style={registeredStyles.goingBadgeText}>You're going</Text>
            </View>
          </View>

          <View style={styles.detailBody}>
            <Text style={styles.labelTag}>{(event.category || 'EVENT').toUpperCase()}</Text>
            <Text style={styles.detailH1}>{event.name}</Text>

            <View style={styles.infoLine}>
              <Feather name="calendar" size={18} color="#65675d" style={{ marginTop: 2 }} />
              <View>
                <Text style={styles.infoMain}>{getFormattedDate()}</Text>
                <Text style={styles.infoSub}>{getFormattedTime()}</Text>
              </View>
            </View>

            <View style={styles.infoLine}>
              <Feather name="map-pin" size={18} color="#65675d" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoMain}>{getLocationString()}</Text>
                <TouchableOpacity onPress={handleGetDirections}>
                  <Text style={styles.infoLink}>Get Directions</Text>
                </TouchableOpacity>
              </View>
            </View>

            {(event.venueType === 'virtual' || event.venueType === 'hybrid') && (
              <View style={styles.infoLine}>
                <Feather name="video" size={18} color="#65675d" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.infoMain}>
                    {event.meetingPlatform === 'google_meet' ? 'Google Meet' :
                     event.meetingPlatform === 'zoom' ? 'Zoom' :
                     event.meetingPlatform === 'teams' ? 'Microsoft Teams' :
                     event.meetingPlatform || 'Online meeting'}
                  </Text>
                  {event.meetingLink ? (
                    <TouchableOpacity onPress={() => Linking.openURL(event.meetingLink)}>
                      <Text style={styles.infoLink}>Join meeting</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.infoSub}>Link will be shared by the organiser</Text>
                  )}
                </View>
              </View>
            )}

            {getDaysLeft() !== null && getDaysLeft() >= 0 && (
              <View style={styles.infoLine}>
                <Feather name="clock" size={18} color="#65675d" style={{ marginTop: 2 }} />
                <Text style={styles.infoMain}>{getDaysLeftLabel()}</Text>
              </View>
            )}

            {attendeeCount > 0 && (
              <View style={styles.infoLine}>
                <Feather name="users" size={18} color="#65675d" style={{ marginTop: 2 }} />
                <Text style={styles.infoMain}>{attendeeCount} attending</Text>
              </View>
            )}

            <View style={styles.tabs}>
              {regTabs.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tab, activeEventTab === t.key && styles.tabActive]}
                  onPress={() => setActiveEventTab(t.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, activeEventTab === t.key && styles.tabTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {renderTabContent()}
          </View>
        </ScrollView>

        <View style={styles.bookBar}>
          <View>
            <Text style={styles.bookBarLabel}>STATUS</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.bookBarPrice, { color: '#1a8c4e' }]}>Confirmed</Text>
              <Feather name="check-circle" size={18} color="#1a8c4e" />
            </View>
          </View>
          <TouchableOpacity style={styles.bookBarBtn} onPress={shareEvent} activeOpacity={0.85}>
            <Text style={styles.bookBarBtnText}>Share event</Text>
            <Feather name="share" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Speaker Details Modal */}
        <Modal
          visible={!!selectedSpeaker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedSpeaker(null)}
        >
          <View style={registeredStyles.speakerModalOverlay}>
            <TouchableOpacity
              style={registeredStyles.speakerModalBackdrop}
              activeOpacity={1}
              onPress={() => setSelectedSpeaker(null)}
            />
            <View style={[registeredStyles.speakerModalContainer, { backgroundColor: colors.background.primary }]}>
              {/* Handle bar */}
              <View style={[registeredStyles.speakerModalHandle, { backgroundColor: colors.border.medium }]} />

              {/* Speaker Photo */}
              {(selectedSpeaker?.photo || selectedSpeaker?.photoBase64) ? (
                <Image
                  source={{
                    uri: (selectedSpeaker.photo || selectedSpeaker.photoBase64 || '').startsWith('data:')
                      ? (selectedSpeaker.photo || selectedSpeaker.photoBase64)
                      : `data:image/jpeg;base64,${selectedSpeaker.photo || selectedSpeaker.photoBase64}`,
                  }}
                  style={registeredStyles.speakerModalPhoto}
                />
              ) : (
                <View style={[registeredStyles.speakerModalPhotoPlaceholder, { backgroundColor: colors.background.secondary }]}>
                  <Feather name="user" size={32} color={colors.text.tertiary} />
                </View>
              )}

              {/* Speaker Name */}
              <Text style={[registeredStyles.speakerModalName, { color: colors.text.primary }]}>
                {selectedSpeaker?.name || 'Speaker'}
              </Text>

              {/* Job Title & Company — only if speaker entered them */}
              {(selectedSpeaker?.jobTitle || selectedSpeaker?.company) ? (
                <Text style={[registeredStyles.speakerModalTitle, { color: colors.text.secondary }]}>
                  {[selectedSpeaker.jobTitle, selectedSpeaker.company].filter(Boolean).join(' at ')}
                </Text>
              ) : null}

              {/* Bio — only if speaker entered it */}
              {selectedSpeaker?.bio ? (
                <ScrollView style={registeredStyles.speakerModalBioScroll} showsVerticalScrollIndicator={false}>
                  <Text style={[registeredStyles.speakerModalBio, { color: colors.text.secondary }]}>
                    {selectedSpeaker.bio}
                  </Text>
                </ScrollView>
              ) : null}

              {/* Social Links — icon-only, only icons for fields the speaker actually provided */}
              {(() => {
                const links = [];
                if (selectedSpeaker?.linkedInUrl) links.push({ icon: 'linkedin', url: selectedSpeaker.linkedInUrl });
                if (selectedSpeaker?.twitterHandle) links.push({ icon: 'twitter', url: `https://twitter.com/${selectedSpeaker.twitterHandle.replace('@', '')}` });
                if (selectedSpeaker?.websiteUrl) links.push({ icon: 'globe', url: selectedSpeaker.websiteUrl });
                if (selectedSpeaker?.email) links.push({ icon: 'mail', url: `mailto:${selectedSpeaker.email}` });
                if (links.length === 0) return null;
                return (
                  <View style={registeredStyles.speakerModalLinks}>
                    {links.map((link) => (
                      <TouchableOpacity
                        key={link.icon}
                        style={[registeredStyles.speakerModalIconButton, { backgroundColor: colors.background.secondary }]}
                        onPress={() => Linking.openURL(link.url)}
                      >
                        <Feather name={link.icon} size={18} color={colors.primary[500]} />
                      </TouchableOpacity>
                    ))}
                  </View>
                );
              })()}

              {/* Close Button */}
              <TouchableOpacity
                style={[registeredStyles.speakerModalClose, { backgroundColor: colors.primary[500] }]}
                onPress={() => setSelectedSpeaker(null)}
              >
                <Text style={[registeredStyles.speakerModalCloseText, { color: isDarkMode ? Colors.black : Colors.white }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ──────────────────────────────────────────────────────
  // UNREGISTERED VIEW — Reference design (detail screen)
  // ──────────────────────────────────────────────────────

  return (
    <View style={styles.modalContainer}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}
      >
        {/* ── Full-bleed image ──────────────────────────── */}
        <View style={styles.detailImage}>
          {event.imageBase64 ? (
            <Image
              source={{
                uri: event.imageBase64.startsWith('data:')
                  ? event.imageBase64
                  : `data:image/jpeg;base64,${event.imageBase64}`,
              }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#6256e8' }]} />
          )}
          {/* gradient */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.72)']}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* toolbar */}
          <View style={styles.detailToolbar}>
            <TouchableOpacity style={styles.toolbarBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
              <Feather name="chevron-left" size={20} color="#202220" />
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={styles.toolbarBtn}
                onPress={() => {
                  const eventUrl = generateEventShareUrl(event.id, event.name);
                  Share.share({ message: `${event.name}\n\n${eventUrl}`, title: event.name });
                }}
                activeOpacity={0.8}
              >
                <Feather name="share" size={18} color="#202220" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toolbarBtn, isSaved && { backgroundColor: '#f44929' }]} onPress={toggleSave} activeOpacity={0.8}>
                <Feather name="heart" size={18} color={isSaved ? '#fff' : '#202220'} />
              </TouchableOpacity>
            </View>
          </View>

        </View>

        {/* ── Body ─────────────────────────────────────── */}
        <View style={styles.detailBody}>
          {/* label tag */}
          <Text style={styles.labelTag}>{(event.category || 'EVENT').toUpperCase()}</Text>

          {/* h1 */}
          <Text style={styles.detailH1}>{event.name}</Text>

          {/* calendar info-line */}
          <View style={styles.infoLine}>
            <Feather name="calendar" size={18} color="#65675d" style={{ marginTop: 2 }} />
            <View>
              <Text style={styles.infoMain}>{event.date || 'Date TBA'}</Text>
              <Text style={styles.infoSub}>{event.startTime || event.time || 'Time TBA'}</Text>
            </View>
          </View>

          {/* pin info-line */}
          <View style={styles.infoLine}>
            <Feather name="map-pin" size={18} color="#65675d" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoMain}>
                {typeof event.location === 'object'
                  ? (event.location.name || event.location.address || 'Venue TBA')
                  : (event.location || 'Venue TBA')}
              </Text>
              <TouchableOpacity onPress={handleGetDirections}>
                <Text style={styles.infoLink}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* organiser contacts (from the flyer) */}
          {getEventContacts(event).map((c) => (
            <View key={contactDigits(c.phone)} style={styles.infoLine}>
              <Feather name="phone" size={18} color="#65675d" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <TouchableOpacity
                  onPress={() => callContact(c)}
                  onLongPress={() => whatsappContact(c, event.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${c.name || formatContactPhone(c.phone)}`}
                >
                  <Text style={styles.infoMain}>{formatContactPhone(c.phone)}</Text>
                  {c.name ? <Text style={styles.infoSub}>{c.name}</Text> : null}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => whatsappContact(c, event.name)} accessibilityRole="link">
                  <Text style={styles.infoLink}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* attendees */}
          {attendeeCount > 0 && (
            <View style={styles.infoLine}>
              <Feather name="users" size={18} color="#65675d" style={{ marginTop: 2 }} />
              <Text style={styles.infoMain}>{attendeeCount} attending</Text>
            </View>
          )}

          {/* tabs */}
          <View style={styles.tabs}>
            {['About', 'Programme'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tab, detailTab === t && styles.tabActive]}
                onPress={() => setDetailTab(t)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, detailTab === t && styles.tabTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* tab content */}
          {detailTab === 'About' ? (
            <View style={styles.bodyCopy}>
              {event.description ? (
                <Text style={styles.bodyText}>{event.description}</Text>
              ) : (
                <Text style={styles.bodyText}>No description available for this event.</Text>
              )}
              {event.organizerName && (
                <>
                  <Text style={styles.bodyH3}>Organizer</Text>
                  <Text style={styles.bodyText}>{event.organizerName}</Text>
                </>
              )}
              <Text style={styles.finePrint}>Illustrative event details. Actual details may vary.</Text>
            </View>
          ) : (
            <View style={styles.bodyCopy}>
              {event.program?.sessions?.length > 0 ? (
                event.program.sessions.map((session, i) => (
                  <View key={i} style={styles.agendaItem}>
                    <Text style={styles.agendaTime}>{session.startTime || 'TBA'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.agendaTitle}>{session.title}</Text>
                      {session.description ? (
                        <Text style={styles.agendaSub}>{session.description}</Text>
                      ) : null}
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.bodyText}>Programme not yet published. Check back closer to the event.</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Book bar ──────────────────────────────────────── */}
      {(() => {
        const externalCta = getExternalCta(event);
        const contactCta = getContactCta(event);
        const paid = event.price && event.price !== '0';
        return (
          <View style={styles.bookBar}>
            <View>
              <Text style={styles.bookBarLabel}>
                {externalCta?.leftLabel || (paid ? 'PER PERSON' : 'ENTRY')}
              </Text>
              <Text style={styles.bookBarPrice}>
                {externalCta?.leftValue || (paid ? `₵${event.price}` : 'Free')}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.bookBarBtn}
              onPress={() => {
                if (event.registrationUrl) {
                  Linking.openURL(event.registrationUrl);
                } else if (externalCta) {
                  Linking.openURL(event.meetingLink);
                } else if (contactCta) {
                  if (contactCta.whatsapp) whatsappContact(contactCta.contact, event.name);
                  else callContact(contactCta.contact);
                } else {
                  setShowRegistrationModal(true);
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.bookBarBtnText}>
                {event.registrationUrl ? 'Register on their site' : externalCta ? externalCta.label : contactCta ? 'Contact organiser' : (paid ? 'Get tickets' : 'Register for free')}
              </Text>
              <Feather name={event.registrationUrl || externalCta ? 'external-link' : contactCta ? (contactCta.whatsapp ? 'message-circle' : 'phone') : 'arrow-right'} size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        );
      })()}

      {/* ──── Registration Bottom Sheet Modal ──────────────── */}
      <Modal
        visible={showRegistrationModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRegistrationModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={registeredStyles.regModalOverlay}>
            <TouchableOpacity
              style={registeredStyles.regModalBackdrop}
              activeOpacity={1}
              onPress={() => !submittingRegistration && setShowRegistrationModal(false)}
            />
            <View style={[registeredStyles.regModalContainer, { backgroundColor: colors.background.primary }]}>
              {/* Handle bar */}
              <View style={[registeredStyles.regModalHandle, { backgroundColor: colors.border.medium }]} />

              {/* Title */}
              <Text style={[registeredStyles.regModalTitle, { color: colors.text.primary }]}>{isPaidEvent ? 'Get tickets' : 'Register for Event'}</Text>
              <Text style={[registeredStyles.regModalSubtitle, { color: colors.text.secondary }]}>
                {event.name}
              </Text>

              {isPaidEvent && (
                <View style={registeredStyles.qtyCard}>
                  <View style={registeredStyles.qtyRow}>
                    <View>
                      <Text style={registeredStyles.qtyTitle}>General admission</Text>
                      <Text style={registeredStyles.qtySub}>GH₵{unitPrice.toFixed(2)} / person</Text>
                    </View>
                    <View style={registeredStyles.stepper}>
                      <TouchableOpacity onPress={() => adjustQuantity(-1)} disabled={ticketQuantity <= 1} style={[registeredStyles.stepBtn, ticketQuantity <= 1 && { opacity: 0.35 }]}>
                        <Feather name="minus" size={16} color="#202220" />
                      </TouchableOpacity>
                      <Text style={registeredStyles.stepValue}>{ticketQuantity}</Text>
                      <TouchableOpacity onPress={() => adjustQuantity(1)} disabled={ticketQuantity >= 10} style={[registeredStyles.stepBtn, ticketQuantity >= 10 && { opacity: 0.35 }]}>
                        <Feather name="plus" size={16} color="#202220" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={registeredStyles.totalRow}>
                    <Text style={registeredStyles.totalLabel}>{ticketQuantity} ticket{ticketQuantity > 1 ? 's' : ''}</Text>
                    <Text style={registeredStyles.totalLabel}>GH₵{(unitPrice * ticketQuantity).toFixed(2)}</Text>
                  </View>
                  <View style={registeredStyles.totalRow}>
                    <Text style={registeredStyles.totalLabel}>Booking fee</Text>
                    <Text style={registeredStyles.totalLabel}>GH₵0.00</Text>
                  </View>
                  <View style={[registeredStyles.totalRow, registeredStyles.totalRowStrong]}>
                    <Text style={registeredStyles.totalStrong}>Total</Text>
                    <Text style={registeredStyles.totalStrong}>GH₵{(unitPrice * ticketQuantity).toFixed(2)}</Text>
                  </View>
                </View>
              )}

              <ScrollView
                style={registeredStyles.regModalScroll}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Cohort Selector */}
                {event.hasCohorts && event.cohorts && Object.keys(event.cohorts).length > 0 && (
                  <View style={registeredStyles.regSectionContainer}>
                    <Text style={[registeredStyles.regSectionLabel, { color: colors.text.primary }]}>Select Session</Text>
                    {Object.entries(event.cohorts)
                      .sort(([, a], [, b]) => (a.startDate || '').localeCompare(b.startDate || ''))
                      .map(([cohortId, cohort]) => {
                        const isFull = cohort.maxAttendees && (cohort.soldTickets || 0) >= cohort.maxAttendees;
                        const isSelected = selectedCohort === cohortId;
                        const spotsLeft = cohort.maxAttendees ? cohort.maxAttendees - (cohort.soldTickets || 0) : null;
                        return (
                          <TouchableOpacity
                            key={cohortId}
                            style={[
                              registeredStyles.cohortCard,
                              { borderColor: isSelected ? colors.primary[500] : colors.border.light },
                              isSelected && { backgroundColor: colors.primary[50] || '#f0f7ff' },
                              isFull && registeredStyles.cohortCardFull,
                            ]}
                            onPress={() => !isFull && setSelectedCohort(cohortId)}
                            disabled={isFull}
                            activeOpacity={0.7}
                          >
                            <View style={registeredStyles.cohortCardContent}>
                              <Text style={[
                                registeredStyles.cohortCardName,
                                { color: isFull ? colors.text.tertiary : colors.text.primary }
                              ]}>
                                {cohort.name}
                              </Text>
                              {(cohort.startDate || cohort.endDate) && (
                                <Text style={[registeredStyles.cohortCardDates, { color: colors.text.secondary }]}>
                                  {cohort.startDate}{cohort.endDate ? ` - ${cohort.endDate}` : ''}
                                </Text>
                              )}
                              {spotsLeft !== null && (
                                <Text style={[
                                  registeredStyles.cohortCardSpots,
                                  { color: isFull ? colors.error[500] : spotsLeft <= 5 ? colors.warning[500] : colors.text.tertiary }
                                ]}>
                                  {isFull ? 'Full' : `${spotsLeft} spots left`}
                                </Text>
                              )}
                            </View>
                            <View style={[
                              registeredStyles.cohortRadio,
                              { borderColor: isSelected ? colors.primary[500] : colors.border.medium },
                              isSelected && { backgroundColor: colors.primary[500] },
                            ]}>
                              {isSelected && <Feather name="check" size={12} color="#fff" />}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                  </View>
                )}

                {/* Dynamic Form Fields */}
                {getFormFields().map((field) => {
                  if (field.type === 'radio' && field.options) {
                    return (
                      <View key={field.id} style={registeredStyles.regFieldContainer}>
                        <Text style={[registeredStyles.regFieldLabel, { color: colors.text.primary }]}>
                          {field.label}{field.required ? ' *' : ''}
                        </Text>
                        <View style={registeredStyles.regRadioGroup}>
                          {field.options.map((option) => (
                            <TouchableOpacity
                              key={option}
                              style={[
                                registeredStyles.regRadioButton,
                                { borderColor: formValues[field.id] === option ? '#6256e8' : '#deded4' },
                                formValues[field.id] === option && { backgroundColor: '#f0eeff' },
                              ]}
                              onPress={() => !field.readOnly && setFormValues(prev => ({ ...prev, [field.id]: option }))}
                              disabled={field.readOnly}
                            >
                              <Text style={[
                                registeredStyles.regRadioText,
                                { color: formValues[field.id] === option ? '#6256e8' : '#202220', fontWeight: formValues[field.id] === option ? '700' : '500' },
                              ]}>
                                {option}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    );
                  }

                  if (field.type === 'dropdown' && field.options) {
                    return (
                      <View key={field.id} style={registeredStyles.regFieldContainer}>
                        <Text style={[registeredStyles.regFieldLabel, { color: colors.text.primary }]}>
                          {field.label}{field.required ? ' *' : ''}
                        </Text>
                        <View style={registeredStyles.regRadioGroup}>
                          {field.options.map((option) => (
                            <TouchableOpacity
                              key={option}
                              style={[
                                registeredStyles.regRadioButton,
                                { borderColor: formValues[field.id] === option ? '#6256e8' : '#deded4' },
                                formValues[field.id] === option && { backgroundColor: '#f0eeff' },
                              ]}
                              onPress={() => !field.readOnly && setFormValues(prev => ({ ...prev, [field.id]: option }))}
                              disabled={field.readOnly}
                            >
                              <Text style={[
                                registeredStyles.regRadioText,
                                { color: formValues[field.id] === option ? '#6256e8' : '#202220', fontWeight: formValues[field.id] === option ? '700' : '500' },
                              ]}>
                                {option}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    );
                  }

                  if (field.type === 'checkbox') {
                    return (
                      <View key={field.id} style={registeredStyles.regCheckboxRow}>
                        <Switch
                          value={!!formValues[field.id]}
                          onValueChange={(val) => !field.readOnly && setFormValues(prev => ({ ...prev, [field.id]: val }))}
                          trackColor={{ false: colors.border.medium, true: colors.primary[500] }}
                          thumbColor="#fff"
                          disabled={field.readOnly}
                        />
                        <Text style={[registeredStyles.regCheckboxLabel, { color: colors.text.primary }]}>
                          {field.label}{field.required ? ' *' : ''}
                        </Text>
                      </View>
                    );
                  }

                  // Default: text/email/phone/number input
                  return (
                    <View key={field.id} style={registeredStyles.regFieldContainer}>
                      <Text style={[registeredStyles.regFieldLabel, { color: colors.text.primary }]}>
                        {field.label}{field.required ? ' *' : ''}
                      </Text>
                      <TextInput
                        style={[
                          registeredStyles.regFieldInput,
                          {
                            backgroundColor: field.readOnly ? (colors.background.tertiary || '#f5f5f5') : colors.background.secondary,
                            color: field.readOnly ? colors.text.tertiary : colors.text.primary,
                            borderColor: colors.border.light,
                          },
                        ]}
                        value={formValues[field.id]?.toString() || ''}
                        onChangeText={(text) => setFormValues(prev => ({ ...prev, [field.id]: text }))}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        placeholderTextColor={colors.text.tertiary}
                        editable={!field.readOnly}
                        keyboardType={
                          field.type === 'email' ? 'email-address' :
                          field.type === 'phone' ? 'phone-pad' :
                          field.type === 'number' ? 'numeric' :
                          'default'
                        }
                        autoCapitalize={field.type === 'email' ? 'none' : 'words'}
                      />
                      {field.defaultValue && field.id === 'email' && (
                        <Text style={[registeredStyles.regFieldHint, { color: '#65675d' }]}>
                          From your profile
                        </Text>
                      )}
                    </View>
                  );
                })}

                {/* Consent checkbox */}
                {event.registrationForm?.consentRequired && (
                  <View style={registeredStyles.regCheckboxRow}>
                    <Switch
                      value={!!formValues._consent}
                      onValueChange={(val) => setFormValues(prev => ({ ...prev, _consent: val }))}
                      trackColor={{ false: colors.border.medium, true: colors.primary[500] }}
                      thumbColor="#fff"
                    />
                    <Text style={[registeredStyles.regCheckboxLabel, { color: colors.text.secondary, flex: 1 }]}>
                      {event.registrationForm.consentText || 'I agree to the terms and conditions'}
                    </Text>
                  </View>
                )}

                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Submit Button */}
              <TouchableOpacity
                style={[registeredStyles.regSubmitButton, submittingRegistration && { opacity: 0.6 }]}
                onPress={submitRegistration}
                disabled={submittingRegistration}
              >
                {submittingRegistration ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={registeredStyles.regSubmitButtonText}>
                    {isPaidEvent ? `Pay GH₵${(unitPrice * ticketQuantity).toFixed(2)} · MoMo or card` : 'Confirm Registration'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // ─── Container ───────────────────────────────────────
  modalContainer: {
    flex: 1,
    backgroundColor: '#faf9f2',
  },
  scrollView: {
    flex: 1,
  },

  // ─── Detail image (full-bleed hero) ──────────────────
  detailImage: {
    height: 290,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#6256e8',
  },
  bookBar: {
    backgroundColor: '#faf9f2',
    borderTopWidth: 1,
    borderTopColor: '#deded4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 30,
    gap: 20,
  },
  bookBarLabel: {
    fontSize: 11,
    color: '#65675d',
    marginBottom: 3,
  },
  bookBarPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202220',
  },
  bookBarBtn: {
    flex: 1,
    backgroundColor: '#f44929',
    height: 50,
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  bookBarBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  detailToolbar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  toolbarBtn: {
    backgroundColor: '#faf9f2',
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolbarBtnText: {
    fontSize: 20,
    color: '#202220',
    lineHeight: 24,
  },
  posterTitle: {
    position: 'absolute',
    bottom: 23,
    left: 24,
    right: 20,
    color: '#fff',
    fontSize: 44,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    zIndex: 1,
  },

  // ─── Body ────────────────────────────────────────────
  detailBody: {
    padding: 23,
    paddingBottom: 0,
  },
  labelTag: {
    fontSize: 11,
    letterSpacing: 1,
    color: '#6256e8',
    fontWeight: '700',
    marginBottom: 4,
  },
  detailH1: {
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 34,
    color: '#202220',
    marginTop: 10,
    marginBottom: 20,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },

  // info lines
  infoLine: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 17,
  },
  infoIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  infoMain: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202220',
  },
  infoSub: {
    fontSize: 12,
    color: '#65675d',
    marginTop: 3,
  },
  infoLink: {
    fontSize: 12,
    color: '#f44929',
    fontWeight: '600',
    marginTop: 4,
  },

  // tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#deded4',
    marginTop: 8,
    marginBottom: 19,
    gap: 24,
  },
  tab: {
    paddingVertical: 12,
    paddingBottom: 14,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#f44929',
    marginBottom: -1,
  },
  tabText: {
    fontSize: 14,
    color: '#65675d',
  },
  tabTextActive: {
    color: '#202220',
    fontWeight: '700',
  },

  // body copy
  bodyCopy: {
    paddingBottom: 16,
  },
  bodyH3: {
    fontSize: 17,
    fontWeight: '700',
    color: '#202220',
    marginTop: 20,
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 24,
    color: '#65675d',
  },
  finePrint: {
    fontSize: 12,
    color: '#65675d',
    marginTop: 20,
    lineHeight: 18,
  },

  // agenda (programme tab)
  agendaItem: {
    flexDirection: 'row',
    gap: 16,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#deded4',
    fontSize: 14,
  },
  agendaTime: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f44929',
    minWidth: 48,
  },
  agendaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202220',
  },
  agendaSub: {
    fontSize: 12,
    color: '#65675d',
    lineHeight: 18,
    marginTop: 4,
  },

  // ─── Quantity section (paid events) — kept for logic ─
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
    backgroundColor: '#faf9f2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#deded4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.extrabold,
    fontSize: 18,
    color: '#202220',
    marginLeft: 12,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 32,
  },

  // ─── Event card ─────────────────────────────────────
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#deded4',
    marginBottom: 14,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 170,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  goingBadge: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 2,
    backgroundColor: '#e8f5ee',
    borderWidth: 1,
    borderColor: '#b7dfc8',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  goingBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1a8c4e',
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#202220',
    letterSpacing: -0.5,
    lineHeight: 26,
    marginBottom: 14,
  },
  pillsContainer: {
    gap: 6,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    backgroundColor: '#faf9f2',
    borderWidth: 1,
    borderColor: '#deded4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#65675d',
  },

  // ─── Tab bar ────────────────────────────────────────
  tabBarContainer: {
    marginTop: 16,
    marginBottom: 14,
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#deded4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 30,
    gap: 6,
    marginBottom: 2,
  },
  daysLeftPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#65675d',
  },

  // ─── Ticket tab content ──────────────────────────────
  ticketCard: { borderRadius: 19, backgroundColor: '#fffef9', borderWidth: 1, borderColor: '#deded4', overflow: 'hidden', marginBottom: 14 },
  ticketTop: { padding: 22, backgroundColor: '#6256e8' },
  ticketCategory: { fontSize: 11, letterSpacing: 1, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 12 },
  ticketName: { fontSize: 28, fontWeight: '700', color: '#fff', lineHeight: 29, marginBottom: 10, letterSpacing: -0.5 },
  ticketVenue: { fontSize: 13, color: '#fff' },
  ticketMiddle: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#b6b6ad', borderStyle: 'dashed' },
  ticketFieldLabel: { fontSize: 11, color: '#65675d', letterSpacing: 0.5, marginBottom: 5 },
  ticketFieldValue: { fontSize: 14, fontWeight: '700', color: '#202220' },
  ticketBottom: { padding: 19, alignItems: 'center' },
  ticketQrWrap: { padding: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#deded4' },
  ticketRef: { fontSize: 12, color: '#65675d', textAlign: 'center', lineHeight: 18, marginTop: 12 },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 50, borderRadius: 40, borderWidth: 1.5, borderColor: '#202220', marginBottom: 6 },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: '#202220' },
  ticketTabContainer: {
    gap: 0,
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
  postVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1.5,
    gap: 9,
    marginTop: 8,
  },
  postVideoButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
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

  // ─── Speaker Modal ─────────────────────────────────────
  speakerModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  speakerModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  speakerModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    alignItems: 'center',
    maxHeight: '75%',
  },
  speakerModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    marginBottom: 20,
  },
  speakerModalPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  speakerModalPhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  speakerModalName: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 20,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  speakerModalTitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  speakerModalBioScroll: {
    maxHeight: 120,
    width: '100%',
    marginBottom: 16,
  },
  speakerModalBio: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  speakerModalLinks: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  speakerModalLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  speakerModalLinkText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
    color: Colors.primary[500],
  },
  speakerModalIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerModalClose: {
    backgroundColor: '#333',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  speakerModalCloseText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 15,
    color: '#fff',
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
    marginTop: 8,
    paddingVertical: 12,
  },
  cancelRegistrationText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 14,
  },

  // ─── Registration Modal ─────────────────────────────────
  regModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  regModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  regModalContainer: {
    backgroundColor: '#faf9f2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    maxHeight: '90%',
  },
  regModalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#deded4',
    alignSelf: 'center',
    marginBottom: 20,
  },
  regModalTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 26,
    fontWeight: '800',
    color: '#202220',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  regModalSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    color: '#65675d',
    marginBottom: 24,
  },
  regModalScroll: {
    maxHeight: SCREEN_HEIGHT * 0.55,
  },
  regSectionContainer: {
    marginBottom: 20,
  },
  regSectionLabel: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16,
    color: Colors.text.primary,
    marginBottom: 12,
  },

  // ─── Cohort cards ─────────────────────────────────────
  cohortCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  cohortCardFull: {
    opacity: 0.5,
  },
  cohortCardContent: {
    flex: 1,
    gap: 2,
  },
  cohortCardName: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 15,
    color: Colors.text.primary,
  },
  cohortCardDates: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  cohortCardSpots: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  cohortRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  // ─── Form fields ──────────────────────────────────────
  regFieldContainer: {
    marginBottom: 16,
  },
  regFieldLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
    fontWeight: '600',
    color: '#202220',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  regFieldInput: {
    borderWidth: 1,
    borderColor: '#deded4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: Typography.fontFamily.regular,
    backgroundColor: '#fff',
    color: '#202220',
  },
  regFieldHint: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 11,
    color: '#65675d',
    marginTop: 4,
    marginLeft: 2,
  },

  // ─── Radio / dropdown buttons ─────────────────────────
  regRadioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  regRadioButton: {
    borderWidth: 1.5,
    borderColor: '#deded4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  regRadioText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    color: '#202220',
  },

  // ─── Checkbox / switch ────────────────────────────────
  regCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  regCheckboxLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 14,
    color: Colors.text.primary,
    flex: 1,
  },

  // ─── Submit button ────────────────────────────────────
  qtyCard: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#deded4', borderRadius: 16, padding: 16, marginBottom: 20 },
  qtyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#deded4', marginBottom: 10 },
  qtyTitle: { fontSize: 15, fontWeight: '700', color: '#202220' },
  qtySub: { fontSize: 13, color: '#65675d', marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#deded4', borderRadius: 30, paddingHorizontal: 6, paddingVertical: 4 },
  stepBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf9f2' },
  stepValue: { fontSize: 16, fontWeight: '700', color: '#202220', minWidth: 18, textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalRowStrong: { borderTopWidth: 1, borderTopColor: '#deded4', marginTop: 6, paddingTop: 10 },
  totalLabel: { fontSize: 13, color: '#65675d' },
  totalStrong: { fontSize: 16, fontWeight: '800', color: '#202220' },
  regSubmitButton: {
    backgroundColor: '#202220',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  regSubmitButtonText: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
});

export default EventDetailScreen;