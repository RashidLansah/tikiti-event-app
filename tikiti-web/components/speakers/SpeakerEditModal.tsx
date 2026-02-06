'use client';

import { useState, useRef } from 'react';
import { speakerService } from '@/lib/services/speakerService';
import { Speaker } from '@/types/speaker';
import { X, Loader2, Camera, User, Briefcase, Building2, FileText, Linkedin, Twitter, Globe } from 'lucide-react';

interface SpeakerEditModalProps {
  speaker: Speaker;
  onClose: () => void;
  onSaved: (speaker: Speaker) => void;
}

export default function SpeakerEditModal({
  speaker,
  onClose,
  onSaved,
}: SpeakerEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: speaker.name || '',
    jobTitle: speaker.jobTitle || '',
    company: speaker.company || '',
    bio: speaker.bio || '',
    photoBase64: speaker.photoBase64 || '',
    linkedInUrl: speaker.linkedInUrl || '',
    twitterHandle: speaker.twitterHandle || '',
    websiteUrl: speaker.websiteUrl || '',
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 500 * 1024) {
      alert('Image must be less than 500KB');
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
    setError(null);

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setLoading(true);

      // Build update data, only including fields that have values
      const updateData: Record<string, any> = {
        name: formData.name.trim(),
      };

      if (formData.jobTitle.trim()) updateData.jobTitle = formData.jobTitle.trim();
      if (formData.company.trim()) updateData.company = formData.company.trim();
      if (formData.bio.trim()) updateData.bio = formData.bio.trim();
      if (formData.photoBase64) updateData.photoBase64 = formData.photoBase64;
      if (formData.linkedInUrl.trim()) updateData.linkedInUrl = formData.linkedInUrl.trim();
      if (formData.twitterHandle.trim()) updateData.twitterHandle = formData.twitterHandle.trim();
      if (formData.websiteUrl.trim()) updateData.websiteUrl = formData.websiteUrl.trim();

      await speakerService.update(speaker.id!, updateData);

      onSaved({ ...speaker, ...updateData });
    } catch (err: any) {
      console.error('Error updating speaker:', err);
      setError(err.message || 'Failed to update speaker');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Edit Speaker</h2>
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
          <div className="flex flex-col items-center mb-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden"
            >
              {formData.photoBase64 ? (
                <img
                  src={formData.photoBase64}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">Click to change photo</p>
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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors"
              required
            />
          </div>

          {/* Job Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Briefcase className="w-4 h-4 inline mr-1" />
              Job Title
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors"
            />
          </div>

          {/* Company */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Building2 className="w-4 h-4 inline mr-1" />
              Company
            </label>
            <input
              type="text"
              value={formData.company}
              onChange={(e) => setFormData((prev) => ({ ...prev, company: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors"
            />
          </div>

          {/* Bio */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none transition-colors resize-none"
            />
          </div>

          {/* Social Links */}
          <div className="border-t border-gray-100 pt-4 mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Social Links</h3>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Linkedin className="w-5 h-5 text-[#0077b5]" />
                <input
                  type="url"
                  value={formData.linkedInUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, linkedInUrl: e.target.value }))}
                  placeholder="LinkedIn URL"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <Twitter className="w-5 h-5 text-[#1da1f2]" />
                <input
                  type="text"
                  value={formData.twitterHandle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, twitterHandle: e.target.value }))}
                  placeholder="@handle"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, websiteUrl: e.target.value }))}
                  placeholder="Website URL"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 focus:border-[#333] focus:ring-1 focus:ring-[#333] outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
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
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
