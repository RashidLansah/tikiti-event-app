import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Helper to get API key from env or .env.local file
function getAnthropicApiKey(): string | undefined {
  // First try process.env
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  // Try to read from .env.local files
  const possiblePaths = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), 'tikiti-web', '.env.local'),
    '/Users/macbook/Documents/GitHub/tikiti-event-app/tikiti-web/.env.local',
  ];

  for (const envPath of possiblePaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        const match = content.match(/ANTHROPIC_API_KEY=(.+)/);
        if (match) {
          return match[1].trim();
        }
      }
    } catch (e) {
      // Continue to next path
    }
  }

  return undefined;
}

interface RequestBody {
  eventName?: string;
  currentDescription?: string;
  eventDetails?: {
    category?: string;
    location?: string;
    date?: string;
    time?: string;
    type?: 'free' | 'paid';
    price?: number;
  };
  action: 'improve' | 'generate';
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = getAnthropicApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    const body: RequestBody = await req.json();
    const { eventName, currentDescription, eventDetails, action } = body;

    if (!eventName && !currentDescription) {
      return NextResponse.json(
        { error: 'Either event name or current description is required' },
        { status: 400 }
      );
    }

    let prompt: string;

    if (action === 'improve' && currentDescription) {
      prompt = `You are helping an event organizer improve their event description.

Event Name: ${eventName || 'Not provided'}
${eventDetails?.category ? `Category: ${eventDetails.category}` : ''}
${eventDetails?.location ? `Location: ${eventDetails.location}` : ''}
${eventDetails?.date ? `Date: ${eventDetails.date}` : ''}
${eventDetails?.time ? `Time: ${eventDetails.time}` : ''}
${eventDetails?.type ? `Type: ${eventDetails.type === 'free' ? 'Free Event' : `Paid Event${eventDetails.price ? ` - $${eventDetails.price}` : ''}`}` : ''}

Current Description:
${currentDescription}

Please rewrite and improve this event description to be more engaging, professional, and compelling. Keep the same key information but make it more appealing to potential attendees. The description should:
- Be clear and concise
- Highlight what makes this event special
- Include a call to action
- Be appropriate for the event type and category

Respond with ONLY the improved description text, no explanations or preamble.`;
    } else {
      prompt = `You are helping an event organizer create an event description.

Event Name: ${eventName}
${eventDetails?.category ? `Category: ${eventDetails.category}` : ''}
${eventDetails?.location ? `Location: ${eventDetails.location}` : ''}
${eventDetails?.date ? `Date: ${eventDetails.date}` : ''}
${eventDetails?.time ? `Time: ${eventDetails.time}` : ''}
${eventDetails?.type ? `Type: ${eventDetails.type === 'free' ? 'Free Event' : `Paid Event${eventDetails.price ? ` - $${eventDetails.price}` : ''}`}` : ''}
${currentDescription ? `\nNotes/Ideas from organizer:\n${currentDescription}` : ''}

Please write an engaging, professional event description based on the information provided. The description should:
- Be 2-4 paragraphs long
- Be clear and compelling
- Highlight what attendees can expect
- Include a call to action
- Be appropriate for the event type and category

Respond with ONLY the description text, no explanations or preamble.`;
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Anthropic API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate description' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedDescription = data.content?.[0]?.text || '';

    return NextResponse.json({
      success: true,
      description: generatedDescription.trim(),
    });
  } catch (error: any) {
    console.error('AI description error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate description' },
      { status: 500 }
    );
  }
}
