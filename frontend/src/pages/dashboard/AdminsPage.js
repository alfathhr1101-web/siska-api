export function AdminsPage() {
  return `
    <section class="page-header">
      <div>
        <h2>Admin Online</h2>
        <p>Monitoring status bot dan bank aktif admin secara realtime</p>
      </div>

      <button id="refreshBtn" class="refresh-btn">
        Refresh
      </button>
    </section>

    <section class="table-card">

      <table>

        <thead>
          <tr>
            <th>Status</th>
            <th>Admin</th>
            <th>Bank Aktif</th>
            <th>Last Seen</th>
          </tr>
        </thead>

        <tbody id="adminBody"></tbody>

      </table>

    </section>
  `;
}