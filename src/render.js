export function renderTable(data, formatRupiah){
  const body = document.getElementById('dataBody');

  body.innerHTML = data.map(item => `
    <tr>
      <td>${item.panelNo}</td>
      <td>${item.tanggal}</td>
      <td style="font-weight:700">${item.username}</td>
      <td style="max-width:260px;white-space:normal">${item.bankTujuan}</td>
      <td style="max-width:260px;white-space:normal">${item.bankAsal}</td>
      <td class="amount">Rp ${formatRupiah(item.nominal)}</td>
      <td>${item.note || '---'}</td>
      <td style="font-weight:700">${item.admin}</td>
    </tr>
  `).join('');
}

export function renderAdmins(admins){

  const body = document.getElementById('adminBody');

  if(!body) return;

  body.innerHTML = admins.map(admin => `

    <tr>

      <td style="font-weight:700">
        ${admin.admin}
      </td>

      <td>
        ${admin.activeBank || '-'}
      </td>

      <td>
        ${new Date(admin.lastSeen).toLocaleTimeString('id-ID')}
      </td>

      <td>
        <span class="status-badge ${admin.online ? 'online' : 'offline'}">
          ${admin.online ? '🟢 Online' : '⚫ Offline'}
        </span>
      </td>

    </tr>

  `).join('');
}