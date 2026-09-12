import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import { appendToSheet, getSpreadsheetSheets, extractSpreadsheetId } from './googleSheet.js';
import banksRouter from './routes/banks.routes.js';
import db from './config/database.js';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'https://botwdsis4d.com',
      'https://www.botwdsis4d.com',
      'http://localhost:5173',
      'http://127.0.0.1:5173'
    ],
    methods: ['GET', 'POST', 'DELETE']
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

async function loadAdminStatus() {
  try {
    const [rows] = await db.query(`
      SELECT
        admin,
        active_bank AS activeBank,
        bot_enabled AS botEnabled,
        last_seen AS lastSeen
      FROM admin_status
    `);

    adminStatus = {};

    for (const row of rows) {
      adminStatus[row.admin] = {
        admin: row.admin,
        activeBank: row.activeBank || '',
        botEnabled: Boolean(row.botEnabled),
        lastSeen: Number(row.lastSeen) || Date.now()
      };
    }

    console.log(
      `[${nowTime()}] [MYSQL] ${rows.length} status admin berhasil dimuat`
    );
  } catch (error) {
    console.error(
      `[${nowTime()}] [MYSQL LOAD ERROR] ${error.message}`
    );
  }
}

// =========================
// HELPER
// =========================
function nowTime() {
  return new Date().toLocaleTimeString('id-ID');
}

function normalizeAdmin(admin = '') {
  return String(admin).trim().toLowerCase();
}

function getStats() {
  return {
    total: logs.length,
    success: logs.filter(
      item => String(item.status).toUpperCase() === 'APPROVED'
    ).length
  };
}

// =========================
// SOCKET.IO
// =========================
io.on('connection', socket => {
  socket.emit('init-data', {
    logs: logs.slice(0, 40),
    stats: getStats(),
    admins: Object.values(adminStatus)
  });
});

// =========================
// ROOT
// =========================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SIS4D Realtime Server',
    port: PORT
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
// ADMIN STATUS
// =========================
app.post('/api/admin-status', async (req, res) => {
  try {
    const {
      admin,
      activeBank,
      botEnabled,
      lastSeen
    } = req.body;

    const adminName = normalizeAdmin(admin);

    if (!adminName || adminName === 'unknown') {
      return res.status(400).json({
        success: false,
        message: 'admin wajib diisi dengan benar'
      });
    }

    const previous = adminStatus[adminName] || {};

    adminStatus[adminName] = {
      admin: adminName,

      activeBank:
        typeof activeBank === 'string'
          ? activeBank.trim()
          : previous.activeBank || '',

      botEnabled:
        typeof botEnabled === 'boolean'
          ? botEnabled
          : previous.botEnabled !== false,

      lastSeen: lastSeen || Date.now()
    };

    await db.query(
  `
  INSERT INTO admin_status
    (admin, active_bank, bot_enabled, last_seen)
  VALUES (?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    active_bank = VALUES(active_bank),
    bot_enabled = VALUES(bot_enabled),
    last_seen = VALUES(last_seen)
  `,
  [
    adminStatus[adminName].admin,
    adminStatus[adminName].activeBank,
    adminStatus[adminName].botEnabled ? 1 : 0,
    adminStatus[adminName].lastSeen
  ]
);

    io.emit('admin-update', adminStatus[adminName]);

    console.log(
      `[${nowTime()}] [ADMIN STATUS] ${adminName} | Bank: ${
        adminStatus[adminName].activeBank || '-'
      } | BOT: ${
        adminStatus[adminName].botEnabled ? 'ON' : 'OFF'
      }`
    );

    res.json({
      success: true,
      data: adminStatus[adminName]
    });
  } catch (error) {
    console.error(
      `[${nowTime()}] [ADMIN STATUS ERROR] ${error.message}`
    );

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// GET ADMIN STATUS
// =========================
app.get('/api/admin-status', (req, res) => {
  const now = Date.now();

  const result = Object.values(adminStatus).map(item => ({
    ...item,
    online: now - item.lastSeen < 60000
  }));

  res.json(result);
});

// =========================
// CLEANUP ADMIN OFFLINE
// =========================
setInterval(() => {
  const now = Date.now();

  for (const key in adminStatus) {
    if (now - adminStatus[key].lastSeen > 5 * 60 * 1000) {
      console.log(
        `[${nowTime()}] [ADMIN OFFLINE] ${adminStatus[key].admin}`
      );

      delete adminStatus[key];
    }
  }

  io.emit('admin-update');
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

      admin: normalizeAdmin(req.body.admin),

      operatorLogin: normalizeAdmin(
        req.body.operatorLogin || req.body.admin
      ),

      status: req.body.status || 'APPROVED',

      trxId: String(req.body.trxId || '').trim()
    };

    // =========================
    // VALIDASI TRANSAKSI
    // =========================
    if (!item.trxId) {
      return res.status(400).json({
        success: false,
        message: 'trxId wajib diisi'
      });
    }

    if (!item.nominal || item.nominal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'nominal tidak valid'
      });
    }

    // =========================
    // ANTI DUPLIKAT
    // =========================
    if (trxIds.has(item.trxId)) {
      return res.json({
        success: true,
        duplicate: true,
        message: 'Transaksi sudah pernah diterima'
      });
    }

    trxIds.add(item.trxId);

    // =========================
    // SIMPAN TRANSAKSI
    // SEMUA TRANSAKSI WAJIB MASUK DASHBOARD
    // =========================
    logs.unshift(item);

    // Batasi memory maksimal 500 transaksi
    if (logs.length > 500) {
      const removed = logs.pop();

      if (removed?.trxId) {
        trxIds.delete(removed.trxId);
      }
    }

    // =========================
    // REALTIME DASHBOARD
    // =========================
    io.emit('new-log', item);
    io.emit('stats-update', getStats());

    console.log(
      `[${nowTime()}] [DASHBOARD] [${
        item.admin || '-'
      }] ${item.username || item.userId || '-'} | Rp ${
        item.nominal.toLocaleString('id-ID')
      }`
    );

    // Response langsung ke extension
    res.json({
      success: true,
      item
    });

    // =========================
    // ATURAN BOT GOOGLE SHEETS
    // =========================
    const adminInfo = adminStatus[item.admin];

    const botIsOn = adminInfo?.botEnabled === true;

    const activeBank =
      adminInfo?.activeBank ||
      item.bankAktif ||
      '';

    // BOT OFF:
    // Transaksi tetap dashboard, tidak dikirim ke Sheet
    if (!botIsOn) {
      console.log(
        `[${nowTime()}] [SHEET SKIP] Admin ${
          item.admin || '-'
        } BOT OFF`
      );

      return;
    }

    // BOT ON tapi belum pilih bank:
    // Tetap dashboard, tidak dikirim ke Sheet
    if (!activeBank) {
      console.log(
        `[${nowTime()}] [SHEET SKIP] Admin ${
          item.admin || '-'
        } belum memilih bank aktif`
      );

      return;
    }

    // =========================
    // KIRIM KE GOOGLE SHEETS
    // =========================
    try {
      await appendToSheet(
        activeBank,
        item,
        activeBank
      );

      console.log(
        `[${nowTime()}] [SHEET OK] Admin ${
          item.admin || '-'
        } | Bank ${activeBank} | ${item.trxId}`
      );
    } catch (error) {
      console.error(
        `[${nowTime()}] [SHEET ERROR] ${activeBank} | ${
          error.message
        }`
      );
    }
  } catch (error) {
    console.error(
      `[${nowTime()}] [POST ERROR] ${error.message}`
    );

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
});

