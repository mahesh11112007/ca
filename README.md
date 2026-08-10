<div align="center">

# 📑 CA LEDGER MANAGEMENT SYSTEM
### *Enterprise Role-Based Financial Ledger & Audit Logging Platform*

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-Flask%2FFastAPI-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon.tech-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech)
[![JWT](https://img.shields.io/badge/Auth-JWT_Tokens-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
[![Developer](https://img.shields.io/badge/Developer-Mahesh_Vilasagaram-0052CC?style=for-the-badge&logo=github)](https://github.com/mahesh11112007)

[Overview](#-overview) • [System Architecture](#-system-architecture) • [Features](#-key-features) • [API Reference](#-api-reference) • [Quick Start](#-quick-start) • [Deployment](#-deployment-guide)

---

</div>

## 📌 Overview

**CA Ledger Management System** is a production-ready, full-stack financial ledger and approval workflow platform designed specifically for Chartered Accountants (CAs) and their corporate clients. 

Clients (**Senders**) submit payment notifications with detailed breakdown records, and CAs (**Receivers**) inspect, approve, or reject incoming entries in real-time — maintaining an immutable audit log and live financial dashboard analytics.

---

## ✨ Key Features

<div align="center">

| Feature | Description | Target Role |
| :--- | :--- | :---: |
| 🛡️ **Role-Based Authorization** | Enforces strict boundaries between Senders (Clients) and Receivers (CAs) | Sender / Receiver |
| 💸 **Transaction Submission** | Instant payment notification creation with amount, reference, & purpose tags | Sender |
| ⭐ **CA Approval Desk** | Real-time review queue with single-click Approval or Rejection actions | Receiver (CA) |
| 📜 **Audit Log Tracking** | Comprehensive, immutable ledger history with timestamps & status transitions | System |
| 📊 **Financial Dashboard** | Live statistical metrics showing total approved, pending, & rejected balances | Receiver (CA) |
| 🔍 **Filter & Search Studio** | Search by client username, filter by date range or transaction status | Both |
| 🔑 **JWT Auth Engine** | Secure token-based session handling with 24-hour expiration & bcrypt hashing | System |

</div>

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["React 18 + Vite SPA"] -->|REST API Requests| API["Flask / FastAPI Serverless API"]
    
    subgraph Authentication & Middleware
        API -->|JWT Verification| JWT["JWT Auth Engine"]
        API -->|Password Hashing| Bcrypt["Bcrypt Security"]
    end

    subgraph Business Logic & Workflows
        API --> TransactionService["Transaction Engine"]
        API --> StatsService["Dashboard Analytics Service"]
    end

    subgraph Data & Audit Layer
        TransactionService -->|SQLAlchemy ORM| DB[("Neon Cloud PostgreSQL")]
        StatsService -->|Read Queries| DB
    end
```

---

## 🔄 Transaction Lifecycle Workflow

```mermaid
stateDiagram-v2
    [*] --> Pending : Sender Submits Payment Entry
    
    state Pending {
        [*] --> InReview : Receiver Inspects Ledger Entry
    }

    InReview --> Approved : Receiver Approves Transaction
    InReview --> Rejected : Receiver Rejects Transaction

    Approved --> AuditLogged : Generate Permanent Audit Entry
    Rejected --> AuditLogged : Record Rejection Reason

    AuditLogged --> [*]
```

---

## 🗄️ Database Entity-Relationship Model

```mermaid
erDiagram
    USERS ||--o{ TRANSACTIONS : creates_or_receives
    USERS ||--o{ AUDIT_LOGS : triggers

    USERS {
        int id PK
        string username UK
        string email UK
        string password_hash
        string role "sender | receiver"
        datetime created_at
    }

    TRANSACTIONS {
        int id PK
        int sender_id FK
        int receiver_id FK
        float amount
        string purpose
        string status "pending | approved | rejected"
        datetime created_at
        datetime updated_at
    }

    AUDIT_LOGS {
        int id PK
        int transaction_id FK
        int action_by_id FK
        string action "APPROVED | REJECTED | CREATED"
        datetime timestamp
    }
```

---

## 📡 API Reference

### 🔐 Authentication
| Method | Endpoint | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `POST` | `/api/auth/register` | No | Register a new user (`sender` or `receiver`) |
| `POST` | `/api/auth/login` | No | Authenticate user & return JWT Bearer Token |
| `GET` | `/api/auth/me` | Yes | Fetch authenticated user profile details |

### 💳 Transactions
| Method | Endpoint | Auth Required | Role Scope | Description |
| :--- | :--- | :---: | :---: | :--- |
| `POST` | `/api/transactions` | Yes | `sender` | Submit a new payment notification |
| `GET` | `/api/transactions` | Yes | Both | List all transactions with search & filter |
| `GET` | `/api/transactions/{id}` | Yes | Both | Get detailed view of single transaction |
| `PATCH` | `/api/transactions/{id}/approve` | Yes | `receiver` | Approve pending payment & create audit log |
| `PATCH` | `/api/transactions/{id}/reject` | Yes | `receiver` | Reject payment entry & record feedback |

### 📊 Dashboard Analytics
| Method | Endpoint | Auth Required | Role Scope | Description |
| :--- | :--- | :---: | :---: | :--- |
| `GET` | `/api/dashboard/stats` | Yes | `receiver` | Get aggregate totals, balances & status counts |

---

## 🚀 Quick Start Guide

> [!IMPORTANT]
> Requires **Python 3.11+** and **Node.js 18+** installed on your machine.

### 1. Clone Repository
```bash
git clone https://github.com/mahesh11112007/ca.git
cd ca
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux: source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Set up your `.env` variables:
```env
DATABASE_URL=postgresql://username:password@ep-cool-name.neon.tech/dbname?sslmode=require
JWT_SECRET_KEY=your_64_character_hex_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
```

Run Backend Server:
```bash
python main.py
```
*Backend initializes automatically on `http://127.0.0.1:8000`.*

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 📁 Repository Structure

```gcode
ca/
├── 📁 backend/                 # Python Flask / FastAPI Serverless Service
│   ├── 📁 api/                 # Vercel Serverless Function Handler
│   ├── 📁 config/              # Application Settings & ENV Readers
│   ├── 📁 database/            # SQLAlchemy Engine & Pool Config
│   ├── 📁 models/              # User, Transaction & Audit ORM Schemas
│   ├── 📁 routes/              # Auth, Transaction & Dashboard Endpoints
│   ├── 📄 main.py              # Application Entry point
│   └── 📄 requirements.txt     # Python Dependencies
├── 📁 frontend/                # React 18 + Vite Frontend Application
│   ├── 📁 src/
│   │   ├── 📁 components/      # Glassmorphism & UI Components
│   │   ├── 📁 pages/           # Sender & Receiver Dashboard Views
│   │   ├── 📁 context/         # AuthContext & Session Provider
│   │   ├── 📁 services/        # Axios API Client Modules
│   │   └── 📁 styles/          # Tailwind CSS v4 Styles
│   ├── 📄 package.json         # Node Dependencies & Scripts
│   └── 📄 vercel.json          # Frontend Routing Rules
└── 📄 README.md                # Platform Documentation
```

---

## 🌐 Deployment Guide (Vercel + Neon PostgreSQL)

1. **Database**: Provision a free PostgreSQL database on [Neon.tech](https://neon.tech) and copy your connection string.
2. **Deploy Backend on Vercel**:
   - Create a project on Vercel selecting `backend` as the Root Directory.
   - Configure Environment Variables: `DATABASE_URL`, `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `CORS_ORIGINS`.
3. **Deploy Frontend on Vercel**:
   - Create a separate project on Vercel selecting `frontend` as the Root Directory.
   - Build Command: `npm run build` | Output Directory: `dist`.

---

## 🛡️ Security Features

- 🔒 **Bcrypt Password Hashing**: Passwords stored using 12 rounds of bcrypt hashing.
- 🔑 **Cryptographic JWT Tokens**: Stateless HMAC-SHA256 signatures with 24h expiration.
- 🛡️ **Role-Based Guards**: Strict role enforcement preventing client users from executing receiver functions.
- 💉 **SQL Injection Prevention**: Full ORM query abstraction via SQLAlchemy.

---

## 📜 License & Author

Private — All rights reserved.

<div align="center">

---
### 👨‍💻 Architected & Engineered by **Mahesh Vilasagaram**
*AI-First Full-Stack Software Engineer*

[![GitHub](https://img.shields.io/badge/GitHub-mahesh11112007-181717?style=for-the-badge&logo=github)](https://github.com/mahesh11112007)

</div>
