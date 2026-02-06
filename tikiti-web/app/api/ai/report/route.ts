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

interface EventReportData {
  event: {
    name: string;
    description: string;
    date: string;
    time: string;
    location: string;
    category: string;
    type: 'free' | 'paid';
    price?: number;
    totalTickets: number;
    soldTickets: number;
    availableTickets: number;
    status: string;
  };
  attendees: {
    total: number;
    confirmed: number;
    cancelled: number;
    waitlisted: number;
    registrationsByDay: { date: string; count: number }[];
    ticketTypes: { type: string; count: number }[];
  };
  engagement?: {
    quizzes: {
      total: number;
      totalResponses: number;
      averageScore?: number;
    };
    polls: {
      total: number;
      totalResponses: number;
    };
  };
  surveys?: {
    total: number;
    totalResponses: number;
    averageNPS?: number;
    topFeedback?: string[];
  };
  revenue?: {
    total: number;
    average: number;
  };
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

    const body: { reportData: EventReportData } = await req.json();
    const { reportData } = body;

    if (!reportData || !reportData.event) {
      return NextResponse.json(
        { error: 'Event report data is required' },
        { status: 400 }
      );
    }

    const { event, attendees, engagement, surveys, revenue } = reportData;

    // Calculate key metrics
    const ticketSalesRate = event.totalTickets > 0
      ? ((event.soldTickets / event.totalTickets) * 100).toFixed(1)
      : '0';

    const cancellationRate = attendees.total > 0
      ? ((attendees.cancelled / attendees.total) * 100).toFixed(1)
      : '0';

    const prompt = `You are an expert event analytics consultant. Generate a comprehensive, professional event report based on the following data.

EVENT DETAILS:
- Name: ${event.name}
- Description: ${event.description}
- Date: ${event.date} at ${event.time}
- Location: ${event.location}
- Category: ${event.category}
- Type: ${event.type === 'free' ? 'Free Event' : `Paid Event (${event.price ? `$${event.price}/ticket` : 'Price varies'})`}
- Status: ${event.status}

TICKET PERFORMANCE:
- Total Capacity: ${event.totalTickets} tickets
- Tickets Sold: ${event.soldTickets}
- Available: ${event.availableTickets}
- Sales Rate: ${ticketSalesRate}%

ATTENDEE METRICS:
- Total Registrations: ${attendees.total}
- Confirmed: ${attendees.confirmed}
- Cancelled: ${attendees.cancelled}
- Waitlisted: ${attendees.waitlisted}
- Cancellation Rate: ${cancellationRate}%
- Registration Timeline: ${JSON.stringify(attendees.registrationsByDay)}

${revenue ? `REVENUE:
- Total Revenue: $${revenue.total.toFixed(2)}
- Average per Attendee: $${revenue.average.toFixed(2)}` : ''}

${engagement ? `ENGAGEMENT METRICS:
- Quizzes Created: ${engagement.quizzes.total}
- Quiz Responses: ${engagement.quizzes.totalResponses}
${engagement.quizzes.averageScore ? `- Average Quiz Score: ${engagement.quizzes.averageScore}%` : ''}
- Polls Created: ${engagement.polls.total}
- Poll Responses: ${engagement.polls.totalResponses}` : ''}

${surveys ? `SURVEY & FEEDBACK:
- Surveys Created: ${surveys.total}
- Survey Responses: ${surveys.totalResponses}
${surveys.averageNPS !== undefined ? `- Average NPS Score: ${surveys.averageNPS}/10` : ''}
${surveys.topFeedback?.length ? `- Sample Feedback: ${surveys.topFeedback.slice(0, 3).join('; ')}` : ''}` : ''}

Please generate a detailed report with the following sections. Use markdown formatting:

## Executive Summary
A 2-3 sentence overview of event performance.

## Key Performance Indicators
List 4-5 most important metrics with brief analysis.

## Attendance Analysis
Analyze registration patterns, cancellation rates, and attendee behavior.

## ${event.type === 'paid' ? 'Revenue Analysis' : 'Registration Analysis'}
${event.type === 'paid' ? 'Analyze revenue performance and ticket sales trends.' : 'Analyze registration trends and capacity utilization.'}

${engagement ? `## Engagement Insights
Analyze quiz and poll participation rates and what they indicate about attendee engagement.` : ''}

${surveys ? `## Feedback Summary
Summarize survey results and key takeaways from attendee feedback.` : ''}

## Recommendations
Provide 3-5 actionable recommendations for future events based on the data.

## Overall Assessment
Give an overall grade (A-F) and final thoughts on event success.

Be specific with numbers and percentages. Highlight both strengths and areas for improvement. Keep the tone professional but accessible.`;

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 4096,
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
        { error: 'Failed to generate report' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedReport = data.content?.[0]?.text || '';

    return NextResponse.json({
      success: true,
      report: generatedReport.trim(),
    });
  } catch (error: any) {
    console.error('AI report error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}
