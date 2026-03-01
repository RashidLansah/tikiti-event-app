'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { eventCategories } from '@/lib/data/categories';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Upload,
  Image as ImageIcon,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Ticket,
  Sparkles,
  ChevronDown,
  Video,
  Building2,
  Globe,
  Link,
} from 'lucide-react';
import { AIDescriptionHelper } from '@/components/AIDescriptionHelper';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  {
    id: 'name',
    title: "What's your event called?",
    subtitle: 'Give your event a name that captures attention',
    icon: Sparkles,
  },
  {
    id: 'description',
    title: 'Tell people about your event',
    subtitle: 'Describe what attendees can expect',
    icon: Sparkles,
  },
  {
    id: 'image',
    title: 'Add a cover image',
    subtitle: 'A great image helps your event stand out',
    icon: ImageIcon,
  },
  {
    id: 'datetime',
    title: 'When is your event?',
    subtitle: 'Set the date and time',
    icon: Calendar,
  },
  {
    id: 'venueType',
    title: 'How will people attend?',
    subtitle: 'Choose the format for your event',
    icon: Globe,
  },
  {
    id: 'location',
    title: 'Where will it happen?',
    subtitle: 'Add your venue details',
    icon: MapPin,
  },
  {
    id: 'category',
    title: 'What type of event is this?',
    subtitle: 'Choose the category that best fits',
    icon: Tag,
  },
  {
    id: 'tickets',
    title: 'Set up your tickets',
    subtitle: 'Choose pricing and capacity',
    icon: Ticket,
  },
  {
    id: 'review',
    title: 'Ready to create?',
    subtitle: 'Review your event details',
    icon: Check,
  },
];

