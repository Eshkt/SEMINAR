import express from 'express';
import cors from 'cors';
import { Filter } from 'bad-words';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;
const ADMIN_PASSWORD = 'admin123';

const DB_FILE = path.join(__dirname, 'db.json');

// Initialize database
function loadDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ questions: [] }, null, 2));
    return { questions: [] };
  }
  return JSON.parse(fs.readFileSync(DB_FILE));
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Profanity filter
const filter = new Filter();

// Middleware
app.use(cors());
app.use(express.json());

// Profanity check middleware for POST requests
function checkProfanity(req, res, next) {
  if (req.body && req.body.text) {
    if (filter.isProfane(req.body.text)) {
      return res.status(400).json({
        error: 'Profanity detected',
        message: 'Please keep your questions professional'
      });
    }
  }
  next();
}

// Simple auth middleware for admin routes
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  if (token !== ADMIN_PASSWORD) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

// Guest routes
app.get('/api/questions', (req, res) => {
  const db = loadDB();
  const approved = db.questions.filter(q => q.status === 'approved');
  res.json(approved);
});

app.post('/api/questions', checkProfanity, (req, res) => {
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Question text is required' });
  }

  const db = loadDB();
  const question = {
    id: uuidv4(),
    text: text.trim(),
    author: 'Anonymous',
    status: 'pending',
    upvotes: 0,
    createdAt: Date.now()
  };
  db.questions.push(question);
  saveDB(db);

  res.status(201).json(question);
});

app.get('/api/questions/:id', (req, res) => {
  const db = loadDB();
  const question = db.questions.find(q => q.id === req.params.id);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }
  res.json(question);
});

// Admin routes
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_PASSWORD });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

app.get('/api/admin/questions/pending', authMiddleware, (req, res) => {
  const db = loadDB();
  const pending = db.questions.filter(q => q.status === 'pending');
  res.json(pending);
});

app.post('/api/admin/questions/approve/:id', authMiddleware, (req, res) => {
  const db = loadDB();
  const question = db.questions.find(q => q.id === req.params.id);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }
  question.status = 'approved';
  saveDB(db);
  res.json(question);
});

app.delete('/api/admin/questions/:id', authMiddleware, (req, res) => {
  const db = loadDB();
  const index = db.questions.findIndex(q => q.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Question not found' });
  }
  db.questions.splice(index, 1);
  saveDB(db);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
