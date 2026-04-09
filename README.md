# UMA

UMA (Ur Medical Assistant) helps people upload medical PDFs, see trends, and chat in plain language. The app uses **Next.js** with a **PostgreSQL** backend for accounts and cloud sync, plus **browser storage** as a cache and for data that is not sent to the server (for example, embedded PDF bytes are stripped before sync).

## What the backend includes (beta)

- **PostgreSQL + Prisma**: `User`, `OtpChallenge`, `PatientRecord` (JSON blob per user).
- **Sign-in**: One-time codes stored in the database; signed session cookie (`AUTH_SECRET`) with user id.
- **Patient data**: `GET` / `PUT` `/api/patient-store` syncs the structured store for signed-in users (PDF base64 is omitted in the payload to keep rows small).
- **Still prototype**: SMS/email OTP delivery is not wired—you use `AUTH_DEV_RETURN_OTP=1` locally or add a provider for real betas.

## What is not “enterprise complete”

- No real OTP SMS/email provider (add Twilio, etc., when you are ready).
- No separate blob store for raw PDFs (they stay on the device unless you extend the API).
## Tech stack

- Next.js App Router, Tailwind CSS v4
- Prisma + PostgreSQL
- Anthropic Claude for PDF extraction and chat (optional OpenAI fallback)

## Local setup

### 1) Install

```bash
npm install
```

### 2) Database

Create a Postgres database (local Docker, or a free [Neon](https://neon.tech) project). Set `DATABASE_URL` in `.env.local` (see `.env.example`).

Apply the schema:

```bash
npx prisma migrate deploy
```

For quick local iteration you can use:

```bash
npx prisma db push
```

### 3) Environment

```bash
cp .env.example .env.local
```

Fill at least: `DATABASE_URL`, `AUTH_SECRET` (16+ random characters), and `ANTHROPIC_API_KEY` if you use AI features. For local OTP testing: `AUTH_DEV_RETURN_OTP=1`.

### 4) Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Troubleshooting: `Can't resolve '@prisma/client'`

That means dependencies or the generated client are missing. From the project root run:

```bash
npm install
npx prisma generate
```

Commit an up-to-date **`package-lock.json`** after `npm install` so Vercel installs the same tree. This repo’s `vercel.json` uses `npm install` (not `npm ci`) so the first deploy can reconcile the lockfile if needed.

### Production-style build (local)

```bash
npm run build
npm run start
```

---

## Deploy a beta on a free tier (temp / preview URLs)

A common **free** combo: **[Vercel](https://vercel.com) (Hobby)** for the app + **[Neon](https://neon.tech) (free)** for Postgres. Vercel gives you a `*.vercel.app` URL; every git branch/PR can get its own **Preview URL** (temporary-style links for testers).

### A) Neon (database)

1. Sign up at [neon.tech](https://neon.tech), create a project.
2. Copy the **connection string** (include `sslmode=require` if offered).
3. You will paste it as `DATABASE_URL` in Vercel.

### B) GitHub

1. Push this repo to GitHub (if it is not already).

### C) Vercel

1. Sign up at [vercel.com](https://vercel.com) (free Hobby tier).
2. **Add New Project** → import the GitHub repo.
3. **Before the first deploy**, open **Settings → Environment Variables** and add **`DATABASE_URL`** (and the other vars below). If `DATABASE_URL` is missing, the build fails with Prisma **P1012** because `prisma migrate deploy` and `prisma generate` read `prisma/schema.prisma` during the build.
4. **Environment variables** (Production + Preview):

   | Name | Notes |
   |------|--------|
   | `DATABASE_URL` | Neon connection string |
   | `AUTH_SECRET` | Long random string (32+ chars) |
   | `ANTHROPIC_API_KEY` | For PDF extraction + Claude chat |
   | `ANTHROPIC_MODEL` | Optional (defaults in `.env.example`) |
   | `ANTHROPIC_PDF_MODEL` | Optional |
   | `AUTH_DEV_RETURN_OTP` | Set to `1` **only** for internal demos where returning the OTP in JSON is acceptable—**never** for public betas unless you understand the risk |

5. Deploy. This repo’s `vercel.json` runs **`npm install`**, then a **`DATABASE_URL` check**, **`prisma migrate deploy`**, **`prisma generate`**, and **`next build`** so tables exist before the app is built.

6. **Preview deployments**: push a branch or open a PR—Vercel shows a unique preview URL in the dashboard and on the PR. Use that to share a “temp” beta link.

### D) After deploy

- Open your `https://….vercel.app` URL, sign in with the OTP flow (with a real messaging provider or a controlled dev OTP mode).
- Confirm `/api/patient-store` works by signing in on two browsers: data should follow the account after sync.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | `prisma generate` + `next build` |
| `npm run start` | Production server (after `build`) |
| `npm run db:migrate` | `prisma migrate deploy` (production/staging DB) |
| `npm run db:push` | `prisma db push` (prototyping; skips migration files) |

## License

MIT
