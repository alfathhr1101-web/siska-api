import { io } from 'socket.io-client';

import { DashboardPage } from './pages/Dashboard.js';
import { AdminsPage } from './pages/Admins.js';
import { BanksPage } from './pages/Banks.js';

// =========================
// API ENDPOINT
// =========================
const API_BASE = 'http://127.0.0.1:3001/api';

const API = {
  logs: `${API_BASE}/logs`,
  admins: `${API_BASE}/admin-status`,
  banks: `${API_BASE}/banks`
};

// =========================
// SOCKET
// =========================
const socket = io('http://127.0.0.1:3001', {
  transports: ['websocket']
});

const app = document.getElementById('app');

// =========================
// ROUTER
// =========================
async function render(){

  const hash = location.hash || '#dashboard';

  switch(hash){

    case '#admins':
      app.innerHTML = AdminsPage();
      await loadAdmins();
      break;

    case '#banks':
      app.innerHTML = BanksPage();
      await loadBanks();
      break;

    default:
      app.innerHTML = DashboardPage();
      await loadLogs();
      break;
  }

  setActive(hash.replace('#',''));
}

function setActive(page){

  document.querySelectorAll('[data-page]')
    .forEach(el => el.classList.remove('active'));

  document.querySelector(`[data-page="${page}"]`)
    ?.classList.add('active');
}

// =========================
// LOAD LOGS
// =========================
async function loadLogs(){

  try{

    const res = await fetch(API.logs);

    const data = await res.json();

    renderLogTable(data);

  }catch(err){

    console.error('Gagal load logs:', err);
  }
}

function renderLogTable(data){

  const body = document.getElementById('dataBody');

  if (!body) return;

  body.innerHTML = data.map((x,i)=>`
    <tr>
      <td>${i+1}</td>
      <td>${x.tanggal || '-'}</td>
      <td>${x.username || '-'}</td>
      <td>${x.bankTujuan || '-'}</td>
      <td>Rp ${Number(x.nominal || 0).toLocaleString('id-ID')}</td>
      <td>${x.admin || '-'}</td>
    </tr>
  `).join('');
}

// =========================
// LOAD ADMINS
// =========================
async function loadAdmins(){

  try{

    const res = await fetch(API.admins);

    const data = await res.json();

    const body = document.getElementById('adminBody');

    if (!body) return;

    body.innerHTML = data.map(x=>`
      <tr>
        <td>${x.online ? '🟢 Online' : '⚫ Offline'}</td>
        <td>${x.admin}</td>
        <td>${x.activeBank || '-'}</td>
        <td>${new Date(x.lastSeen).toLocaleTimeString('id-ID')}</td>
      </tr>
    `).join('');

  }catch(err){

    console.error('Gagal load admins:', err);
  }
}

// =========================
// LOAD BANKS
// =========================
async function loadBanks(){

  try{

    const res = await fetch(API.banks);

    const data = await res.json();

    const body = document.getElementById('bankBody');

    if (!body) return;

    body.innerHTML = data.map(x=>`
      <tr>
        <td><strong>${x.name}</strong></td>
        <td>${x.sheetName}</td>
        <td>${x.startRow}</td>
        <td>${x.active ? '🟢 Aktif' : '⚫ Nonaktif'}</td>
        <td style="display:flex;gap:8px">
          <button class="table-btn edit-bank" data-id="${x.id}">
            Edit
          </button>

          <button class="table-btn danger delete-bank" data-id="${x.id}">
            Hapus
          </button>
        </td>
      </tr>
    `).join('');

    bindBankActions(data);

  }catch(err){

    console.error('Gagal load banks:', err);
  }
}

// =========================
// BANK ACTIONS
// =========================
let editingBankId = null;

