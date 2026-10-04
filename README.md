# PetThrone

The richest pet on the web. Pay to rank. Highest total sits at #1.

## Local development

```bash
cp .env.example .env
npm install
npm run dev
```

Open http://localhost:3000

## Production

This app is a single Node process with a local JSON store in `.data/`. Run it on a VPS or Docker with a persistent disk. Serverless hosts will lose rankings and uploads on restart.

```bash
cp .env.example .env
npm install
npm run build
npm start
```

The production server listens on http://localhost:3000. Health check: `/api/health`.

### Docker

```bash
docker build -t petthrone .
docker run -p 3000:3000 --env-file .env -v petthrone-data:/app/.data petthrone
```

## Required environment

Set these before you charge anyone:

```
NEXT_PUBLIC_SITE_URL=https://your-domain.com
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Webhook path: `/api/stripe/webhook`

Without Stripe, checkout is refused. Bids are not applied for free.

Optional realtime (live board refresh on new bids):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
