import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support - Tikiti',
  description: 'Get help and support for Tikiti event management platform.',
};

export default function SupportPage() {
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
        <h1 className="text-4xl font-bold mb-2">Support</h1>
        <p className="text-white/40 text-sm mb-12">We&apos;re here to help you get the most out of Tikiti.</p>

        <div className="space-y-10 text-white/70 leading-relaxed">
          {/* Contact Us */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact Us</h2>
            <p className="mb-4">
              Have a question, issue, or feedback? Reach out to our team and we&apos;ll get back to you as soon as possible.
            </p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <div>
                  <p className="text-white font-medium text-sm">Email</p>
                  <a href="mailto:support@gettikiti.com" className="text-orange-400 hover:text-orange-300 underline">
                    support@gettikiti.com
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* FAQs */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-base font-medium text-white/90 mb-2">How do I register for an event?</h3>
                <p>
                  Browse events on the app or website, tap on an event you&apos;re interested in, and click the
                  &quot;Register&quot; or &quot;Get Tickets&quot; button. You&apos;ll receive a confirmation email
                  with your QR ticket.
                </p>
              </div>

              <div>
                <h3 className="text-base font-medium text-white/90 mb-2">Where can I find my tickets?</h3>
                <p>
                  Your tickets are available in the &quot;My Events&quot; tab in the Tikiti app. Each ticket
                  includes a QR code for check-in at the event.
                </p>
              </div>

              <div>
                <h3 className="text-base font-medium text-white/90 mb-2">Can I cancel my registration?</h3>
                <p>
                  Yes. Go to &quot;My Events&quot; in the app, tap on the event, and select
                  &quot;Cancel Registration.&quot; Please note that refund policies vary by event.
                </p>
              </div>

              <div>
                <h3 className="text-base font-medium text-white/90 mb-2">How do I join a virtual or hybrid event?</h3>
                <p>
                  After registering, open the event in the app. You&apos;ll see a &quot;Join Meeting&quot; button
                  with a link to the event&apos;s Zoom, Google Meet, or Microsoft Teams session.
                </p>
              </div>

              <div>
                <h3 className="text-base font-medium text-white/90 mb-2">I&apos;m an event organizer. Where do I manage my events?</h3>
                <p>
                  Event management is done through our web dashboard at{' '}
                  <a href="https://gettikiti.com/dashboard" className="text-orange-400 hover:text-orange-300 underline">
                    gettikiti.com/dashboard
                  </a>. Sign in with your account to create events, manage attendees, and view analytics.
                </p>
              </div>

              <div>
                <h3 className="text-base font-medium text-white/90 mb-2">How do I delete my account?</h3>
                <p>
                  You can delete your account at{' '}
                  <Link href="/account/delete" className="text-orange-400 hover:text-orange-300 underline">
                    gettikiti.com/account/delete
                  </Link>. This will permanently remove your account and all associated data.
                </p>
              </div>
            </div>
          </section>

          {/* Response Time */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Response Times</h2>
            <p>
              We aim to respond to all support requests within 24 hours. For urgent issues related to
              upcoming events, please include &quot;URGENT&quot; in your email subject line.
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
