'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Question } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface QuestionsTabProps {
  taskSlug: string;
}

export function QuestionsTab({ taskSlug }: QuestionsTabProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskSlug}/questions`);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [taskSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskSlug}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setFormData({ title: '', content: '' });
        setShowForm(false);
        fetchQuestions();
      }
    } catch (error) {
      console.error('Failed to create question:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/tasks/${taskSlug}/questions/${questionId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setQuestions(questions.filter(q => q.id !== questionId));
        if (selectedQuestion?.id === questionId) {
          setSelectedQuestion(null);
        }
      }
    } catch (error) {
      console.error('Failed to delete question:', error);
    }
  };

  const handleResolve = async (questionId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskSlug}/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_resolved: true })
      });

      if (res.ok) {
        fetchQuestions();
        if (selectedQuestion?.id === questionId) {
          setSelectedQuestion({ ...selectedQuestion, is_resolved: true });
        }
      }
    } catch (error) {
      console.error('Failed to resolve question:', error);
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

  // Question detail view
  if (selectedQuestion) {
    return (
      <QuestionDetail
        taskSlug={taskSlug}
        question={selectedQuestion}
        onBack={() => setSelectedQuestion(null)}
        onDelete={() => handleDelete(selectedQuestion.id)}
        onResolve={() => handleResolve(selectedQuestion.id)}
        currentUserId={user?.id}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Q&A ({questions.length})
        </h3>
        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            질문하기
          </button>
        )}
      </div>

      {/* Question Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 rounded-lg p-4 space-y-3">
          <input
            type="text"
            placeholder="질문 제목"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            maxLength={200}
          />
          <textarea
            placeholder="질문 내용을 상세히 작성해주세요..."
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
              {submitting ? '작성 중...' : '질문 등록'}
            </button>
          </div>
        </form>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          아직 질문이 없습니다.
          {user && ' 첫 번째 질문을 작성해보세요!'}
        </div>
      ) : (
        <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg bg-white">
          {questions.map(question => (
            <div
              key={question.id}
              onClick={() => setSelectedQuestion(question)}
              className="p-4 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {question.is_resolved && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                        해결됨
                      </span>
                    )}
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {question.title}
                    </h4>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {question.author?.cohort && `${question.author.cohort}기 `}
                      {question.author?.name || question.author?.username || '익명'}
                    </span>
                    <span>&middot;</span>
                    <span>{formatRelativeTime(question.created_at)}</span>
                    {(question.answers_count ?? 0) > 0 && (
                      <>
                        <span>&middot;</span>
                        <span className="text-blue-600">답변 {question.answers_count}</span>
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

// Question Detail Component
interface QuestionDetailProps {
  taskSlug: string;
  question: Question;
  onBack: () => void;
  onDelete: () => void;
  onResolve: () => void;
  currentUserId?: string;
}

interface Answer {
  id: string;
  content: string;
  created_at: string;
  author_id: string;
  author?: {
    id: string;
    username: string | null;
    name: string | null;
    cohort: number | null;
    role?: string;
  };
}

function QuestionDetail({ taskSlug, question, onBack, onDelete, onResolve, currentUserId }: QuestionDetailProps) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAnswer, setNewAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAnswers = async () => {
    try {
      const res = await fetch(`/api/tasks/${taskSlug}/questions/${question.id}/answers`);
      if (res.ok) {
        const data = await res.json();
        setAnswers(data);
      }
    } catch (error) {
      console.error('Failed to fetch answers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnswers();
  }, [question.id]);

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tasks/${taskSlug}/questions/${question.id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newAnswer })
      });

      if (res.ok) {
        setNewAnswer('');
        fetchAnswers();
      }
    } catch (error) {
      console.error('Failed to create answer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const isAuthor = currentUserId === question.author_id;

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

      {/* Question content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              {question.is_resolved && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                  해결됨
                </span>
              )}
              <h2 className="text-xl font-semibold text-gray-900">{question.title}</h2>
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {question.author?.cohort && `${question.author.cohort}기 `}
              {question.author?.name || question.author?.username || '익명'}
              <span className="mx-2">&middot;</span>
              {formatRelativeTime(question.created_at)}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthor && !question.is_resolved && (
              <button
                onClick={onResolve}
                className="text-green-600 hover:text-green-800 text-sm"
              >
                해결됨 표시
              </button>
            )}
            {isAuthor && (
              <button
                onClick={onDelete}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                삭제
              </button>
            )}
          </div>
        </div>
        <div className="mt-4 text-gray-700 whitespace-pre-wrap">
          {question.content}
        </div>
      </div>

      {/* Answers section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          답변 ({answers.length})
        </h3>

        {/* Answer form */}
        {currentUserId && (
          <form onSubmit={handleSubmitAnswer} className="mb-6">
            <textarea
              placeholder="답변을 작성해주세요..."
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newAnswer.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? '작성 중...' : '답변 등록'}
              </button>
            </div>
          </form>
        )}

        {/* Answers list */}
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-gray-100 rounded" />
            ))}
          </div>
        ) : answers.length === 0 ? (
          <p className="text-gray-500 text-center py-4">아직 답변이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {answers.map(answer => (
              <div key={answer.id} className="border-b border-gray-100 pb-4 last:border-0">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium text-gray-900">
                    {answer.author?.cohort && `${answer.author.cohort}기 `}
                    {answer.author?.name || answer.author?.username || '익명'}
                  </span>
                  {(answer.author?.role === 'admin' || answer.author?.role === 'creator') && (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      answer.author.role === 'admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {answer.author.role === 'admin' ? 'Admin' : 'Creator'}
                    </span>
                  )}
                  <span className="text-gray-400">&middot;</span>
                  <span className="text-gray-500">{formatRelativeTime(answer.created_at)}</span>
                </div>
                <p className="mt-2 text-gray-700 whitespace-pre-wrap">{answer.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
