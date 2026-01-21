import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/[0.02] via-transparent to-[var(--brand-accent)]/[0.03]" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[var(--brand-primary)]/[0.04] to-transparent rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[var(--brand-accent)]/[0.04] to-transparent rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full bg-[var(--brand-primary)]/[0.08] border border-[var(--brand-primary)]/10 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] animate-pulse" />
              <span className="text-xs font-medium text-[var(--brand-primary)]">
                Data Science Competition Platform
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="heading-1 text-4xl sm:text-5xl lg:text-6xl mb-6 animate-slide-up">
              <span className="gradient-text">26-1 YBIGTA 교육세션</span>
            </h1>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-2">
              <Link
                href="/tasks"
                className="btn btn-primary btn-lg w-full sm:w-auto group"
              >
                과제 둘러보기
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/register"
                className="btn btn-secondary btn-lg w-full sm:w-auto"
              >
                시작하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-[var(--background-subtle)] to-[var(--background)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="label mb-3 text-[var(--brand-primary)]">How it works</p>
            <h2 className="heading-2 mb-4">시작하는 방법</h2>
            <p className="body-base max-w-xl mx-auto">
              간단한 3단계로 데이터 과학 여정을 시작하세요
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="relative text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white text-xl font-bold flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--brand-primary)]/20">
                1
              </div>
              <h3 className="heading-3 mb-3">과제 선택</h3>
              <p className="body-small">
                다양한 난이도와 주제의 과제 중 관심 있는 것을 선택하세요.
              </p>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-px bg-gradient-to-r from-[var(--border)] to-transparent" />
            </div>

            {/* Step 2 */}
            <div className="relative text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white text-xl font-bold flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--brand-primary)]/20">
                2
              </div>
              <h3 className="heading-3 mb-3">모델 개발</h3>
              <p className="body-small">
                데이터를 분석하고 최적의 모델을 개발하세요. 코드 가이드가 도움이 될 거예요.
              </p>
              {/* Connector Line */}
              <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-px bg-gradient-to-r from-[var(--border)] to-transparent" />
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white text-xl font-bold flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--brand-primary)]/20">
                3
              </div>
              <h3 className="heading-3 mb-3">결과 제출</h3>
              <p className="body-small">
                예측 결과를 CSV로 제출하고 즉시 점수와 순위를 확인하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-[var(--text-secondary)]">DS Dashboard</span>
            </div>
            <p className="text-sm text-[var(--text-tertiary)]">
              &copy; {new Date().getFullYear()} DS Dashboard. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
