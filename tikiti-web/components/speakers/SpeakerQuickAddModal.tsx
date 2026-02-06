'use client';

import { useState } from 'react';
import { speakerService } from '@/lib/services/speakerService';
import { speakerInvitationService } from '@/lib/services/speakerInvitationService';
import { Speaker, SpeakerRole } from '@/types/speaker';
import { X, Loader2, User, Mail, Briefcase, Building2, FileText, Upload } from 'lucide-react';

interface SpeakerQuickAddModalProps {
  eventId: string;
  eventName: string;
  organizationId: string;
  organizationName: string;
  createdBy: string;
  onClose: () => void;
  onSpeakerAdded: (speaker: Speaker) => void;
}

const ROLES: { value: SpeakerRole; label: string }[] = [
  { value: 'speaker', label: 'Speaker' },
  { value: 'panelist', label: 'Panelist' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'host', label: 'Host' },
];

export default function SpeakerQuickAddModal({
  eventId,
  eventName,
  organizationId,
  organizationName,
  createdBy,
  onClose,
  onSpeakerAdded,
}: SpeakerQuickAddModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [bio, setBio] = useState('');
  const [role, setRole] = useState<SpeakerRole>('speaker');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 500KB)
    if (file.size > 500 * 1024) {
      setError('Photo must be less than 500KB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoBase64(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to read image file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter the speaker name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);

      // Create speaker directly with profile_submitted status (skipping invitation flow)
      const speakerData: Omit<Speaker, 'id' | 'createdAt' | 'updatedAt'> = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        organizationId,
        status: 'active', // Directly active since organizer is adding them
        createdBy,
      };

      // Add optional fields
      if (jobTitle.trim()) speakerData.jobTitle = jobTitle.trim();
      if (company.trim()) speakerData.company = company.trim();
      if (bio.trim()) speakerData.bio = bio.trim();
      if (photoBase64) speakerData.photoBase64 = photoBase64;

      const speaker = await speakerService.create(speakerData);

      // Also create a "submitted" invitation to link the speaker to this event
      await speakerInvitationService.create({
        email: email.trim().toLowerCase(),
        speakerName: name.trim(),
        eventId,
        eventName,
        organizationId,
        organizationName,
        role,
        invitedBy: createdBy,
        inviterName: 'Event Organizer',
      });

      // Mark it as submitted immediately with the speaker ID
      const invitations = await speakerInvitationService.getByEvent(eventId);
      const thisInvitation = invitations.find(
        (inv) => inv.email === email.trim().toLowerCase() && inv.status === 'pending'
      );
      if (thisInvitation?.id) {
        await speakerInvitationService.markSubmitted(thisInvitation.id, speaker.id!);
      }

      // Return speaker with role for session assignment
      onSpeakerAdded({ ...speaker, role } as Speaker & { role: SpeakerRole });
    } catch (err: any) {
      console.error('Error adding speaker:', err);
      setError(err.message || 'Failed to add speaker. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Speaker Manually</h2>
            <p className="text-sm text-gray-500 mt-1">Add a speaker directly without sending an invitation</p>
          </div>
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

          {/* Photo Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              {photoBase64 ? (
                <img
                  src={photoBase64}
                  alt="Speaker"
                  className="w-16 h-16 rounded-xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">Max 500KB</p>
              </div>
            </div>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors"
              required
            />
          </div>

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

          {/* Job Title & Company */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Briefcase className="w-4 h-4 inline mr-1" />
                Job Title
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="CEO"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Building2 className="w-4 h-4 inline mr-1" />
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief bio about the speaker..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors resize-none"
            />
          </div>

          {/* Role */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role for this event *
            </label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    role === r.value
                      ? 'bg-[#333] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
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
                  Adding...
                </>
              ) : (
                'Add Speaker'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