export default function CreateEventPage() {
  const router = useRouter();
  const { currentOrganization, user, userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState<Partial<Event>>({
    name: '',
    description: '',
    date: '',
    time: '',
    startDate: '',
    endDate: '',
    venueType: 'in_person',
    location: '',
    address: '',
    meetingLink: '',
    meetingPlatform: '',
    category: '',
    type: 'free',
    price: 0,
    totalTickets: 100,
    status: 'draft',
    isActive: true,
    imageBase64: undefined,
  });
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [hasCohorts, setHasCohorts] = useState(false);
  const [cohortEntries, setCohortEntries] = useState<Array<{ name: string; startDate: string; endDate: string; capacity: number }>>([
    { name: '', startDate: '', endDate: '', capacity: 50 },
  ]);

  // Auto-focus input on step change
  useEffect(() => {
    setTimeout(() => {
      if (currentStep === 0 && inputRef.current) {
        inputRef.current.focus();
      } else if (currentStep === 1 && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 400);
  }, [currentStep]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && currentStep !== 1) {
        e.preventDefault();
        handleNext();
      }
      if (e.key === 'Escape') {
        router.push('/dashboard/events');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, formData]);

  const updateFormData = (field: keyof Event, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 1024 * 1024) {
      setError('Image size must be less than 1MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      updateFormData('imageBase64', reader.result as string);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const canProceed = (): boolean => {
    switch (STEPS[currentStep].id) {
      case 'name':
        return (formData.name?.length || 0) > 0;
      case 'description':
        return (formData.description?.length || 0) > 10;
      case 'image':
        return true; // Optional
      case 'datetime':
        if (isMultiDay) {
          return Boolean(formData.startDate && formData.endDate && formData.time && formData.endDate >= formData.startDate);
        }
        return Boolean(formData.date && formData.time);
      case 'venueType':
        return Boolean(formData.venueType);
      case 'location':
        // For virtual events, location is optional but meeting link is recommended
        if (formData.venueType === 'virtual') {
          return true; // Meeting link is optional, can be added later
        }
        // For in_person or hybrid, location is required
        return (formData.location?.length || 0) > 0;
      case 'category':
        return Boolean(formData.category);
      case 'tickets':
        return (formData.totalTickets || 0) > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1 && canProceed()) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!user || !currentOrganization?.id) {
      setError('Please sign in to create an event');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const eventData: Partial<Event> = {
        ...formData,
        organizerId: user.uid,
        organizationId: currentOrganization.id,
        organizerName: userProfile?.displayName || user.displayName || 'Event Organizer',
        organizerEmail: user.email || '',
        availableTickets: formData.totalTickets || 100,
        soldTickets: 0,
        status: 'draft',
        isActive: true,
      };

      // Add cohorts if enabled
      if (hasCohorts && cohortEntries.length > 0) {
        const cohortsMap: Record<string, any> = {};
        cohortEntries.forEach((entry) => {
          if (entry.name.trim() && entry.startDate) {
            const id = `cohort-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            cohortsMap[id] = {
              id,
              name: entry.name.trim(),
              startDate: entry.startDate,
              endDate: entry.endDate || '',
              capacity: entry.capacity || 50,
              soldTickets: 0,
              availableTickets: entry.capacity || 50,
              status: 'active',
            };
          }
        });
        if (Object.keys(cohortsMap).length > 0) {
          eventData.cohorts = cohortsMap;
          eventData.hasCohorts = true;
        }
      }

      const newEvent = await eventService.create(eventData, user.uid, currentOrganization.id);
      router.push(`/dashboard/events/${newEvent.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const renderStepContent = () => {
    const step = STEPS[currentStep];

    switch (step.id) {
      case 'name':
        return (
          <div className="space-y-8">
            <Input
              ref={inputRef}
              value={formData.name || ''}
              onChange={(e) => updateFormData('name', e.target.value)}
              placeholder="Enter event name..."
              className="text-4xl md:text-5xl font-semibold border-none shadow-none focus-visible:ring-0 px-0 py-4 placeholder:text-[#333]/30 bg-transparent"
              style={{ fontSize: 'clamp(1.5rem, 5vw, 3rem)' }}
            />
            <p className="text-sm text-[#86868b]">Press Enter to continue ↵</p>
          </div>
        );

      case 'description':
        return (
          <div className="space-y-6">
            <Textarea
              ref={textareaRef}
              value={formData.description || ''}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Describe what makes your event special..."
              className="text-xl md:text-2xl font-medium border-none shadow-none focus-visible:ring-0 px-0 py-4 placeholder:text-[#333]/30 bg-transparent resize-none min-h-[200px]"
              rows={5}
            />
            <AIDescriptionHelper
              eventName={formData.name || ''}
              currentDescription={formData.description || ''}
              eventDetails={{
                category: formData.category,
                location: formData.location,
                date: formData.date,
                time: formData.time,
                type: formData.type,
                price: formData.price,
              }}
              onDescriptionGenerated={(description) => updateFormData('description', description)}
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-6">
            {formData.imageBase64 ? (
              <div className="relative group">
                <img
                  src={formData.imageBase64}
                  alt="Event preview"
                  className="w-full max-w-2xl h-80 object-cover rounded-3xl"
                />
                <button
                  onClick={() => updateFormData('imageBase64', null)}
                  className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <label className="block w-full max-w-2xl cursor-pointer">
                <div className="border-2 border-dashed border-[#333]/20 rounded-3xl p-16 text-center hover:border-[#333]/40 transition-colors">
                  <Upload className="h-16 w-16 text-[#333]/30 mx-auto mb-6" />
                  <p className="text-xl font-medium text-[#333]/70 mb-2">
                    Drop an image here or click to upload
                  </p>
                  <p className="text-sm text-[#86868b]">
                    Recommended: 1200×630px • Max 1MB
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
            <button
              onClick={handleNext}
              className="text-sm text-[#86868b] hover:text-[#333] transition-colors"
            >
              Skip for now →
            </button>
          </div>
        );

      case 'datetime':
        return (
          <div className="space-y-8 max-w-md">
            {/* Multi-day toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => {
                  const newMultiDay = !isMultiDay;
                  setIsMultiDay(newMultiDay);
                  if (!newMultiDay) {
                    updateFormData('startDate', '');
                    updateFormData('endDate', '');
                  } else {
                    updateFormData('startDate', formData.date || '');
                  }
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${isMultiDay ? 'bg-[#333]' : 'bg-[#d1d1d6]'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isMultiDay ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-base font-medium text-[#333]">Multi-day event</span>
            </label>

            {isMultiDay ? (
              <>
                <div className="space-y-3">
                  <label className="text-lg font-medium text-[#333]">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868b]" />
                    <Input
                      type="date"
                      value={formData.startDate || ''}
                      onChange={(e) => {
                        updateFormData('startDate', e.target.value);
                        updateFormData('date', e.target.value);
                      }}
                      min={new Date().toISOString().split('T')[0]}
                      className="pl-12 h-14 text-lg rounded-2xl border-[#333]/10 bg-[#f0f0f0]"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-lg font-medium text-[#333]">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868b]" />
                    <Input
                      type="date"
                      value={formData.endDate || ''}
                      onChange={(e) => updateFormData('endDate', e.target.value)}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      className="pl-12 h-14 text-lg rounded-2xl border-[#333]/10 bg-[#f0f0f0]"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <label className="text-lg font-medium text-[#333]">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868b]" />
                  <Input
                    type="date"
                    value={formData.date || ''}
                    onChange={(e) => updateFormData('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="pl-12 h-14 text-lg rounded-2xl border-[#333]/10 bg-[#f0f0f0]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-lg font-medium text-[#333]">{isMultiDay ? 'Start Time' : 'Time'}</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868b]" />
                <Input
                  type="time"
                  value={formData.time || ''}
                  onChange={(e) => updateFormData('time', e.target.value)}
                  className="pl-12 h-14 text-lg rounded-2xl border-[#333]/10 bg-[#f0f0f0]"
                />
              </div>
            </div>
          </div>
        );

      case 'venueType':
        return (
          <div className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.button
                onClick={() => updateFormData('venueType', 'in_person')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-2xl text-left transition-all ${
                  formData.venueType === 'in_person'
                    ? 'bg-[#333] text-white ring-2 ring-[#333] ring-offset-2'
                    : 'bg-[#f0f0f0] text-[#333] hover:bg-[#e8e8e8]'
                }`}
              >
                <Building2 className={`h-8 w-8 mb-3 ${formData.venueType === 'in_person' ? 'text-white' : 'text-[#333]'}`} />
                <span className="text-lg font-medium block">In Person</span>
                <span className={`text-sm mt-1 block ${formData.venueType === 'in_person' ? 'text-white/70' : 'text-[#86868b]'}`}>
                  At a physical venue
                </span>
              </motion.button>

              <motion.button
                onClick={() => updateFormData('venueType', 'virtual')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-2xl text-left transition-all ${
                  formData.venueType === 'virtual'
                    ? 'bg-[#333] text-white ring-2 ring-[#333] ring-offset-2'
                    : 'bg-[#f0f0f0] text-[#333] hover:bg-[#e8e8e8]'
                }`}
              >
                <Video className={`h-8 w-8 mb-3 ${formData.venueType === 'virtual' ? 'text-white' : 'text-[#333]'}`} />
                <span className="text-lg font-medium block">Virtual</span>
                <span className={`text-sm mt-1 block ${formData.venueType === 'virtual' ? 'text-white/70' : 'text-[#86868b]'}`}>
                  Online via video call
                </span>
              </motion.button>

              <motion.button
                onClick={() => updateFormData('venueType', 'hybrid')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-2xl text-left transition-all ${
                  formData.venueType === 'hybrid'
                    ? 'bg-[#333] text-white ring-2 ring-[#333] ring-offset-2'
                    : 'bg-[#f0f0f0] text-[#333] hover:bg-[#e8e8e8]'
                }`}
              >
                <Globe className={`h-8 w-8 mb-3 ${formData.venueType === 'hybrid' ? 'text-white' : 'text-[#333]'}`} />
                <span className="text-lg font-medium block">Hybrid</span>
                <span className={`text-sm mt-1 block ${formData.venueType === 'hybrid' ? 'text-white/70' : 'text-[#86868b]'}`}>
                  Both in person & online
                </span>
              </motion.button>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-8 max-w-xl">
            {/* Physical Location - shown for in_person and hybrid */}
            {(formData.venueType === 'in_person' || formData.venueType === 'hybrid') && (
              <>
                <div className="space-y-3">
                  <label className="text-lg font-medium text-[#333]">Venue Name</label>
                  <Input
                    value={formData.location || ''}
                    onChange={(e) => updateFormData('location', e.target.value)}
                    placeholder="e.g., The Grand Ballroom"
                    className="h-14 text-lg rounded-2xl border-[#333]/10 bg-[#f0f0f0]"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-lg font-medium text-[#333]">Address (optional)</label>
                  <Input
                    value={formData.address || ''}
                    onChange={(e) => updateFormData('address', e.target.value)}
                    placeholder="123 Main Street, City"
                    className="h-14 text-lg rounded-2xl border-[#333]/10 bg-[#f0f0f0]"
                  />
                </div>
              </>
            )}

            {/* Meeting Link - shown for virtual and hybrid */}
            {(formData.venueType === 'virtual' || formData.venueType === 'hybrid') && (
              <>
                {formData.venueType === 'hybrid' && (
                  <div className="border-t border-[#333]/10 pt-6">
                    <p className="text-sm text-[#86868b] mb-4">Virtual meeting details</p>
                  </div>
                )}
                <div className="space-y-3">
                  <label className="text-lg font-medium text-[#333]">Meeting Platform</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'zoom', label: 'Zoom' },
                      { id: 'google_meet', label: 'Google Meet' },
                      { id: 'teams', label: 'MS Teams' },
                      { id: 'other', label: 'Other' },
                    ].map((platform) => (
                      <motion.button
                        key={platform.id}
                        onClick={() => updateFormData('meetingPlatform', platform.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`p-3 rounded-xl text-center transition-all ${
                          formData.meetingPlatform === platform.id
                            ? 'bg-[#333] text-white'
                            : 'bg-[#f0f0f0] text-[#333] hover:bg-[#e8e8e8]'
                        }`}
                      >
                        <span className="text-sm font-medium">{platform.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-lg font-medium text-[#333]">
                    Meeting Link
                    <span className="text-sm font-normal text-[#86868b] ml-2">(can add later)</span>
                  </label>
                  <div className="relative">
                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#86868b]" />
                    <Input
                      value={formData.meetingLink || ''}
                      onChange={(e) => updateFormData('meetingLink', e.target.value)}
                      placeholder="https://zoom.us/j/..."
                      className="pl-12 h-14 text-lg rounded-2xl border-[#333]/10 bg-[#f0f0f0]"
                    />
                  </div>
                  <p className="text-sm text-[#86868b]">
                    You can add this now or later. Registered attendees will see the link in their ticket.
                  </p>
                </div>
              </>
            )}

            {/* Virtual only - show option to add location name for display */}
            {formData.venueType === 'virtual' && (
              <div className="space-y-3 pt-4 border-t border-[#333]/10">
                <label className="text-lg font-medium text-[#333]">
                  Display Location
                  <span className="text-sm font-normal text-[#86868b] ml-2">(optional)</span>
                </label>
                <Input
                  value={formData.location || ''}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  placeholder="e.g., Online via Zoom"
                  className="h-14 text-lg rounded-2xl border-[#333]/10 bg-[#f0f0f0]"
                />
                <p className="text-sm text-[#86868b]">
                  This will be shown on the event card. Leave empty to show "Virtual Event".
                </p>
              </div>
            )}
          </div>
        );

      case 'category':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl">
            {eventCategories.map((category, index) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
                onClick={() => updateFormData('category', category.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-2xl text-left transition-all ${
                  formData.category === category.id
                    ? 'bg-[#333] text-white ring-2 ring-[#333] ring-offset-2'
                    : 'bg-[#f0f0f0] text-[#333] hover:bg-[#e8e8e8]'
                }`}
              >
                <span className="text-lg font-medium">{category.name}</span>
              </motion.button>
            ))}
          </div>
        );

      case 'tickets':
        return (
          <div className="space-y-8 max-w-md">
            <div className="space-y-4">
              <label className="text-lg font-medium text-[#333]">Event Type</label>
              <div className="flex gap-4">
                <motion.button
                  onClick={() => updateFormData('type', 'free')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 p-6 rounded-2xl text-center transition-all ${
                    formData.type === 'free'
                      ? 'bg-[#333] text-white ring-2 ring-[#333] ring-offset-2'
                      : 'bg-[#f0f0f0] text-[#333] hover:bg-[#e8e8e8]'
                  }`}
                >
                  <span className="text-lg font-medium">Free</span>
                </motion.button>
                <motion.button
                  disabled
                  className="flex-1 p-6 rounded-2xl text-center bg-[#f0f0f0] text-[#bbb] cursor-not-allowed opacity-60"
                >
                  <span className="text-lg font-medium">Paid</span>
                  <span className="block text-xs mt-1">Coming soon</span>
                </motion.button>
              </div>
            </div>

            {formData.type === 'paid' && (
              <div className="space-y-3">
                <label className="text-lg font-medium text-[#333]">Price per ticket</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#86868b]">₵</span>
                  <Input
                    type="number"
                    value={formData.price || ''}
                    onChange={(e) => updateFormData('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="pl-10 h-14 text-lg rounded-2xl border-[#333]/10 bg-[#f0f0f0]"
                  />
                </div>
              </div>
            )}

            {!hasCohorts && (
              <div className="space-y-3">
                <label className="text-lg font-medium text-[#333]">Total tickets available</label>
                <Input
                  type="number"
                  value={formData.totalTickets || ''}
                  onChange={(e) => updateFormData('totalTickets', parseInt(e.target.value) || 0)}
                  placeholder="100"
                  min="1"
                  className="h-14 text-lg rounded-2xl border-[#333]/10 bg-[#f0f0f0]"
                />
              </div>
            )}

            {/* Cohorts toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => {
                  setHasCohorts(!hasCohorts);
                  if (!hasCohorts) {
                    // Sum cohort capacities into totalTickets
                    const totalCap = cohortEntries.reduce((sum, c) => sum + (c.capacity || 0), 0);
                    if (totalCap > 0) updateFormData('totalTickets', totalCap);
                  }
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${hasCohorts ? 'bg-[#333]' : 'bg-[#d1d1d6]'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${hasCohorts ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-base font-medium text-[#333]">Multiple cohorts</span>
            </label>
            {hasCohorts && (
              <p className="text-sm text-[#86868b] -mt-4">Run this event multiple times on different dates</p>
            )}

            {hasCohorts && (
              <div className="space-y-4">
                {cohortEntries.map((entry, idx) => (
                  <div key={idx} className="bg-[#f0f0f0] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#333]">Cohort {idx + 1}</span>
                      {cohortEntries.length > 1 && (
                        <button
                          onClick={() => {
                            const updated = cohortEntries.filter((_, i) => i !== idx);
                            setCohortEntries(updated);
                            updateFormData('totalTickets', updated.reduce((sum, c) => sum + (c.capacity || 0), 0));
                          }}
                          className="text-red-500 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <Input
                      value={entry.name}
                      onChange={(e) => {
                        const updated = [...cohortEntries];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setCohortEntries(updated);
                      }}
                      placeholder="Cohort name (e.g. January Batch)"
                      className="h-12 rounded-xl border-[#333]/10 bg-white"
                    />
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        type="date"
                        value={entry.startDate}
                        onChange={(e) => {
                          const updated = [...cohortEntries];
                          updated[idx] = { ...updated[idx], startDate: e.target.value };
                          setCohortEntries(updated);
                        }}
                        className="h-10 text-sm rounded-xl border-[#333]/10 bg-white"
                      />
                      <Input
                        type="date"
                        value={entry.endDate}
                        min={entry.startDate}
                        onChange={(e) => {
                          const updated = [...cohortEntries];
                          updated[idx] = { ...updated[idx], endDate: e.target.value };
                          setCohortEntries(updated);
                        }}
                        placeholder="End date"
                        className="h-10 text-sm rounded-xl border-[#333]/10 bg-white"
                      />
                      <Input
                        type="number"
                        value={entry.capacity || ''}
                        min={1}
                        onChange={(e) => {
                          const updated = [...cohortEntries];
                          updated[idx] = { ...updated[idx], capacity: parseInt(e.target.value) || 0 };
                          setCohortEntries(updated);
                          updateFormData('totalTickets', updated.reduce((sum, c) => sum + (c.capacity || 0), 0));
                        }}
                        placeholder="Capacity"
                        className="h-10 text-sm rounded-xl border-[#333]/10 bg-white"
                      />
                    </div>
                    <div className="flex gap-2 text-xs text-[#86868b]">
                      <span>Start date</span>
                      <span>End date (optional)</span>
                      <span>Capacity</span>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setCohortEntries([...cohortEntries, { name: '', startDate: '', endDate: '', capacity: 50 }])}
                  className="text-sm font-medium text-[#333] hover:underline"
                >
                  + Add another cohort
                </button>
                <div className="text-sm text-[#86868b]">
                  Total capacity: {cohortEntries.reduce((sum, c) => sum + (c.capacity || 0), 0)} tickets
                </div>
              </div>
            )}
          </div>
        );

      case 'review':
        const venueTypeLabels: Record<string, string> = {
          in_person: 'In Person',
          virtual: 'Virtual',
          hybrid: 'Hybrid',
        };
        const platformLabels: Record<string, string> = {
          zoom: 'Zoom',
          google_meet: 'Google Meet',
          teams: 'MS Teams',
          other: 'Other',
        };
        return (
          <div className="max-w-2xl space-y-6">
            <div className="bg-[#f0f0f0] rounded-3xl p-8 space-y-6">
              {formData.imageBase64 && (
                <img
                  src={formData.imageBase64}
                  alt="Event"
                  className="w-full h-48 object-cover rounded-2xl"
                />
              )}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-semibold text-[#333]">{formData.name}</h3>
                  {formData.venueType && formData.venueType !== 'in_person' && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      formData.venueType === 'virtual'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {formData.venueType === 'virtual' ? 'Virtual' : 'Hybrid'}
                    </span>
                  )}
                </div>
                <p className="text-[#86868b] mt-2 line-clamp-3">{formData.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-[#333]">
                  <Calendar className="h-4 w-4 text-[#86868b]" />
                  {isMultiDay && formData.startDate && formData.endDate ? (
                    <>
                      {new Date(formData.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {' - '}
                      {new Date(formData.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </>
                  ) : (
                    formData.date && new Date(formData.date).toLocaleDateString('en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  )}
                </div>
                <div className="flex items-center gap-2 text-[#333]">
                  <Clock className="h-4 w-4 text-[#86868b]" />
                  {formData.time}
                </div>
                <div className="flex items-center gap-2 text-[#333]">
                  {formData.venueType === 'virtual' ? (
                    <Video className="h-4 w-4 text-[#86868b]" />
                  ) : (
                    <MapPin className="h-4 w-4 text-[#86868b]" />
                  )}
                  {formData.location || (formData.venueType === 'virtual' ? 'Virtual Event' : 'TBA')}
                </div>
                <div className="flex items-center gap-2 text-[#333]">
                  <Ticket className="h-4 w-4 text-[#86868b]" />
                  {formData.type === 'free' ? 'Free' : `₵${formData.price}`} • {formData.totalTickets} tickets
                </div>
              </div>
              {/* Meeting Link Info */}
              {(formData.venueType === 'virtual' || formData.venueType === 'hybrid') && formData.meetingLink && (
                <div className="flex items-center gap-2 text-sm text-[#333] bg-white/50 p-3 rounded-xl">
                  <Link className="h-4 w-4 text-[#86868b]" />
                  <span className="text-[#86868b]">
                    {platformLabels[formData.meetingPlatform || 'other'] || 'Meeting'} link added
                  </span>
                </div>
              )}
              {(formData.venueType === 'virtual' || formData.venueType === 'hybrid') && !formData.meetingLink && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-xl">
                  <Link className="h-4 w-4" />
                  <span>Meeting link not added yet - you can add it later</span>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#333]/10 text-[#333]">
                  {eventCategories.find((c) => c.id === formData.category)?.name}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#333]/10 text-[#333]">
                  {venueTypeLabels[formData.venueType || 'in_person']}
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#fefff7] overflow-y-auto"
      style={{ fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif' }}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#333]/10">
        <motion.div
          className="h-full bg-[#333]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Header */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 lg:px-12 py-6">
        <div className="flex items-center gap-6">
          <span className="text-sm font-medium text-[#86868b]">
            {currentStep + 1} of {STEPS.length}
          </span>
        </div>

        {/* Close Button - Big and prominent like Typeform */}
        <motion.button
          onClick={() => router.push('/dashboard/events')}
          className="w-14 h-14 rounded-full bg-[#333]/5 hover:bg-[#333]/10 flex items-center justify-center transition-all hover:scale-105"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <X className="h-7 w-7 text-[#333]" strokeWidth={2.5} />
        </motion.button>
      </header>

      {/* Main Content */}
      <div className="min-h-full flex flex-col justify-center px-6 lg:px-24 xl:px-32 pt-20 pb-32">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-4xl"
          >
            {/* Step Icon & Title */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const Icon = STEPS[currentStep].icon;
                  return <Icon className="h-6 w-6 text-[#86868b]" />;
                })()}
                <span className="text-sm font-medium text-[#86868b] uppercase tracking-wide">
                  Step {currentStep + 1}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-[#333] mb-3">
                {STEPS[currentStep].title}
              </h1>
              <p className="text-xl text-[#86868b]">
                {STEPS[currentStep].subtitle}
              </p>
            </div>

            {/* Step Content */}
            {renderStepContent()}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-2xl bg-red-50 text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation - Typeform style big buttons */}
      <footer className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-6 lg:px-12 py-8 bg-gradient-to-t from-[#fefff7] via-[#fefff7] to-transparent">
        <motion.button
          onClick={handlePrev}
          disabled={currentStep === 0}
          whileHover={currentStep > 0 ? { scale: 1.02 } : {}}
          whileTap={currentStep > 0 ? { scale: 0.98 } : {}}
          className={`flex items-center gap-3 px-8 py-4 rounded-full font-semibold text-lg transition-all ${
            currentStep === 0
              ? 'text-[#86868b]/40 cursor-not-allowed'
              : 'text-[#333] hover:bg-[#333]/5 border border-[#333]/10'
          }`}
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </motion.button>

        {currentStep < STEPS.length - 1 ? (
          <motion.button
            onClick={handleNext}
            disabled={!canProceed()}
            whileHover={canProceed() ? { scale: 1.02 } : {}}
            whileTap={canProceed() ? { scale: 0.98 } : {}}
            className={`flex items-center gap-3 px-10 py-4 rounded-full font-semibold text-lg transition-all shadow-lg ${
              canProceed()
                ? 'bg-[#333] text-white hover:bg-[#444] shadow-[#333]/25'
                : 'bg-[#333]/15 text-[#333]/40 cursor-not-allowed shadow-none'
            }`}
          >
            Continue
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        ) : (
          <motion.button
            onClick={handleSubmit}
            disabled={loading}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.98 } : {}}
            className="flex items-center gap-3 px-10 py-4 rounded-full font-semibold text-lg bg-[#333] text-white hover:bg-[#444] transition-all disabled:opacity-50 shadow-lg shadow-[#333]/25"
          >
            {loading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
                Creating...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Create Event
              </>
            )}
          </motion.button>
        )}
      </footer>
    </div>
  );
}
