# Mohd Majid Portfolio — Vercel + MongoDB

Full-stack portfolio with an admin CMS. Projects, messages, skills, experience/education, settings, activity logs and uploaded project images can persist in MongoDB Atlas.

## Local development

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `JWT_SECRET`.
3. `MONGODB_URI` is optional locally. Without it, the app uses `backend/data/local.json`.
4. Run:

```bash
npm install --prefix backend
npm start
```

Open `http://localhost:5000/` and `http://localhost:5000/admin/`.

## Vercel deployment

Set these Environment Variables in Vercel for **Production** (and Preview if needed):

- `MONGODB_URI` — MongoDB Atlas connection string
- `ADMIN_EMAIL` — initial admin email
- `ADMIN_PASSWORD` — initial admin password
- `JWT_SECRET` — long random secret used only to bootstrap the MongoDB admin account

The first deployment with an empty database creates the initial admin account from these variables. After that, the admin password and JWT secret are stored in MongoDB and can be changed from Admin Security.

### MongoDB Atlas

Create a database user, allow your deployment to connect (Atlas Network Access), and use a database name such as `mohd_majid_portfolio` in the connection string.

## Important

Do not commit `backend/.env`. Use Vercel Environment Variables for production secrets.
