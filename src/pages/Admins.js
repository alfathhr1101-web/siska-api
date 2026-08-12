export function AdminsPage(){

  return `
    <section class="table-card">

      <h2>Admin Online</h2>

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