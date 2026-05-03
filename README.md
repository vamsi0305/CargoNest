# CargoNest

CargoNest is scaffolded as:

- `frontend/`: React + Vite + TypeScript
- `backend/`: FastAPI + SQLModel

Current platform includes:

- database-backed login and admin access control
- form-level permissions
- production-ready Supabase Storage integration path
- Vercel + Render deployment structure
- cookie-based session auth with CSRF protection
- login throttling and password/session management flows
- admin audit logging for role and user management actions
- backend request/error logging with frontend error reporting

## Environment Files

Development:

- `frontend/.env.example`
- `backend/.env.example`

Production templates:

- `frontend/.env.production.example`
- `backend/.env.production.example`

## Production Checklist

1. Set `VITE_API_BASE_URL` in Vercel to your Render backend URL.
2. Set backend `FRONTEND_ORIGIN` and `FRONTEND_ORIGINS` to your exact Vercel domain.
3. Use the Supabase pooler connection string for `DATABASE_URL`.
4. Set `AUTO_CREATE_TABLES=false` in production so startup does not depend on `create_all()`.
5. Run `alembic upgrade head` during deployment before starting the API service.
6. Create a public Supabase Storage bucket named `cargonest-attachments` or update `SUPABASE_STORAGE_BUCKET`.
7. Set `BOOTSTRAP_ADMIN_ENABLED=true` only for first-time admin creation if needed.
8. After the first admin is created, set `BOOTSTRAP_ADMIN_ENABLED=false` again.
9. Set a strong `SESSION_SECRET_KEY` in the backend environment.
10. Rotate all old shared keys before production launch.
11. Keep `LOG_LEVEL=INFO` or stricter in production and leave `FRONTEND_ERROR_REPORTING_ENABLED=true`.

## Security Notes

- Authentication now uses an HttpOnly session cookie instead of storing the session token in browser storage.
- Mutating requests require a CSRF token header that is derived from the active session.
- Login attempts are throttled and repeated failed logins are temporarily blocked.
- Users can change their password and revoke all active sessions from the Security page.

## Monitoring Notes

- Backend requests now log structured request completion and exception events with an `X-Request-ID` response header.
- Frontend render errors, unhandled promise rejections, and React Query failures are reported to the backend telemetry endpoint and written into backend logs.
- When an API error reaches the UI, the message includes the backend request ID when available so production issues can be traced quickly.

## Automated Tests

From `backend/`:

- Run API flow tests: `venv\Scripts\python.exe -m unittest discover -s tests -p "test_*.py" -v`

Current automated coverage includes:

- auth login and session bootstrap
- admin create/update user flows
- role-based access control checks
- purchase order save plus downstream prefill behavior
- backend form validation rejection for invalid payloads

## Database Migrations

From `backend/`:

- Apply migrations: `venv\Scripts\python.exe -m alembic upgrade head`
- Create a new revision after model changes: `venv\Scripts\python.exe -m alembic revision -m "your message"`

For local development, `AUTO_CREATE_TABLES=true` can stay enabled. For production, keep it disabled and rely on Alembic migrations.
