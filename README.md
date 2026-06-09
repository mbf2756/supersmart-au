# SuperSmart AU

Australia's independent superannuation optimisation platform.

## Stack
- **Framework:** Next.js 14 (App Router)
- **Database & Auth:** Supabase (Sydney region)
- **Payments:** Stripe
- **Email:** Resend
- **Deployment:** Vercel

## Getting started in Codespaces

1. Open this repo in GitHub Codespaces (click Code → Codespaces → Create codespace on main)
2. Copy `.env.local.example` to `.env.local` and fill in your keys
3. Run `npm run dev` — site runs at localhost:3000 (Codespaces opens a preview automatically)

## Environment variables

See `.env.local.example` for all required variables.

## Database setup

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

## Deployment

Push to `main` → Vercel auto-deploys. Add environment variables in Vercel dashboard.

## Stripe webhook (local testing)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Feature modules

| Route | Module | Plan required |
|-------|--------|---------------|
| `/dashboard` | Super health score | Free |
| `/dashboard/contributions` | Carry-forward + concessional cap | Optimiser |
| `/dashboard/fees` | Fee drag analyser | Free |
| `/dashboard/funds` | Fund comparison | Free (3 funds) / Optimiser (all) |
| `/dashboard/div296` | Division 296 modeller | Free (basic) / Optimiser (full) |
| `/dashboard/salary` | Salary sacrifice | Optimiser |
| `/dashboard/spouse` | Spouse contributions | Optimiser |
| `/dashboard/smsf` | SMSF analytics | Optimiser + SMSF add-on |

## Disclaimer

SuperSmart AU provides general financial information and modelling only. It does not constitute financial advice.
