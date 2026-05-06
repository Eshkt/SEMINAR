// Backend - Dual runtime (local/lambda)
// RUNTIME=local → Express + Socket.io on port 5000
// RUNTIME=lambda → serverless-http wrapper for Lambda

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { Pool } = require('pg');
const { Server } = require('socket.io');

const serverless = require('serverless-http');

const bedrockMod = require('./lib/bedrockMod');
const realtime = require('./lib/realtime');
const adminMiddleware = require('./lib/adminMiddleware');


const DB_URL = process.env.DB_URL || 'postgres://qa_user:qa_pass@localhost:5432/qa_db';
const ADMIN_PASS = process.env.ADMIN_PASS;
if (!ADMIN_PASS && process.env.RUNTIME === 'lambda') {
  console.error('ADMIN_PASS must be set for lambda runtime');
  process.exit(1);
}
const RUNTIME = process.env.RUNTIME || 'local';

const app = express();
app.set('trust proxy', 1);
app.use(cors({
  origin: '*'
}));
app.use(express.json());
app.use(express.text({ type: 'text/plain' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: 'Rate limit exceeded' },
  keyGenerator: (req) => req.ip || 'unknown'
});
app.use(limiter);

// Filter must be imported dynamically due to ESM package
let filterInstance = null;
const getFilter = async () => {
  if (!filterInstance) {
    const { Filter } = await import('bad-words');
    filterInstance = new Filter();
  }
  return filterInstance;
};

const pool = new Pool({ 
  connectionString: DB_URL,
  ssl: process.env.RUNTIME === 'lambda' ? { rejectUnauthorized: false } : false
});

// Initialize database
const initDb = async () => {
  try {
    // Check if table exists
    const checkTable = await pool.query("SELECT to_regclass('public.questions')");
    if (!checkTable.rows[0].to_regclass) {
      console.log('Creating questions table...');
      await pool.query(`
        DO $$ 
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_enum') THEN
            CREATE TYPE status_enum AS ENUM ('pend', 'apprv', 'flag', 'done');
          END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS questions (
          id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          txt  TEXT NOT NULL,
          stat status_enum NOT NULL DEFAULT 'pend',
          gid  UUID REFERENCES questions(id),
          ts   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    }
    // Migration: Ensure 'done' value exists and new columns added
    await pool.query("ALTER TYPE status_enum ADD VALUE IF NOT EXISTS 'done'");
    await pool.query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS name TEXT");
    await pool.query("ALTER TABLE questions ADD COLUMN IF NOT EXISTS course_section TEXT NOT NULL DEFAULT ''");
    console.log('Database initialized and migrated.');
  } catch (err) {
    console.error('Database initialization failed:', err);
  }
};
initDb();

// Sanitize input - remove control characters, trim whitespace
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
}

// Routes
// POST /questions - Public submission
app.post('/questions', async (req, res, next) => {
  console.log('Submit request body:', req.body);
  try {
    const { name, courseSection, question: rawText } = req.body;
    
    if (!courseSection) {
      return res.status(400).json({ error: 'courseSection required' });
    }
    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({ error: 'question required' });
    }
    
    const text = sanitizeInput(rawText);
    if (text.length === 0) return res.status(400).json({ error: 'question required' });
    if (text.length > 500) return res.status(400).json({ error: 'TOO_LONG' });

    const filter = await getFilter();
    if (filter.isProfane(text)) return res.status(400).json({ error: 'PROFANITY' });

    const id = crypto.randomUUID();
    const cleanName = name ? sanitizeInput(name) : null;
    const cleanCourse = sanitizeInput(courseSection);

    await pool.query(
      'INSERT INTO questions (id, name, course_section, txt, stat) VALUES ($1, $2, $3, $4, $5)',
      [id, cleanName, cleanCourse, text, 'pend']
    );

    const question = { id, name: cleanName, courseSection: cleanCourse, text, ts: new Date() };
    await realtime.publish('questionSubmitted', question);
    res.status(201).json({ success: true, id });
  } catch (err) {
    next(err);
  }
});

// GET /questions - Protected admin list
app.get('/questions', adminMiddleware, async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT id, name, course_section as \"courseSection\", txt as question, ts FROM questions WHERE stat != 'done' ORDER BY ts ASC"
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// PATCH /questions/:id/done - Mark as done
app.patch('/questions/:id/done', adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateResult = await pool.query("UPDATE questions SET stat = 'done' WHERE id = $1", [id]);
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    await realtime.publish('questionDone', { id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /questions/:id - Permanent delete
app.delete('/questions/:id', adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM questions WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    await realtime.publish('questionDeleted', { id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message, // Always show message for debugging
    stack: RUNTIME === 'local' ? err.stack : undefined
  });
});

if (RUNTIME === 'local') {
  const PORT = 5000;
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

// Lambda export - serverless-http wrapper
module.exports.handler = serverless(app);
