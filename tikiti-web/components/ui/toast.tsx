'use client';

import { useEffect, useState } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastProps {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  onDismiss?: (id: string) => void;
}

export function Toast({ id, title, description, variant = 'default', onDismiss }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(showTimer);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss?.(id);
    }, 200);
  };

  const getIcon = () => {
    switch (variant) {
      case 'success':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-green-600" />
          </div>
        );
      case 'destructive':
        return (
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center shrink-0">
            <Check className="w-5 h-5 text-white" />
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-[20px] shadow-2xl border border-black/5 p-4 flex items-center gap-4 min-w-[320px] max-w-[420px] transition-all duration-200',
        isVisible && !isLeaving ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4',
        variant === 'destructive' && 'border-red-100',
        variant === 'success' && 'border-green-100'
      )}
      style={{
        fontFamily: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={cn(
            'font-semibold text-base',
            variant === 'destructive' ? 'text-red-900' : 'text-[#333]'
          )}>
            {title}
          </p>
        )}
        {description && (
          <p className={cn(
            'text-sm mt-0.5',
            variant === 'destructive' ? 'text-red-700' : 'text-[#86868b]'
          )}>
            {description}
          </p>
        )}
      </div>
      <button
        onClick={handleDismiss}
        className="w-8 h-8 rounded-full bg-[#f0f0f0] flex items-center justify-center hover:bg-[#e8e8e8] transition-colors shrink-0"
      >
        <X className="w-4 h-4 text-[#333]" />
      </button>
    </div>
  );
}

export interface ToastContainerProps {
  toasts: Array<{
    id: string;
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success';
  }>;
  onDismiss?: (id: string) => void;
  position?: 'top-center' | 'bottom-center' | 'top-right' | 'bottom-right';
}

export function ToastContainer({ toasts, onDismiss, position = 'top-center' }: ToastContainerProps) {
  const positionClasses = {
    'top-center': 'top-6 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
    'top-right': 'top-6 right-6',
    'bottom-right': 'bottom-6 right-6',
  };

  if (toasts.length === 0) return null;

  return (
    <div className={cn('fixed z-50', positionClasses[position])}>
      <div className="flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            description={toast.description}
            variant={toast.variant}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
}
