'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { invitationService, Invitation } from '@/lib/services/invitationService';
import { organizationService } from '@/lib/services/organizationService';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Eye, EyeOff, Ticket, Check, X, Loader2 } from 'lucide-react';

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, register, login, refreshOrganizations } = useAuth();
  const token = params.token as string;

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  // Form state for new users
  const [isNewUser, setIsNewUser] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadInvitation();
  }, [token]);

  useEffect(() => {
    // Pre-fill email from invitation
    if (invitation) {
      setFormData((prev) => ({ ...prev, email: invitation.email }));
    }
  }, [invitation]);

  const loadInvitation = async () => {
    try {
      setLoading(true);
      const invite = await invitationService.getByToken(token);

      if (!invite) {
        setError('Invitation not found or has been cancelled.');
        return;
      }

      // Check if expired
      const now = new Date();
      const expiresAt = invite.expiresAt.toDate
        ? invite.expiresAt.toDate()
        : new Date(invite.expiresAt);

      if (now > expiresAt) {
        setError('This invitation has expired. Please ask for a new invitation.');
        return;
      }

      if (invite.status !== 'pending') {
        setError(`This invitation has already been ${invite.status}.`);
        return;
      }

      setInvitation(invite);
    } catch (err) {
      console.error('Error loading invitation:', err);
      setError('Failed to load invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (userId: string) => {
    if (!invitation) return;

    try {
      setAccepting(true);

      // Accept the invitation
      await invitationService.accept(token, userId);

      // Add user to organization
      await organizationService.addMember(
        invitation.organizationId,
        userId,
        invitation.role,
        invitation.invitedBy
      );

      // Update user profile with organization ID
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        organizationId: invitation.organizationId,
        currentOrganizationRole: invitation.role,
        updatedAt: serverTimestamp()
      });

      // Refresh auth context so dashboard sees the organization
      // Small delay to ensure Firestore writes are consistent
      await new Promise(resolve => setTimeout(resolve, 1000));
      await refreshOrganizations();

      // Redirect based on role
      if (invitation.role === 'gate_staff') {
        router.push('/gate');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setFormError(err.message || 'Failed to accept invitation');
      setAccepting(false);
    }
  };

  const handleRegisterAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (formData.password !== formData.confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    try {
      setAccepting(true);

      // Register user
      const userCredential = await register(
        formData.email,
        formData.password,
        formData.name,
        { accountType: 'organiser' }
      );

      // Accept invitation with new user ID
      await handleAcceptInvitation(userCredential.user.uid);
    } catch (err: any) {
      console.error('Error registering:', err);

      // Check if the error is "email already in use"
      if (err.code === 'auth/email-already-in-use') {
        setFormError('An account with this email already exists. Please use "I have an account" to sign in instead.');
        setIsNewUser(false); // Switch to login mode
      } else {
        setFormError(err.message || 'Failed to create account');
      }
      setAccepting(false);
    }
  };

  const handleLoginAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      setAccepting(true);

      // Login user
      const userCredential = await login(formData.email, formData.password);

      // Accept invitation
      await handleAcceptInvitation(userCredential.user.uid);
    } catch (err: any) {
      console.error('Error logging in:', err);
      setFormError(err.message || 'Failed to login');
      setAccepting(false);
    }
  };

  // If user is already logged in
  const handleAcceptAsCurrentUser = async () => {
    if (!user) return;

    // Check if logged-in user email matches invitation
    if (user.email?.toLowerCase() !== invitation?.email.toLowerCase()) {
      setFormError(
        `This invitation was sent to ${invitation?.email}. Please log in with that email address.`
      );
      return;
    }

    await handleAcceptInvitation(user.uid);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fefff7]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#333] mx-auto" />
          <p className="mt-4 text-[#333]">Loading invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fefff7] px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#333] mb-4">Invalid Invitation</h1>
          <p className="text-[#86868b] mb-8">{error}</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#333] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#444] transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

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

          {/* Invitation Info */}
          <div className="bg-[#f0f0f0] rounded-[24px] p-6 mb-8">
            <p className="text-sm text-[#86868b] mb-2">You've been invited to join</p>
            <h2 className="text-2xl font-bold text-[#333] mb-1">{invitation?.organizationName}</h2>
            <p className="text-sm text-[#86868b]">
              as a <span className="text-[#333] font-medium capitalize">{invitation?.role.replace('_', ' ')}</span>
            </p>
            <p className="text-sm text-[#86868b] mt-2">
              Invited by <span className="text-[#333] font-medium">{invitation?.inviterName}</span>
            </p>
          </div>

          {/* If user is logged in */}
          {user ? (
            <div>
              <h1 className="text-[32px] font-semibold text-[#333] mb-4">Accept Invitation</h1>
              <p className="text-[#86868b] mb-6">
                You're logged in as <strong>{user.email}</strong>
              </p>

              {formError && (
                <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[16px]">
                  {formError}
                </div>
              )}

              <button
                onClick={handleAcceptAsCurrentUser}
                disabled={accepting}
                className="w-full h-12 bg-[#333] text-white font-medium rounded-full hover:bg-[#444] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {accepting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Accept Invitation
                  </>
                )}
              </button>

              <p className="text-center text-sm text-[#86868b] mt-6">
                Not you?{' '}
                <button
                  onClick={() => {
                    // Logout and reload
                    window.location.href = `/invite/${token}`;
                  }}
                  className="text-[#333] font-medium hover:underline"
                >
                  Use a different account
                </button>
              </p>
            </div>
          ) : (
            <>
              {/* Toggle between login and register */}
              <div className="flex items-center gap-2 mb-6">
                <button
                  onClick={() => setIsNewUser(true)}
                  className={`flex-1 py-3 rounded-full text-base font-medium transition-colors ${
                    isNewUser ? 'bg-[#333] text-white' : 'bg-[#f0f0f0] text-[#333]'
                  }`}
                >
                  Create Account
                </button>
                <button
                  onClick={() => setIsNewUser(false)}
                  className={`flex-1 py-3 rounded-full text-base font-medium transition-colors ${
                    !isNewUser ? 'bg-[#333] text-white' : 'bg-[#f0f0f0] text-[#333]'
                  }`}
                >
                  I have an account
                </button>
              </div>

              <h1 className="text-[32px] font-semibold text-[#333] mb-2">
                {isNewUser ? 'Create Your Account' : 'Sign In'}
              </h1>
              <p className="text-[#86868b] text-base mb-6">
                {isNewUser
                  ? 'Create an account to join the team'
                  : 'Sign in to accept the invitation'}
              </p>

              {formError && (
                <div className="mb-6 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-[16px]">
                  {formError}
                </div>
              )}

              <form onSubmit={isNewUser ? handleRegisterAndAccept : handleLoginAndAccept} className="space-y-5">
                {isNewUser && (
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
                      disabled={accepting}
                      className="w-full h-12 px-4 bg-[#f0f0f0] border-0 rounded-[16px] text-[#333] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#333]/20 transition-all disabled:opacity-50"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#333] mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={accepting}
                    readOnly
                    className="w-full h-12 px-4 bg-[#e8e8e8] border-0 rounded-[16px] text-[#333] placeholder:text-[#86868b] focus:outline-none cursor-not-allowed"
                  />
                  <p className="text-xs text-[#86868b] mt-1">Email is pre-filled from your invitation</p>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-[#333] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isNewUser ? 'Create a password' : 'Enter your password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      disabled={accepting}
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

                {isNewUser && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#333] mb-2">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      disabled={accepting}
                      minLength={6}
                      className="w-full h-12 px-4 bg-[#f0f0f0] border-0 rounded-[16px] text-[#333] placeholder:text-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#333]/20 transition-all disabled:opacity-50"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={accepting}
                  className="w-full h-12 bg-[#333] text-white font-medium rounded-full hover:bg-[#444] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isNewUser ? 'Creating account...' : 'Signing in...'}
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      {isNewUser ? 'Create Account & Join' : 'Sign In & Join'}
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-[#86868b] mt-12">
            Copyright &copy; {new Date().getFullYear()} Tikiti Events Ltd
          </p>
        </div>
      </div>

      {/* Right Side - Info */}
      <div className="hidden lg:flex w-1/2 bg-[#333] p-12 flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center max-w-lg">
          <h2 className="text-[36px] font-semibold text-white mb-4">
            Join {invitation?.organizationName}
          </h2>
          <p className="text-white/70 text-base mb-12">
            You've been invited to help manage events. Accept the invitation to get started.
          </p>

          <div className="bg-white rounded-[24px] p-8 shadow-2xl text-left">
            <h3 className="text-lg font-semibold text-[#333] mb-6">
              As a {invitation?.role.replace('_', ' ')}, you'll be able to:
            </h3>
            <ul className="space-y-4">
              {invitation?.role === 'admin' && (
                <>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#333] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#333]">Manage team members</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#333] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#333]">Create and manage events</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#333] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#333]">View analytics and reports</span>
                  </li>
                </>
              )}
              {invitation?.role === 'project_manager' && (
                <>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#333] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#333]">Create and manage events</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#333] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#333]">Manage attendees and check-ins</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#333] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#333]">Send messages to attendees</span>
                  </li>
                </>
              )}
              {invitation?.role === 'gate_staff' && (
                <>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#333] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#333]">Scan tickets at events</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#333] rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[#333]">View attendee information</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
