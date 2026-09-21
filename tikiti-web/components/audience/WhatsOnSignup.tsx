'use client';

import SubscribeForm, { useSubscribed } from './SubscribeForm';

const CSS = `
  .tk-whatson { background: #faf9f2; color: #202220; border-top: 1px solid #deded4; padding: 64px 5%; font-family: 'DM Sans', Arial, sans-serif; }
  .tk-whatson-inner { max-width: 1440px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: 48px; align-items: start; }
  .tk-whatson-eyebrow { font-size: 11px; letter-spacing: 1.5px; font-weight: 600; color: #65675d; }
  .tk-whatson h2 { font-family: 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif; font-size: clamp(44px, 6vw, 80px); font-weight: 800; line-height: 0.92; letter-spacing: -1px; text-transform: uppercase; margin: 14px 0 18px; overflow-wrap: anywhere; }
  .tk-whatson-sub { font-size: 16px; line-height: 1.6; color: #65675d; max-width: 420px; }
  @media (max-width: 900px) {
    .tk-whatson { padding: 48px 5%; }
    .tk-whatson-inner { grid-template-columns: minmax(0, 1fr); gap: 28px; }
  }
`;

/** Weekly what's-on signup band. Hidden once the visitor has subscribed. */
export default function WhatsOnSignup() {
  const subscribed = useSubscribed();
  if (subscribed) return null;
  return (
    <section className="tk-whatson" aria-labelledby="tk-whatson-title">
      <style>{CSS}</style>
      <div className="tk-whatson-inner">
        <div>
          <span className="tk-whatson-eyebrow">FREE · ONCE A WEEK</span>
          <h2 id="tk-whatson-title">The weekly what&apos;s on.</h2>
          <p className="tk-whatson-sub">A short list of events worth your time, matched to what you like.</p>
        </div>
        <SubscribeForm
          fields={{ name: true, phone: true, email: true, city: true, interests: true }}
          source="web_signup"
          submitLabel="Send me the list"
        />
      </div>
    </section>
  );
}
