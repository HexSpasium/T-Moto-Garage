# T-Moto Garage

Cinematic motorcycle service and repair platform.

## Stack
- React 19 + Vite
- React Router
- Supabase Auth / Database / Storage
- QR code generation (planned service records module)
- Lucide icons

## Local development
1. Install Node.js 20.19+ or 22.12+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set the Supabase project URL and publishable key.
5. Run `npm run dev`.

## Environment
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are public client configuration values.
Never put a Supabase `service_role` or secret key in frontend code or GitHub.

## Current scope
- Cinematic public landing page
- Public service lookup entry point (backend integration pending)
- Supabase email/password admin sign-in
- Protected panel placeholder

Database schema, RLS policies, vehicle management, service timeline, media upload, and per-vehicle QR generation are the next implementation milestone.

## Deployment
Build with `npm run build`; deploy the generated `dist` folder to a static host. Configure SPA fallback to `index.html` for client-side routes.