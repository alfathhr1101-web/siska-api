// =====================================
// HITUNG BIAYA ADMIN UNTUK DASHBOARD
// =====================================
function getBiayaAdmin(admin, bankTujuan) {

  const tujuan = (bankTujuan || '')
    .split('-')[0]
    .trim()
    .toUpperCase();

  // mapping bank aktif admin
  const bankAdminMap = {
    alfath: 'BCA',
    reza: 'BNI',
    robi: 'BCA'
  };

  const asal =
    bankAdminMap[(admin || '').toLowerCase()] || '';

  // sesama bank gratis
  if (asal === tujuan) return 0;

  // ewallet gratis
  if (tujuan === 'DANA' || tujuan === 'OVO') return 0;

  // ewallet tertentu kena 1000
  if (tujuan === 'GOPAY' || tujuan === 'LINKAJA') return 1000;

  // beda bank kena 2500
  return 2500;
}

// =====================================
// FORMAT RUPIAH
// =====================================
function rupiah(n) {
  return 'Rp ' + Number(n || 0).toLocaleString('id-ID');
}

// =====================================
// HALAMAN DASHBOARD
// =====================================
export function DashboardPage(data = []) {

  const rows = data.map((item, i) => {

    const biaya = getBiayaAdmin(
      item.admin,
      item.bankTujuan
    );

    return `
      <tr>
        <td>${i + 1}</td>
        <td>${item.tanggal || '-'}</td>
        <td>${item.username || '-'}</td>
        <td>${item.bankTujuan || '-'}</td>
        <td>${rupiah(item.nominal)}</td>
        <td style="color:#f59e0b;font-weight:700">
          ${rupiah(biaya)}
        </td>
        <td>${item.admin || '-'}</td>
      </tr>
    `;
  }).join('');

  return `
    <section class="kpi-grid">

      <div class="kpi-card">
        <div id="successCount">0</div>
        <small>Success</small>
      </div>

      <div class="kpi-card">
        <div id="totalCount">0</div>
        <small>Total Transaksi</small>
      </div>

    </section>

    <section class="table-card">

      <table>

        <thead>
          <tr>
            <th>NO</th>
            <th>TANGGAL</th>
            <th>USERNAME</th>
            <th>BANK TUJUAN</th>
            <th>NOMINAL</th>
            <th>BIAYA ADMIN</th>
            <th>ADMIN</th>
          </tr>
        </thead>

        <tbody id="dataBody">
          ${rows}
        </tbody>

      </table>

    </section>
  `;
}