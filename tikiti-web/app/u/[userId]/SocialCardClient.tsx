'use client';

import type { UserSocialCardData } from '@/lib/firebase/rest-api';

interface SocialCardClientProps {
  userData: UserSocialCardData;
}

function getInitials(userData: UserSocialCardData): string {
  if (userData.firstName && userData.lastName) {
    return `${userData.firstName[0]}${userData.lastName[0]}`.toUpperCase();
  }
  if (userData.displayName) {
    const parts = userData.displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
  return '?';
}

function getDisplayName(userData: UserSocialCardData): string {
  return (
    userData.displayName
    || [userData.firstName, userData.lastName].filter(Boolean).join(' ')
    || 'Tikiti User'
  );
}

/** Instagram icon SVG */
function InstagramIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** X / Twitter icon SVG */
function XTwitterIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** LinkedIn icon SVG */
function LinkedInIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

/** Phone icon SVG */
function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

/** Arrow right icon SVG */
function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

interface SocialLinkButtonProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  username: string;
  color: string;
}

function SocialLinkButton({ href, icon, label, username, color }: SocialLinkButtonProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/20 active:scale-[0.98] transition-all duration-150"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: color }}
      >
        <span className="text-white">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white/60 text-xs font-medium">{label}</p>
        <p className="text-white text-sm font-semibold truncate">{username}</p>
      </div>
      <span className="text-white/40 shrink-0">
        <ArrowRightIcon />
      </span>
    </a>
  );
}

export default function SocialCardClient({ userData }: SocialCardClientProps) {
  const initials = getInitials(userData);
  const displayName = getDisplayName(userData);
  const links = userData.socialLinks;

  const hasSocialLinks = links && (
    links.instagram || links.twitter || links.linkedin || links.phone
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4f46e5] via-[#6366f1] to-[#818cf8] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center mb-5 shadow-lg">
            <span className="text-3xl font-bold text-white">{initials}</span>
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold text-white text-center mb-1">
            {displayName}
          </h1>
          <p className="text-white/60 text-sm font-medium mb-8">on Tikiti</p>

          {/* Social links */}
          {hasSocialLinks ? (
            <div className="w-full flex flex-col gap-3 mb-8">
              {links.instagram && (
                <SocialLinkButton
                  href={`https://instagram.com/${links.instagram.replace(/^@/, '')}`}
                  icon={<InstagramIcon />}
                  label="Instagram"
                  username={`@${links.instagram.replace(/^@/, '')}`}
                  color="#E1306C"
                />
              )}

              {links.twitter && (
                <SocialLinkButton
                  href={`https://x.com/${links.twitter.replace(/^@/, '')}`}
                  icon={<XTwitterIcon />}
                  label="X / Twitter"
                  username={`@${links.twitter.replace(/^@/, '')}`}
                  color="#000000"
                />
              )}

              {links.linkedin && (
                <SocialLinkButton
                  href={`https://linkedin.com/in/${links.linkedin}`}
                  icon={<LinkedInIcon />}
                  label="LinkedIn"
                  username={links.linkedin}
                  color="#0A66C2"
                />
              )}

              {links.phone && (
                <SocialLinkButton
                  href={`tel:${links.phone}`}
                  icon={<PhoneIcon />}
                  label="Phone"
                  username={links.phone}
                  color="#22C55E"
                />
              )}
            </div>
          ) : (
            <div className="w-full text-center py-8 mb-8">
              <p className="text-white/50 text-sm">
                No social links added yet.
              </p>
            </div>
          )}

          {/* Get Tikiti CTA */}
          <a
            href="https://gettikiti.com/download"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white text-[#4f46e5] font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-150"
          >
            Get Tikiti
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17l9.2-9.2M17 17V7.8H7.8" />
            </svg>
          </a>

          {/* Footer */}
          <p className="text-white/30 text-xs mt-6 text-center">
            Powered by Tikiti
          </p>
        </div>
      </div>
    </div>
  );
}
