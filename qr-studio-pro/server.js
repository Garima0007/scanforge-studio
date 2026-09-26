'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const express = require('express');
const session = require('express-session');
const multer = require('multer');

const app = express();
const port = Number(process.env.PORT) || 8080;
const publicBaseUrl = String(process.env.PUBLIC_URL || '').replace(/\/$/, '');
const maxFileSize = 500 * 1024 * 1024;
const storageRoot = path.join(__dirname, 'storage');
const uploadRoot = path.join(storageRoot, 'uploads');
fs.mkdirSync(storageRoot, { recursive: true });
const database = new Database(path.join(storageRoot, 'qrforge.db'));
const lanAddress = Object.values(os.networkInterfaces())
  .flat()
  .find(address => address && address.family === 'IPv4' && !address.internal)?.address || '';
const defaultBaseUrl = lanAddress ? `http://${lanAddress}:${port}` : '';

fs.mkdirSync(uploadRoot, { recursive: true });

database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadRoot),
    filename: (_req, _file, callback) => callback(null, `${crypto.randomUUID()}.bin`)
  }),
  limits: { fileSize: maxFileSize },
  fileFilter: (_req, file, callback) => {
    if (!file.originalname || file.originalname.length > 255) {
      return callback(new Error('Invalid file name'));
    }
    callback(null, true);
  }
});

app.use(express.json({ limit: '1mb' }));
app.use(session({
  name: 'qrforge.sid',
  secret: process.env.SESSION_SECRET || 'qrforge-local-development-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));
app.use(express.static(__dirname));

app.get('/api/network', (_req, res) => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const [name, list] of Object.entries(interfaces)) {
    for (const item of list || []) {
      if (item && item.family === 'IPv4' && !item.internal) {
        addresses.push({ name, address: item.address, url: `http://${item.address}:${port}` });
      }
    }
  }
  res.json({
    port,
    lanAddress,
    defaultBaseUrl,
    publicBaseUrl,
    addresses
  });
});

const publicUser = user => ({ id: user.id, name: user.name, email: user.email });

app.get('/api/auth/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated.' });
  const user = database.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.session.userId);
  if (!user) return res.status(401).json({ error: 'Session expired.' });
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/register', (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');

  if (name.length < 2) return res.status(400).json({ error: 'Enter your name.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

  if (database.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'Email is already registered.' });
  }

  const passwordHash = bcrypt.hashSync(password, 12);
  const result = database.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)').run(name, email, passwordHash);
  req.session.userId = result.lastInsertRowid;
  const user = database.prepare('SELECT id, name, email FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const user = database.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }

  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.status(204).end());
});

app.post('/api/files', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'A file is required.' });
  }

  const metadata = {
    id: path.basename(req.file.filename, '.bin'),
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype || 'application/octet-stream',
    size: req.file.size,
    createdAt: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(uploadRoot, `${metadata.id}.json`),
    JSON.stringify(metadata),
    'utf8'
  );

  const customBase = String(req.headers['x-custom-base-url'] || req.query.base || '').trim().replace(/\/$/, '');
  const resolvedBase = customBase || publicBaseUrl || defaultBaseUrl || `${req.protocol}://${req.get('host')}`;

  res.status(201).json({
    id: metadata.id,
    url: `${resolvedBase.replace(/\/$/, '')}/api/files/${metadata.id}`,
    name: metadata.originalName,
    size: metadata.size,
    lanAddress,
    port
  });
});

app.get('/api/files/:id', (req, res) => {
  if (!/^[a-f0-9-]{36}$/i.test(req.params.id)) {
    return res.status(404).json({ error: 'File not found.' });
  }

  const metadataPath = path.join(uploadRoot, `${req.params.id}.json`);
  if (!fs.existsSync(metadataPath)) {
    return res.status(404).json({ error: 'File not found.' });
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const filePath = path.join(uploadRoot, metadata.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found.' });
  }

  res.type(metadata.mimeType);
  const safeName = metadata.originalName.replace(/[\r\n"]/g, '_');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(safeName)}`);
  res.sendFile(filePath);
});

app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File exceeds the 500 MB limit.' });
  }
  res.status(400).json({ error: error.message || 'Upload failed.' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`\n==========================================`);
  console.log(`🚀 QRForge Pro Server running:`);
  console.log(`   Local URL:   http://localhost:${port}`);
  if (lanAddress) {
    console.log(`   Network URL: http://${lanAddress}:${port} (For phone scanning on same Wi-Fi)`);
  }
  if (publicBaseUrl) {
    console.log(`   Public URL:  ${publicBaseUrl}`);
  }
  console.log(`   Max upload:  ${maxFileSize / 1024 / 1024} MB`);
  console.log(`==========================================\n`);
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.log(`QRForge is already running on port ${port}. Open http://localhost:${port}/`);
    process.exitCode = 0;
    return;
  }
  throw error;
});
