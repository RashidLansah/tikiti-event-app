'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { eventService } from '@/lib/services/eventService';
import { speakerService } from '@/lib/services/speakerService';
import { speakerInvitationService } from '@/lib/services/speakerInvitationService';
import { Speaker } from '@/types/speaker';
import { SpeakerInvitation } from '@/types/speakerInvitation';
import { Event } from '@/lib/services/eventService';
import SpeakerInviteModal from '@/components/speakers/SpeakerInviteModal';
import SpeakerEditModal from '@/components/speakers/SpeakerEditModal';
import SpeakerCard from '@/components/speakers/SpeakerCard';
import {
  ArrowLeft,
  Plus,
  Users,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  UserPlus,
} from 'lucide-react';

export default function EventSpeakersPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { user, currentOrganization } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [invitations, setInvitations] = useState<SpeakerInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load event
      const eventData = await eventService.getById(eventId);
      setEvent(eventData);

      // Load invitations for this event
      const eventInvitations = await speakerInvitationService.getByEvent(eventId);
      setInvitations(eventInvitations);

      // Get unique speaker IDs from submitted invitations
      const speakerIds = eventInvitations
        .filter((inv) => inv.speakerId)
        .map((inv) => inv.speakerId!);

      // Load speakers
      if (speakerIds.length > 0) {
        const speakersData = await speakerService.getByIds(speakerIds);
        setSpeakers(speakersData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteSent = (invitation: SpeakerInvitation) => {
    setInvitations((prev) => [invitation, ...prev]);
    setShowInviteModal(false);
  };

  const handleResend = async (invitationId: string) => {
    try {
      setResendingId(invitationId);
      const invitation = invitations.find((inv) => inv.id === invitationId);
      if (!invitation) return;

      // Resend creates a new invitation
      const newInvitation = await speakerInvitationService.resend(invitationId);

      // Send email
      await fetch('/api/email/speaker-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newInvitation.email,
          speakerName: newInvitation.speakerName,
          eventName: newInvitation.eventName,
          sessionTitle: newInvitation.sessionTitle,
          organizationName: newInvitation.organizationName,
          inviterName: newInvitation.inviterName,
          role: newInvitation.role,
          inviteToken: newInvitation.token,
          personalMessage: newInvitation.message,
        }),
      });

      // Update local state
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId ? { ...inv, status: 'cancelled' as const } : inv
        )
      );
      setInvitations((prev) => [newInvitation, ...prev]);
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation');
    } finally {
      setResendingId(null);
    }
  };

  const handleCancel = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      setCancellingId(invitationId);
      await speakerInvitationService.cancel(invitationId);
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === invitationId ? { ...inv, status: 'cancelled' as const } : inv
        )
      );
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      alert('Failed to cancel invitation');
    } finally {
      setCancellingId(null);
    }
  };

  const pendingInvitations = invitations.filter((inv) => inv.status === 'pending');
  const submittedInvitations = invitations.filter((inv) => inv.status === 'submitted');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefff7] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/dashboard/events/${eventId}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Speakers & Panelists</h1>
              <p className="text-gray-600">{event?.name}</p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 bg-[#333] text-white px-4 py-2 rounded-full hover:bg-[#444] transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invite Speaker
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{speakers.length}</p>
                <p className="text-sm text-gray-500">Confirmed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{pendingInvitations.length}</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{invitations.length}</p>
                <p className="text-sm text-gray-500">Total Invited</p>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmed Speakers */}
        {speakers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Confirmed Speakers ({speakers.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {speakers.map((speaker) => (
                <SpeakerCard
                  key={speaker.id}
                  speaker={speaker}
                  onEdit={() => setEditingSpeaker(speaker)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              Pending Invitations ({pendingInvitations.length})
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
              {pendingInvitations.map((invitation) => (
                <div key={invitation.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {invitation.speakerName || invitation.email}
                    </p>
                    <p className="text-sm text-gray-500">
                      {invitation.email} • <span className="capitalize">{invitation.role}</span>
                    </p>
                    {invitation.sessionTitle && (
                      <p className="text-xs text-gray-400 mt-1">Session: {invitation.sessionTitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleResend(invitation.id!)}
                      disabled={resendingId === invitation.id}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Resend invitation"
                    >
                      {resendingId === invitation.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleCancel(invitation.id!)}
                      disabled={cancellingId === invitation.id}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Cancel invitation"
                    >
                      {cancellingId === invitation.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {speakers.length === 0 && pendingInvitations.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No speakers yet</h3>
            <p className="text-gray-500 mb-6">
              Invite speakers and panelists to make your event more engaging.
            </p>
            <button
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 bg-[#333] text-white px-6 py-3 rounded-full hover:bg-[#444] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Invite Your First Speaker
            </button>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && event && currentOrganization?.id && (
        <SpeakerInviteModal
          eventId={eventId}
          eventName={event.name}
          organizationId={currentOrganization.id}
          organizationName={currentOrganization.name}
          inviterName={user?.displayName || user?.email || 'Event Organizer'}
          inviterId={user?.uid ?? ''}
          onClose={() => setShowInviteModal(false)}
          onInviteSent={handleInviteSent}
        />
      )}

      {/* Edit Modal */}
      {editingSpeaker && (
        <SpeakerEditModal
          speaker={editingSpeaker}
          onClose={() => setEditingSpeaker(null)}
          onSaved={(updatedSpeaker) => {
            setSpeakers((prev) =>
              prev.map((s) => (s.id === updatedSpeaker.id ? updatedSpeaker : s))
            );
            setEditingSpeaker(null);
          }}
        />
      )}
    </div>
  );
}
