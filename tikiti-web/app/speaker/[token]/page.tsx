'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { speakerInvitationService } from '@/lib/services/speakerInvitationService';
import { speakerService } from '@/lib/services/speakerService';
import { SpeakerInvitation } from '@/types/speakerInvitation';
import { Camera, User, Briefcase, Building2, FileText, Linkedin, Twitter, Globe, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function SpeakerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [invitation, setInvitation] = useState<SpeakerInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    jobTitle: '',
    company: '',
    bio: '',
    photoBase64: '',
    linkedInUrl: '',
    twitterHandle: '',
    websiteUrl: '',
  });

  useEffect(() => {
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      const inv = await speakerInvitationService.getByToken(token);

      if (!inv) {
        setError('Invitation not found. The link may be invalid or expired.');
        return;
      }

      if (inv.status === 'submitted') {
        setSubmitted(true);
        setInvitation(inv);
        return;
      }

      if (inv.status === 'cancelled') {
        setError('This invitation has been cancelled.');
        return;
      }

      if (speakerInvitationService.isExpired(inv)) {
        setError('This invitation has expired. Please contact the organizer for a new invitation.');
        return;
      }

      setInvitation(inv);
      if (inv.speakerName) {
        setFormData((prev) => ({ ...prev, name: inv.speakerName || '' }));
      }
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (500KB max)
    if (file.size > 500 * 1024) {
      alert('Image must be less than 500KB. Please choose a smaller image or compress it.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, photoBase64: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) return;

    // Validate required fields
    if (!formData.name.trim()) {
      alert('Please enter your full name');
      return;
    }
    if (!formData.jobTitle.trim()) {
      alert('Please enter your job title');
      return;
    }
    if (!formData.bio.trim()) {
      alert('Please enter a short bio');
      return;
    }

    try {
      setSubmitting(true);

      // Check if speaker already exists for this email in the org
      let speaker = await speakerService.getByEmail(
        invitation.email,
        invitation.organizationId
      );

      if (speaker) {
        // Update existing speaker profile
        await speakerService.updateProfile(speaker.id!, {
          name: formData.name.trim(),
          jobTitle: formData.jobTitle.trim(),
          company: formData.company.trim() || undefined,
          bio: formData.bio.trim(),
          photoBase64: formData.photoBase64 || undefined,
          linkedInUrl: formData.linkedInUrl.trim() || undefined,
          twitterHandle: formData.twitterHandle.trim() || undefined,
          websiteUrl: formData.websiteUrl.trim() || undefined,
        });
      } else {
        // Create new speaker
        speaker = await speakerService.create({
          name: formData.name.trim(),
          email: invitation.email,
          jobTitle: formData.jobTitle.trim(),
          company: formData.company.trim() || undefined,
          bio: formData.bio.trim(),
          photoBase64: formData.photoBase64 || undefined,
          linkedInUrl: formData.linkedInUrl.trim() || undefined,
          twitterHandle: formData.twitterHandle.trim() || undefined,
          websiteUrl: formData.websiteUrl.trim() || undefined,
          organizationId: invitation.organizationId,
          status: 'profile_submitted',
          createdBy: invitation.invitedBy,
        });
      }

      // Mark invitation as submitted
      await speakerInvitationService.markSubmitted(invitation.id!, speaker.id!);

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting profile:', err);
      alert('Failed to submit profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fefff7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#333] mx-auto" />
          <p className="mt-4 text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fefff7] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#fefff7] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-sm border border-gray-100">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Submitted!</h1>
          <p className="text-gray-600 mb-4">
            Thank you for completing your speaker profile for <strong>{invitation?.eventName}</strong>.
          </p>
          <p className="text-sm text-gray-500">
            The event organizers will be in touch with more details about your session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fefff7] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block w-12 h-12 bg-[#333] rounded-xl text-white font-bold text-lg leading-[48px] mb-4">
            TK
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Complete Your Speaker Profile</h1>
          <p className="text-gray-600 mt-2">
            You've been invited to be a <span className="font-semibold capitalize">{invitation?.role}</span> at
          </p>
          <p className="text-lg font-semibold text-gray-900">{invitation?.eventName}</p>
          {invitation?.sessionTitle && (
            <p className="text-sm text-gray-500 mt-1">Session: {invitation.sessionTitle}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          {/* Photo Upload */}
          <div className="flex flex-col items-center mb-8">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden"
            >
              {formData.photoBase64 ? (
                <img
                  src={formData.photoBase64}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto" />
                  <span className="text-xs text-gray-500 mt-1 block">Add Photo</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">Max 500KB (JPG, PNG)</p>
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors"
              required
            />
          </div>

          {/* Job Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Briefcase className="w-4 h-4 inline mr-1" />
              Job Title *
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))}
              placeholder="Senior Software Engineer"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors"
              required
            />
          </div>

          {/* Company */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="w-4 h-4 inline mr-1" />
              Company / Organization
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
              placeholder="Acme Inc."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors"
            />
          </div>

          {/* Bio */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              Short Bio * <span className="text-gray-400 font-normal">({formData.bio.length}/500)</span>
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => {
                if (e.target.value.length <= 500) {
                  setFormData((prev) => ({ ...prev, bio: e.target.value }));
                }
              }}
              placeholder="Tell attendees a bit about yourself, your expertise, and what you'll be sharing..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors resize-none"
              required
            />
          </div>

          {/* Social Links */}
          <div className="border-t border-gray-100 pt-6 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Social Links (Optional)</h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Linkedin className="w-5 h-5 text-[#0077b5]" />
                <input
                  type="url"
                  value={formData.linkedInUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, linkedInUrl: e.target.value }))}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <Twitter className="w-5 h-5 text-[#1da1f2]" />
                <input
                  type="text"
                  value={formData.twitterHandle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, twitterHandle: e.target.value }))}
                  placeholder="@yourhandle"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                  placeholder="https://yourwebsite.com"
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#333] text-white py-4 rounded-full font-semibold text-lg hover:bg-[#444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Profile'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Powered by Tikiti Events
        </p>
      </div>
    </div>
  );
}
