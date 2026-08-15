import { io } from 'socket.io-client';

// =========================
// GLOBAL CSS
// =========================
import './styles/app.css';
import './styles/layout.css';
import './styles/sidebar.css';
import './styles/navbar.css';
import './styles/cards.css';
import './styles/table.css';
import './styles/auth.css';

// =========================
// PAGES
// =========================
import { LoginPage, bindLogin } from './pages/auth/LoginPage.js';
import { DashboardPage } from './pages/dashboard/DashboardPage.js';
import { AdminsPage } from './pages/dashboard/AdminsPage.js';
import { BanksPage } from './pages/dashboard/BanksPage.js';

// =========================
// API ENDPOINT
// =========================
const API = {
  logs: 'https://api.botwdsis4d.com/api/logs',
  admins: 'https://api.botwdsis4d.com/api/admin-status',
  banks: 'https://api.botwdsis4d.com/api/banks'
};

// =========================
// SOCKET REALTIME
// =========================
const socket = io('https://api.botwdsis4d.com', {
  transports: ['websocket']
});

// =========================
// ROOT ELEMENT
// =========================
const app = document.getElementById('app');
const sidebar = document.getElementById('sidebar');
const navbar = document.getElementById('navbar');

// =========================
// AUTH HELPERS
// =========================
function isLoggedIn() {
  return localStorage.getItem('operator_login') === '1';
}

function getOperatorName() {
  return localStorage.getItem('sis4d_operator') || 'operator';
}

// =========================
// LOGOUT GLOBAL
// =========================
window.logout = function () {

  localStorage.removeItem('operator_login');
  localStorage.removeItem('sis4d_operator');

  location.hash = '#login';
  render();
};

// =========================
// SIDEBAR TEMPLATE
// =========================
function renderSidebar() {

  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo">S</div>
      <div>
        <h2>SIS4D</h2>
        <p>Operator Panel</p>
      </div>
    </div>

    <nav class="sidebar-nav">

      <a href="#dashboard" class="nav-item" data-page="dashboard">
        📊 Dashboard
      </a>

      <a href="#admins" class="nav-item" data-page="admins">
        👤 Admin Online
      </a>

      <a href="#banks" class="nav-item" data-page="banks">
        🏦 Bank Master
      </a>

    </nav>
  `;
}

// =========================
// NAVBAR TEMPLATE
// =========================
function renderNavbar() {

  navbar.innerHTML = `
    <div class="topbar">

      <div>
        <h1>SIS4D Operator Panel</h1>
        <small>Login sebagai: ${getOperatorName()}</small>
      </div>

      <div style="display:flex;gap:12px">
        <button id="refreshBtn" class="refresh-btn">
          Refresh
        </button>

        <button onclick="logout()" class="secondary-btn">
          Logout
        </button>
      </div>

    </div>
  `;

document.getElementById('refreshBtn')?.addEventListener('click', async () => {
  await render();
});
}

// =========================
// ROUTER
// =========================
async function render() {

  const hash = location.hash || '#login';

  // belum login
  if (!isLoggedIn()) {

    sidebar.style.display = 'none';
    navbar.style.display = 'none';

    app.innerHTML = LoginPage();
    bindLogin();

    return;
  }

  // sudah login tapi buka #login
  if (hash === '#login') {
    location.hash = '#dashboard';
    return;
  }

  sidebar.style.display = 'block';
  navbar.style.display = 'block';

  renderSidebar();
  renderNavbar();

  switch (hash) {

    case '#admins':
      app.innerHTML = AdminsPage();
      await loadAdmins();
      break;

    case '#banks':
      app.innerHTML = BanksPage();
      await loadBanks();
      break;

    case '#dashboard':
    default:
      app.innerHTML = DashboardPage();
      await loadLogs();
      break;
  }

  setActive(hash.replace('#', ''));
}

// =========================
// ACTIVE MENU
// =========================
function setActive(page) {

  document.querySelectorAll('[data-page]')
    .forEach(el => el.classList.remove('active'));

  document.querySelector(`[data-page="${page}"]`)
    ?.classList.add('active');
}

// =========================
// LOAD LOGS
// =========================
async function loadLogs() {

  try {

    const res = await fetch(API.logs);
    const data = await res.json();

    renderLogTable(data);

  } catch (err) {

    console.error('Gagal load logs:', err);
  }
}

function renderLogTable(data = []) {

  const body = document.getElementById('dataBody');

  if (!body) return;

  body.innerHTML = data.map((x, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${x.tanggal || '-'}</td>
      <td>${x.username || '-'}</td>
      <td>${x.bankTujuan || '-'}</td>
      <td>Rp ${Number(x.nominal || 0).toLocaleString('id-ID')}</td>
      <td style="color:#f59e0b;font-weight:700">Rp 2.500</td>
      <td>${x.admin || '-'}</td>
    </tr>
  `).join('');
}

