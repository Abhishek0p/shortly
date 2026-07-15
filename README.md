# URL Shortener with Analytics

A full-stack, production-ready URL shortener built with modern technologies. It provides ultra-fast redirects, secure Google Authentication, and real-time click analytics.

## 🚀 Tech Stack

- **Frontend:** React (Vite), Vanilla CSS (Custom Design System)
- **Backend:** Python (FastAPI)
- **Database:** MongoDB Atlas (Persistent Storage)
- **Cache & Rate Limiting:** Redis
- **Authentication:** Supabase (OAuth + JWT)

## ✨ Features

- **Google OAuth:** Secure authentication powered by Supabase.
- **Lightning Fast Redirects:** Sub-10ms redirects cached natively using Redis.
- **Analytics Dashboard:** Track clicks, referrers, device types, browsers, and daily trends.
- **Rate Limiting:** Protects the API against abuse (10 req/min per IP).
- **Data Isolation:** Links are tied securely to the authenticated user via JWT verification.

## 🛠️ Local Development

### 1. Backend Setup (FastAPI)
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
```
Create a `.env` file in the `backend/` directory:
```env
MONGODB_URL=mongodb+srv://...
DB_NAME=url_shortener
REDIS_URL=redis://localhost:6379
BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
```
Run the backend:
```bash
uvicorn app.main:app --reload
```

### 2. Frontend Setup (React/Vite)
```bash
cd frontend
npm install
```
Create a `.env` file in the `frontend/` directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
Run the frontend:
```bash
npm run dev
```

## 🔒 Security Notice
Do not commit `.env` files. The `.gitignore` is configured to prevent accidental uploads of secrets.
