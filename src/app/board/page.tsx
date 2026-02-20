'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { boardService } from '@/lib/firebase/service';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import type { BoardPost, BoardReply } from '@/types';

export default function BoardPage() {
  const { admin } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, BoardReply[]>>({});
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    const unsub = boardService.subscribePosts(setPosts);
    return unsub;
  }, []);

  useEffect(() => {
    if (!expandedPost) return;
    const unsub = boardService.subscribeReplies(expandedPost, (r) => {
      setReplies((prev) => ({ ...prev, [expandedPost]: r }));
    });
    return unsub;
  }, [expandedPost]);

  const filtered = posts.filter((p) => {
    if (filter === 'open') return !p.completed;
    if (filter === 'closed') return p.completed;
    return true;
  });

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!newPost.trim() || !admin) return;
    setPosting(true);
    try {
      await boardService.createPost({
        text: newPost,
        mentions: [],
        createdBy: admin.name,
        completed: false,
      });
      setNewPost('');
      toast('success', 'Post created');
    } catch {
      toast('error', 'Failed to post');
    } finally {
      setPosting(false);
    }
  }

  async function toggleComplete(post: BoardPost) {
    await boardService.updatePost(post.id, { completed: !post.completed });
  }

  async function handleReply(postId: string) {
    if (!replyText.trim() || !admin) return;
    try {
      await boardService.createReply({
        postId,
        parentId: null,
        text: replyText,
        mentions: [],
        createdBy: admin.name,
      });
      setReplyText('');
    } catch {
      toast('error', 'Failed to reply');
    }
  }

  function formatTimestamp(ts: { seconds: number } | undefined) {
    if (!ts) return '';
    return new Date(ts.seconds * 1000).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
    });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-navy-heading">Message Board</h1>

      {/* New post */}
      <Card>
        <form onSubmit={handlePost} className="flex gap-3">
          <input
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Write a message…"
            className="flex-1 px-4 py-2 text-sm rounded-lg ring-1 ring-slate-200 focus:ring-2 focus:ring-pink-medium outline-none"
          />
          <Button type="submit" loading={posting} disabled={!newPost.trim()}>Post</Button>
        </form>
      </Card>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'open', 'closed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize ${
              filter === f ? 'bg-pink-dark text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-3">
        {filtered.map((post) => (
          <Card key={post.id}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-navy">{post.createdBy}</span>
                  <span className="text-xs text-slate-400">{formatTimestamp(post.createdAt)}</span>
                  {post.completed && <Badge variant="emerald">Done</Badge>}
                </div>
                <p className="text-sm text-slate-600">{post.text}</p>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => toggleComplete(post)}
                  className={`text-xs px-2 py-1 rounded ${post.completed ? 'text-slate-400' : 'text-emerald-600 hover:bg-emerald-50'}`}
                >
                  {post.completed ? 'Reopen' : '✓ Done'}
                </button>
                <button
                  onClick={() => setExpandedPost(expandedPost === post.id ? null : post.id)}
                  className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
                >
                  Replies
                </button>
              </div>
            </div>

            {expandedPost === post.id && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                {(replies[post.id] || []).map((r) => (
                  <div key={r.id} className="pl-4 border-l-2 border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-navy">{r.createdBy}</span>
                      <span className="text-xs text-slate-400">{formatTimestamp(r.createdAt)}</span>
                    </div>
                    <p className="text-sm text-slate-600">{r.text}</p>
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Reply…"
                    className="flex-1 px-3 py-1.5 text-sm rounded-lg ring-1 ring-slate-200 outline-none"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleReply(post.id); }}
                  />
                  <Button size="sm" onClick={() => handleReply(post.id)} disabled={!replyText.trim()}>Reply</Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
