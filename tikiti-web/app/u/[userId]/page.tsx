import { Metadata } from 'next';
import { fetchUserSocialCard } from '@/lib/firebase/rest-api';
import SocialCardClient from './SocialCardClient';
import Link from 'next/link';

// Revalidate every 5 minutes (ISR)
export const revalidate = 300;

const BASE_URL = 'https://gettikiti.com';

type Props = {
  params: Promise<{ userId: string }>;
};

/**
 * Generate dynamic OG meta tags for social card sharing.
 * When someone scans a user's QR code, link previews show their name and socials.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const userData = await fetchUserSocialCard(userId);

  if (!userData) {
    return {
      title: 'User Not Found - Tikiti',
      description: 'This user could not be found on Tikiti.',
    };
  }

  const name = userData.displayName
    || [userData.firstName, userData.lastName].filter(Boolean).join(' ')
    || 'Tikiti User';

  // Build description from available social links
  const socialParts: string[] = [];
  if (userData.socialLinks?.instagram) socialParts.push('Instagram');
  if (userData.socialLinks?.twitter) socialParts.push('X/Twitter');
  if (userData.socialLinks?.linkedin) socialParts.push('LinkedIn');
  if (userData.socialLinks?.phone) socialParts.push('Phone');

  const description = socialParts.length > 0
    ? `Connect with ${name} on ${socialParts.join(', ')}`
    : `Connect with ${name} on Tikiti`;

  return {
    title: `Connect with ${name} on Tikiti`,
    description,
    openGraph: {
      title: `Connect with ${name} on Tikiti`,
      description,
      type: 'profile',
      url: `${BASE_URL}/u/${userId}`,
      siteName: 'Tikiti',
      images: [
        {
          url: `${BASE_URL}/favicon.png`,
          width: 512,
          height: 512,
          alt: `${name} on Tikiti`,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: `Connect with ${name} on Tikiti`,
      description,
      images: [`${BASE_URL}/favicon.png`],
    },
  };
}

/**
 * Social card page — server component that fetches user data and renders the client card.
 * This page is shown when someone scans a user's QR code.
 */
export default async function UserSocialCardPage({ params }: Props) {
  const { userId } = await params;
  const userData = await fetchUserSocialCard(userId);

  if (!userData) {
    return (
      <div className="min-h-screen bg-[#fefff7] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M20 21a8 8 0 1 0-16 0" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h1>
          <p className="text-gray-500 mb-8">
            This profile could not be found. The link may be outdated or the user may have removed their account.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#333] px-6 py-3 rounded-full hover:bg-[#1a1a1a] transition-colors"
          >
            Go to Tikiti
          </Link>
        </div>
      </div>
    );
  }

  return <SocialCardClient userData={userData} />;
}
