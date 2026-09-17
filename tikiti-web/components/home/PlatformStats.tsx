import { getPlatformStats } from '@/lib/stats/platformStats';
import CountUp from './CountUp';

export default async function PlatformStats() {
  let stats;
  try {
    stats = await getPlatformStats();
  } catch (error) {
    console.error('PlatformStats: failed to load', error);
    return null;
  }

  const items = [
    { label: 'Events listed', value: stats.eventsListed },
    { label: 'People served', value: stats.peopleServed },
    { label: 'Organisers', value: stats.organisers },
    { label: 'Cities', value: stats.cities },
  ].filter(i => i.value > 0);

  if (items.length === 0) return null;

  return (
    <section className="pg-stats" aria-label="Platform stats">
      <style>{`
        .pg-stats {
          margin: 0 5%;
          padding: 40px 0;
          border-bottom: 1px solid var(--pg-line);
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }
        .pg-stat { text-align: center; }
        .pg-stat b {
          display: block;
          font-family: var(--pg-display);
          font-size: clamp(56px, 7vw, 96px);
          font-weight: 800;
          line-height: 0.9;
          letter-spacing: -2px;
          color: var(--pg-fg);
          font-variant-numeric: tabular-nums;
        }
        .pg-stat:nth-child(2n) b { color: var(--pg-accent); }
        .pg-stat small {
          display: block;
          margin-top: 10px;
          font-size: 11px;
          letter-spacing: 1.7px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--pg-muted);
        }
        @media (max-width: 768px) {
          .pg-stats { grid-template-columns: repeat(2, 1fr); gap: 28px 12px; padding: 32px 0; }
          .pg-stat b { font-size: clamp(48px, 14vw, 64px); }
        }
      `}</style>
      {items.map(item => (
        <div className="pg-stat" key={item.label}>
          <b><CountUp value={item.value} /></b>
          <small>{item.label}</small>
        </div>
      ))}
    </section>
  );
}
