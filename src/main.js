const API = 'http://localhost/sis4d-api/list-transactions.php';

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID').format(Number(n));
}

async function loadTransactions() {
  try {
    const res = await fetch(API);
    const data = await res.json();

    console.log('DATA API:', data);

    const body = document.getElementById('txBody');

body.innerHTML = data.map(tx => `
  <tr>
    <td>${tx.approve_time}</td>
    <td class="username">${tx.username}</td>
    <td><span class="bank">${tx.bank_name}</span></td>
    <td>${tx.account_name}</td>
    <td>${tx.account_number}</td>
    <td class="amount">Rp ${formatRupiah(tx.amount)}</td>
    <td><span class="status ${tx.status}">${tx.status}</span></td>
    <td>
      ${tx.status === 'Pending'
        ? `<button onclick="processTx(${tx.id})">Proses</button>`
        : '-'}
    </td>
  </tr>
`).join('');

window.processTx = async function(id) {
  try {
    const res = await fetch(
      'http://localhost/sis4d-api/update-status.php',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `id=${id}&status=Processing`
      }
    );

    const result = await res.json();

    console.log('UPDATE RESULT:', result);

    if (result.success) {
      alert('Status berhasil diubah');
      loadTransactions();
    } else {
      alert('Gagal update status');
    }

  } catch (err) {
    console.error(err);
    alert('Error koneksi');
  }
};

    document.getElementById('totalCount').innerText = data.length;

    document.getElementById('pendingCount').innerText =
      data.filter(d => d.status === 'Pending').length;

    document.getElementById('successCount').innerText =
      data.filter(d => d.status === 'Success').length;

  } catch (err) {
    console.error('Gagal load:', err);
  }
}

loadTransactions();

setInterval(loadTransactions, 3000);