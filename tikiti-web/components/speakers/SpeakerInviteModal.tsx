'use client';

import { useState } from 'react';
import { speakerInvitationService } from '@/lib/services/speakerInvitationService';
import { SpeakerInvitation } from '@/types/speakerInvitation';
import { SpeakerRole } from '@/types/speaker';
import { X, Loader2, Mail, User, MessageSquare } from 'lucide-react';

interface SpeakerInviteModalProps {
  eventId: string;
  eventName: string;
  organizationId: string;
  organizationName: string;
  inviterName: string;
  inviterId: string;
  sessionId?: string;
  sessionTitle?: string;
  onClose: () => void;
  onInviteSent: (invitation: SpeakerInvitation) => void;
}

const ROLES: { value: SpeakerRole; label: string; description: string }[] = [
  { value: 'speaker', label: 'Speaker', description: 'Delivers a presentation or talk' },
  { value: 'panelist', label: 'Panelist', description: 'Participates in a panel discussion' },
  { value: 'moderator', label: 'Moderator', description: 'Facilitates discussions and Q&A' },
  { value: 'host', label: 'Host', description: 'Hosts or emcees the event/session' },
];

export default function SpeakerInviteModal({
  eventId,
  eventName,
  organizationId,
  organizationName,
  inviterName,
  inviterId,
  sessionId,
  sessionTitle,
  onClose,
  onInviteSent,
}: SpeakerInviteModalProps) {
  const [email, setEmail] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [role, setRole] = useState<SpeakerRole>('speaker');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);

      // Create invitation
      const invitation = await speakerInvitationService.create({
        email: email.trim(),
        speakerName: speakerName.trim() || undefined,
        eventId,
        eventName,
        sessionId,
        sessionTitle,
        organizationId,
        organizationName,
        role,
        invitedBy: inviterId,
        inviterName,
        message: message.trim() || undefined,
      });

      // Send email
      const emailResponse = await fetch('/api/email/speaker-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: invitation.email,
          speakerName: invitation.speakerName,
          eventName,
          sessionTitle,
          organizationName,
          inviterName,
          role,
          inviteToken: invitation.token,
          personalMessage: invitation.message,
        }),
      });

      if (!emailResponse.ok) {
        throw new Error('Failed to send invitation email');
      }

      onInviteSent(invitation);
    } catch (err: any) {
      console.error('Error sending invitation:', err);
      setError(err.message || 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Invite Speaker</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="speaker@example.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors"
              required
            />
          </div>

          {/* Name (optional) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Speaker Name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Pre-fill the speaker's name for a more personalized invitation
            </p>
          </div>

          {/* Role */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    role === r.value
                      ? 'border-[#333] bg-[#333]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-medium text-gray-900">{r.label}</p>
                  <p className="text-xs text-gray-500">{r.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Personal Message (optional) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Personal Message <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal note to your invitation..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors resize-none"
            />
          </div>

          {/* Event Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-600">
              <strong>Event:</strong> {eventName}
            </p>
            {sessionTitle && (
              <p className="text-sm text-gray-600 mt-1">
                <strong>Session:</strong> {sessionTitle}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-full border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-full bg-[#333] text-white font-medium hover:bg-[#444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
