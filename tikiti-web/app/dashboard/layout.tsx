'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { NewDashboardLayout } from '@/components/layout/NewDashboardLayout';
import { ToastProvider } from '@/components/ui/toast-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isGateStaff, loading, user } = useAuth();

  // Redirect gate staff to the gate portal
  useEffect(() => {
    if (!loading && user && isGateStaff) {
      router.replace('/gate');
    }
  }, [isGateStaff, loading, user, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting gate staff
  if (user && isGateStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Redirecting to gate portal...</p>
        </div>
      </div>
    );
  }

  // All dashboard pages require organization
  return (
    <ProtectedRoute requireOrganization={true}>
      <ToastProvider>
        <NewDashboardLayout>
          {children}
        </NewDashboardLayout>
      </ToastProvider>
    </ProtectedRoute>
  );
}
