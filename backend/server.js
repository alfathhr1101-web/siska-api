import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { appendToSheet } from './googleSheet.js';
import banksRouter from './routes/banks.routes.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
    'https://botwdsis4d.com',
    'https://www.botwdsis4d.com'
  ]
  }
});

const PORT = 3001;

// =========================
// MIDDLEWARE
// =========================
app.use(cors());
app.use(express.json({ limit: '200kb' }));
app.use('/api/banks', banksRouter);

// =========================
// MEMORY DATABASE
// =========================
let logs = [];
const trxIds = new Set();

let adminStatus = {};

// =========================
// HELPER
// =========================
function nowTime(){
  return new Date().toLocaleTimeString('id-ID');
}

function getStats(){
  return {
    total: logs.length,
    success: logs.filter(x => x.status === 'APPROVED').length
  };
}

// =========================
// SOCKET.IO
// =========================
io.on('connection', (socket) => {

  // kirim data awal
  socket.emit('init-data', {
    logs: logs.slice(0, 40),
    stats: getStats()
  });

  // sengaja tidak log connect/disconnect
});

// =========================
// ROOT
// =========================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SIS4D Realtime Server'
  });
});

// =========================
// HEALTH CHECK
// =========================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    logs: logs.length,
    admins: Object.keys(adminStatus).length,
    time: new Date().toISOString()
  });
});

// =========================
// ADMIN HEARTBEAT
// =========================
app.post('/api/admin-status', (req, res) => {

  const {
    admin,
    activeBank,
    botEnabled,
    lastSeen
  } = req.body;

  if (!admin) {
    return res.status(400).json({
      success: false,
      message: 'admin wajib diisi'
    });
  }

  adminStatus[admin.toLowerCase()] = {
    admin: admin.toLowerCase(),
    activeBank,
    botEnabled: botEnabled !== false,
    lastSeen: lastSeen || Date.now()
  };

  io.emit('admin-update');

  res.json({ success: true });
});

// =========================
// GET ADMIN ONLINE
// =========================
app.get('/api/admin-status', (req, res) => {

  const now = Date.now();

  const result = Object.values(adminStatus).map(item => ({
    ...item,
    online: now - item.lastSeen < 60000
  }));

  res.json(result);
});

// cleanup admin offline
setInterval(() => {

  const now = Date.now();

  for (const key in adminStatus) {

    if (now - adminStatus[key].lastSeen > 5 * 60 * 1000) {
      delete adminStatus[key];
    }
  }

}, 60000);

// =========================
// GET LOGS
// =========================
app.get('/api/logs', (req, res) => {
  res.json(logs.slice(0, 40));
});

// =========================
// POST TRANSAKSI
// =========================
app.post('/api/logs', async (req, res) => {

  try {

    const item = {

      id: Date.now(),

      tanggal: req.body.tanggal || '',

      userId: req.body.userId || '',
      atasNama: req.body.atasNama || '',
      nominal: Number(req.body.nominal || 0),

      username: req.body.username || '',

      bankTujuan: req.body.bankTujuan || '',
      bankAsal: req.body.bankAsal || '',
      bankAktif: req.body.bankAktif || '',

      note: req.body.note || '',

      admin: (req.body.admin || '').toLowerCase(),

      operatorLogin:
        (req.body.operatorLogin || '').toLowerCase(),

      status: req.body.status || 'APPROVED',

      trxId: req.body.trxId || ''
    };

    // validasi
    if (!item.trxId) {
      return res.status(400).json({
        success: false,
        message: 'trxId wajib'
      });
    }

    // anti duplikat
    if (trxIds.has(item.trxId)) {
      return res.json({
        success: true,
        duplicate: true
      });
    }

    trxIds.add(item.trxId);

    // simpan terbaru di depan
    logs.unshift(item);

    if (logs.length > 500) {

      const removed = logs.pop();

      if (removed?.trxId) {
        trxIds.delete(removed.trxId);
      }
    }

    // realtime dashboard
    io.emit('new-log', item);
    io.emit('stats-update', getStats());

    // log terminal bersih
    console.log(
      `[${nowTime()}] [${item.admin}] ${item.username} | Rp ${item.nominal.toLocaleString('id-ID')}`
    );

    // kirim response cepat
    res.json({
      success: true,
      item
    });

    // background google sheet
    try {

      const adminInfo = adminStatus[item.admin];
      const bankName = adminInfo?.activeBank || '';

if (bankName) {

  appendToSheet(
    bankName,
    item,
    bankName
  )
    .then(() => {

      console.log(
        `[${nowTime()}] [SHEET OK] ${bankName}`
      );

    })
    .catch(err => {

      console.error(
        `[${nowTime()}] [SHEET ERROR] ${err.message}`
      );
    });
}

    } catch (err) {

      console.error(
        `[${nowTime()}] [SHEET ERROR] ${err.message}`
      );
    }

  } catch (err) {

    console.error(
      `[${nowTime()}] [POST ERROR] ${err.message}`
    );

    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

// =========================
// CLEAR LOG
// =========================
app.delete('/api/logs', (req, res) => {

  logs = [];
  trxIds.clear();

  io.emit('logs-cleared');

  res.json({
    success: true
  });
});

// =========================
// START SERVER
// =========================
server.listen(PORT, () => {

  console.log('');
  console.log('====================================');
  console.log('🚀 SIS4D Realtime Server');
  console.log(`📡 http://127.0.0.1:${PORT}`);
  console.log('====================================');
  console.log('');
});