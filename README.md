# T-Moto Garage

Cinematic motorcycle service and repair platform.

## Stack
- React 19 + Vite
- React Router
- Supabase Auth / Postgres / Storage
- QR code generation
- Lucide icons

## Local development
1. Install Node.js 20.19+ or 22.12+.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Run `npm run dev`.

## Supabase database
Project: `oxvftybytcwpdcqygxpp` (EU Central / Frankfurt).

Applied migrations are tracked in `supabase/migrations/`:
- `20261117165419_initial_service_management_schema.sql`
- `20261117165730_index_foreign_key_columns.sql`

Core tables:
- `admin_users`: explicitly allowlisted staff accounts and roles
- `customers`: private customer contact information
- `vehicles`: motorcycle identity, plate, VIN and unique QR token
- `service_records`: service intake, lifecycle and delivery timestamps
- `service_events`: chronological status timeline
- `parts_catalog` and `service_parts`: catalog and per-job part operations
- `service_media`: private/public media metadata

RLS is enabled on every application table. Direct anonymous table access is revoked. Staff access requires an active row in `admin_users`.

### First administrator
Create the first user in Supabase Dashboard → Authentication → Users, then insert that Auth user's UUID into `public.admin_users` from the SQL Editor as the project owner:

```sql
insert into public.admin_users (user_id, role)
select id, 'owner'
from auth.users
where email = 'YOUR_ADMIN_EMAIL'
on conflict (user_id) do update
set role = 'owner', is_active = true;
```

Do not expose a service-role or secret API key in frontend code.

### Public QR service history
The public QR route calls `public.get_public_service_history(uuid)`. It returns only published vehicle/service data and explicitly public timeline events, parts and media metadata. It never returns customer contact information, VIN or internal notes. QR UUIDs act as bearer tokens; publish a record only after obtaining customer consent, especially when the full registration plate is shown.

The Supabase security advisor flags this RPC because it is intentionally callable by `anon` and uses `SECURITY DEFINER` to return a carefully restricted projection while base tables remain private. The function uses an empty search path and fully-qualified table names.

## Deployment
Build with `npm run build`; deploy the generated `dist` folder to a static host. Configure SPA fallback to `index.html` for client-side routes.