// =========================
// CLEAR LOG
// =========================
app.delete('/api/logs', (req, res) => {
  logs = [];
  trxIds.clear();

  io.emit('logs-cleared');
  io.emit('stats-update', getStats());

  console.log(`[${nowTime()}] [LOGS CLEARED]`);

  res.json({
    success: true,
    message: 'Semua log berhasil dihapus'
  });
});


// =========================
// GOOGLE SPREADSHEET CONFIG
// =========================

// Ambil semua konfigurasi spreadsheet
app.get('/api/spreadsheet-config', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        name,
        spreadsheet_url,
        spreadsheet_id,
        is_active,
        created_at,
        updated_at
      FROM spreadsheet_config
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('[SPREADSHEET CONFIG GET]', error.message);

    res.status(500).json({
      success: false,
      message: 'Gagal mengambil konfigurasi Spreadsheet'
    });
  }
});


// Simpan konfigurasi spreadsheet baru
app.post('/api/spreadsheet-config', async (req, res) => {
  try {
    const {
      name,
      spreadsheetUrl
    } = req.body;

    if (!name || !spreadsheetUrl) {
      return res.status(400).json({
        success: false,
        message: 'Nama dan link Spreadsheet wajib diisi'
      });
    }

    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);

    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        message: 'Link Google Spreadsheet tidak valid'
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO spreadsheet_config
        (name, spreadsheet_url, spreadsheet_id, is_active)
      VALUES (?, ?, ?, 1)
      `,
      [
        name,
        spreadsheetUrl,
        spreadsheetId
      ]
    );

    res.json({
      success: true,
      message: 'Spreadsheet berhasil disimpan',
      data: {
        id: result.insertId,
        name,
        spreadsheetUrl,
        spreadsheetId
      }
    });
  } catch (error) {
    console.error('[SPREADSHEET CONFIG POST]', error.message);

    res.status(500).json({
      success: false,
      message: 'Gagal menyimpan konfigurasi Spreadsheet'
    });
  }
});

// =========================
// BACA SELURUH TAB SPREADSHEET
// =========================
app.get('/api/google-sheets', async (req, res) => {
  try {
    const { spreadsheetId, url } = req.query;

    const id = extractSpreadsheetId(
      spreadsheetId || url || ''
    );

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Spreadsheet ID atau link tidak valid'
      });
    }

    const sheets = await getSpreadsheetSheets(id);

    res.json({
      success: true,
      data: sheets
    });
  } catch (error) {
    console.error('[GOOGLE SHEETS GET]', error.message);

    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// =========================
// START SERVER
// =========================
async function startServer() {
  await loadAdminStatus();

  server.listen(PORT, () => {
    console.log('');
    console.log('====================================');
    console.log('🚀 SIS4D Realtime Server');
    console.log(`📡 http://127.0.0.1:${PORT}`);
    console.log('====================================');
    console.log('');
  });
}

startServer();