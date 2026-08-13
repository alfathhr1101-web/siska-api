import {
  getBanks,
  createBank,
  updateBank,
  deleteBank
} from '../../api.js';

// =====================================
// HALAMAN BANK MASTER
// =====================================
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
                <td colspan="5" style="text-align:center;color:#94a3b8">
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

// =====================================
// LOAD BANKS
// =====================================
export async function renderBanks() {

  const body = document.getElementById('bankBody');
  if (!body) return;

  try {

    const banks = await getBanks();

    if (!banks.length) {
      body.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;color:#94a3b8">
            Belum ada data bank
          </td>
        </tr>
      `;
      return;
    }

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

  } catch (err) {

    console.error(err);

    body.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;color:#ef4444">
          Gagal memuat data bank
        </td>
      </tr>
    `;
  }
}

// =====================================
// BIND ACTIONS
// =====================================
function bindBankActions(banks) {

  // Tambah bank
  document.getElementById('addBankBtn').onclick = async () => {

    const name = prompt('Nama Bank');
    if (!name) return;

    const spreadsheetId = prompt('Spreadsheet ID');
    if (!spreadsheetId) return;

    const sheetName = prompt('Nama Sheet');
    if (!sheetName) return;

    const startRow = prompt('Start Row', '7');

    try {

      await createBank({
        name,
        spreadsheetId,
        sheetName,
        startRow: Number(startRow || 7)
      });

      await renderBanks();

    } catch (err) {

      console.error(err);
      alert('Gagal menambah bank');
    }
  };

  // Edit bank
  document.querySelectorAll('.edit-bank').forEach(btn => {

    btn.onclick = async () => {

      const bank = banks.find(
        b => String(b.id) === btn.dataset.id
      );

      if (!bank) return;

      const name = prompt('Nama Bank', bank.name);
      if (!name) return;

      try {

        await updateBank(bank.id, {
          name
        });

        await renderBanks();

      } catch (err) {

        console.error(err);
        alert('Gagal mengubah bank');
      }
    };
  });

  // Hapus bank
  document.querySelectorAll('.delete-bank').forEach(btn => {

    btn.onclick = async () => {

      if (!confirm('Hapus bank ini?')) return;

      try {

        await deleteBank(btn.dataset.id);

        await renderBanks();

      } catch (err) {

        console.error(err);
        alert('Gagal menghapus bank');
      }
    };
  });
}