export function DashboardPage(){

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
            <th>No</th>
            <th>Tanggal</th>
            <th>Username</th>
            <th>Bank Tujuan</th>
            <th>Nominal</th>
            <th>Admin</th>
          </tr>
        </thead>

        <tbody id="dataBody"></tbody>

      </table>

    </section>
  `;
}