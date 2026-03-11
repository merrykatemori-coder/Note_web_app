# Workspace App

Personal workspace management web application built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Memo** - Notes organized by brand tabs (Office, Hs Cargo, EOS, Mori, Tolun, Personal) with search, pin, and URL linking
- **Finance** - Income/expense tracking with dashboard charts and date filters
- **Work Order** - Task management with Todo/Doing/Done status for personal and company
- **Salary/Commission** - Track salary and commission by brand
- **Settings** - Manage dropdown options for all modules

## Tech Stack

- Next.js 14 (App Router)
- Supabase (Auth + Database)
- Tailwind CSS
- Recharts (Charts)
- Lucide React (Icons)
- Deployed on Vercel

---

## Setup Instructions

### 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **SQL Editor** and run the entire content of `supabase-migration.sql`
3. Go to **Authentication > Providers** and make sure **Email** provider is enabled
4. Go to **Project Settings > API** and copy:
   - Project URL
   - anon/public key

### 2. Local Development

```bash
git clone <your-repo-url>
cd workspace-app
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

```bash
npm run dev
```

Open http://localhost:3000

### 3. Deploy to Vercel

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### 4. Supabase Auth URL Config

After deploying to Vercel, go to Supabase:
- **Authentication > URL Configuration**
- Set **Site URL** to your Vercel domain (e.g., `https://your-app.vercel.app`)
- Add the same URL to **Redirect URLs**

---

## Project Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/page.tsx
│   └── dashboard/
│       ├── layout.tsx
│       ├── memo/page.tsx
│       ├── finance/page.tsx
│       ├── workorder/page.tsx
│       ├── salary/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── Modal.tsx
│   ├── TabBar.tsx
│   └── SearchBar.tsx
├── hooks/
│   └── useAuth.ts
└── lib/
    ├── supabase-browser.ts
    ├── supabase-server.ts
    └── types.ts
```
