import {
  getBanks,
  createBank,
  updateBank,
  deleteBank
} from '../api.js';

export function BanksPage() {

  return `
  <section id="page-banks" class="page-card">

    <div class="page-header">
      <div>
        <h2>Bank Master</h2>
        <p>Kelola daftar bank dan Google Sheet tujuan transaksi.</p>
      </div>

      <button id="addBankBtn" class="primary-btn">
        + Tambah Bank
      </button>
    </div>

    <div class="table-card">
      <div class="table-wrapper">

        <table>

          <thead>
            <tr>
              <th>Bank</th>
              <th>Sheet</th>
              <th>Start Row</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>

          <tbody id="bankBody">
            <tr>
              <td colspan="5" style="text-align:center">
                Memuat data bank...
              </td>
            </tr>
          </tbody>

        </table>

      </div>
    </div>

  </section>
  `;
}

export async function renderBanks() {

  const banks = await getBanks();

  const body = document.getElementById('bankBody');

  if (!body) return;

  body.innerHTML = banks.map(bank => `
    <tr>

      <td><strong>${bank.name}</strong></td>

      <td>${bank.sheetName}</td>

      <td>${bank.startRow}</td>

      <td>${bank.active ? '🟢 Aktif' : '⚫ Nonaktif'}</td>

      <td style="display:flex;gap:8px">

        <button class="table-btn edit-bank" data-id="${bank.id}">
          Edit
        </button>

        <button class="table-btn danger delete-bank" data-id="${bank.id}">
          Hapus
        </button>

      </td>

    </tr>
  `).join('');

  bindBankActions(banks);
}

function bindBankActions(banks) {

  document.getElementById('addBankBtn').onclick = async () => {

    const name = prompt('Nama Bank');
    if (!name) return;

    const spreadsheetId = prompt('Spreadsheet ID');
    if (!spreadsheetId) return;

    const sheetName = prompt('Nama Sheet');
    if (!sheetName) return;

    const startRow = prompt('Start Row', '7');

    await createBank({
      name,
      spreadsheetId,
      sheetName,
      startRow
    });

    renderBanks();
  };

  document.querySelectorAll('.edit-bank').forEach(btn => {

    btn.onclick = async () => {

      const bank = banks.find(
        b => String(b.id) === btn.dataset.id
      );

      const name = prompt('Nama Bank', bank.name);
      if (!name) return;

      await updateBank(bank.id, {
        name
      });

      renderBanks();
    };
  });

  document.querySelectorAll('.delete-bank').forEach(btn => {

    btn.onclick = async () => {

      if (!confirm('Hapus bank ini?')) return;

      await deleteBank(btn.dataset.id);

      renderBanks();
    };
  });
}