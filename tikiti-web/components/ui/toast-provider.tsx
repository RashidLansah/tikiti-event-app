'use client';

import { ToastContext, useToastState } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toast, toasts, dismiss } = useToastState();

  return (
    <ToastContext.Provider value={{ toast, toasts, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} position="top-center" />
    </ToastContext.Provider>
  );
}
