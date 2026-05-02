// Backend - Dual runtime (local/lambda)
// RUNTIME=local → Express + Socket.io on port 5000
// RUNTIME=lambda → serverless-http wrapper for Lambda

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Filter = require('bad-words');
const { Pool } = require('pg');
const { Server } = require('socket.io');
const serverless = require('serverless-http');

const bedrockMod = require('./lib/bedrockMod');
const realtime = require('./lib/realtime');
const adminMiddleware = require('./lib/adminMiddleware');

const DB_URL = process.env.DB_URL || 'postgres://qa_user:qa_pass@localhost:5432/qa_db';
const ADMIN_PASS = process.env.ADMIN_PASS || 'localadmin123';
const RUNTIME = process.env.RUNTIME || 'local';

const app = express();
app.use(cors());
app.use(express.json());

const filter = new Filter();
const pool = new Pool({ connectionString: DB_URL });

let io;
if (RUNTIME === 'local') {
  const http = require('http');
  const server = http.createServer(app);
  io = new Server(server, { cors: { origin: '*' } });
  realtime.init(io);
}

// Routes
app.post('/submit', async (req, res) => {
  const { text } = req.body;

  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Text required' });
  }
  if (text.length > 280) {
    return res.status(400).json({ error: 'TOO_LONG' });
  }
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

  const id = uuidv4();
  const gid = modResult.groupId; // AI detected duplicate or group
  await pool.query(
    'INSERT INTO questions (id, txt, stat, gid) VALUES ($1, $2, $3, $4)',
    [id, text, 'pend', gid]
  );

  realtime.publish('questionSubmitted', { id, txt: text, stat: 'pend', ts: new Date() });
  res.status(201).json({ id, text, status: 'pending' });
});

app.get('/questions/approved', async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM questions WHERE stat = $1 ORDER BY ts DESC',
    ['apprv']
  );
  res.json(result.rows);
});

app.get('/questions/pending', adminMiddleware, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM questions WHERE stat = $1 ORDER BY ts ASC',
    ['pend']
  );
  res.json(result.rows);
});

app.post('/questions/approve/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  await pool.query("UPDATE questions SET stat = 'apprv' WHERE id = $1", [id]);
  const result = await pool.query('SELECT * FROM questions WHERE id = $1', [id]);
  realtime.publish('questionApproved', result.rows[0]);
  res.json(result.rows[0]);
});

app.post('/questions/hide/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  await pool.query("UPDATE questions SET stat = 'flag' WHERE id = $1", [id]);
  realtime.publish('questionHidden', { id });
  res.json({ id, status: 'flag' });
});

app.delete('/questions/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM questions WHERE id = $1', [id]);
  realtime.publish('questionDeleted', { id });
  res.status(204).send();
});

if (RUNTIME === 'local') {
  const PORT = 5000;
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);
  });
  app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
}

// Lambda export
module.exports.handler = serverless(app);
