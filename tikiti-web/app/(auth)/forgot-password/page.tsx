'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Ticket, ArrowLeft, Mail, Check } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      // Always show success for security (don't reveal if email exists)
      // Only show error for network/unexpected issues
      if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else {
        // For auth/user-not-found and other errors, still show success
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (sent) {
    return (
      <div className="min-h-screen flex bg-[#fefff7]">
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
          <div className="max-w-md w-full mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-12">
              <div className="w-10 h-10 bg-[#333] rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-[#333]">Tikiti</span>
            </div>

            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-8">
              <Check className="w-8 h-8 text-green-600" />
            </div>

            <h1 className="text-[40px] font-semibold text-[#333] mb-2">Check Your Email</h1>
            <p className="text-[#86868b] text-base mb-4">
              We've sent password reset instructions to:
            </p>
            <p className="text-[#333] font-semibold text-base mb-8">
              {email}
            </p>
            <p className="text-[#86868b] text-sm mb-8">
              If you don't see the email, check your spam folder. The link will expire in 1 hour.
            </p>

            <div className="space-y-3">
              <Link
                href="/login"
                className="w-full h-12 bg-[#333] text-white font-medium rounded-full hover:bg-[#444] transition-colors flex items-center justify-center"
              >
                Back to Login
              </Link>
              <button
                onClick={() => {
                  setSent(false);
                  setEmail('');
                }}
                className="w-full h-12 bg-[#f0f0f0] text-[#333] font-medium rounded-full hover:bg-[#e8e8e8] transition-colors"
              >
                Try a Different Email
              </button>
            </div>
          </div>
        </div>

        {/* Right Side */}
        <div className="hidden lg:flex w-1/2 bg-[#333] items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 text-center max-w-md px-12">
            <Mail className="w-16 h-16 text-white/80 mx-auto mb-8" />
            <h2 className="text-3xl font-semibold text-white mb-4">Email Sent</h2>
            <p className="text-white/70 text-base">
              Follow the instructions in the email to reset your password and regain access to your account.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen flex bg-[#fefff7]">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-[#333] rounded-xl flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-[#333]">Tikiti</span>
          </div>

          {/* Back Link */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-[#86868b] hover:text-[#333] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          {/* Heading */}
          <h1 className="text-[40px] font-semibold text-[#333] mb-2">Forgot Password?</h1>
          <p className="text-[#86868b] text-base mb-8">
            Enter the email address associated with your account and we'll send you a link to reset your password.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[16px]">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#333] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="hello@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoFocus
                className="w-full h-12 px-4 bg-[#f0f0f0] border-0 rounded-[16px] text-[#333] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#333]/20 transition-all disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full h-12 bg-[#333] text-white font-medium rounded-full hover:bg-[#444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-[#86868b] mt-8">
            Remember your password?{' '}
            <Link href="/login" className="text-[#333] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Decorative */}
      <div className="hidden lg:flex w-1/2 bg-[#333] items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center max-w-md px-12">
          <div className="w-20 h-20 bg-white/10 rounded-[24px] flex items-center justify-center mx-auto mb-8">
            <Ticket className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-semibold text-white mb-4">Reset Your Password</h2>
          <p className="text-white/70 text-base">
            We'll help you get back into your account. Just enter your email and follow the instructions.
          </p>
        </div>
      </div>
    </div>
  );
}
