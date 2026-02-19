'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOrganization?: boolean;
}

export function ProtectedRoute({ children, requireOrganization = false }: ProtectedRouteProps) {
  const { user, loading, hasOrganization, userProfile, refreshOrganizations } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshAttempts = useRef(0);
  const maxRefreshAttempts = 3;

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      return;
    }

    // If not authenticated, redirect to login
    if (!user) {
      const currentPath = pathname || '/dashboard';
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    // If organization is required but user doesn't have one
    // Try refreshing organizations (user might have just accepted an invite)
    if (requireOrganization && !hasOrganization && userProfile?.organizationId && refreshAttempts.current < maxRefreshAttempts && !isRefreshing) {
      setIsRefreshing(true);
      refreshAttempts.current += 1;
      const attempt = refreshAttempts.current;

      // Add increasing delay between retries to handle Firestore eventual consistency
      const delay = attempt === 1 ? 0 : 1000 * attempt;
      setTimeout(async () => {
        try {
          await refreshOrganizations();
        } catch (error) {
          console.error(`Org refresh attempt ${attempt} failed:`, error);
        } finally {
          setIsRefreshing(false);
        }
      }, delay);
      return;
    }

    // If organization is required but user doesn't have one after all retries, redirect to register
    if (requireOrganization && !hasOrganization && !isRefreshing && refreshAttempts.current >= maxRefreshAttempts) {
      router.push('/register');
      return;
    }
  }, [user, loading, hasOrganization, requireOrganization, router, pathname, userProfile?.organizationId, isRefreshing, refreshOrganizations]);

  // Show loading state while checking auth or refreshing
  if (loading || isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect is happening)
  if (!user) {
    return null;
  }

  // If organization is required but user doesn't have one, show nothing (redirect is happening)
  if (requireOrganization && !hasOrganization) {
    return null;
  }

  // All checks passed, render children
  return <>{children}</>;
}
