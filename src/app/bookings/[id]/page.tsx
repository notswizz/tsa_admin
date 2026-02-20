'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { bookingService, availabilityService } from '@/lib/firebase/service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { formatDateShort } from '@/lib/utils/dates';
import { totalNeeded, totalAssigned, fillRatio, getAvailableStaff, autoAssign } from '@/lib/utils/booking';
import type { Availability, DateNeed, Booking } from '@/types';

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { bookings, clients, shows, staff } = useStore();

  const booking = bookings.find((b) => b.id === id);
  const client = clients.find((c) => c.id === booking?.clientId);
  const show = shows.find((s) => s.id === booking?.showId);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [datesNeeded, setDatesNeeded] = useState<DateNeed[]>([]);
  const [status, setStatus] = useState<Booking['status']>('pending');
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  useEffect(() => {
    if (booking) {
      setDatesNeeded(booking.datesNeeded.map((d) => ({ ...d, staffIds: [...d.staffIds] })));
      setStatus(booking.status);
    }
  }, [booking]);

  useEffect(() => {
    if (booking?.showId) {
      availabilityService.getByShow(booking.showId).then(setAvailabilities);
    }
  }, [booking?.showId]);

  function assignStaff(date: string, slotIndex: number, staffId: string) {
    setDatesNeeded((prev) => prev.map((d) => {
      if (d.date !== date) return d;
      const staffIds = [...d.staffIds];
      staffIds[slotIndex] = staffId;
      return { ...d, staffIds };
    }));
  }

  function handleAutoAssign() {
    if (!booking) return;
    const result = autoAssign(datesNeeded, booking.showId, availabilities, bookings, booking.id);
    setDatesNeeded(result);
    toast('info', 'Auto-assigned staff');
  }

  async function save() {
    if (!booking) return;
    setSaving(true);
    try {
      await bookingService.update(id, { datesNeeded, status });
      toast('success', 'Booking updated');
      setEditing(false);
    } catch {
      toast('error', 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  function getStaffName(staffId: string) {
    return staff.find((s) => s.id === staffId)?.name || 'Unknown';
  }

  if (!booking) {
    return <div className="text-center py-12 text-slate-400">Booking not found</div>;
  }

  const needed = totalNeeded(booking);
  const assigned = totalAssigned(booking);
  const fill = fillRatio(booking);

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-slate-600">← Back</button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy-heading">
            {client?.companyName || client?.name || 'Unknown Client'}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <Link href={`/shows/${booking.showId}`} className="text-sm text-pink-dark hover:underline">
              {show?.name || 'Unknown Show'}
            </Link>
            <Badge status={booking.status}>{booking.status}</Badge>
            {booking.paymentStatus && <Badge variant="slate">{booking.paymentStatus}</Badge>}
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => { setEditing(false); setDatesNeeded(booking.datesNeeded); }}>
                Cancel
              </Button>
              <Button size="sm" onClick={save} loading={saving}>Save</Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <div className="text-xs text-slate-400">Staff Needed</div>
          <div className="text-2xl font-bold text-navy">{needed}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-400">Assigned</div>
          <div className="text-2xl font-bold text-navy">{assigned}</div>
        </Card>
        <Card>
          <div className="text-xs text-slate-400">Fill Rate</div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-navy">{Math.round(fill * 100)}%</div>
            <div className="flex-1 bg-slate-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${fill < 0.5 ? 'bg-red-400' : fill < 1 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${fill * 100}%` }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Status editor */}
      {editing && (
        <Card>
          <div className="flex items-center gap-4">
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Booking['status'])}
              options={[
                { value: 'pending', label: 'Pending' },
                { value: 'confirmed', label: 'Confirmed' },
                { value: 'completed', label: 'Completed' },
                { value: 'cancelled', label: 'Cancelled' },
              ]}
            />
            <div className="pt-6">
              <Button variant="secondary" size="sm" onClick={handleAutoAssign}>⚡ Auto-Assign</Button>
            </div>
          </div>
        </Card>
      )}

      {/* Date-by-date breakdown */}
      <Card>
        <h2 className="text-lg font-semibold text-navy-heading mb-4">Staff Assignments</h2>
        <div className="space-y-4">
          {(editing ? datesNeeded : booking.datesNeeded).map((dn) => {
            const availableIds = editing
              ? getAvailableStaff(dn.date, booking.showId, availabilities, bookings, booking.id, dn)
              : [];

            return (
              <div key={dn.date} className="p-4 rounded-xl bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-navy">{formatDateShort(dn.date)}</span>
                  <span className="text-xs text-slate-500">
                    {dn.staffIds.filter(Boolean).length}/{dn.staffCount} assigned
                  </span>
                </div>
                <div className="space-y-1.5">
                  {Array.from({ length: dn.staffCount }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-5">{i + 1}.</span>
                      {editing ? (
                        <select
                          value={dn.staffIds[i] || ''}
                          onChange={(e) => assignStaff(dn.date, i, e.target.value)}
                          className="flex-1 px-3 py-1.5 text-sm rounded-lg ring-1 ring-slate-200 bg-white"
                        >
                          <option value="">Unassigned</option>
                          {dn.staffIds[i] && !availableIds.includes(dn.staffIds[i]) && (
                            <option value={dn.staffIds[i]}>{getStaffName(dn.staffIds[i])} (assigned)</option>
                          )}
                          {availableIds.map((sid) => (
                            <option key={sid} value={sid}>{getStaffName(sid)}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`text-sm ${dn.staffIds[i] ? 'text-navy' : 'text-slate-300 italic'}`}>
                          {dn.staffIds[i] ? (
                            <Link href={`/staff/${dn.staffIds[i]}`} className="hover:text-pink-dark">
                              {getStaffName(dn.staffIds[i])}
                            </Link>
                          ) : 'Unassigned'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Notes */}
      {booking.notes && (
        <Card>
          <h2 className="text-lg font-semibold text-navy-heading mb-2">Notes</h2>
          <p className="text-sm text-slate-600">{booking.notes}</p>
        </Card>
      )}
    </div>
  );
}
