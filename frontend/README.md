# Local-First Q&A Web App

A real-time Q&A application for seminars, classrooms, or events. Guests can submit anonymous questions, and moderators can approve/reject them before they go live.

---

## Architecture

- **Backend:** Node.js + Express (`localhost:5000`)
- **Frontend:** Vite + React (`localhost:5173`)
- **Database:** Local JSON file (`backend/db.json`)
- **Profanity Filter:** `bad-words` library

---

## Project Structure

```
SEMINAR/
├── backend/
│   ├── server.js          # Express server with API routes
│   ├── db.json            # Local database (auto-created)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main router
│   │   ├── App.css        # Styles
│   │   └── pages/
│   │       ├── Guest.jsx  # Public question submission
│   │       ├── Admin.jsx  # Moderation dashboard
│   │       └── Login.jsx  # Admin login
│   └── package.json
└── gemini-code-1777695983444.md  # This file
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
```

### Access

- **Guest Interface:** http://localhost:5173
- **Admin Login:** http://localhost:5173/login
- **Admin Password:** `admin123`

---

## API Endpoints

### Guest Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/questions` | Get all approved questions |
| POST | `/api/questions` | Submit a new question (body: `{ text: string }`) |
| GET | `/api/questions/:id` | Get a specific question by ID |

### Admin Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/admin/login` | - | Login (body: `{ password: string }`) |
| GET | `/api/admin/questions/pending` | Bearer token | Get pending questions |
| POST | `/api/admin/questions/approve/:id` | Bearer token | Approve a question |
| DELETE | `/api/admin/questions/:id` | Bearer token | Delete a question |

---

## Features

### Guest Interface
- Anonymous question submission
- Real-time status updates (Pending Approval / Live)
- Profanity filter with toast notification

### Admin Dashboard
- Password-protected access
- View pending questions
- Approve or delete submissions

### Data Model

```json
{
  "id": "uuid",
  "text": "String",
  "author": "Anonymous",
  "status": "pending | approved | rejected",
  "upvotes": 0,
  "createdAt": "timestamp"
}
```

---

## Configuration

- **Backend Port:** `5000` (change in `server.js`)
- **Frontend Port:** `5173` (Vite default)
- **Admin Password:** `admin123` (change in `server.js`)
- **Database File:** `backend/db.json`

---

## Development Notes

- Frontend polls every 5 seconds for question updates
- Profanity uses `bad-words` v4 (ESM module)
- Backend uses ES modules (`"type": "module"` in package.json)
