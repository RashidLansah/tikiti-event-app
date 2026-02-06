'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Ticket, Check } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function RegisterPage() {
  const router = useRouter();
  const { register, createOrganization } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!formData.companyName.trim()) {
      setError('Company name is required');
      return;
    }

    setLoading(true);

    try {
      // First register the user
      await register(
        formData.email,
        formData.password,
        formData.name,
        {
          accountType: 'organiser',
        }
      );

      // Then create their organization
      await createOrganization({
        name: formData.companyName.trim(),
        slug: formData.companyName.trim().toLowerCase().replace(/\s+/g, '-'),
      });

      // Show loading screen then redirect to dashboard
      setShowLoadingScreen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  const handleLoadingComplete = () => {
    router.push('/dashboard');
  };

  if (showLoadingScreen) {
    return <LoadingScreen onComplete={handleLoadingComplete} duration={1500} />;
  }

  const features = [
    'Create unlimited events',
    'Sell tickets online & offline',
    'Real-time analytics dashboard',
    'QR code check-in system',
    'Team collaboration tools',
  ];

  return (
    <div className="min-h-screen flex bg-[#fefff7]">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 py-12">
        <div className="max-w-md w-full mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-[#333] rounded-xl flex items-center justify-center">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-[#333]">Tikiti</span>
          </div>

          {/* Heading */}
          <h1 className="text-[40px] font-semibold text-[#333] mb-2">Create Account</h1>
          <p className="text-[#86868b] text-base mb-8">
            Get started with Tikiti event management
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[16px]">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#333] mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
                className="w-full h-12 px-4 bg-[#f0f0f0] border-0 rounded-[16px] text-[#333] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#333]/20 transition-all disabled:opacity-50"
              />
            </div>

            {/* Company Name */}
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-[#333] mb-2">
                Company / Organization Name
              </label>
              <input
                id="companyName"
                type="text"
                placeholder="Acme Events Ltd"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
                disabled={loading}
                className="w-full h-12 px-4 bg-[#f0f0f0] border-0 rounded-[16px] text-[#333] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#333]/20 transition-all disabled:opacity-50"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#333] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="hello@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading}
                  minLength={6}
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

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#333] mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={loading}
                  minLength={6}
                  className="w-full h-12 px-4 pr-12 bg-[#f0f0f0] border-0 rounded-[16px] text-[#333] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#333]/20 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#333] transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#333] text-white font-medium rounded-full hover:bg-[#444] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#e8e8e8]" />
            <span className="text-sm text-[#86868b]">Or continue with</span>
            <div className="flex-1 h-px bg-[#e8e8e8]" />
          </div>

          {/* Social Login */}
          <div className="flex gap-4">
            <button
              type="button"
              className="flex-1 h-12 flex items-center justify-center gap-2 bg-[#f0f0f0] rounded-full text-[#333] font-medium hover:bg-[#e8e8e8] transition-colors"
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
              className="flex-1 h-12 flex items-center justify-center gap-2 bg-[#f0f0f0] rounded-full text-[#333] font-medium hover:bg-[#e8e8e8] transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09997 22C7.78997 22.05 6.79997 20.68 5.95997 19.47C4.24997 17 2.93997 12.45 4.69997 9.39C5.56997 7.87 7.12997 6.91 8.81997 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
              </svg>
              Apple
            </button>
          </div>

          {/* Sign In Link */}
          <p className="text-center text-sm text-[#86868b] mt-8">
            Already Have An Account?{' '}
            <Link href="/login" className="text-[#333] font-medium hover:underline">
              Sign In
            </Link>
          </p>

          {/* Footer */}
          <p className="text-center text-xs text-[#86868b] mt-8">
            Copyright &copy; {new Date().getFullYear()} Tikiti Events Ltd
          </p>
        </div>
      </div>

      {/* Right Side - Features */}
      <div className="hidden lg:flex w-1/2 bg-[#333] p-12 flex-col justify-center items-center relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-lg">
          <h2 className="text-[36px] font-semibold text-white mb-4">
            Start managing your events like a pro.
          </h2>
          <p className="text-white/70 text-base mb-12">
            Join thousands of event organizers who trust Tikiti.
          </p>

          {/* Features Card */}
          <div className="bg-white rounded-[24px] p-8 shadow-2xl text-left">
            <h3 className="text-lg font-semibold text-[#333] mb-6">
              Everything you need to succeed
            </h3>
            <ul className="space-y-4">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-[#333] rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[#333]">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Stats */}
            <div className="mt-8 pt-6 border-t border-[#e8e8e8] grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#333]">10K+</div>
                <div className="text-xs text-[#86868b]">Events</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#333]">500K+</div>
                <div className="text-xs text-[#86868b]">Tickets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#333]">99.9%</div>
                <div className="text-xs text-[#86868b]">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
