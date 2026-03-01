# Parker College Management (Full Stack)

This repository contains both:
- `frontend` (React app)
- `backend` (Node.js + Express API)

## Prerequisites

- Node.js 18+ (or newer)
- MongoDB running locally

## 1) Clone and install

```bash
git clone https://github.com/AshleyImmanuel/alan_college_management.git
cd alan_college_management
```

Install backend deps:

```bash
cd backend
npm install
```

Install frontend deps:

```bash
cd ../frontend
npm install
```

## 2) Configure backend env

Create `backend/.env` from `backend/.env.example`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/parker_university
JWT_SECRET=your_secret_here
PORT=5000
```

Use your own local MongoDB URI if needed.

## 3) Run app

Start backend:

```bash
cd backend
npm start
```

Start frontend in another terminal:

```bash
cd frontend
npm start
```

App URLs:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

## Notes

- Frontend proxies API requests to `http://localhost:5000`.
- Students/faculty/hod/admin workflows are included.
- Leave request flow is role-based:
  - student -> faculty
  - faculty -> hod
  - hod -> admin
