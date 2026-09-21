'use client';

import SubscribeForm, { useSubscribed } from './SubscribeForm';

const CSS = `
  .tk-like { margin-top: 28px; padding: 22px; background: #faf9f2; border: 1px solid #deded4; border-radius: 12px; color: #202220; font-family: 'DM Sans', Arial, sans-serif; min-width: 0; }
  .tk-like h3 { font-family: 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif; font-size: 28px; font-weight: 700; line-height: 1; text-transform: uppercase; letter-spacing: -0.3px; }
  .tk-like > p { font-size: 13px; line-height: 1.5; color: #65675d; margin: 8px 0 16px; }
`;

/** "Get events like this" prompt for external/community event pages. Hidden once subscribed. */
export default function EventsLikeThis({ eventId }: { eventId: string }) {
  const subscribed = useSubscribed();
  if (subscribed) return null;
  return (
    <div className="tk-like">
      <style>{CSS}</style>
      <h3>Get events like this</h3>
      <p>We&apos;ll send a few that match — free, and you can stop anytime.</p>
      <SubscribeForm
        compact
        fields={{ phone: true, name: true }}
        source="web_event_prompt"
        eventId={eventId}
        defaultChannels={['whatsapp', 'sms']}
        submitLabel="Send me events"
      />
    </div>
  );
}
