'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatDateShort, daysFromNow, toDateString } from '@/lib/utils/dates';
import { totalNeeded, totalAssigned } from '@/lib/utils/booking';

export default function DashboardPage() {
  const { staff, shows, bookings, clients } = useStore();

  const stats = useMemo(() => {
    const activeStaff = staff.filter((s) => s.applicationFormApproved).length;
    const today = toDateString(new Date());
    const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30);
    const upcomingShows = shows.filter((s) => s.startDate >= today && s.startDate <= toDateString(thirtyDays)).length;
    const openBookings = bookings.filter((b) =>
      (b.status === 'pending' || b.status === 'confirmed') && totalAssigned(b) < totalNeeded(b)
    ).length;
    return { activeStaff, upcomingShows, openBookings, totalClients: clients.length };
  }, [staff, shows, bookings, clients]);

  const upcomingShowsList = useMemo(() => {
    const today = toDateString(new Date());
    return shows
      .filter((s) => s.startDate >= today && s.status !== 'cancelled')
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(0, 5);
  }, [shows]);

  const staffingGaps = useMemo(() => {
    return bookings
      .filter((b) => b.status !== 'cancelled' && b.status !== 'completed' && totalAssigned(b) < totalNeeded(b))
      .sort((a, b) => {
        const aMin = a.datesNeeded.map((d) => d.date).sort()[0] || 'z';
        const bMin = b.datesNeeded.map((d) => d.date).sort()[0] || 'z';
        return aMin.localeCompare(bMin);
      })
      .slice(0, 8);
  }, [bookings]);

  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => {
        const at = a.updatedAt?.seconds || 0;
        const bt = b.updatedAt?.seconds || 0;
        return bt - at;
      })
      .slice(0, 10);
  }, [bookings]);

  const statCards = [
    { label: 'Active Staff', value: stats.activeStaff, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Upcoming Shows', value: stats.upcomingShows, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Open Bookings', value: stats.openBookings, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Total Clients', value: stats.totalClients, color: 'text-pink-dark', bg: 'bg-pink-50' },
  ];

  function getClientName(clientId: string) {
    return clients.find((c) => c.id === clientId)?.companyName || clients.find((c) => c.id === clientId)?.name || 'Unknown';
  }

  function getShowName(showId: string) {
    return shows.find((s) => s.id === showId)?.name || 'Unknown';
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy-heading">Dashboard</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                <span className={`text-lg font-bold ${s.color}`}>{s.value}</span>
              </div>
              <span className="text-sm text-slate-500">{s.label}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upcoming Shows */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-heading">Upcoming Shows</h2>
            <Link href="/shows" className="text-sm text-pink-dark hover:text-pink-dark/80">View all →</Link>
          </div>
          <div className="space-y-3">
            {upcomingShowsList.length === 0 && <p className="text-sm text-slate-400">No upcoming shows</p>}
            {upcomingShowsList.map((show) => {
              const days = daysFromNow(show.startDate);
              const showBookings = bookings.filter((b) => b.showId === show.id && b.status !== 'cancelled').length;
              return (
                <Link
                  key={show.id}
                  href={`/shows/${show.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <div className="font-medium text-sm text-navy">{show.name}</div>
                    <div className="text-xs text-slate-400">
                      {formatDateShort(show.startDate)} – {formatDateShort(show.endDate)} · {show.location}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">{showBookings} bookings</div>
                    <div className="text-xs text-slate-400">{days <= 0 ? 'Now' : `${days}d away`}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        {/* Staffing Gaps */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-heading">⚠️ Staffing Gaps</h2>
            <Link href="/bookings" className="text-sm text-pink-dark hover:text-pink-dark/80">View all →</Link>
          </div>
          <div className="space-y-3">
            {staffingGaps.length === 0 && <p className="text-sm text-slate-400">All bookings fully staffed! 🎉</p>}
            {staffingGaps.map((booking) => {
              const needed = totalNeeded(booking);
              const assigned = totalAssigned(booking);
              const pct = needed > 0 ? (assigned / needed) * 100 : 100;
              return (
                <Link
                  key={booking.id}
                  href={`/bookings/${booking.id}`}
                  className="block p-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-navy">{getClientName(booking.clientId)}</span>
                    <span className="text-xs text-slate-500">{assigned}/{needed} staff</span>
                  </div>
                  <div className="text-xs text-slate-400 mb-2">{getShowName(booking.showId)}</div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${pct < 50 ? 'bg-red-400' : pct < 100 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h2 className="text-lg font-semibold text-navy-heading mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {recentBookings.length === 0 && <p className="text-sm text-slate-400">No recent activity</p>}
          {recentBookings.map((b) => (
            <Link
              key={b.id}
              href={`/bookings/${b.id}`}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Badge status={b.status}>{b.status}</Badge>
                <div>
                  <span className="text-sm text-navy">{getClientName(b.clientId)}</span>
                  <span className="text-slate-300 mx-2">·</span>
                  <span className="text-sm text-slate-500">{getShowName(b.showId)}</span>
                </div>
              </div>
              <span className="text-xs text-slate-400">
                {b.updatedAt ? formatDate(new Date(b.updatedAt.seconds * 1000).toISOString().split('T')[0]) : ''}
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
