/* ============================================================
   DarkGlass Mail — Backend Express
   Wrapper API untuk scraper SmailPro (lib/smailpro.js).
   ============================================================ */

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import smailpro from './lib/smailpro.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err?.message || err));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err?.message || err));

const wrap = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    console.error('[API]', err?.message || err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err?.message || 'Internal server error' });
    }
  }
};

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', uptime: Math.round(process.uptime()) });
});

app.get('/api/domains', wrap(async (req, res) => {
  const domains = await smailpro.getDomains();
  res.json({ success: true, domains });
}));

app.post('/api/create', wrap(async (req, res) => {
  const { domain, username, type, server } = req.body || {};
  const result = await smailpro.createEmail({ domain, username, type, server });
  res.json(result);
}));

app.post('/api/inbox', wrap(async (req, res) => {
  const account = req.body?.account || req.body;
  if (!account || !account.address) {
    return res.status(400).json({ success: false, error: 'account.address wajib dikirim' });
  }
  const result = await smailpro.getInbox(account);
  res.json(result);
}));

app.post('/api/message', wrap(async (req, res) => {
  const { account, mid } = req.body || {};
  if (!account || !account.address || !mid) {
    return res.status(400).json({ success: false, error: 'account.address dan mid wajib dikirim' });
  }
  const result = await smailpro.getMessage(account, mid);
  res.json(result);
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ success: false, error: 'Endpoint tidak ditemukan' });
  }
});

app.use((err, req, res, next) => {
  console.error('[ERR]', err?.message || err);
  if (res.headersSent) return next(err);
  res.status(err?.status || 500).json({ success: false, error: err?.message || 'Internal server error' });
});

export default app;

if (!process.env.VERCEL) {
  const PORT = Number(process.env.SERVER_PORT || process.env.PORT || 3000);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[DarkGlass Mail] Server berjalan di http://0.0.0.0:${PORT}`);
  });

  process.on('SIGTERM', () => process.exit(0));
  process.on('SIGINT', () => process.exit(0));
}
