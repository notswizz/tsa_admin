'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table, Column } from '@/components/ui/Table';
import { totalNeeded, totalAssigned, fillRatio } from '@/lib/utils/booking';
import { formatDateShort } from '@/lib/utils/dates';
import { searchEntities } from '@/lib/utils/search';
import type { Booking } from '@/types';

export default function BookingsPage() {
  const { bookings, clients, shows } = useStore();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const enriched = useMemo(() => {
    return bookings.map((b) => ({
      ...b,
      clientName: clients.find((c) => c.id === b.clientId)?.companyName || clients.find((c) => c.id === b.clientId)?.name || 'Unknown',
      showName: shows.find((s) => s.id === b.showId)?.name || 'Unknown',
      needed: totalNeeded(b),
      assigned: totalAssigned(b),
      fill: fillRatio(b),
    }));
  }, [bookings, clients, shows]);

  const filtered = useMemo(() => {
    let result = enriched;
    if (search) result = searchEntities(result, search, ['clientName', 'showName']);
    if (statusFilter !== 'all') result = result.filter((b) => b.status === statusFilter);
    return result;
  }, [enriched, search, statusFilter]);

  type EnrichedBooking = (typeof enriched)[number];

  const columns: Column<EnrichedBooking>[] = [
    { key: 'clientName', header: 'Client', sortable: true, render: (b) => <span className="font-medium text-navy">{b.clientName}</span> },
    { key: 'showName', header: 'Show', sortable: true },
    {
      key: 'dates', header: 'Dates',
      render: (b) => {
        const dates = b.datesNeeded.map((d) => d.date).sort();
        if (dates.length === 0) return '—';
        return <span className="text-slate-600">{formatDateShort(dates[0])} – {formatDateShort(dates[dates.length - 1])}</span>;
      },
    },
    {
      key: 'staffing', header: 'Staffing',
      render: (b) => (
        <div className="flex items-center gap-2">
          <div className="w-16 bg-slate-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${b.fill < 0.5 ? 'bg-red-400' : b.fill < 1 ? 'bg-amber-400' : 'bg-emerald-400'}`}
              style={{ width: `${b.fill * 100}%` }}
            />
          </div>
          <span className="text-xs text-slate-500">{b.assigned}/{b.needed}</span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (b) => <Badge status={b.status}>{b.status}</Badge> },
    {
      key: 'paymentStatus', header: 'Payment',
      render: (b) => <span className="text-xs text-slate-500">{b.paymentStatus || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-navy-heading">Bookings</h1>
        <Link href="/bookings/new"><Button>+ New Booking</Button></Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input placeholder="Search bookings…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((s) => (
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

      <Card padding={false}>
        <Table
          columns={columns}
          data={filtered as (EnrichedBooking & Record<string, unknown>)[]}
          getRowKey={(b) => b.id as string}
          onRowClick={(b) => router.push(`/bookings/${b.id}`)}
        />
      </Card>
    </div>
  );
}
