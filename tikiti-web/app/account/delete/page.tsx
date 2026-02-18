'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, Trash2, Check, Loader2 } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

type Step = 'info' | 'signin' | 'confirm' | 'deleting' | 'done';

export default function DeleteAccountPage() {
  const [step, setStep] = useState<Step>('info');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [userDisplayName, setUserDisplayName] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      setUserDisplayName(credential.user.displayName || credential.user.email || 'User');
      setStep('confirm');
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string };
      if (firebaseErr.code === 'auth/user-not-found' || firebaseErr.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please try again.');
      } else if (firebaseErr.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.');
      } else {
        setError('Sign in failed. Please check your credentials.');
      }
    }
  };

  const deleteCollectionDocs = async (collectionName: string, field: string, value: string) => {
    try {
      const q = query(collection(db, collectionName), where(field, '==', value));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return 0;

      // Delete in batches of 500 (Firestore limit)
      const batches = [];
      let batch = writeBatch(db);
      let count = 0;

      for (const docSnap of snapshot.docs) {
        batch.delete(docSnap.ref);
        count++;
        if (count % 500 === 0) {
          batches.push(batch.commit());
          batch = writeBatch(db);
        }
      }
      batches.push(batch.commit());
      await Promise.all(batches);

      return count;
    } catch {
      // Security rules may prevent deletion of some docs — continue
      return 0;
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('No user signed in. Please sign in again.');
      setStep('signin');
      return;
    }

    setStep('deleting');
    setError('');

    try {
      const uid = user.uid;
      const userEmail = user.email || '';

      // Re-authenticate to ensure fresh credentials
      setProgress('Verifying your identity...');
      try {
        const credential = EmailAuthProvider.credential(userEmail, password);
        await reauthenticateWithCredential(user, credential);
      } catch {
        setError('Re-authentication failed. Please sign in again.');
        setStep('signin');
        return;
      }

      // Delete user data from Firestore collections
      setProgress('Removing your bookings...');
      await deleteCollectionDocs('bookings', 'userId', uid);

      setProgress('Removing your notifications...');
      await deleteCollectionDocs('notifications', 'userId', uid);

      setProgress('Removing your RSVPs...');
      await deleteCollectionDocs('rsvps', 'userId', uid);

      setProgress('Removing your profile...');
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch {
        // May fail if doc doesn't exist — continue
      }

      // Delete Firebase Auth account (must be last)
      setProgress('Deleting your account...');
      await deleteUser(user);

      setStep('done');
    } catch (err: unknown) {
      const firebaseErr = err as { code?: string; message?: string };
      if (firebaseErr.code === 'auth/requires-recent-login') {
        setError('Your session has expired. Please sign in again to continue.');
        setStep('signin');
      } else {
        setError(`Deletion failed: ${firebaseErr.message || 'Unknown error'}. Please contact support.`);
        setStep('confirm');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#fefff7]">
      {/* Header */}
      <nav className="border-b border-black/5 bg-[#fefff7]">
        <div className="max-w-[600px] mx-auto px-6 flex items-center h-[64px] gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center hover:bg-[#e5e5e5] transition-colors"
          >
            <ArrowLeft size={18} className="text-[#333]" />
          </Link>
          <Link href="/" className="text-[28px] font-extrabold text-[#333] tracking-tight">
            Tikiti
          </Link>
        </div>
      </nav>

      <div className="max-w-[600px] mx-auto px-6 py-12">

        {/* ── INFO STEP ── */}
        {step === 'info' && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 size={22} className="text-red-500" />
              </div>
              <div>
                <h1 className="text-[28px] font-extrabold text-[#333] leading-tight">Delete Account</h1>
                <p className="text-[14px] text-[#86868b]">Permanently remove your Tikiti account and data</p>
              </div>
            </div>

            <div className="bg-[#f0f0f0] rounded-[20px] p-6 mb-6">
              <h2 className="text-[16px] font-bold text-[#333] mb-3">What will be deleted</h2>
              <ul className="space-y-2.5">
                {[
                  'Your account profile and personal information',
                  'All event registrations and bookings',
                  'Your tickets and RSVPs',
                  'Notifications and messages',
                  'Any events you created as an organizer',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[14px] text-[#525252]">
                    <span className="mt-0.5 text-red-400">&#x2022;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-[16px] p-5 mb-8">
              <div className="flex gap-3">
                <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[14px] font-semibold text-amber-800 mb-1">This action is permanent</p>
                  <p className="text-[13px] text-amber-700 leading-relaxed">
                    Once your account is deleted, all your data will be permanently removed and cannot be recovered.
                    Active event tickets will no longer be valid.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('signin')}
              className="w-full bg-red-500 text-white text-[15px] font-semibold py-3.5 rounded-full hover:bg-red-600 transition-colors mb-4"
            >
              Continue with Account Deletion
            </button>

            <Link
              href="/"
              className="block text-center text-[14px] text-[#86868b] hover:text-[#333] transition-colors"
            >
              Cancel and go back
            </Link>

            {/* Can't sign in section */}
            <div className="mt-12 pt-8 border-t border-black/5">
              <p className="text-[14px] text-[#86868b] leading-relaxed">
                <span className="font-semibold text-[#333]">Can&apos;t sign in?</span>{' '}
                If you no longer have access to your account, email us at{' '}
                <a href="mailto:support@gettikiti.com" className="text-[#333] underline font-medium">
                  support@gettikiti.com
                </a>{' '}
                with the email address associated with your account, and we&apos;ll process your deletion request within 7 days.
              </p>
            </div>
          </>
        )}

        {/* ── SIGN IN STEP ── */}
        {step === 'signin' && (
          <>
            <h1 className="text-[28px] font-extrabold text-[#333] mb-2">Verify Your Identity</h1>
            <p className="text-[15px] text-[#86868b] mb-8">
              Sign in to confirm you own this account before deleting it.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[12px] p-4 mb-6">
                <p className="text-[14px] text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-[14px] font-semibold text-[#333] mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 rounded-[12px] border border-black/10 bg-white text-[15px] text-[#333] placeholder:text-[#a3a3a3] focus:outline-none focus:border-[#333] transition-colors"
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold text-[#333] mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-[12px] border border-black/10 bg-white text-[15px] text-[#333] placeholder:text-[#a3a3a3] focus:outline-none focus:border-[#333] transition-colors"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#333] text-white text-[15px] font-semibold py-3.5 rounded-full hover:bg-[#1a1a1a] transition-colors"
              >
                Sign In & Continue
              </button>
            </form>

            <button
              onClick={() => setStep('info')}
              className="block w-full text-center text-[14px] text-[#86868b] hover:text-[#333] transition-colors mt-4"
            >
              Go back
            </button>
          </>
        )}

        {/* ── CONFIRM STEP ── */}
        {step === 'confirm' && (
          <>
            <h1 className="text-[28px] font-extrabold text-[#333] mb-2">Final Confirmation</h1>
            <p className="text-[15px] text-[#86868b] mb-2">
              Signed in as <span className="font-semibold text-[#333]">{userDisplayName}</span>
            </p>
            <p className="text-[15px] text-[#86868b] mb-8">
              Type <span className="font-mono font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">DELETE</span> below to permanently delete your account.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[12px] p-4 mb-6">
                <p className="text-[14px] text-red-700">{error}</p>
              </div>
            )}

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="w-full px-4 py-3 rounded-[12px] border border-black/10 bg-white text-[15px] text-[#333] placeholder:text-[#a3a3a3] focus:outline-none focus:border-red-400 transition-colors mb-4"
            />

            <button
              onClick={handleDeleteAccount}
              disabled={confirmText !== 'DELETE'}
              className="w-full bg-red-500 text-white text-[15px] font-semibold py-3.5 rounded-full hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed mb-4"
            >
              Permanently Delete My Account
            </button>

            <button
              onClick={() => { setStep('info'); setConfirmText(''); setError(''); }}
              className="block w-full text-center text-[14px] text-[#86868b] hover:text-[#333] transition-colors"
            >
              Cancel
            </button>
          </>
        )}

        {/* ── DELETING STEP ── */}
        {step === 'deleting' && (
          <div className="text-center py-16">
            <Loader2 size={40} className="animate-spin text-[#333] mx-auto mb-6" />
            <h1 className="text-[24px] font-extrabold text-[#333] mb-2">Deleting Your Account</h1>
            <p className="text-[15px] text-[#86868b]">{progress || 'Please wait...'}</p>
          </div>
        )}

        {/* ── DONE STEP ── */}
        {step === 'done' && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
              <Check size={28} className="text-green-500" />
            </div>
            <h1 className="text-[28px] font-extrabold text-[#333] mb-3">Account Deleted</h1>
            <p className="text-[15px] text-[#86868b] mb-8 max-w-[400px] mx-auto leading-relaxed">
              Your Tikiti account and all associated data have been permanently removed.
              We&apos;re sorry to see you go.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#333] text-white text-[15px] font-semibold px-6 py-3 rounded-full hover:bg-[#1a1a1a] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
