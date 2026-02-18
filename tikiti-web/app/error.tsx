'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#fefff7] flex items-center justify-center px-6">
      <div className="text-center max-w-[480px]">
        <div className="w-[80px] h-[80px] bg-[#f0f0f0] rounded-[24px] flex items-center justify-center mx-auto mb-8">
          <span className="text-[36px]">!</span>
        </div>
        <h1 className="text-[36px] font-extrabold text-[#333] mb-4">Something went wrong</h1>
        <p className="text-[16px] text-[#86868b] mb-8">
          We encountered an unexpected error. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="bg-[#333] text-white text-[15px] font-semibold px-6 py-3 rounded-full hover:bg-[#1a1a1a] transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
