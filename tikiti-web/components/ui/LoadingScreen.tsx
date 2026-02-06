'use client';

import { useEffect, useState, useRef } from 'react';

interface LoadingScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export default function LoadingScreen({ onComplete, duration = 2000 }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const hasCompleted = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, duration / 50);

    return () => clearInterval(interval);
  }, [duration]);

  // Handle completion in a separate effect to avoid setState during render
  useEffect(() => {
    if (progress >= 100 && !hasCompleted.current) {
      hasCompleted.current = true;
      onComplete?.();
    }
  }, [progress, onComplete]);

  return (
    <div className="fixed inset-0 bg-[#fefff7] z-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Logo Text */}
        <h1 className="text-[64px] font-extrabold text-black tracking-tight">
          Tikiti
        </h1>

        {/* Progress Bar */}
        <div className="w-[157px] h-6 bg-[#d9d9d9] rounded-[16px] overflow-hidden">
          <div
            className="h-full bg-black rounded-[16px] transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
