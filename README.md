# PetThrone

The richest pet on the web. Pay to rank. Highest total sits at #1.

```bash
npm run dev
```

Open http://localhost:3000

## Live

Set these before you charge anyone:

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

Webhook path: `/api/stripe/webhook`

Without Stripe, checkout is refused. Bids are not applied for free.
