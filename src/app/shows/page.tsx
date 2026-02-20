'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { Table, Column } from '@/components/ui/Table';
import { ShowCalendar } from '@/components/shows/ShowCalendar';
import { formatDateShort } from '@/lib/utils/dates';
import { searchEntities } from '@/lib/utils/search';
import type { Show } from '@/types';

export default function ShowsPage() {
  const { shows, bookings } = useStore();
  const router = useRouter();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = useMemo(() => {
    let result = shows;
    if (search) result = searchEntities(result, search, ['name', 'location', 'venue']);
    if (statusFilter !== 'all') result = result.filter((s) => s.status === statusFilter);
    return result;
  }, [shows, search, statusFilter]);

  const columns: Column<Show>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (s) => <span className="font-medium text-navy">{s.name}</span> },
    { key: 'startDate', header: 'Dates', sortable: true, render: (s) => <span className="text-slate-600">{formatDateShort(s.startDate)} – {formatDateShort(s.endDate)}</span> },
    { key: 'location', header: 'Location', sortable: true },
    { key: 'venue', header: 'Venue', sortable: true },
    { key: 'status', header: 'Status', render: (s) => <Badge status={s.status}>{s.status}</Badge> },
    {
      key: 'bookings', header: 'Bookings',
      render: (s) => {
        const count = bookings.filter((b) => b.showId === s.id && b.status !== 'cancelled').length;
        return <span className="text-slate-600">{count}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-heading">Shows</h1>
        <Link href="/shows/new">
          <Button>+ New Show</Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search shows…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['all', 'upcoming', 'ongoing', 'completed', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium rounded-lg capitalize transition-colors ${
                statusFilter === s ? 'bg-pink-dark text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Tabs
        tabs={[
          { key: 'list', label: 'List' },
          { key: 'calendar', label: 'Calendar' },
        ]}
        active={view}
        onChange={(k) => setView(k as 'list' | 'calendar')}
      />

      {view === 'list' ? (
        <Card padding={false}>
          <Table
            columns={columns}
            data={filtered as (Show & Record<string, unknown>)[]}
            getRowKey={(s) => s.id as string}
            onRowClick={(s) => router.push(`/shows/${s.id}`)}
          />
        </Card>
      ) : (
        <ShowCalendar shows={filtered} />
      )}
    </div>
  );
}
