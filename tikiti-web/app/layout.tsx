import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "Tikiti — Free Event Management Platform",
  description: "Tikiti is a free event management platform. Create events, manage attendees, send QR tickets, track check-ins, and view analytics. 100% free for event organizers.",
  keywords: [
    "free event management platform",
    "event management software",
    "event organizer tool",
    "event ticketing platform",
    "free event ticketing",
    "QR code tickets",
    "event check-in app",
    "event registration",
    "event analytics",
    "manage event attendees",
    "event dashboard",
    "create events online",
    "event management app",
    "free event platform",
    "event organizer software",
    "attendee management",
    "event messaging",
    "digital event tickets",
    "event management tool free",
    "Tikiti",
  ],
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  metadataBase: new URL('https://gettikiti.com'),
  openGraph: {
    title: "Tikiti — Free Event Management Platform",
    description: "Create events, manage attendees, send QR tickets, and track analytics — completely free. Tikiti is the modern event platform built for organizers.",
    type: "website",
    url: "https://gettikiti.com",
    siteName: "Tikiti",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Tikiti — Free Event Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tikiti — Free Event Management Platform",
    description: "Create events, manage attendees, send QR tickets, and track analytics — completely free.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://gettikiti.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={plusJakarta.className}>
        <ReactQueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
