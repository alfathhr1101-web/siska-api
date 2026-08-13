import { io } from 'socket.io-client';

import { DashboardPage } from './pages/Dashboard.js';
import { AdminsPage } from './pages/Admins.js';
import { BanksPage } from './pages/Banks.js';

// =========================
// API ENDPOINT
// =========================
const API = {
  logs: 'https://gba-joel-chip-minister.trycloudflare.com/api/logs',
  admins: 'https://gba-joel-chip-minister.trycloudflare.com/api/admin-status',
  banks: 'https://gba-joel-chip-minister.trycloudflare.com/api/banks'
};

// =========================
// SOCKET
// =========================
const socket = io('https://gba-joel-chip-minister.trycloudflare.com', {
  transports: ['websocket']
});

const app = document.getElementById('app');
let adminStatusMap = {};
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
  await loadAdmins();
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

function getBiayaAdmin(admin, bankTujuan){

  const asal =
    (adminStatusMap[
      (admin || '').toLowerCase()
    ] || '')
    .toUpperCase();

  const tujuan = (bankTujuan || '')
    .split('-')[0]
    .trim()
    .toUpperCase();

  // sesama bank gratis
  if (asal === tujuan) return 0;

  // ewallet gratis
  if (tujuan === 'DANA') return 0;
  if (tujuan === 'OVO') return 0;

  // ewallet kena 1000
  if (tujuan === 'GOPAY') return 1000;
  if (tujuan === 'LINKAJA') return 1000;

  // selain itu beda bank
  return 2500;
}

// =========================
// HITUNG BIAYA ADMIN
// =========================
function getAdminFee(item) {

  const tujuan = (item.bankTujuan || '')
    .split('-')[0]
    .trim()
    .toUpperCase();

  const bankAdmin = (item.bankAktif || '')
    .trim()
    .toUpperCase();

  // sesama bank gratis
  if (tujuan === bankAdmin) {
    return 0;
  }

  // beda bank kena biaya transfer
  return 2500;
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

      <td>
        Rp ${Number(x.nominal || 0).toLocaleString('id-ID')}
      </td>

      <td style="color:#f59e0b;font-weight:700">
        Rp ${getBiayaAdmin(x.admin, x.bankTujuan).toLocaleString('id-ID')}
      </td>

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
    adminStatusMap = {};

data.forEach(x => {
  adminStatusMap[
    (x.admin || '').toLowerCase()
  ] = x.activeBank || '';
});

    // simpan mapping admin -> bank aktif
    adminStatusMap = {};

    data.forEach(x => {
      adminStatusMap[
        (x.admin || '').toLowerCase()
      ] = x.activeBank || '';
    });

    const body = document.getElementById('adminBody');

    if (!body) return;

    body.innerHTML = data.map(x=>`
      <tr>
        <td>${x.botEnabled ? '🟢 Online' : '🔴 Bot Off'}</td>
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
      startRow: Number(rowInput.value || 4)
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

  const fee = getAdminFee(item);

  const row = `
    <tr>
      <td>1</td>
      <td>${item.tanggal}</td>
      <td>${item.username}</td>
      <td>${item.bankTujuan}</td>
      <td>Rp ${Number(item.nominal).toLocaleString('id-ID')}</td>
      <td style="color:${fee ? '#ffb020' : '#7cff8f'};font-weight:600">
        ${fee ? 'Rp ' + fee.toLocaleString('id-ID') : 'Gratis'}
      </td>
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