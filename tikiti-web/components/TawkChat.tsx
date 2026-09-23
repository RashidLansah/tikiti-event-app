'use client';
// tawk.to live-chat widget. Hidden on ticket pages (/t/…) so it never covers the QR code, and on API-less print views.
import Script from 'next/script';
import { usePathname } from 'next/navigation';

const TAWK_SRC = 'https://embed.tawk.to/6ab3db01dce7f83441669153/1k378v0cg';

export default function TawkChat() {
  const path = usePathname() || '';
  if (path.startsWith('/t/') || path.startsWith('/unsubscribe')) return null;
  return (
    <Script id="tawk-to" strategy="lazyOnload">
      {`var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;s1.src='${TAWK_SRC}';s1.charset='UTF-8';s1.setAttribute('crossorigin','*');s0.parentNode.insertBefore(s1,s0);})();`}
    </Script>
  );
}
