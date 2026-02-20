'use client';

import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/lib/store';

export function Header() {
  const { admin, signOut } = useAuth();
  const { setSidebarOpen } = useStore();

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center px-6 gap-4">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1" />

      {/* Admin info */}
      {admin && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 hidden sm:inline">{admin.name}</span>
          <button
            onClick={signOut}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </header>
  );
}
