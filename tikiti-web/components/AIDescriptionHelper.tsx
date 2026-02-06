'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw, Wand2 } from 'lucide-react';

interface EventDetails {
  category?: string;
  location?: string;
  date?: string;
  time?: string;
  type?: 'free' | 'paid';
  price?: number;
}

interface AIDescriptionHelperProps {
  eventName: string;
  currentDescription: string;
  eventDetails?: EventDetails;
  onDescriptionGenerated: (description: string) => void;
}

export function AIDescriptionHelper({
  eventName,
  currentDescription,
  eventDetails,
  onDescriptionGenerated,
}: AIDescriptionHelperProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDescription = async (action: 'improve' | 'generate') => {
    if (action === 'generate' && !eventName.trim()) {
      setError('Please enter an event name first');
      return;
    }

    if (action === 'improve' && !currentDescription.trim()) {
      setError('Please enter a description to improve');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventName,
          currentDescription,
          eventDetails,
          action,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate description');
      }

      if (data.success && data.description) {
        onDescriptionGenerated(data.description);
      } else {
        throw new Error('No description generated');
      }
    } catch (err: any) {
      console.error('AI generation error:', err);
      setError(err.message || 'Failed to generate description');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => generateDescription('generate')}
          disabled={isGenerating || !eventName.trim()}
          className="text-xs"
        >
          {isGenerating ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Wand2 className="h-3 w-3 mr-1" />
          )}
          Generate with AI
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => generateDescription('improve')}
          disabled={isGenerating || !currentDescription.trim()}
          className="text-xs"
        >
          {isGenerating ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3 mr-1" />
          )}
          Improve with AI
        </Button>
      </div>

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      <p className="text-xs text-gray-500">
        AI can generate a description based on your event details, or improve your existing description.
      </p>
    </div>
  );
}
