export default function PayDone({ searchParams }: { searchParams: { reference?: string; trxref?: string } }) {
  const reference = searchParams.reference || searchParams.trxref || '';
  const deepLink = `tikiti://pay/done?reference=${encodeURIComponent(reference)}`;
  return (
    <html>
      <head>
        <meta httpEquiv="refresh" content={`0;url=${deepLink}`} />
        <title>Returning to Tikiti…</title>
      </head>
      <body style={{ fontFamily: 'system-ui', background: '#faf9f2', color: '#202220', display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, margin: '0 0 8px' }}>Payment received.</h1>
          <p style={{ color: '#65675d' }}>Taking you back to Tikiti…</p>
          <a href={deepLink} style={{ display: 'inline-block', marginTop: 18, background: '#f44929', color: '#fff', padding: '12px 22px', borderRadius: 40, textDecoration: 'none', fontWeight: 700 }}>Open Tikiti</a>
        </div>
      </body>
    </html>
  );
}