// =========================
// LOAD ADMINS
// =========================
async function loadAdmins() {

  try {

    const res = await fetch(API.admins);
    const data = await res.json();

    const body = document.getElementById('adminBody');

    if (!body) return;

    body.innerHTML = data.map(x => `
      <tr>
        <td>
          ${x.botEnabled ? '🟢 Online' : '🔴 Bot Off'}
        </td>

        <td>${x.admin}</td>

        <td>${x.activeBank || '-'}</td>

        <td>
          ${x.lastSeen
            ? new Date(x.lastSeen).toLocaleTimeString('id-ID')
            : '-'}
        </td>
      </tr>
    `).join('');

  } catch (err) {

    console.error('Gagal load admins:', err);
  }
}

// =========================
// LOAD BANKS
// =========================
async function loadBanks() {

  try {

    const res = await fetch(API.banks);
    const data = await res.json();

    const body = document.getElementById('bankBody');

    if (!body) return;

    body.innerHTML = data.map(x => `
      <tr>
        <td><strong>${x.name}</strong></td>
        <td>${x.sheetName}</td>
        <td>${x.startRow}</td>
        <td>${x.active ? '🟢 Aktif' : '⚫ Nonaktif'}</td>
      </tr>
    `).join('');

  } catch (err) {

    console.error('Gagal load banks:', err);
  }
}

// =========================
// REALTIME SOCKET EVENTS
// =========================

socket.on('connect', () => {
  // realtime connected
});

socket.on('disconnect', () => {
  // realtime disconnected
});

socket.on('connect_error', () => {
  // socket error handled silently
});

// =========================
// DATA AWAL SAAT SOCKET CONNECT
// =========================

socket.on('init-data', ({ logs = [], stats = {} }) => {

  if (location.hash !== '#dashboard') return;

  renderLogTable(logs);

  const success = document.getElementById('successCount');
  const total = document.getElementById('totalCount');

  if (success) {
    success.textContent = stats.success ?? 0;
  }

  if (total) {
    total.textContent = stats.total ?? 0;
  }
});

// =========================
// TRANSAKSI BARU
// =========================

socket.on('new-log', (item) => {

  if (location.hash !== '#dashboard') return;

  const body = document.getElementById('dataBody');

  if (!body) {
    loadLogs();
    return;
  }

  const row = document.createElement('tr');

  row.innerHTML = `
    <td>NEW</td>
    <td>${item.tanggal || '-'}</td>
    <td>${item.username || '-'}</td>
    <td>${item.bankTujuan || '-'}</td>
    <td>
      Rp ${Number(item.nominal || 0).toLocaleString('id-ID')}
    </td>
    <td style="color:#f59e0b;font-weight:700">
      Rp 2.500
    </td>
    <td>${item.admin || '-'}</td>
  `;

  body.prepend(row);

  // batasi tabel realtime supaya tidak membesar terus
  while (body.children.length > 40) {
    body.removeChild(body.lastElementChild);
  }
});

// =========================
// UPDATE STATISTIK
// =========================

socket.on('stats-update', (stats = {}) => {

  const success = document.getElementById('successCount');
  const total = document.getElementById('totalCount');

  if (success) {
    success.textContent = stats.success ?? 0;
  }

  if (total) {
    total.textContent = stats.total ?? 0;
  }
});

// =========================
// ADMIN STATUS UPDATE
// =========================

socket.on('admin-update', () => {

  if (location.hash === '#admins') {
    loadAdmins();
  }
});

// =========================
// LOGS CLEARED
// =========================

socket.on('logs-cleared', () => {

  const body = document.getElementById('dataBody');

  if (body) {
    body.innerHTML = '';
  }

  const success = document.getElementById('successCount');
  const total = document.getElementById('totalCount');

  if (success) success.textContent = '0';
  if (total) total.textContent = '0';
});

// =========================
// START APP
// =========================
window.addEventListener('hashchange', render);

window.addEventListener('DOMContentLoaded', () => {

  if (!location.hash) {
    location.hash = isLoggedIn() ? '#dashboard' : '#login';
  } else {
    render();
  }
});