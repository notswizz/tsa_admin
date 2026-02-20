'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { showService } from '@/lib/firebase/service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import type { Show } from '@/types';

export default function NewShowPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', startDate: '', endDate: '', location: '', venue: '',
    description: '', season: '', type: '', status: 'upcoming' as Show['status'],
  });

  function set<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await showService.create(form);
      toast('success', 'Show created');
      router.push('/shows');
    } catch {
      toast('error', 'Failed to create show');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-navy-heading">New Show</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} required />
            <Input label="End Date" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Location" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="New York, NY" />
            <Input label="Venue" value={form.venue} onChange={(e) => set('venue', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Season" value={form.season} onChange={(e) => set('season', e.target.value)} placeholder="SS25" />
            <Input label="Type" value={form.type} onChange={(e) => set('type', e.target.value)} />
          </div>
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => set('status', e.target.value as Show['status'])}
            options={[
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'ongoing', label: 'Ongoing' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <Textarea label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" type="button" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" loading={loading}>Create Show</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
