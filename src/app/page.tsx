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
              실력을 증명하고
              <br />
              <span className="gradient-text">함께 성장하세요</span>
            </h1>

            {/* Subheading */}
            <p className="body-large text-lg sm:text-xl max-w-2xl mx-auto mb-10 animate-slide-up stagger-1">
              DS Dashboard에서 데이터 과학 과제에 도전하고,
              <br className="hidden sm:block" />
              리더보드에서 당신의 실력을 확인하세요.
            </p>

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

      {/* Features Section */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <p className="label mb-3 text-[var(--brand-primary)]">Features</p>
            <h2 className="heading-2 mb-4">왜 DS Dashboard인가요?</h2>
            <p className="body-base max-w-xl mx-auto">
              데이터 과학 실력 향상을 위한 최적의 환경을 제공합니다
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="card card-accent p-8 animate-fade-in stagger-1">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-accent)]/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="heading-3 mb-3">실전 과제</h3>
              <p className="body-small">
                실무에서 마주할 수 있는 다양한 데이터 과학 문제를 해결하며 실전 경험을 쌓으세요.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card card-accent p-8 animate-fade-in stagger-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-accent)]/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h3 className="heading-3 mb-3">즉시 피드백</h3>
              <p className="body-small">
                제출 즉시 점수를 확인하고, 리더보드에서 다른 참가자들과 비교해보세요.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card card-accent p-8 animate-fade-in stagger-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--brand-primary)]/10 to-[var(--brand-accent)]/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--brand-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="heading-3 mb-3">커뮤니티</h3>
              <p className="body-small">
                질문하고, 토론하고, 함께 배우세요. 혼자가 아닌 팀으로 성장합니다.
              </p>
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

      {/* CTA Section */}
      <section className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-dark)] p-10 lg:p-16 text-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>

            <div className="relative">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                지금 바로 시작하세요
              </h2>
              <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">
                무료로 가입하고 첫 번째 과제에 도전해보세요.
                <br />
                당신의 데이터 과학 여정이 시작됩니다.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="btn btn-lg bg-white text-[var(--brand-primary)] hover:bg-white/90 w-full sm:w-auto"
                >
                  무료로 시작하기
                </Link>
                <Link
                  href="/tasks"
                  className="btn btn-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 w-full sm:w-auto"
                >
                  과제 둘러보기
                </Link>
              </div>
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
