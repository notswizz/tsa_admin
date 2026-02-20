'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { searchEntities } from '@/lib/utils/search';

export default function StaffPage() {
  const { staff, bookings } = useStore();
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all');

  const locations = useMemo(() => {
    const locs = new Set(staff.map((s) => s.location).filter(Boolean));
    return Array.from(locs).sort();
  }, [staff]);

  const filtered = useMemo(() => {
    let result = staff;
    if (search) result = searchEntities(result, search, ['name', 'email', 'location']);
    if (locationFilter !== 'all') result = result.filter((s) => s.location === locationFilter);
    if (statusFilter === 'approved') result = result.filter((s) => s.applicationFormApproved);
    if (statusFilter === 'pending') result = result.filter((s) => !s.applicationFormApproved);
    return result;
  }, [staff, search, locationFilter, statusFilter]);

  function getBookingCount(staffId: string) {
    return bookings.filter((b) =>
      b.status !== 'cancelled' &&
      b.datesNeeded.some((d) => d.staffIds.includes(staffId))
    ).length;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy-heading">Staff ({staff.length})</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input placeholder="Search staff…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg ring-1 ring-slate-200 bg-white"
        >
          <option value="all">All locations</option>
          {locations.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <div className="flex gap-2">
          {(['all', 'approved', 'pending'] as const).map((s) => (
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((s) => (
          <Link key={s.id} href={`/staff/${s.id}`}>
            <Card className="hover:ring-pink-medium/50 transition-all cursor-pointer">
              <div className="flex items-start gap-3">
                <Avatar
                  src={s.headshotURL}
                  name={s.name}
                  size="lg"
                  status={s.applicationFormApproved ? 'approved' : 'pending'}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-navy truncate">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.location}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={s.applicationFormApproved ? 'emerald' : 'amber'}>
                      {s.applicationFormApproved ? 'Approved' : 'Pending'}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    {getBookingCount(s.id)} bookings · ${s.payRate}/hr
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-400">No staff found</div>
      )}
    </div>
  );
}
