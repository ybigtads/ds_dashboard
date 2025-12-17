'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Doc } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export default function DocDetailPage({ params }: Props) {
  const { slug } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [doc, setDoc] = useState<Doc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await fetch(`/api/docs/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setDoc(data);
        }
      } catch (error) {
        console.error('Failed to fetch doc:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [slug]);

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/docs/${slug}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        router.push('/docs');
      }
    } catch (error) {
      console.error('Failed to delete doc:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <p className="text-gray-500">문서를 찾을 수 없습니다.</p>
          <Link
            href="/docs"
            className="inline-block mt-4 text-blue-600 hover:text-blue-800"
          >
            문서 목록으로
          </Link>
        </div>
      </div>
    );
  }

  const isAuthor = user?.id === doc.author_id;
  const isAdmin = user?.role === 'admin' || user?.is_admin;
  const canEdit = isAuthor || isAdmin;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/docs"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        문서 목록
      </Link>

      <article className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              {doc.category && (
                <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mb-2">
                  {doc.category}
                </span>
              )}
              <h1 className="text-3xl font-bold text-gray-900">{doc.title}</h1>
              <div className="mt-2 text-sm text-gray-500">
                {doc.author?.cohort && `${doc.author.cohort}기 `}
                {doc.author?.name || doc.author?.username || '익명'}
                <span className="mx-2">&middot;</span>
                {formatRelativeTime(doc.created_at)}
                {doc.updated_at !== doc.created_at && (
                  <>
                    <span className="mx-2">&middot;</span>
                    수정됨
                  </>
                )}
              </div>
            </div>
            {canEdit && (
              <div className="flex gap-2">
                <Link
                  href={`/docs/${slug}/edit`}
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  수정
                </Link>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  삭제
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">
              {doc.content}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
