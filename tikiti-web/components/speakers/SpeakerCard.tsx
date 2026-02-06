'use client';

import { Speaker } from '@/types/speaker';
import { User, Briefcase, Building2, Edit2, Linkedin, Twitter, Globe } from 'lucide-react';

interface SpeakerCardProps {
  speaker: Speaker;
  onEdit?: () => void;
  compact?: boolean;
}

export default function SpeakerCard({ speaker, onEdit, compact = false }: SpeakerCardProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-2">
        {speaker.photoBase64 ? (
          <img
            src={speaker.photoBase64}
            alt={speaker.name}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">{speaker.name}</p>
          <p className="text-sm text-gray-500 truncate">
            {speaker.jobTitle}
            {speaker.company && ` at ${speaker.company}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4">
        {/* Photo */}
        {speaker.photoBase64 ? (
          <img
            src={speaker.photoBase64}
            alt={speaker.name}
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <User className="w-8 h-8 text-gray-400" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{speaker.name}</h3>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Briefcase className="w-3 h-3" />
                {speaker.jobTitle}
              </p>
              {speaker.company && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {speaker.company}
                </p>
              )}
            </div>
            {onEdit && (
              <button
                onClick={onEdit}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Edit speaker"
              >
                <Edit2 className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          {/* Bio */}
          {speaker.bio && (
            <p className="text-sm text-gray-600 mt-2 line-clamp-2">{speaker.bio}</p>
          )}

          {/* Social Links */}
          <div className="flex items-center gap-2 mt-3">
            {speaker.linkedInUrl && (
              <a
                href={speaker.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4 text-[#0077b5]" />
              </a>
            )}
            {speaker.twitterHandle && (
              <a
                href={`https://twitter.com/${speaker.twitterHandle.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Twitter"
              >
                <Twitter className="w-4 h-4 text-[#1da1f2]" />
              </a>
            )}
            {speaker.websiteUrl && (
              <a
                href={speaker.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title="Website"
              >
                <Globe className="w-4 h-4 text-gray-500" />
              </a>
            )}
          </div>

          {/* Status Badge */}
          <div className="mt-3">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                speaker.status === 'active'
                  ? 'bg-green-100 text-green-700'
                  : speaker.status === 'profile_submitted'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {speaker.status === 'active'
                ? 'Active'
                : speaker.status === 'profile_submitted'
                ? 'Profile Submitted'
                : 'Invited'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
