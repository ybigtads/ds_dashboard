'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { Doc } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

export default function DocsPage() {
  const { user } = useAuth();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('전체');

  const categories = ['전체', 'PyTorch', 'VESSL', '가이드', '기타'];

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const params = selectedCategory !== '전체' ? `?category=${selectedCategory}` : '';
        const res = await fetch(`/api/docs${params}`);
        if (res.ok) {
          const data = await res.json();
          setDocs(data);
        }
      } catch (error) {
        console.error('Failed to fetch docs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 sm:mb-0">Docs</h1>
        {user && (
          <Link
            href="/docs/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            문서 작성
          </Link>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-5xl mb-4">📄</div>
          <p className="text-gray-500">아직 문서가 없습니다.</p>
          {user && (
            <Link
              href="/docs/new"
              className="inline-block mt-4 text-blue-600 hover:text-blue-800"
            >
              첫 번째 문서 작성하기
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {docs.map(doc => (
            <Link
              key={doc.id}
              href={`/docs/${doc.slug}`}
              className="block bg-white rounded-lg shadow p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {doc.category && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {doc.category}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {doc.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {doc.content.substring(0, 150)}...
                  </p>
                  <p className="text-xs text-gray-400">
                    {doc.author?.cohort && `${doc.author.cohort}기 `}
                    {doc.author?.name || doc.author?.username || '익명'}
                    <span className="mx-1">&middot;</span>
                    {formatRelativeTime(doc.created_at)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
