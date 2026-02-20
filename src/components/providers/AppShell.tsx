'use client';

import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFirestoreSubscriptions } from '@/hooks/useFirestore';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useStore } from '@/lib/store';

export function AppShell({ children }: { children: ReactNode }) {
  const { admin, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const { chatOpen, setChatOpen } = useStore();

  useFirestoreSubscriptions();
  useCommandPalette();

  // Login page — no shell
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-dark border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not authenticated
  if (!admin) {
    if (typeof window !== 'undefined') router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="lg:ml-64">
        <Header />
        <main className="p-6 pb-24 lg:pb-6">{children}</main>
      </div>
      <MobileNav />
      <CommandPalette />

      {/* Chat FAB */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-20 lg:bottom-6 right-6 z-30 w-14 h-14 bg-pink-dark text-white rounded-full shadow-lg
          flex items-center justify-center hover:bg-pink-dark/90 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>
      {chatOpen && <ChatPanel onClose={() => setChatOpen(false)} />}
    </div>
  );
}
