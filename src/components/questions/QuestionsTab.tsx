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
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 skeleton rounded-xl" />
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">Q&A</h2>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            과제 관련 궁금한 점을 질문해보세요
          </p>
        </div>
        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            질문하기
          </button>
        )}
      </div>

      {/* Question Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--background-subtle)] rounded-xl p-5 space-y-4 border border-[var(--border-subtle)]">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">질문 제목</label>
            <input
              type="text"
              placeholder="질문 제목을 입력하세요"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="input"
              maxLength={200}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">질문 내용</label>
            <textarea
              placeholder="질문 내용을 상세히 작성해주세요..."
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
              {submitting ? '작성 중...' : '질문 등록'}
            </button>
          </div>
        </form>
      )}

      {/* Questions List */}
      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-accent)]/10 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-[var(--brand-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">아직 질문이 없습니다</h3>
          <p className="text-[var(--text-tertiary)] text-center max-w-sm">
            {user ? '첫 번째 질문을 작성해보세요!' : '로그인하면 질문을 작성할 수 있습니다.'}
          </p>
        </div>
      ) : (
        <div className="border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)]">
          {questions.map((question, index) => (
            <div
              key={question.id}
              onClick={() => setSelectedQuestion(question)}
              className={`p-4 hover:bg-[var(--background-subtle)] cursor-pointer transition-colors ${
                index !== questions.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {question.is_resolved ? (
                      <span className="badge badge-success">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        해결됨
                      </span>
                    ) : (
                      <span className="badge badge-primary">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        질문
                      </span>
                    )}
                    <h4 className="text-sm font-medium text-[var(--text-primary)] truncate hover:text-[var(--brand-primary)] transition-colors">
                      {question.title}
                    </h4>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
                    <span className="font-medium text-[var(--text-secondary)]">
                      {question.author?.cohort && `${question.author.cohort}기 `}
                      {question.author?.name || question.author?.username || '익명'}
                    </span>
                    <span className="text-[var(--border)]">·</span>
                    <span>{formatRelativeTime(question.created_at)}</span>
                    {(question.answers_count ?? 0) > 0 && (
                      <>
                        <span className="text-[var(--border)]">·</span>
                        <span className="text-[var(--success)] font-medium">
                          <svg className="w-3.5 h-3.5 inline mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          답변 {question.answers_count}
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

      {/* Question content */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {question.is_resolved ? (
                <span className="badge badge-success">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  해결됨
                </span>
              ) : (
                <span className="badge badge-primary">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  질문
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{question.title}</h2>
            <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-tertiary)]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center text-white text-xs font-medium">
                {(question.author?.name || question.author?.username || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-medium text-[var(--text-secondary)]">
                  {question.author?.cohort && `${question.author.cohort}기 `}
                  {question.author?.name || question.author?.username || '익명'}
                </span>
                <span className="mx-2 text-[var(--border)]">·</span>
                <span>{formatRelativeTime(question.created_at)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 ml-4">
            {isAuthor && !question.is_resolved && (
              <button
                onClick={onResolve}
                className="btn btn-sm bg-[var(--success-light)] text-[var(--success)] hover:bg-[var(--success)]/20 border-0"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                해결됨 표시
              </button>
            )}
            {isAuthor && (
              <button
                onClick={onDelete}
                className="text-[var(--error)] hover:text-[var(--error)]/80 text-sm font-medium transition-colors"
              >
                삭제
              </button>
            )}
          </div>
        </div>
        <div className="mt-6 text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed">
          {question.content}
        </div>
      </div>

      {/* Answers section */}
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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
              className="input resize-none"
            />
            <div className="mt-3 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newAnswer.trim()}
                className="btn btn-primary btn-sm"
              >
                {submitting ? '작성 중...' : '답변 등록'}
              </button>
            </div>
          </form>
        )}

        {/* Answers list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-24 skeleton rounded-lg" />
            ))}
          </div>
        ) : answers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[var(--text-tertiary)]">아직 답변이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map((answer, index) => (
              <div key={answer.id} className={`pb-4 ${index !== answers.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}`}>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full bg-[var(--background-subtle)] flex items-center justify-center text-[var(--text-tertiary)] text-xs font-medium">
                    {(answer.author?.name || answer.author?.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-[var(--text-primary)]">
                    {answer.author?.cohort && `${answer.author.cohort}기 `}
                    {answer.author?.name || answer.author?.username || '익명'}
                  </span>
                  {(answer.author?.role === 'admin' || answer.author?.role === 'creator') && (
                    <span className={`badge ${
                      answer.author.role === 'admin'
                        ? 'badge-primary'
                        : 'badge-success'
                    }`}>
                      {answer.author.role === 'admin' ? 'Admin' : 'Creator'}
                    </span>
                  )}
                  <span className="text-[var(--border)]">·</span>
                  <span className="text-[var(--text-tertiary)]">{formatRelativeTime(answer.created_at)}</span>
                </div>
                <p className="mt-2 ml-9 text-[var(--text-secondary)] whitespace-pre-wrap">{answer.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
