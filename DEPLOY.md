# Deploying PayGate v4

Single Node service: Express (`server.ts`, run with `tsx`) serves the `/v1/*` API and, in production, the static Vite build from `dist/`.

## Requirements
- Node.js 20+ (22 recommended), or Docker

## Environment variables
| Variable | Required | Notes |
| --- | --- | --- |
| `NODE_ENV` | yes | Set to `production` (the Dockerfile does this). |
| `ADMIN_SECRET_KEY` | **yes** | Server exits on boot in production if unset or left at the demo default. |
| `PORT` | no | Default `3000`. |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | if using Supabase | Needed at **build** time. |
| `SUPABASE_SERVICE_ROLE_KEY` | if using Supabase | Server only. Never expose to the browser. |

Copy `.env.example` to `.env` and fill it in.

## Option A: Docker
```
docker build -t paygate .
docker run -p 3000:3000 -e ADMIN_SECRET_KEY='<strong-random-value>' paygate
```

## Option B: Node directly
```
npm ci
npm run build
NODE_ENV=production ADMIN_SECRET_KEY='<strong-random-value>' npm start
```

## Database
SQL migrations are in `supabase/migrations/`. Apply them with `npm run migrate` or through the Supabase CLI.

## Before taking real money
- `src/api/client.ts` hardcodes a demo merchant API key and the admin token, so they are shipped to every browser that loads the app. Replace them with real per-user auth.
- Demo merchant API keys are seeded in `src/db/gatewayStore.ts` and `src/data/seedData.ts`.
- Put the service behind HTTPS and restrict `/v1/sms/webhook` to the forwarder handset's IP.
