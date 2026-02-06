'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Ticket } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, logout, user, loading: authLoading, hasOrganization, isGateStaff } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [error, setError] = useState('');

  // Redirect authenticated users based on their role
  useEffect(() => {
    if (!authLoading && user) {
      if (hasOrganization) {
        // Gate staff go directly to gate portal
        if (isGateStaff) {
          router.replace('/gate');
        } else {
          const redirectUrl = searchParams.get('redirect') || '/dashboard';
          router.replace(redirectUrl);
        }
      }
      // If user is logged in but has no organization, they stay on login page
      // and should see a message to register or contact their admin
    }
  }, [user, authLoading, hasOrganization, isGateStaff, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Show loading screen after successful login
      setShowLoadingScreen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleLoadingComplete = () => {
    // Gate staff go to gate portal, others go to dashboard
    if (isGateStaff) {
      router.push('/gate');
    } else {
      router.push('/dashboard');
    }
  };

  // Show loading screen after successful login
  if (showLoadingScreen) {
    return <LoadingScreen onComplete={handleLoadingComplete} duration={1500} />;
  }

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fefff7]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#333]"></div>
          <p className="mt-4 text-[#86868b]">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render form if user is authenticated with organization (redirect is happening)
  if (user && hasOrganization) {
    return null;
  }

  // User is logged in but has no organization - show message
  if (user && !hasOrganization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fefff7] px-4">
        <div className="max-w-md w-full text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-[#333] rounded-xl flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-[#333]">Tikiti</span>
          </div>
          <h1 className="text-2xl font-bold text-[#333] mb-4">No Organization Found</h1>
          <p className="text-[#86868b] mb-6">
            Your account ({user.email}) is not associated with any organization.
          </p>
          <p className="text-[#86868b] mb-8">
            If you were invited to join an organization, please use the invitation link sent to your email. Otherwise, you can create a new organization.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/register"
              className="w-full h-12 bg-[#333] text-white font-medium rounded-full hover:bg-[#444] transition-colors flex items-center justify-center"
            >
              Create New Organization
            </Link>
            <button
              onClick={async () => {
                await logout();
                window.location.reload();
              }}
              className="w-full h-12 bg-[#f0f0f0] text-[#333] font-medium rounded-full hover:bg-[#e8e8e8] transition-colors"
            >
              Sign Out & Use Different Account
            </button>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Heading */}
          <h1 className="text-[40px] font-semibold text-[#333] mb-2">Welcome Back</h1>
          <p className="text-[#86868b] text-base mb-8">
            Enter your email and password to access your account
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[16px]">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
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
                className="w-full h-12 px-4 bg-[#f0f0f0] border-0 rounded-[16px] text-[#333] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#333]/20 transition-all disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#333] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full h-12 px-4 pr-12 bg-[#f0f0f0] border-0 rounded-[16px] text-[#333] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#333]/20 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#333] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-[#e8e8e8] text-[#333] focus:ring-[#333]/20"
                />
                <span className="text-sm text-[#86868b]">Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-[#333] hover:underline font-medium"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#333] text-white font-medium rounded-full hover:bg-[#444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#e8e8e8]" />
            <span className="text-sm text-[#86868b]">Login With</span>
            <div className="flex-1 h-px bg-[#e8e8e8]" />
          </div>

          {/* Social Login */}
          <div className="flex gap-4">
            <button
              type="button"
              disabled={loading}
              className="flex-1 h-12 flex items-center justify-center gap-2 bg-[#f0f0f0] rounded-full text-[#333] font-medium hover:bg-[#e8e8e8] transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              disabled={loading}
              className="flex-1 h-12 flex items-center justify-center gap-2 bg-[#f0f0f0] rounded-full text-[#333] font-medium hover:bg-[#e8e8e8] transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
              </svg>
              Apple
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-[#86868b] mt-8">
            Don't Have An Account?{' '}
            <Link href="/register" className="text-[#333] font-medium hover:underline">
              Register Now
            </Link>
          </p>

          {/* Footer */}
          <p className="text-center text-xs text-[#86868b] mt-12">
            Copyright &copy; {new Date().getFullYear()} Tikiti Events Ltd
          </p>
        </div>
      </div>

      {/* Right Side - Preview */}
      <div className="hidden lg:flex w-1/2 bg-[#333] p-12 flex-col justify-center items-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-lg">
          <h2 className="text-[36px] font-semibold text-white mb-4">
            Effortlessly manage your events and attendees.
          </h2>
          <p className="text-white/70 text-base mb-12">
            Log in to access your event dashboard and manage your tickets.
          </p>

          {/* Dashboard Preview Card */}
          <div className="bg-white rounded-[24px] p-6 shadow-2xl">
            {/* Mini Dashboard Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#333] rounded-lg flex items-center justify-center">
                  <Ticket className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-[#333]">Dashboard</span>
              </div>
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#f0f0f0]" />
                <div className="w-3 h-3 rounded-full bg-[#f0f0f0]" />
                <div className="w-3 h-3 rounded-full bg-[#333]" />
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#f0f0f0] rounded-[16px] p-3 text-center">
                <div className="text-2xl font-bold text-[#333]">2,450</div>
                <div className="text-xs text-[#86868b]">Tickets Sold</div>
              </div>
              <div className="bg-[#f0f0f0] rounded-[16px] p-3 text-center">
                <div className="text-2xl font-bold text-[#333]">12</div>
                <div className="text-xs text-[#86868b]">Events</div>
              </div>
              <div className="bg-[#f0f0f0] rounded-[16px] p-3 text-center">
                <div className="text-2xl font-bold text-[#333]">98%</div>
                <div className="text-xs text-[#86868b]">Check-in</div>
              </div>
            </div>

            {/* Mini Chart */}
            <div className="bg-[#f0f0f0] rounded-[16px] p-4">
              <div className="flex items-end justify-between h-20 gap-2">
                {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[#333] rounded-t-lg transition-all"
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-[#86868b]">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fefff7]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#333]"></div>
        <p className="mt-4 text-[#86868b]">Loading...</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
