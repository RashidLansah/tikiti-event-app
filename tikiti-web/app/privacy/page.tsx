import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - Tikiti',
  description: 'Privacy Policy for Tikiti event management platform.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center gap-4">
          <Link
            href="/"
            className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-white/40 text-sm mb-12">Effective Date: February 2025</p>

        <div className="space-y-10 text-white/70 leading-relaxed">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Introduction</h2>
            <p>
              Tikiti (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy.
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information
              when you use our mobile application and related services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Information We Collect</h2>

            <h3 className="text-base font-medium text-white/90 mb-2 mt-4">Personal Information</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="text-white/90 font-medium">Account Information:</span> Name, email address, phone number</li>
              <li><span className="text-white/90 font-medium">Profile Information:</span> Profile photos, preferences</li>
              <li><span className="text-white/90 font-medium">Event Information:</span> Events you create, attend, or show interest in</li>
              <li><span className="text-white/90 font-medium">Payment Information:</span> Processed securely through third-party payment processors</li>
            </ul>

            <h3 className="text-base font-medium text-white/90 mb-2 mt-4">Automatically Collected Information</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="text-white/90 font-medium">Device Information:</span> Device type, operating system, unique device identifiers</li>
              <li><span className="text-white/90 font-medium">Usage Information:</span> App features used, time spent in app, crash logs</li>
              <li><span className="text-white/90 font-medium">Location Information:</span> General location for event recommendations (with permission)</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="text-white/90 font-medium">Service Provision:</span> To provide and maintain our event platform services</li>
              <li><span className="text-white/90 font-medium">Communication:</span> To send you event updates, notifications, and support messages</li>
              <li><span className="text-white/90 font-medium">Improvement:</span> To analyze usage patterns and improve our app</li>
              <li><span className="text-white/90 font-medium">Security:</span> To detect and prevent fraud and ensure platform security</li>
              <li><span className="text-white/90 font-medium">Legal Compliance:</span> To comply with applicable laws and regulations</li>
            </ul>
          </section>

          {/* Information Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Information Sharing</h2>
            <p className="mb-3">We do not sell your personal information. We may share information in these situations:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="text-white/90 font-medium">Event Organizers:</span> Basic attendee information for events you register for</li>
              <li><span className="text-white/90 font-medium">Service Providers:</span> Third-party services that help us operate our platform</li>
              <li><span className="text-white/90 font-medium">Legal Requirements:</span> When required by law or to protect our rights</li>
              <li><span className="text-white/90 font-medium">Business Transfers:</span> In connection with mergers or acquisitions</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Security</h2>
            <p className="mb-3">We implement appropriate security measures to protect your information, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Secure data centers and infrastructure</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Your Rights</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of marketing communications</li>
              <li>Request data portability</li>
            </ul>
            <p className="mt-3">
              To delete your account, visit{' '}
              <Link href="/account/delete" className="text-orange-400 hover:text-orange-300 underline">
                gettikiti.com/account/delete
              </Link>.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Retention</h2>
            <p>
              We retain your information for as long as necessary to provide our services and comply
              with legal obligations. You may request deletion of your account at any time.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Children&apos;s Privacy</h2>
            <p>
              Our service is not intended for children under 13. We do not knowingly collect personal
              information from children under 13.
            </p>
          </section>

          {/* International Data Transfers */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place.
            </p>
          </section>

          {/* Changes to This Policy */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material
              changes through the app or via email.
            </p>
          </section>

          {/* Contact Us */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:support@gettikiti.com" className="text-orange-400 hover:text-orange-300 underline">
                support@gettikiti.com
              </a>.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/10 text-center text-white/30 text-sm">
          <p>&copy; {new Date().getFullYear()} Tikiti. All rights reserved.</p>
        </div>
      </main>
    </div>
  );
}
