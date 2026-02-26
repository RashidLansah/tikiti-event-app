'use client';

import { useState, useCallback, createContext, useContext } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

interface ToastContextValue {
  toast: (props: Omit<Toast, 'id'>) => void;
  toasts: Toast[];
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastState() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7);
    const newToast: Toast = { id, title, description, variant };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toast, toasts, dismiss };
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback to local state if not wrapped in provider (backwards compatible)
    return useToastState();
  }
  return context;
}
