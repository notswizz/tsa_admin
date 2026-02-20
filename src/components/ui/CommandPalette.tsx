'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { fuzzyMatch } from '@/lib/utils/search';

interface SearchResult {
  type: 'staff' | 'client' | 'show' | 'booking';
  id: string;
  label: string;
  sublabel: string;
  href: string;
}

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, staff, clients, shows } = useStore();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const r: SearchResult[] = [];

    for (const s of staff) {
      if (fuzzyMatch(query, s.name) || fuzzyMatch(query, s.email) || fuzzyMatch(query, s.location)) {
        r.push({ type: 'staff', id: s.id, label: s.name, sublabel: `Staff · ${s.location}`, href: `/staff/${s.id}` });
      }
    }
    for (const c of clients) {
      if (fuzzyMatch(query, c.name) || fuzzyMatch(query, c.companyName)) {
        r.push({ type: 'client', id: c.id, label: c.companyName || c.name, sublabel: `Client · ${c.email}`, href: `/clients/${c.id}` });
      }
    }
    for (const s of shows) {
      if (fuzzyMatch(query, s.name) || fuzzyMatch(query, s.location)) {
        r.push({ type: 'show', id: s.id, label: s.name, sublabel: `Show · ${s.location}`, href: `/shows/${s.id}` });
      }
    }

    return r.slice(0, 10);
  }, [query, staff, clients, shows]);

  function navigate(result: SearchResult) {
    setCommandPaletteOpen(false);
    router.push(result.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      navigate(results[selectedIndex]);
    }
  }

  if (!commandPaletteOpen) return null;

  const typeIcons: Record<string, string> = { staff: '👤', client: '🏢', show: '🎪', booking: '📋' };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh]"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden ring-1 ring-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={onKeyDown}
            placeholder="Search staff, clients, shows…"
            className="flex-1 text-sm outline-none bg-transparent placeholder:text-slate-400"
          />
          <kbd className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">esc</kbd>
        </div>
        {results.length > 0 && (
          <ul className="max-h-72 overflow-y-auto py-2">
            {results.map((r, i) => (
              <li
                key={`${r.type}-${r.id}`}
                onClick={() => navigate(r)}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm ${
                  i === selectedIndex ? 'bg-pink-light/20' : 'hover:bg-slate-50'
                }`}
              >
                <span className="text-lg">{typeIcons[r.type]}</span>
                <div>
                  <div className="font-medium text-navy">{r.label}</div>
                  <div className="text-xs text-slate-400">{r.sublabel}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {query && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-400">No results found</div>
        )}
      </div>
    </div>
  );
}
