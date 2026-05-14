# Deploy CargoNest live (Vercel + Render + Supabase)

This guide targets a **client-ready demo** on free tiers: **Supabase** (Postgres + file storage), **Render** (FastAPI), **Vercel** (React). No Docker required.

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **Database → Connection string → URI** (Session mode is fine to start). Copy the URL. It may start with `postgresql://`; the API normalizes it to `postgresql+psycopg://` automatically.
3. Append SSL if your string does not already include it: add `?sslmode=require` (or keep Supabase’s default query string).
4. **Storage → New bucket**  
   - Name: `cargonest-attachments` (or set `SUPABASE_STORAGE_BUCKET` to your name).  
   - For public file links returned by the app, set the bucket to **public** (or adjust the app later to use signed URLs).
5. **Project Settings → API**: copy **Project URL**, **anon public** key (optional for future client use), and **service_role** key (server-only; use in Render, never in the browser).

## 2. Render (backend)

1. New **Web Service** → connect this repo (or use **Blueprint** and point at `render.yaml`).
2. **Root directory**: `backend`.
3. **Build command**: `pip install -r requirements.txt`  
   **Start command** (already in `render.yaml`): runs `alembic upgrade head` then Uvicorn on `$PORT`.
4. **Environment** (match keys to `backend/.env.production.example`):

| Variable | Notes |
|----------|--------|
| `APP_ENV` | `production` |
| `DATABASE_URL` | Supabase Postgres URI (`postgresql://` is OK). |
| `SESSION_SECRET_KEY` | Long random string (not the dev default). |
| `FRONTEND_ORIGIN` | Exact Vercel URL, e.g. `https://your-app.vercel.app` (no trailing slash required; backend normalizes). |
| `FRONTEND_ORIGINS` | Same as above, or comma-separated list if you use multiple previews. |
| `AUTO_CREATE_TABLES` | `false` |
| `SUPABASE_URL` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role secret |
| `SUPABASE_STORAGE_BUCKET` | `cargonest-attachments` (or your bucket name) |
| `BOOTSTRAP_ADMIN_ENABLED` | `true` **only** for the first deploy that should create the admin user, then set back to `false`. |
| `BOOTSTRAP_ADMIN_USERNAME` / `EMAIL` / `PASSWORD` | Strong password; remove or disable after first login. |

5. Deploy and wait until **healthy**. Open `https://<your-service>.onrender.com/api/v1/health`.

**Cold starts**: the Render free tier sleeps after inactivity; the first request after sleep can take ~30–60s. For a live demo, keep the service awake or mention the delay.

## 3. Vercel (frontend)

1. Import the repo; set **Root Directory** to `frontend`.
2. **Environment variables → Production (and Preview if needed)**:

   - `VITE_API_BASE_URL` = `https://<your-render-service>.onrender.com/api/v1`  
     (no trailing slash; must be **HTTPS** to match secure cookies.)

3. Deploy. Open the Vercel URL and test **login** and one **form** + **upload** if you enabled Supabase storage.

## 4. Smoke test before the client

- [ ] Login as bootstrap admin (then turn `BOOTSTRAP_ADMIN_ENABLED` off and redeploy).
- [ ] Create a non-admin user with a subset of forms; confirm RBAC.
- [ ] Submit a form and upload a small file (Supabase configured).
- [ ] Purchase queue / detail pages load without 401/403.

## 5. What was fixed for split domains

The SPA and API are on different origins (Vercel vs Render). The browser **cannot** read CSRF cookies set on the API domain from JavaScript on the frontend domain. The API now returns **`csrf_token`** on `POST /auth/login` and `GET /auth/me`, and the frontend keeps that value in memory for `X-CSRF-Token` on mutating requests. Same-origin local dev still works via the CSRF cookie.
