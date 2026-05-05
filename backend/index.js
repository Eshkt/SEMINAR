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
  message: { error: 'Rate limit exceeded' }
});
app.use(limiter);

// Filter must be imported dynamically due to ESM package
let filterInstance = null;
const getFilter = async () => {
  if (!filterInstance) {
    const BadWords = (await import('bad-words')).default;
    filterInstance = new BadWords();
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
            CREATE TYPE status_enum AS ENUM ('pend', 'apprv', 'flag');
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
      console.log('Database initialized.');
    }
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
app.post('/submit', async (req, res, next) => {
  console.log('Submit request body:', req.body);
  try {
    const rawText = req.body?.text;
    if (!rawText || typeof rawText !== 'string') {
      console.warn('Submit: Text missing or not a string', req.body);
      return res.status(400).json({ error: 'Text required' });
    }
    
    const text = sanitizeInput(rawText);
    console.log('Sanitized text:', text);
    if (text.length === 0) {
      return res.status(400).json({ error: 'Text required' });
    }
    if (text.length > 280) {
      return res.status(400).json({ error: 'TOO_LONG' });
    }

    const filter = await getFilter();
    if (filter.isProfane(text)) {
      return res.status(400).json({ error: 'PROFANITY' });
    }

    // Fetch recent approved questions for duplicate detection
    const approvedResult = await pool.query(
      'SELECT id, txt FROM questions WHERE stat = $1 ORDER BY ts DESC LIMIT 10',
      ['apprv']
    );
    const approvedQuestions = approvedResult.rows.map(r => ({ id: r.id, text: r.txt }));

    const modResult = await bedrockMod(text, approvedQuestions);
    if (!modResult.safe) {
      return res.status(400).json({ error: 'UNSAFE' });
    }

    const id = crypto.randomUUID();
    let gid = modResult.groupId;
    
    // Ensure gid is a valid UUID and not just a string "null"
    if (gid === 'null' || gid === '') gid = null;
    
    // Defensive check: if gid provided, verify it exists in DB to avoid FK error
    if (gid) {
      const checkGid = await pool.query('SELECT id FROM questions WHERE id = $1', [gid]);
      if (checkGid.rows.length === 0) gid = null;
    }

    await pool.query(
      'INSERT INTO questions (id, txt, stat, gid) VALUES ($1, $2, $3, $4)',
      [id, text, 'pend', gid]
    );

    await realtime.publish('questionSubmitted', { id, txt: text, stat: 'pend', ts: new Date() });
    res.status(201).json({ id, text, status: 'pending' });
  } catch (err) {
    next(err);
  }
});

app.get('/questions/approved', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM questions WHERE stat = $1 ORDER BY ts DESC',
      ['apprv']
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.get('/questions/pending', adminMiddleware, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM questions WHERE stat = $1 ORDER BY ts ASC',
      ['pend']
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

app.post('/questions/approve/:id', adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateResult = await pool.query("UPDATE questions SET stat = 'apprv' WHERE id = $1", [id]);
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    const result = await pool.query('SELECT * FROM questions WHERE id = $1', [id]);
    const question = result.rows[0];
    if (question) {
      await realtime.publish('questionApproved', question);
    }
    res.json(question || { id, status: 'approved' });
  } catch (err) {
    next(err);
  }
});

app.post('/questions/hide/:id', adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateResult = await pool.query("UPDATE questions SET stat = 'flag' WHERE id = $1", [id]);
    if (updateResult.rowCount === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    await realtime.publish('questionHidden', { id });
    res.json({ id, status: 'flag' });
  } catch (err) {
    next(err);
  }
});

app.delete('/questions/:id', adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM questions WHERE id = $1', [id]);
    await realtime.publish('questionDeleted', { id });
    res.status(204).send();
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
