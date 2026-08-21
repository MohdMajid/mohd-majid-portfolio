# Vercel Deployment

This project is configured as a single Vercel deployment.

- `/` → portfolio frontend
- `/admin` → admin panel
- `/api/*` → Express API
- MongoDB is used automatically when `MONGODB_URI` is configured.
- Without MongoDB, the API falls back to temporary local data on Vercel.

## Vercel Environment Variables

Add these in Project Settings → Environment Variables:

- `MONGODB_URI`
- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Do not commit `.env` to GitHub.
