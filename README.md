# DS Dashboard

Kaggle-style data science competition platform built with Next.js, TypeScript, and Supabase.

## Features

- **Multi-Competition Support**: Create and manage multiple competitions
- **Automatic Scoring**: RMSE, Accuracy, F1 Score, AUC metrics
- **Real-time Leaderboard**: Track rankings with submission history
- **Admin Panel**: Create/edit/delete competitions, upload answer files
- **User Authentication**: Simple username/password authentication

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router) + TypeScript
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account

### 1. Clone and Install

```bash
git clone <repository-url>
cd ds_dashboard
npm install
```

### 2. Setup Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the SQL migration in `supabase/migrations/001_initial_schema.sql`
3. Create storage buckets:
   - `answers` (private) - for answer files
   - `submissions` (private) - for user submissions

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Default Admin Account

- Username: `admin`
- Password: `admin123`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── admin/             # Admin pages
│   ├── api/               # API routes
│   └── competitions/      # Competition pages
├── components/            # React components
├── lib/                   # Utilities
│   ├── supabase/         # Supabase clients
│   └── evaluators/       # Scoring functions
└── types/                 # TypeScript types
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| POST | /api/auth/register | Register |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Get current user |
| GET | /api/competitions | List competitions |
| POST | /api/competitions | Create competition (admin) |
| GET | /api/competitions/[id] | Get competition |
| PUT | /api/competitions/[id] | Update competition (admin) |
| DELETE | /api/competitions/[id] | Delete competition (admin) |
| POST | /api/competitions/[id]/answer | Upload answer file (admin) |
| POST | /api/competitions/[id]/submit | Submit prediction |
| GET | /api/competitions/[id]/leaderboard | Get leaderboard |

## Evaluation Metrics

- **RMSE**: Root Mean Squared Error (lower is better)
- **Accuracy**: Classification accuracy (higher is better)
- **F1 Score**: F1 score for binary classification (higher is better)
- **AUC**: Area Under ROC Curve (higher is better)

## Deployment

Deploy to Vercel:

```bash
npm run build
vercel deploy
```

Set environment variables in Vercel dashboard.

## License

MIT
