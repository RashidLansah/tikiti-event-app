'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { attendeesService, Attendee } from '@/lib/services/attendeesService';
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  UserCheck,
  Users,
  Clock,
  RefreshCw,
  Loader2,
  AlertCircle,
  Keyboard,
  LogOut,
  ChevronDown,
} from 'lucide-react';

interface ScanResult {
  success: boolean;
  attendee?: Attendee;
  message: string;
  alreadyCheckedIn?: boolean;
}

export default function GateStaffPortal() {
  const router = useRouter();
  const { user, userProfile, currentOrganization, loading: authLoading, logout, refreshOrganizations } = useAuth();

  // Event selection
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showEventDropdown, setShowEventDropdown] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    notCheckedIn: 0,
    checkInRate: 0,
  });

  // Scanner state
  const [scannerActive, setScannerActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Manual entry state
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const html5QrCodeRef = useRef<any>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  // Load events for the organization
  const loadEvents = useCallback(async () => {
    if (!currentOrganization?.id) return;

    setLoadingEvents(true);
    try {
      const orgEvents = await eventService.getByOrganization(currentOrganization.id);
      // Filter to only show active/published events
      const activeEvents = orgEvents.filter(
        (e) => e.status === 'published' || e.status === 'active'
      );
      setEvents(activeEvents);

      // Auto-select if only one event
      if (activeEvents.length === 1) {
        setSelectedEvent(activeEvents[0]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoadingEvents(false);
    }
  }, [currentOrganization?.id]);

  // Load stats when event is selected
  const loadStats = useCallback(async () => {
    if (!selectedEvent?.id) return;

    try {
      const statsData = await attendeesService.getCheckInStats(selectedEvent.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, [selectedEvent?.id]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/gate');
    }
  }, [authLoading, user, router]);

  // Refresh organizations if user is logged in but has no organization loaded yet
  useEffect(() => {
    if (!authLoading && user && !currentOrganization) {
      refreshOrganizations();
    }
  }, [authLoading, user, currentOrganization, refreshOrganizations]);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadEvents();
    }
  }, [currentOrganization?.id, loadEvents]);

  useEffect(() => {
    if (selectedEvent?.id) {
      loadStats();
      // Refresh stats every 30 seconds
      const interval = setInterval(loadStats, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedEvent?.id, loadStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setCameraError(null);

      // Dynamically import html5-qrcode to avoid SSR issues
      const { Html5Qrcode } = await import('html5-qrcode');

      // Clean up any existing scanner
      if (html5QrCodeRef.current) {
        try {
          await html5QrCodeRef.current.stop();
        } catch (e) {
          // Ignore stop errors
        }
      }

      const scannerId = 'qr-reader';
      html5QrCodeRef.current = new Html5Qrcode(scannerId);

      const qrCodeSuccessCallback = async (decodedText: string) => {
        if (!isProcessing) {
          await processQRCode(decodedText);
        }
      };

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        qrCodeSuccessCallback,
        () => {} // Ignore errors (no QR found)
      );

      setScannerActive(true);
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.toString().includes('NotAllowedError') || error.toString().includes('Permission')) {
        setCameraError('Camera access denied. Please enable camera permissions in your browser settings.');
      } else if (error.toString().includes('NotFoundError')) {
        setCameraError('No camera found. Use manual entry instead.');
      } else {
        setCameraError(`Unable to access camera: ${error.message || error}. Try manual entry.`);
      }
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        // Ignore stop errors
      }
      html5QrCodeRef.current = null;
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setScannerActive(false);
  };

  const processQRCode = async (qrData: string) => {
    if (isProcessing || !selectedEvent) return;

    setIsProcessing(true);
    setLastScanResult(null);

    console.log('📱 Raw QR data received:', qrData);
    console.log('📱 QR data type:', typeof qrData);
    console.log('📱 QR data length:', qrData.length);

    try {
      let ticketData;
      try {
        ticketData = JSON.parse(qrData);
        console.log('✅ Parsed ticket data:', ticketData);
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('❌ Failed to parse:', qrData);
        setLastScanResult({
          success: false,
          message: `Invalid QR code format. Raw data: ${qrData.substring(0, 100)}...`,
        });
        setIsProcessing(false);
        return;
      }

      const { bookingId, eventId: ticketEventId } = ticketData;

      // Validate event ID matches
      if (ticketEventId !== selectedEvent.id) {
        setLastScanResult({
          success: false,
          message: 'This ticket is for a different event',
        });
        setIsProcessing(false);
        return;
      }

      // Get attendee
      const attendee = await attendeesService.getById(bookingId);

      if (!attendee) {
        setLastScanResult({
          success: false,
          message: 'Ticket not found',
        });
        setIsProcessing(false);
        return;
      }

      // Check if already checked in
      if (attendee.checkedIn) {
        setLastScanResult({
          success: false,
          attendee,
          message: 'Already checked in',
          alreadyCheckedIn: true,
        });
        setIsProcessing(false);
        return;
      }

      // Perform check-in
      await attendeesService.checkIn(bookingId, user?.uid || 'gate-staff', 'qr');

      // Update stats
      setStats((prev) => ({
        ...prev,
        checkedIn: prev.checkedIn + 1,
        notCheckedIn: prev.notCheckedIn - 1,
        checkInRate: Math.round(((prev.checkedIn + 1) / prev.total) * 100),
      }));

      setLastScanResult({
        success: true,
        attendee: { ...attendee, checkedIn: true },
        message: 'Check-in successful!',
      });

      // Play success sound
      try {
        const audio = new Audio('/sounds/success.mp3');
        audio.play().catch(() => {});
      } catch {}
    } catch (error: any) {
      console.error('Error processing QR code:', error);
      const errorMessage = error?.message || error?.code || 'Error processing ticket';
      const isPermissionError = errorMessage.includes('permission') || error?.code === 'permission-denied';
      setLastScanResult({
        success: false,
        message: isPermissionError
          ? 'Permission denied. Please check Firebase security rules for bookings collection.'
          : `Error: ${errorMessage}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualEntry = async () => {
    if (!manualCode.trim() || !selectedEvent) return;

    let bookingId = manualCode.trim();
    try {
      const parsed = JSON.parse(manualCode);
      if (parsed.bookingId) {
        bookingId = parsed.bookingId;
      }
    } catch {
      // Use as-is
    }

    await processQRCode(
      JSON.stringify({
        bookingId,
        eventId: selectedEvent.id,
        ticketId: bookingId,
      })
    );

    setManualCode('');
  };

  const clearResult = () => {
    setLastScanResult(null);
  };

  const handleLogout = async () => {
    stopScanner();
    await logout();
    router.push('/login');
  };

  if (authLoading || loadingEvents) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#333]"
        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
          <p className="mt-4 text-white font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className="min-h-screen bg-[#333]"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      {/* Header */}
      <div className="bg-[#222] border-b border-white/10 sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                <span className="text-[#333] font-bold text-lg">TK</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Gate Check-In</h1>
                <p className="text-xs text-white/60">{currentOrganization?.name}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-white/60 hover:text-white transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Event Selector */}
        <div className="relative">
          <button
            onClick={() => setShowEventDropdown(!showEventDropdown)}
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 flex items-center justify-between text-white"
          >
            <div className="text-left">
              <p className="text-xs text-white/60 mb-1">Selected Event</p>
              <p className="font-semibold">
                {selectedEvent ? selectedEvent.name : 'Choose an event...'}
              </p>
            </div>
            <ChevronDown
              className={`h-5 w-5 transition-transform ${showEventDropdown ? 'rotate-180' : ''}`}
            />
          </button>

          {showEventDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#222] border border-white/20 rounded-2xl overflow-hidden z-10 shadow-xl">
              {events.length === 0 ? (
                <div className="p-4 text-center text-white/60">
                  No active events found
                </div>
              ) : (
                events.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowEventDropdown(false);
                      setLastScanResult(null);
                      stopScanner();
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0 ${
                      selectedEvent?.id === event.id ? 'bg-white/10' : ''
                    }`}
                  >
                    <p className="font-semibold text-white">{event.name}</p>
                    <p className="text-xs text-white/60">
                      {event.dateTime
                        ? new Date(
                            event.dateTime.seconds
                              ? event.dateTime.seconds * 1000
                              : event.dateTime
                          ).toLocaleDateString()
                        : 'Date TBD'}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {selectedEvent ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-2xl p-4 text-center">
                <Users className="mx-auto h-5 w-5 text-white/60 mb-1" />
                <p className="text-2xl font-bold text-white">{stats.total}</p>
                <p className="text-xs text-white/60">Total</p>
              </div>
              <div className="bg-green-500/20 rounded-2xl p-4 text-center">
                <UserCheck className="mx-auto h-5 w-5 text-green-400 mb-1" />
                <p className="text-2xl font-bold text-green-400">{stats.checkedIn}</p>
                <p className="text-xs text-green-400/80">Checked In</p>
              </div>
              <div className="bg-orange-500/20 rounded-2xl p-4 text-center">
                <Clock className="mx-auto h-5 w-5 text-orange-400 mb-1" />
                <p className="text-2xl font-bold text-orange-400">{stats.notCheckedIn}</p>
                <p className="text-xs text-orange-400/80">Remaining</p>
              </div>
            </div>

            {/* Scanner Area */}
            <div className="bg-[#222] rounded-3xl overflow-hidden">
              {/* Scanner Controls */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-white" />
                  <span className="font-semibold text-white">Scan Ticket</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowManualEntry(!showManualEntry)}
                    className={`p-2 rounded-full transition-colors ${
                      showManualEntry ? 'bg-white text-[#333]' : 'bg-white/10 text-white'
                    }`}
                  >
                    <Keyboard className="h-5 w-5" />
                  </button>
                  <button
                    onClick={scannerActive ? stopScanner : startScanner}
                    className={`p-2 rounded-full transition-colors ${
                      scannerActive ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    }`}
                  >
                    {scannerActive ? (
                      <CameraOff className="h-5 w-5" />
                    ) : (
                      <Camera className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Camera View */}
              <div className="relative aspect-square bg-black">
                {/* QR Scanner Container - always present but hidden when not scanning */}
                <div
                  id="qr-reader"
                  className={`w-full h-full ${scannerActive ? 'block' : 'hidden'}`}
                  style={{ minHeight: '300px' }}
                />

                {scannerActive && isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                  </div>
                )}

                {!scannerActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {cameraError ? (
                      <>
                        <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
                        <p className="text-center text-white/70 px-8">{cameraError}</p>
                        <button
                          onClick={() => {
                            setCameraError(null);
                            startScanner();
                          }}
                          className="mt-4 px-6 py-2 bg-white text-[#333] rounded-full font-semibold"
                        >
                          Try Again
                        </button>
                      </>
                    ) : (
                      <>
                        <Camera className="h-16 w-16 text-white/30 mb-4" />
                        <p className="text-white/50 mb-4">Camera is off</p>
                        <button
                          onClick={startScanner}
                          className="px-8 py-4 bg-green-500 text-white rounded-full font-bold text-lg"
                        >
                          Start Scanner
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Manual Entry */}
              {showManualEntry && (
                <div className="p-4 border-t border-white/10">
                  <p className="text-sm font-medium text-white mb-2">Manual Entry</p>
                  <div className="flex gap-2">
                    <input
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="Enter ticket ID..."
                      className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/40"
                      onKeyDown={(e) => e.key === 'Enter' && handleManualEntry()}
                    />
                    <button
                      onClick={handleManualEntry}
                      disabled={!manualCode.trim() || isProcessing}
                      className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold disabled:opacity-50"
                    >
                      {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Go'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Scan Result */}
            {lastScanResult && (
              <div
                className={`rounded-3xl p-6 ${
                  lastScanResult.success
                    ? 'bg-green-500'
                    : lastScanResult.alreadyCheckedIn
                    ? 'bg-orange-500'
                    : 'bg-red-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  {lastScanResult.success ? (
                    <CheckCircle2 className="h-12 w-12 text-white flex-shrink-0" />
                  ) : lastScanResult.alreadyCheckedIn ? (
                    <AlertCircle className="h-12 w-12 text-white flex-shrink-0" />
                  ) : (
                    <XCircle className="h-12 w-12 text-white flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{lastScanResult.message}</h3>
                    {lastScanResult.attendee && (
                      <div className="mt-2">
                        <p className="text-lg font-semibold text-white/90">
                          {lastScanResult.attendee.firstName} {lastScanResult.attendee.lastName}
                        </p>
                        <p className="text-white/70">{lastScanResult.attendee.userEmail}</p>
                        <p className="text-sm text-white/60 mt-1">
                          {lastScanResult.attendee.quantity} ticket
                          {lastScanResult.attendee.quantity > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                  <button onClick={clearResult} className="text-white/70 hover:text-white p-2">
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={loadStats}
              className="w-full py-3 bg-white/10 text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Stats
            </button>
          </>
        ) : (
          <div className="text-center py-12">
            <QrCode className="mx-auto h-16 w-16 text-white/30 mb-4" />
            <p className="text-white/60">Select an event to start scanning</p>
          </div>
        )}
      </div>

      {/* CSS for scanning animation and QR reader styling */}
      <style jsx global>{`
        @keyframes scan {
          0%,
          100% {
            top: 0;
          }
          50% {
            top: calc(100% - 2px);
          }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        #qr-reader {
          border: none !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #qr-reader__scan_region {
          min-height: 300px !important;
        }
        #qr-reader__dashboard {
          display: none !important;
        }
        #qr-shaded-region {
          border-color: rgba(34, 197, 94, 0.5) !important;
        }
      `}</style>
    </div>
  );
}
