# Mohd Majid — Full-Stack Portfolio

A futuristic, responsive portfolio built with HTML, CSS, Vanilla JavaScript, Node.js, Express and MongoDB.

## 1. Project structure

- `frontend/` — portfolio UI
- `backend/` — Express REST API
- `admin/` — simple protected admin dashboard
- `backend/data/local.json` — local fallback storage when MongoDB is not configured

## 2. SPCK + Termux setup

Copy the project to your phone. Edit frontend files in SPCK.

In Termux:

```bash
cd /path/to/mohd-majid-portfolio/backend
pkg update
pkg install nodejs
npm install
cp .env.example .env
npm start
```

Open:

`http://localhost:5000`

Admin:

`http://localhost:5000/admin/`

## 3. MongoDB

MongoDB is optional for local testing because the project automatically falls back to `backend/data/local.json`.

For MongoDB Atlas:
1. Create a database.
2. Copy the connection string.
3. Put it in `backend/.env`:

```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=use-a-long-random-secret
ADMIN_EMAIL=your-admin-email
ADMIN_PASSWORD=your-strong-password
```

Never commit `.env`.

## 4. Important customization

Replace:

`frontend/assets/images/profile.svg`

with your own profile image if desired.

Replace:

`frontend/assets/Mohd-Majid-CV.pdf`

with your actual CV.

Update GitHub, LinkedIn and other social links in `frontend/index.html`.

Update project links in `frontend/js/projects.js` or through the API later.

## 5. API

- `GET /api/health`
- `GET /api/projects`
- `POST /api/contact`
- `POST /api/admin/login`
- `GET /api/contact` (admin token required)
- `POST /api/projects` (admin token required)
- `PUT /api/projects/:id` (admin token required)
- `DELETE /api/projects/:id` (admin token required)
- `DELETE /api/contact/:id` (admin token required)

## 6. GitHub

Before uploading:

```bash
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

`.env` is ignored by `.gitignore`.

## 7. Deployment

For deployment, use a Node-compatible service for the backend and a MongoDB Atlas database. Set the environment variables in the hosting dashboard.

If frontend and backend are deployed separately, change:

```js
window.PORTFOLIO_API = "/api";
```

in `frontend/index.html` to your deployed API base URL.

## 8. Troubleshooting

### npm install fails
Check:

```bash
node -v
npm -v
```

Then run `npm install` again from the `backend` folder.

### Contact form does not save
Check the backend terminal and:

`GET /api/health`

If MongoDB is not configured, local JSON storage should still work.

### Admin login fails
Set `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `JWT_SECRET` in `backend/.env`, then restart the server.

## 9. Security note

This is a portfolio starter. Use a strong unique admin password and JWT secret. For a public production deployment, add rate limiting, HTTPS, stricter CORS, logging and additional authentication hardening.

## Admin Dashboard v2

The admin panel now includes:
- Dashboard overview with total/published/draft/unread counts
- Project CRUD with publish/draft, featured flag, technologies, GitHub/demo links, preview and image upload
- Contact message search/filter, read/unread, full view, email reply and delete
- Portfolio profile/about content editor
- Skills add/edit/delete with percentage levels
- Experience and education add/edit/delete
- Social links, theme and JWT expiry settings
- Admin password change, logout-all sessions and JWT secret regeneration
- Admin activity/audit logs

### Run locally

```bash
cd backend
npm install
npm start
```

Open `http://localhost:5000/` for the portfolio and `http://localhost:5000/admin/` for the admin panel.

Keep `backend/.env` private and never commit it to GitHub. Use `.env.example` as the template for a new machine.


## Starter Admin Login

The project includes a working fallback admin login so the first deployment can be tested immediately:

- Email: `mohdmajid51091@gmail.com`
- Password: `Majid@51091`

For production, set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `JWT_SECRET` in Vercel Environment Variables and redeploy.
