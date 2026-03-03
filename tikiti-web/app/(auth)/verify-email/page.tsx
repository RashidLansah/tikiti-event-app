'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Ticket, Mail, RefreshCw, ArrowLeft, CheckCircle } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { sendEmailVerification } from 'firebase/auth';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResendVerification = async () => {
    setResending(true);
    setError('');
    setResendSuccess(false);

    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setResendSuccess(true);
      } else {
        setError('Please log in again to resend the verification email.');
      }
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes before trying again.');
      } else {
        setError('Failed to resend verification email. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    setError('');

    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          router.push('/dashboard');
          return;
        }
      }
      setError('Email not yet verified. Please check your inbox and click the verification link.');
    } catch (err: any) {
      setError('Could not check verification status. Please try logging in again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#fefff7]">
      <div className="w-full flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-[#333] rounded-xl flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-[#333]">Tikiti</span>
          </div>

          {/* Icon */}
          <div className="w-20 h-20 bg-[#f0f0f0] rounded-full flex items-center justify-center mx-auto mb-8">
            <Mail className="w-10 h-10 text-[#333]" />
          </div>

          {/* Heading */}
          <h1 className="text-[32px] font-semibold text-[#333] mb-3 text-center">
            Verify your email
          </h1>
          <p className="text-[#86868b] text-base mb-2 text-center">
            We&apos;ve sent a verification link to
          </p>
          {email && (
            <p className="text-[#333] font-medium text-base mb-8 text-center">
              {email}
            </p>
          )}
          {!email && (
            <p className="text-[#86868b] text-base mb-8 text-center">
              your email address
            </p>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[16px]">
              {error}
            </div>
          )}

          {/* Success */}
          {resendSuccess && (
            <div className="mb-6 p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-[16px] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Verification email sent! Check your inbox.
            </div>
          )}

          {/* Instructions */}
          <div className="bg-[#f0f0f0] rounded-[20px] p-6 mb-8">
            <p className="text-sm text-[#333] leading-relaxed">
              Click the link in the email to verify your account. Once verified, come back here and
              click the button below to continue to your dashboard.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleCheckVerification}
              disabled={checking}
              className="w-full h-12 bg-[#333] text-white font-medium rounded-full hover:bg-[#444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {checking ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : (
                "I've verified my email"
              )}
            </button>

            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full h-12 bg-[#f0f0f0] text-[#333] font-medium rounded-full hover:bg-[#e8e8e8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {resending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Resend verification email
                </>
              )}
            </button>
          </div>

          {/* Back to login */}
          <p className="text-center text-sm text-[#86868b] mt-8">
            <Link href="/login" className="text-[#333] font-medium hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </Link>
          </p>

          {/* Footer */}
          <p className="text-center text-xs text-[#86868b] mt-8">
            Copyright &copy; {new Date().getFullYear()} Tikiti Events Ltd
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#fefff7]">
        <div className="text-[#86868b]">Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
