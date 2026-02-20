'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { searchEntities } from '@/lib/utils/search';

export default function SMSPage() {
  const { staff } = useStore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return staff.filter((s) => s.phone);
    return searchEntities(staff.filter((s) => s.phone), search, ['name', 'location', 'phone']);
  }, [staff, search]);

  function toggleStaff(id: string) {
    setSelectedStaff((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelectedStaff(filtered.map((s) => s.id));
  }

  async function handleSend() {
    if (!message.trim() || selectedStaff.length === 0) return;
    setSending(true);
    try {
      const phones = selectedStaff
        .map((id) => staff.find((s) => s.id === id)?.phone)
        .filter(Boolean);

      const res = await fetch('/api/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phones, message }),
      });

      if (!res.ok) throw new Error('Failed to send');
      toast('success', `SMS sent to ${phones.length} staff`);
      setMessage('');
      setSelectedStaff([]);
    } catch {
      toast('error', 'Failed to send SMS');
    } finally {
      setSending(false);
    }
  }

  const templates = [
    'You\'ve been booked for {show} on {dates}. Please confirm your availability.',
    'Reminder: {show} starts tomorrow. Please arrive at {venue} by 8am.',
    'Your payment for {show} has been processed. Thank you!',
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-navy-heading">Send SMS</h1>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Staff selection */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-navy-heading">Recipients</h2>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-pink-dark hover:underline">Select all</button>
              <button onClick={() => setSelectedStaff([])} className="text-xs text-slate-400 hover:underline">Clear</button>
            </div>
          </div>
          <Input placeholder="Search staff…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="mt-3 max-h-80 overflow-y-auto space-y-1">
            {filtered.map((s) => (
              <label
                key={s.id}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedStaff.includes(s.id) ? 'bg-pink-light/10' : 'hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedStaff.includes(s.id)}
                  onChange={() => toggleStaff(s.id)}
                  className="rounded border-slate-300"
                />
                <div>
                  <div className="text-sm font-medium text-navy">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.phone} · {s.location}</div>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-3 text-xs text-slate-400">{selectedStaff.length} selected</div>
        </Card>

        {/* Message */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-lg font-semibold text-navy-heading mb-4">Message</h2>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message…"
              className="min-h-[120px]"
            />
            <div className="text-xs text-slate-400 mt-2">{message.length} characters</div>
            <Button
              className="w-full mt-4"
              onClick={handleSend}
              loading={sending}
              disabled={!message.trim() || selectedStaff.length === 0}
            >
              Send to {selectedStaff.length} {selectedStaff.length === 1 ? 'person' : 'people'}
            </Button>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-navy-heading mb-3">Templates</h3>
            <div className="space-y-2">
              {templates.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setMessage(t)}
                  className="block w-full text-left p-2 text-xs text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
