# DS Dashboard

Kaggle 스타일의 데이터 사이언스 경진대회 플랫폼. 사용자들이 ML 문제를 풀고, CSV를 제출하여 자동 채점받고, 리더보드에서 경쟁합니다.

## 기술 스택

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Database/Auth**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS 4
- **배포**: Vercel

## 디렉토리 구조

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # REST API 라우트
│   │   ├── auth/           # 인증 (me, logout)
│   │   ├── tasks/          # 과제 CRUD, 제출
│   │   ├── competitions/   # 하위호환 (tasks로 리다이렉트)
│   │   ├── docs/           # 문서 시스템
│   │   └── members/        # 구성원
│   ├── admin/              # 관리자 페이지
│   ├── tasks/              # 과제 목록/상세
│   ├── docs/               # 문서 페이지
│   └── ...
├── components/             # React 컴포넌트
│   ├── AuthProvider.tsx    # 인증 Context (OAuth)
│   ├── Header.tsx          # 네비게이션
│   ├── Leaderboard.tsx     # 리더보드
│   └── SubmissionForm.tsx  # 제출 폼
├── lib/
│   ├── auth.ts             # 인증 헬퍼 (getSession, requireAuth 등)
│   ├── permissions.ts      # 권한 체크 (RBAC)
│   ├── evaluators/         # 채점 함수 (RMSE, Accuracy, F1, AUC, mAP@0.5)
│   ├── csv.ts              # CSV 파싱
│   └── supabase/           # Supabase 클라이언트 (server.ts, client.ts)
├── types/index.ts          # TypeScript 타입 정의
└── middleware.ts           # 세션 갱신, 리다이렉트
```

## 핵심 개념

### 역할 시스템 (RBAC)

```typescript
type UserRole = 'user' | 'creator' | 'admin';
```

- **user**: 과제 참여, 제출, 커뮤니티 활동
- **creator**: 자신의 과제 생성/관리
- **admin**: 전체 관리 권한

### 과제(Task) 상태

- **upcoming**: start_date > now
- **active**: start_date ≤ now ≤ end_date
- **ended**: end_date < now

### 평가 지표

```typescript
type EvaluationMetric = 'rmse' | 'accuracy' | 'f1' | 'auc' | 'map50';
```

- **rmse**: 회귀 (낮을수록 좋음)
- **accuracy**: 분류 (높을수록 좋음)
- **f1**: 이진 분류 (높을수록 좋음)
- **auc**: 확률 예측 (높을수록 좋음)
- **map50**: 객체 탐지 IoU@0.5 (높을수록 좋음)

### 커스텀 채점

JavaScript로 채점 함수 정의 가능:
```javascript
function score(answer, submission) {
  // answer, submission: 객체 배열
  return number; // 점수 반환
}
```

## 주요 API 엔드포인트

### 인증
- `GET /api/auth/me` - 현재 사용자 + 자동 회원가입
- `POST /api/auth/logout` - 로그아웃

### 과제
- `GET/POST /api/tasks` - 목록/생성
- `GET/PUT/DELETE /api/tasks/[slug]` - 상세/수정/삭제
- `POST /api/tasks/[slug]/submit` - CSV 제출

### 리더보드
- `GET /api/competitions/[id]/leaderboard` - 순위 조회

## 데이터베이스 스키마

### Users
- `id`, `email`, `username`, `avatar_url`
- `role` (user/creator/admin)
- `auth_provider` (google/github)
- `profile_completed`, `cohort`, `bio`

### Tasks
- `id`, `slug` (URL용), `title`, `description`
- `start_date`, `end_date`
- `evaluation_metric`, `answer_file_path`
- `use_custom_scoring`, `custom_scoring_code`
- `max_submissions_per_day` (기본: 5)
- `is_published`, `created_by`

### Submissions
- `id`, `task_id`, `user_id`
- `file_path`, `score`, `submitted_at`

### Task Creators
- 과제별 Creator 권한 매핑 (user_id, task_id)

### 커뮤니티
- **BoardPosts/BoardComments**: 게시판 (대댓글 지원)
- **Questions/QuestionAnswers**: Q&A
- **Docs**: 전역 문서

## 인증 흐름

1. Google/GitHub OAuth 로그인
2. `/auth/callback`에서 Supabase 세션 생성
3. `AuthProvider`가 `/api/auth/me` 호출
4. DB에 없으면 자동 회원가입
5. `profile_completed=false`면 `/onboarding`으로 리다이렉트

## 제출 워크플로우 (POST /api/tasks/[slug]/submit)

1. 인증 확인
2. 과제 상태 확인 (active 상태만 허용)
3. 일일 제출 한도 확인 (max_submissions_per_day)
4. CSV 파싱 및 검증
5. 채점 (커스텀 또는 표준 평가지표)
6. 점수 저장 → 리더보드 업데이트

## 파일 저장소 (Supabase Storage)

- `answers/` - 정답 파일 (private)
- `submissions/` - 사용자 제출물 (private)

## 주요 라이브러리 함수

### auth.ts
```typescript
getSession(): Promise<User | null>
requireAuth(): Promise<User>
requireAdmin(): Promise<User>
requireRole(roles: UserRole[]): Promise<User>
requireTaskAccess(taskId: string): Promise<User>
```

### permissions.ts
```typescript
canCreateTask(user): boolean
canEditTask(user, task): Promise<boolean>
canDeleteSubmission(user, submission): boolean
```

### evaluators/index.ts
```typescript
evaluators[metric](actual: number[], predicted: number[]): number
executeCustomScoring(code, answerData, submissionData): number
```

### csv.ts
```typescript
parseCSV(content): { headers, rows, column(name) }
getTargetColumn(csv): string[]
csvToObjects(csv): object[]
```

## 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

## 개발 명령어

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

## 코드 컨벤션

- 한글 주석 사용
- 컴포넌트는 PascalCase
- API 라우트는 RESTful 패턴
- slug 기반 URL 사용 (tasks)
- RLS로 데이터 보호
- 하위호환성: `/competitions/*` → `/tasks/*` 리다이렉트

## Git 커밋 규칙

커밋 메시지를 추천할 때, 바로 복사해서 실행할 수 있도록 **전체 명령어**를 출력한다:

```bash
git add <파일들> && git commit -m "커밋 메시지"
```

예시:
```bash
git add src/components/Header.tsx src/lib/auth.ts && git commit -m "feat: 헤더에 로그아웃 버튼 추가"
```

## 최근 변경사항

- mAP@0.5 평가 지표 추가 (객체 탐지)
- 커스텀 JavaScript 채점 함수
- Docs 시스템 (카테고리 없는 단순 게시판)
- OAuth 인증 안정화
