/**
 * Vercel build: Prisma loads prisma/schema.prisma and requires DATABASE_URL.
 * Fails fast with a clear message instead of Prisma P1012.
 */
if (!process.env.DATABASE_URL?.trim()) {
  console.error(`
[UMA] Missing DATABASE_URL

Add it in Vercel: Project → Settings → Environment Variables
Use the same value for Production and Preview if you want branch deploys to work.

Create a Postgres database (e.g. Neon) and paste the connection string, e.g.:
postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require

See README.md → "Deploy a beta on a free tier".
`);
  process.exit(1);
}
