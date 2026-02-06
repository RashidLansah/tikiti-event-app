'use client';

import { Speaker } from '@/types/speaker';
import SpeakerCard from './SpeakerCard';
import { Users } from 'lucide-react';

interface SpeakerListProps {
  speakers: Speaker[];
  onEdit?: (speaker: Speaker) => void;
  compact?: boolean;
  emptyMessage?: string;
}

export default function SpeakerList({
  speakers,
  onEdit,
  compact = false,
  emptyMessage = 'No speakers yet',
}: SpeakerListProps) {
  if (speakers.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="divide-y divide-gray-100">
        {speakers.map((speaker) => (
          <SpeakerCard
            key={speaker.id}
            speaker={speaker}
            compact
            onEdit={onEdit ? () => onEdit(speaker) : undefined}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {speakers.map((speaker) => (
        <SpeakerCard
          key={speaker.id}
          speaker={speaker}
          onEdit={onEdit ? () => onEdit(speaker) : undefined}
        />
      ))}
    </div>
  );
}
