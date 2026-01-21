'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { BoardPost } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface BoardTabProps {
  taskSlug: string;
}

export function BoardTab({ taskSlug }: BoardTabProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BoardPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BoardPost | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskSlug}/board`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [taskSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskSlug}/board`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setFormData({ title: '', content: '' });
        setShowForm(false);
        fetchPosts();
      }
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/tasks/${taskSlug}/board/${postId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setPosts(posts.filter(p => p.id !== postId));
        if (selectedPost?.id === postId) {
          setSelectedPost(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 skeleton rounded-xl" />
        ))}
      </div>
    );
  }

  // Post detail view
  if (selectedPost) {
    return (
      <PostDetail
        taskSlug={taskSlug}
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
        onDelete={() => handleDelete(selectedPost.id)}
        currentUserId={user?.id}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">자유 토론</h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            참가자들과 자유롭게 의견을 나눠보세요
          </p>
        </div>
        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            글쓰기
          </button>
        )}
      </div>

      {/* Post Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--background-subtle)] rounded-xl p-5 space-y-4 border border-[var(--border-subtle)]">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">제목</label>
            <input
              type="text"
              placeholder="제목을 입력하세요"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">내용</label>
            <textarea
              placeholder="내용을 입력하세요..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="input resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="btn btn-ghost"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.title.trim() || !formData.content.trim()}
              className="btn btn-primary"
            >
              {submitting ? '작성 중...' : '등록'}
            </button>
          </div>
        </form>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-accent)]/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[var(--brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">아직 게시글이 없습니다</h3>
          <p className="text-[var(--text-tertiary)] text-center max-w-sm">
            {user ? '첫 번째 글을 작성해보세요!' : '로그인하면 글을 작성할 수 있습니다.'}
          </p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)]">
          {posts.map((post, index) => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className={`p-4 hover:bg-[var(--background-subtle)] cursor-pointer transition-colors ${
                index !== posts.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {post.is_pinned && (
                      <span className="badge badge-warning">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a.75.75 0 01.75.75v1.053L15 6.107V4.75a.75.75 0 011.5 0V17.25a.75.75 0 01-1.5 0V7.608l-4.25-2.304V14.5a.75.75 0 01-1.5 0V5.303l-4.25 2.305v9.642a.75.75 0 01-1.5 0V4.75a.75.75 0 011.5 0v1.357L9.25 3.803V2.75A.75.75 0 0110 2z"/>
                        </svg>
                        고정
                      </span>
                    )}
                    <h4 className="text-sm font-medium text-[var(--text-primary)] truncate hover:text-[var(--brand-primary)] transition-colors">
                      {post.title}
                    </h4>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <span className="font-medium text-[var(--text-secondary)]">
                      {post.author?.cohort && `${post.author.cohort}기 `}
                      {post.author?.name || post.author?.username || '익명'}
                    </span>
                    <span className="text-[var(--border)]">·</span>
                    <span>{formatRelativeTime(post.created_at)}</span>
                    {(post.comments_count ?? 0) > 0 && (
                      <>
                        <span className="text-[var(--border)]">·</span>
                        <span className="text-[var(--brand-primary)] font-medium">
                          <svg className="w-3.5 h-3.5 inline mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          {post.comments_count}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <svg className="w-5 h-5 text-[var(--text-tertiary)] flex-shrink-0 ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Post Detail Component
interface PostDetailProps {
  taskSlug: string;
  post: BoardPost;
  onBack: () => void;
  onDelete: () => void;
  currentUserId?: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author?: {
    id: string;
    username: string | null;
    name: string | null;
    cohort: number | null;
  };
  replies?: Comment[];
}

function PostDetail({ taskSlug, post, onBack, onDelete, currentUserId }: PostDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskSlug}/board/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskSlug}/board/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });

      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isAuthor = currentUserId === post.author_id;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium text-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        목록으로
      </button>

      {/* Post content */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{post.title}</h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center text-white text-xs font-medium">
                {(post.author?.name || post.author?.username || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-medium text-[var(--text-secondary)]">
                  {post.author?.cohort && `${post.author.cohort}기 `}
                  {post.author?.name || post.author?.username || '익명'}
                </span>
                <span className="mx-2 text-[var(--border)]">·</span>
                <span>{formatRelativeTime(post.created_at)}</span>
              </div>
            </div>
          </div>
          {isAuthor && (
            <button
              onClick={onDelete}
              className="text-[var(--error)] hover:text-[var(--error)]/80 text-sm font-medium transition-colors"
            >
              삭제
            </button>
          )}
        </div>
        <div className="mt-6 text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
          {post.content}
        </div>
      </div>

      {/* Comments section */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          댓글 ({comments.length})
        </h3>

        {/* Comment form */}
        {currentUserId && (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <textarea
              placeholder="댓글을 입력하세요..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              className="input resize-none"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="btn btn-primary btn-sm"
              >
                {submitting ? '작성 중...' : '댓글 등록'}
              </button>
            </div>
          </form>
        )}

        {/* Comments list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 skeleton rounded-lg" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-tertiary)]">아직 댓글이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <div key={comment.id} className={`pb-4 ${index !== comments.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}`}>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-[var(--background-subtle)] flex items-center justify-center text-[var(--text-tertiary)] text-xs font-medium">
                    {(comment.author?.name || comment.author?.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-[var(--text-primary)]">
                    {comment.author?.cohort && `${comment.author.cohort}기 `}
                    {comment.author?.name || comment.author?.username || '익명'}
                  </span>
                  <span className="text-[var(--border)]">·</span>
                  <span className="text-[var(--text-tertiary)]">{formatRelativeTime(comment.created_at)}</span>
                </div>
                <p className="mt-2 ml-8 text-[var(--text-secondary)]">{comment.content}</p>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 ml-8 pl-4 border-l-2 border-[var(--brand-primary)]/20 space-y-3">
                    {comment.replies.map(reply => (
                      <div key={reply.id}>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 rounded-full bg-[var(--background-subtle)] flex items-center justify-center text-[var(--text-tertiary)] text-[10px] font-medium">
                            {(reply.author?.name || reply.author?.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-[var(--text-primary)]">
                            {reply.author?.cohort && `${reply.author.cohort}기 `}
                            {reply.author?.name || reply.author?.username || '익명'}
                          </span>
                          <span className="text-[var(--border)]">·</span>
                          <span className="text-[var(--text-tertiary)]">{formatRelativeTime(reply.created_at)}</span>
                        </div>
                        <p className="mt-1 ml-7 text-sm text-[var(--text-secondary)]">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
