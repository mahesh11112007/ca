# CA Ledger Management System

A production-grade Role-Based Ledger Management System for Chartered Accountants. Clients notify the CA about payments they've made, and the CA can review, approve, or reject those entries — with full audit logging.

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS v4 + Framer Motion |
| Backend | Python Flask + SQLAlchemy + JWT |
| Database | Neon PostgreSQL |
| Auth | JWT (python-jose) + bcrypt (passlib) |
| Deployment | Vercel (Frontend static + Backend serverless) |

---

## Quick Start (Local Development)

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Neon PostgreSQL database (or any PostgreSQL instance)

### 1. Clone & Configure Environment

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database URL and JWT secret
```

```bash
# Frontend
cd frontend
cp .env.example .env
# Edit .env if needed (default proxies to localhost:8000)
```

### 2. Start the Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python main.py
```

The backend will auto-create database tables on first startup.

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Create Test Accounts

1. Register a **Receiver** account (the CA)
2. Register a **Sender** account (the client)
3. Login as Sender → submit a payment
4. Login as Receiver → approve or reject

---

## Neon PostgreSQL Setup

1. Go to [https://neon.tech](https://neon.tech) and create a free account
2. Create a new project (select your preferred region)
3. Copy the connection string from the dashboard
4. It will look like:
   ```
   postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```
5. Paste this into `backend/.env` as `DATABASE_URL`

> **Tip**: Use Neon's connection pooler URL for better performance with serverless functions. In the Neon dashboard, find the "Pooled connection" URL.

---

## Vercel Deployment

### Backend Deployment

1. Push the repo to GitHub
2. In Vercel, create a **new project** → import repo → set **Root Directory** to `backend`
3. Vercel auto-detects the Python serverless function in `api/index.py`
4. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` — your Neon connection string
   - `JWT_SECRET_KEY` — a random 64-character hex string (`python -c "import secrets; print(secrets.token_hex(32))"`)
   - `JWT_ALGORITHM` — `HS256`
   - `JWT_EXPIRATION_MINUTES` — `1440`
   - `CORS_ORIGINS` — your frontend Vercel URL (e.g., `https://ca-ledger.vercel.app`)
5. Deploy

### Frontend Deployment

1. In Vercel, create **another new project** → import same repo → set **Root Directory** to `frontend`
2. Set **Build Command** to `npm run build`
3. Set **Output Directory** to `dist`
4. Add environment variable:
   - `VITE_API_URL` — leave empty (the `vercel.json` rewrites handle proxying)
5. Update `frontend/vercel.json` — replace the backend URL in the API rewrite with your actual backend Vercel URL
6. Deploy

### Generate JWT Secret

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Get profile |

### Transactions
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/transactions` | Yes | Sender | Submit payment |
| GET | `/api/transactions` | Yes | Both | List transactions |
| GET | `/api/transactions/{id}` | Yes | Both | Get detail |
| PATCH | `/api/transactions/{id}/approve` | Yes | Receiver | Approve |
| PATCH | `/api/transactions/{id}/reject` | Yes | Receiver | Reject |

### Dashboard
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/dashboard/stats` | Yes | Receiver | Get stats |

---

## Project Structure

```
money/
├── frontend/               # React + Vite SPA
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context (Auth)
│   │   ├── services/       # API client (Axios)
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Helpers & formatters
│   │   ├── routes/         # Router configuration
│   │   └── styles/         # Global CSS
│   ├── vercel.json
│   └── package.json
│
├── backend/                # FastAPI application
│   ├── api/                # Vercel serverless entrypoint
│   ├── config/             # Settings & configuration
│   ├── database/           # SQLAlchemy connection & init
│   ├── models/             # ORM models
│   ├── schemas/            # Pydantic schemas
│   ├── middleware/         # Auth middleware
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic
│   ├── utils/              # Security utilities
│   ├── main.py             # FastAPI app factory
│   ├── vercel.json
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

---

## Security

- Passwords hashed with **bcrypt** (12 rounds)
- Authentication via **JWT** (HS256, 24h expiry)
- Role-based access control on all endpoints
- Input validation with **Pydantic v2**
- SQL injection prevention via **SQLAlchemy ORM**
- CORS restricted to configured origins
- No credentials hardcoded — all from environment variables

---

## Testing Checklist

- [ ] Register a Sender account
- [ ] Register a Receiver account
- [ ] Login as Sender
- [ ] Submit a payment (amount + purpose)
- [ ] Verify payment appears as Pending in history
- [ ] Login as Receiver
- [ ] Verify dashboard stats show 1 Pending request
- [ ] Search by username
- [ ] Filter by Pending status
- [ ] Approve the payment
- [ ] Verify audit log created (in DB)
- [ ] Verify status changed to Approved
- [ ] Login as Sender → verify status shows Approved
- [ ] Submit another payment → Reject it as Receiver
- [ ] Verify stats update correctly
- [ ] Test invalid login (wrong password)
- [ ] Test unauthorized access (Sender trying Receiver endpoints)
- [ ] Deploy to Vercel → repeat smoke tests

---

## License

Private — All rights reserved.
