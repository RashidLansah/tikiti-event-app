import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fefff7] flex items-center justify-center px-6">
      <div className="text-center max-w-[480px]">
        <div className="w-[80px] h-[80px] bg-[#f0f0f0] rounded-[24px] flex items-center justify-center mx-auto mb-8">
          <span className="text-[36px] font-extrabold text-[#a3a3a3]">?</span>
        </div>
        <h1 className="text-[48px] font-extrabold text-[#333] mb-4">404</h1>
        <p className="text-[18px] text-[#86868b] mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 bg-[#333] text-white text-[15px] font-semibold px-6 py-3 rounded-full hover:bg-[#1a1a1a] transition-colors"
          >
            Go home
          </Link>
          <Link
            href="/events"
            className="flex items-center gap-2 bg-[#f0f0f0] text-[#333] text-[15px] font-semibold px-6 py-3 rounded-full hover:bg-[#e5e5e5] transition-colors"
          >
            Browse events
          </Link>
        </div>
      </div>
    </div>
  );
}
