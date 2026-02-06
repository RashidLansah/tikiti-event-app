'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { attendeesService, Attendee } from '@/lib/services/attendeesService';
import { Input } from '@/components/ui/input';
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  XCircle,
  UserCheck,
  Users,
  Clock,
  Search,
  RefreshCw,
  Loader2,
  AlertCircle,
  Keyboard,
  ArrowLeft,
} from 'lucide-react';

// QR Scanner result type
interface ScanResult {
  success: boolean;
  attendee?: Attendee;
  message: string;
  alreadyCheckedIn?: boolean;
}

export default function QRScannerPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.eventId as string;
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
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

  // Video and scanner refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load event data
  const loadData = useCallback(async () => {
    try {
      const [eventData, statsData] = await Promise.all([
        eventService.getById(eventId),
        attendeesService.getCheckInStats(eventId),
      ]);

      setEvent(eventData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    if (!authLoading && user) {
      loadData();
    } else if (!authLoading && !user) {
      router.push(`/login?redirect=/scan/${eventId}`);
    }
  }, [authLoading, user, loadData, router, eventId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const startScanner = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setScannerActive(true);

        // Start scanning interval
        scanIntervalRef.current = setInterval(() => {
          scanFrame();
        }, 500);
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please enable camera permissions.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera or use manual entry.');
      } else {
        setCameraError('Unable to access camera. Try manual entry instead.');
      }
    }
  };

  const stopScanner = () => {
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

  const scanFrame = async () => {
    if (!videoRef.current || isProcessing) return;

    const video = videoRef.current;
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Create canvas to capture frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    // Use BarcodeDetector API if available (Chrome, Edge)
    if ('BarcodeDetector' in window) {
      try {
        // @ts-ignore - BarcodeDetector not in TS types yet
        const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
        const barcodes = await barcodeDetector.detect(canvas);

        if (barcodes.length > 0) {
          const qrData = barcodes[0].rawValue;
          await processQRCode(qrData);
        }
      } catch (e) {
        // Silently fail - no QR code detected
      }
    }
  };

  const processQRCode = async (qrData: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setLastScanResult(null);

    try {
      // Parse QR code data
      let ticketData;
      try {
        ticketData = JSON.parse(qrData);
      } catch {
        setLastScanResult({
          success: false,
          message: 'Invalid QR code format',
        });
        setIsProcessing(false);
        return;
      }

      const { bookingId, eventId: ticketEventId } = ticketData;

      // Validate event ID matches
      if (ticketEventId !== eventId) {
        setLastScanResult({
          success: false,
          message: 'This ticket is for a different event',
        });
        setIsProcessing(false);
        return;
      }

      // Get attendee by booking ID
      const attendee = await attendeesService.getById(bookingId);

      if (!attendee) {
        setLastScanResult({
          success: false,
          message: 'Ticket not found in system',
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
      await attendeesService.checkIn(bookingId, user?.uid || 'scanner', 'qr');

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

      // Play success sound (optional)
      try {
        const audio = new Audio('/sounds/success.mp3');
        audio.play().catch(() => {});
      } catch {}
    } catch (error) {
      console.error('Error processing QR code:', error);
      setLastScanResult({
        success: false,
        message: 'Error processing ticket. Please try again.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualEntry = async () => {
    if (!manualCode.trim()) return;

    try {
      // Try to parse as JSON first (if they copied the full QR data)
      let bookingId = manualCode.trim();
      try {
        const parsed = JSON.parse(manualCode);
        if (parsed.bookingId) {
          bookingId = parsed.bookingId;
        }
      } catch {
        // Not JSON, use as-is (could be just the booking ID)
      }

      await processQRCode(
        JSON.stringify({
          bookingId,
          eventId,
          ticketId: bookingId,
        })
      );
    } catch (error) {
      console.error('Manual entry error:', error);
    }

    setManualCode('');
  };

  const clearResult = () => {
    setLastScanResult(null);
  };

  if (authLoading || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#fefff7]"
        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-[#333]"></div>
          <p className="mt-4 text-[#333] font-medium">Loading scanner...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-[#fefff7] p-6"
        style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
      >
        <div className="text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-[#333] mb-2">Event Not Found</h2>
          <p className="text-[#333]/70 mb-6">This event doesn't exist or you don't have access.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-[#333] text-white px-6 py-3 rounded-full font-semibold"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#fefff7]"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      {/* Header */}
      <div className="bg-white border-b border-black/10 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/dashboard/events/${eventId}/check-in`}
                className="bg-[#f0f0f0] rounded-full p-2 hover:bg-[#e5e5e5] transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-[#333]" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-[#333]">QR Scanner</h1>
                <p className="text-sm text-[#333]/70 truncate max-w-[200px]">{event.name}</p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="bg-[#f0f0f0] rounded-full p-2 hover:bg-[#e5e5e5] transition-colors"
            >
              <RefreshCw className="h-5 w-5 text-[#333]" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-black/10 rounded-2xl p-4 text-center">
            <Users className="mx-auto h-5 w-5 text-[#333]/70 mb-1" />
            <p className="text-2xl font-bold text-[#333]">{stats.total}</p>
            <p className="text-xs text-[#333]/70">Total</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
            <UserCheck className="mx-auto h-5 w-5 text-green-600 mb-1" />
            <p className="text-2xl font-bold text-green-700">{stats.checkedIn}</p>
            <p className="text-xs text-green-700">Checked In</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center">
            <Clock className="mx-auto h-5 w-5 text-orange-600 mb-1" />
            <p className="text-2xl font-bold text-orange-700">{stats.notCheckedIn}</p>
            <p className="text-xs text-orange-700">Remaining</p>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="bg-white border border-black/10 rounded-3xl overflow-hidden">
          {/* Scanner Controls */}
          <div className="p-4 border-b border-black/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-[#333]" />
              <span className="font-semibold text-[#333]">Scan Ticket</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowManualEntry(!showManualEntry)}
                className={`p-2 rounded-full transition-colors ${
                  showManualEntry ? 'bg-[#333] text-white' : 'bg-[#f0f0f0] text-[#333]'
                }`}
              >
                <Keyboard className="h-5 w-5" />
              </button>
              <button
                onClick={scannerActive ? stopScanner : startScanner}
                className={`p-2 rounded-full transition-colors ${
                  scannerActive ? 'bg-red-500 text-white' : 'bg-[#333] text-white'
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
            {scannerActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Scanner overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-64 h-64 border-2 border-white/50 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-xl" />
                    {/* Scanning line animation */}
                    <div className="absolute left-2 right-2 h-0.5 bg-green-400 animate-scan" />
                  </div>
                </div>
                {isProcessing && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                {cameraError ? (
                  <>
                    <AlertCircle className="h-16 w-16 text-red-400 mb-4" />
                    <p className="text-center px-8">{cameraError}</p>
                    <button
                      onClick={startScanner}
                      className="mt-4 px-6 py-2 bg-white text-[#333] rounded-full font-semibold"
                    >
                      Try Again
                    </button>
                  </>
                ) : (
                  <>
                    <Camera className="h-16 w-16 text-white/50 mb-4" />
                    <p className="text-white/70 mb-4">Camera is off</p>
                    <button
                      onClick={startScanner}
                      className="px-6 py-3 bg-white text-[#333] rounded-full font-semibold"
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
            <div className="p-4 border-t border-black/10 bg-[#f8f8f8]">
              <p className="text-sm font-medium text-[#333] mb-2">Manual Entry</p>
              <div className="flex gap-2">
                <Input
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="Enter ticket ID or booking ID..."
                  className="flex-1 rounded-full bg-white border-black/10"
                  onKeyDown={(e) => e.key === 'Enter' && handleManualEntry()}
                />
                <button
                  onClick={handleManualEntry}
                  disabled={!manualCode.trim() || isProcessing}
                  className="px-6 py-2 bg-[#333] text-white rounded-full font-semibold disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Check In'}
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
                ? 'bg-green-50 border-2 border-green-500'
                : lastScanResult.alreadyCheckedIn
                ? 'bg-orange-50 border-2 border-orange-500'
                : 'bg-red-50 border-2 border-red-500'
            }`}
          >
            <div className="flex items-start gap-4">
              {lastScanResult.success ? (
                <CheckCircle2 className="h-12 w-12 text-green-500 flex-shrink-0" />
              ) : lastScanResult.alreadyCheckedIn ? (
                <AlertCircle className="h-12 w-12 text-orange-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h3
                  className={`text-xl font-bold ${
                    lastScanResult.success
                      ? 'text-green-700'
                      : lastScanResult.alreadyCheckedIn
                      ? 'text-orange-700'
                      : 'text-red-700'
                  }`}
                >
                  {lastScanResult.message}
                </h3>
                {lastScanResult.attendee && (
                  <div className="mt-3">
                    <p className="text-lg font-semibold text-[#333]">
                      {lastScanResult.attendee.firstName} {lastScanResult.attendee.lastName}
                    </p>
                    <p className="text-[#333]/70">{lastScanResult.attendee.userEmail}</p>
                    <p className="text-sm text-[#333]/50 mt-1">
                      {lastScanResult.attendee.quantity} ticket
                      {lastScanResult.attendee.quantity > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={clearResult}
                className="text-[#333]/50 hover:text-[#333] p-2"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-center text-sm text-[#333]/50">
          <p>Point your camera at the attendee's QR code</p>
          <p>or use manual entry for ticket IDs</p>
        </div>
      </div>

      {/* CSS for scanning animation */}
      <style jsx>{`
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
      `}</style>
    </div>
  );
}
