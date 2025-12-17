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
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg" />
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          자유 토론 ({posts.length})
        </h3>
        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            글쓰기
          </button>
        )}
      </div>

      {/* Post Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-3">
          <input
            type="text"
            placeholder="제목"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            maxLength={200}
          />
          <textarea
            placeholder="내용을 입력하세요..."
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.title.trim() || !formData.content.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? '작성 중...' : '등록'}
            </button>
          </div>
        </form>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          아직 게시글이 없습니다.
          {user && ' 첫 번째 글을 작성해보세요!'}
        </div>
      ) : (
        <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white">
          {posts.map(post => (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
              className="p-4 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {post.is_pinned && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                        고정
                      </span>
                    )}
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {post.title}
                    </h4>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {post.author?.cohort && `${post.author.cohort}기 `}
                      {post.author?.name || post.author?.username || '익명'}
                    </span>
                    <span>&middot;</span>
                    <span>{formatRelativeTime(post.created_at)}</span>
                    {(post.comments_count ?? 0) > 0 && (
                      <>
                        <span>&middot;</span>
                        <span>댓글 {post.comments_count}</span>
                      </>
                    )}
                  </div>
                </div>
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
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-900"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        목록으로
      </button>

      {/* Post content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{post.title}</h2>
            <div className="mt-1 text-sm text-gray-500">
              {post.author?.cohort && `${post.author.cohort}기 `}
              {post.author?.name || post.author?.username || '익명'}
              <span className="mx-2">&middot;</span>
              {formatRelativeTime(post.created_at)}
            </div>
          </div>
          {isAuthor && (
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              삭제
            </button>
          )}
        </div>
        <div className="mt-4 text-gray-700 whitespace-pre-wrap">
          {post.content}
        </div>
      </div>

      {/* Comments section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '작성 중...' : '댓글 등록'}
              </button>
            </div>
          </form>
        )}

        {/* Comments list */}
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-center py-4">아직 댓글이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {comments.map(comment => (
              <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900">
                    {comment.author?.cohort && `${comment.author.cohort}기 `}
                    {comment.author?.name || comment.author?.username || '익명'}
                  </span>
                  <span className="text-gray-400">&middot;</span>
                  <span className="text-gray-500">{formatRelativeTime(comment.created_at)}</span>
                </div>
                <p className="mt-1 text-gray-700">{comment.content}</p>

                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-3 pl-4 border-l-2 border-gray-200 space-y-3">
                    {comment.replies.map(reply => (
                      <div key={reply.id}>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-900">
                            {reply.author?.cohort && `${reply.author.cohort}기 `}
                            {reply.author?.name || reply.author?.username || '익명'}
                          </span>
                          <span className="text-gray-400">&middot;</span>
                          <span className="text-gray-500">{formatRelativeTime(reply.created_at)}</span>
                        </div>
                        <p className="mt-1 text-gray-700">{reply.content}</p>
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
