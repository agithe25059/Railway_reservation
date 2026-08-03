# 🚂 RailConnect — Railway Reservation System

A full-stack Railway Reservation System built with **React**, **Node.js/Express**, and **MySQL (Aiven Cloud)**.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + React Router v6 |
| Backend | Node.js + Express |
| Database | MySQL 8 (Aiven Cloud) |
| Auth | bcryptjs (salt=12) + JWT |
| Frontend Deploy | Vercel |
| Backend Deploy | Render.com |

## Features (Step 1 — Auth)

- ✅ User Registration with bcrypt password hashing (salt rounds = 12)
- ✅ User Login with JWT token generation
- ✅ Password strength indicator
- ✅ Protected dashboard route
- ✅ Glassmorphism UI design with animations

## Getting Started

### Prerequisites
- Node.js 18+
- MySQL 8 (or Aiven cloud instance)

### Backend Setup

```bash
cd server
cp .env.example .env
# Fill in your Aiven MySQL credentials in .env
npm install
node server.js
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

### Database Setup

Run `server/schema.sql` on your MySQL instance:

```bash
mysql -h <host> -P <port> -u <user> -p < server/schema.sql
```

## Deployment

- **Backend** → [Render.com](https://render.com) (connects to GitHub, auto-deploys)
- **Frontend** → [Vercel](https://vercel.com) (connects to GitHub, auto-deploys)
- **Database** → [Aiven MySQL](https://aiven.io) (free tier)

## Environment Variables

### Server (`server/.env`)
```
DB_HOST=your-aiven-host.aivencloud.com
DB_PORT=12345
DB_USER=avnadmin
DB_PASSWORD=your_password
DB_NAME=railway_reservation
JWT_SECRET=your_secret_key
CLIENT_URL=https://your-vercel-app.vercel.app
```

### Client (`client/.env.production`)
```
VITE_API_URL=https://your-render-app.onrender.com
```
