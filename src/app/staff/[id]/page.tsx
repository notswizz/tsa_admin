'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { staffService, availabilityService } from '@/lib/firebase/service';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils/dates';
import type { Staff, Availability } from '@/types';

export default function StaffDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const { staff, bookings, shows } = useStore();
  const person = staff.find((s) => s.id === id);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Staff>>({});
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  useEffect(() => {
    if (person) setForm(person);
  }, [person]);

  useEffect(() => {
    availabilityService.getByStaff(id).then(setAvailabilities);
  }, [id]);

  const staffBookings = useMemo(
    () => bookings.filter((b) => b.datesNeeded.some((d) => d.staffIds.includes(id))),
    [bookings, id]
  );

  async function save() {
    setSaving(true);
    try {
      const { id: _, createdAt: _c, updatedAt: _u, ...data } = form as Staff;
      await staffService.update(id, data);
      toast('success', 'Staff updated');
      setEditing(false);
    } catch {
      toast('error', 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function toggleApproval() {
    try {
      await staffService.update(id, { applicationFormApproved: !person?.applicationFormApproved });
      toast('success', person?.applicationFormApproved ? 'Application rejected' : 'Application approved');
    } catch {
      toast('error', 'Failed to update');
    }
  }

  if (!person) {
    return <div className="text-center py-12 text-slate-400">Staff member not found</div>;
  }

  const fields = [
    { label: 'Email', key: 'email' as const },
    { label: 'Phone', key: 'phone' as const },
    { label: 'Location', key: 'location' as const },
    { label: 'Address', key: 'address' as const },
    { label: 'College', key: 'college' as const },
    { label: 'Dress Size', key: 'dressSize' as const },
    { label: 'Shoe Size', key: 'shoeSize' as const },
    { label: 'Instagram', key: 'instagram' as const },
    { label: 'Role', key: 'role' as const },
    { label: 'Pay Rate', key: 'payRate' as const },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-slate-600">← Back</button>

      {/* Header */}
      <div className="flex items-start gap-6">
        <Avatar src={person.headshotURL} name={person.name} size="lg" status={person.applicationFormApproved ? 'approved' : 'pending'} />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-navy-heading">{person.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={person.applicationFormApproved ? 'emerald' : 'amber'}>
              {person.applicationFormApproved ? 'Approved' : 'Pending'}
            </Badge>
            <span className="text-sm text-slate-400">{person.location}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={person.applicationFormApproved ? 'danger' : 'primary'}
            size="sm"
            onClick={toggleApproval}
          >
            {person.applicationFormApproved ? 'Reject' : 'Approve'}
          </Button>
          {editing ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={save} loading={saving}>Save</Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
          )}
        </div>
      </div>

      {/* Profile */}
      <Card>
        <h2 className="text-lg font-semibold text-navy-heading mb-4">Profile</h2>
        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            {fields.map((f) => (
              <Input
                key={f.key}
                label={f.label}
                value={String(form[f.key] || '')}
                onChange={(e) => setForm({ ...form, [f.key]: f.key === 'payRate' ? Number(e.target.value) : e.target.value })}
                type={f.key === 'payRate' ? 'number' : 'text'}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((f) => (
              <div key={f.key}>
                <div className="text-xs text-slate-400">{f.label}</div>
                <div className="text-sm font-medium text-navy">
                  {f.key === 'payRate' ? `$${person[f.key]}/hr` : (person[f.key] || '—')}
                </div>
              </div>
            ))}
          </div>
        )}
        {(person.resumeURL || person.headshotURL) && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
            {person.resumeURL && (
              <a href={person.resumeURL} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-dark hover:underline">
                📄 View Resume
              </a>
            )}
            {person.headshotURL && (
              <a href={person.headshotURL} target="_blank" rel="noopener noreferrer" className="text-sm text-pink-dark hover:underline">
                📸 View Headshot
              </a>
            )}
          </div>
        )}
      </Card>

      {/* Booking History */}
      <Card>
        <h2 className="text-lg font-semibold text-navy-heading mb-4">Booking History ({staffBookings.length})</h2>
        <div className="space-y-2">
          {staffBookings.length === 0 && <p className="text-sm text-slate-400">No bookings yet</p>}
          {staffBookings.map((b) => {
            const show = shows.find((s) => s.id === b.showId);
            const assignedDates = b.datesNeeded.filter((d) => d.staffIds.includes(id)).map((d) => d.date);
            return (
              <Link key={b.id} href={`/bookings/${b.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50">
                <div>
                  <span className="text-sm font-medium text-navy">{show?.name || 'Unknown'}</span>
                  <div className="text-xs text-slate-400">{assignedDates.length} days</div>
                </div>
                <Badge status={b.status}>{b.status}</Badge>
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Availability */}
      <Card>
        <h2 className="text-lg font-semibold text-navy-heading mb-4">Availability Submissions</h2>
        <div className="space-y-3">
          {availabilities.length === 0 && <p className="text-sm text-slate-400">No availability submitted</p>}
          {availabilities.map((a) => (
            <div key={a.id} className="p-3 rounded-xl bg-slate-50">
              <div className="font-medium text-sm text-navy">{a.showName}</div>
              <div className="text-xs text-slate-400 mt-1">
                {a.availableDates.map((d) => formatDate(d)).join(', ')}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
