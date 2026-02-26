'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { RegistrationForm } from '@/types/form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function EventFormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const eventData = await eventService.getById(eventId);
      setEvent(eventData);
    } catch (error) {
      console.error('Error loading event:', error);
      toast({
        title: 'Error',
        description: 'Failed to load event',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForm = async (form: RegistrationForm) => {
    if (!event) return;

    try {
      await eventService.update(eventId, {
        registrationForm: form,
      });
      
      toast({
        title: 'Success',
        description: 'Registration form saved successfully',
      });
      
      // Go back to event detail page
      setTimeout(() => {
        router.push(`/dashboard/events/${eventId}`);
      }, 1000);
    } catch (error: any) {
      console.error('Error saving form:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save registration form',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold">Event not found</p>
          <Link href="/dashboard/events">
            <Button variant="outline" className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/events/${eventId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Custom Registration Form</h1>
          <p className="text-gray-600 mt-1">
            {event.name}
          </p>
        </div>
      </div>

      <FormBuilder
        initialForm={event.registrationForm}
        onSave={handleSaveForm}
        onCancel={() => router.push(`/dashboard/events/${eventId}`)}
      />

    </div>
  );
}