function bindBankActions(banks){

  const modal = document.getElementById('bankModal');

  const title = document.getElementById('bankModalTitle');

  const nameInput = document.getElementById('bankName');

  const spreadsheetInput = document.getElementById('bankSpreadsheet');

  const sheetInput = document.getElementById('bankSheet');

  const rowInput = document.getElementById('bankStartRow');

  const saveBtn = document.getElementById('saveBankBtn');

  // buka tambah
  document.getElementById('addBankBtn').onclick = () => {

    editingBankId = null;

    title.textContent = 'Tambah Bank';

    nameInput.value = '';

    spreadsheetInput.value = '';

    sheetInput.value = '';

    rowInput.value = 7;

    modal.classList.remove('hidden');
  };

  // tutup modal
  document.getElementById('closeBankModal').onclick =
    () => modal.classList.add('hidden');

  document.getElementById('cancelBankModal').onclick =
    () => modal.classList.add('hidden');

  // edit
  document.querySelectorAll('.edit-bank').forEach(btn => {

    btn.onclick = () => {

      const bank = banks.find(
        b => String(b.id) === btn.dataset.id
      );

      editingBankId = bank.id;

      title.textContent = 'Edit Bank';

      nameInput.value = bank.name || '';

      spreadsheetInput.value = bank.spreadsheetId || '';

      sheetInput.value = bank.sheetName || '';

      rowInput.value = bank.startRow || 7;

      modal.classList.remove('hidden');
    };
  });

  // hapus
  document.querySelectorAll('.delete-bank').forEach(btn => {

    btn.onclick = async () => {

      if(!confirm('Hapus bank ini?')) return;

      await fetch(`${API.banks}/${btn.dataset.id}`, {
        method:'DELETE'
      });

      loadBanks();
    };
  });

  // simpan
  saveBtn.onclick = async () => {

    const payload = {

      name: nameInput.value.trim(),

      spreadsheetId: spreadsheetInput.value.trim(),

      sheetName: sheetInput.value.trim(),

      startRow: Number(rowInput.value || 7)
    };

    if(!payload.name){
      alert('Nama bank wajib diisi');
      return;
    }

    if(editingBankId){

      await fetch(`${API.banks}/${editingBankId}`, {
        method:'PUT',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });

    }else{

      await fetch(API.banks, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify(payload)
      });
    }

    modal.classList.add('hidden');

    loadBanks();
  };
}

// =========================
// REALTIME SOCKET
// =========================
socket.on('connect', () => {
  console.log('🟢 realtime connected');
});

// transaksi baru
socket.on('new-log', (item) => {

  if (
    location.hash !== '#dashboard' &&
    location.hash !== ''
  ) return;

  const body = document.getElementById('dataBody');

  if (!body) return;

  const row = `
    <tr>
      <td>1</td>
      <td>${item.tanggal}</td>
      <td>${item.username}</td>
      <td>${item.bankTujuan}</td>
      <td>Rp ${Number(item.nominal).toLocaleString('id-ID')}</td>
      <td>${item.admin}</td>
    </tr>
  `;

  body.insertAdjacentHTML('afterbegin', row);

  while (body.rows.length > 40) {
    body.deleteRow(body.rows.length - 1);
  }

  [...body.rows].forEach((r,i)=>{
    r.cells[0].textContent = i + 1;
  });
});

// update KPI
socket.on('stats-update', (stats) => {

  const total = document.getElementById('totalCount');
  const success = document.getElementById('successCount');

  if (total) total.textContent = stats.total;
  if (success) success.textContent = stats.success;
});

// update admin online
socket.on('admin-update', () => {

  if (location.hash === '#admins') {
    loadAdmins();
  }
});

// logs clear
socket.on('logs-cleared', () => {

  if (
    location.hash === '#dashboard' ||
    location.hash === ''
  ) {

    const body = document.getElementById('dataBody');

    if (body) body.innerHTML = '';

    const total = document.getElementById('totalCount');
    const success = document.getElementById('successCount');

    if (total) total.textContent = 0;
    if (success) success.textContent = 0;
  }
});

// =========================
// REFRESH BUTTON
// =========================
document.addEventListener('click', async (e) => {

  if (e.target.id === 'refreshBtn') {
    await render();
  }
});

// =========================
// START
// =========================
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);