// =====================================
// SIS4D EXTENSION BACKGROUND
// =====================================

const API_BASE = 'http://103.193.179.47';

// helper request
async function post(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  return res.json();
}

// =====================================
// LISTENER MESSAGE DARI CONTENT / POPUP
// =====================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  // kirim transaksi ke server
  if (message.type === 'SEND_TO_API') {

    post(`${API_BASE}/api/logs`, message.data)
      .then(result => sendResponse(result))
      .catch(err => {
        console.error('Gagal kirim transaksi:', err);

        sendResponse({
          success: false,
          error: err.message
        });
      });

    return true;
  }

  // kirim status admin online
  if (message.type === 'ADMIN_STATUS') {

    post(`${API_BASE}/api/admin-status`, message.data)
      .then(result => sendResponse(result))
      .catch(err => {
        console.error('Gagal kirim status admin:', err);

        sendResponse({
          success: false,
          error: err.message
        });
      });

    return true;
  }

  // ambil daftar bank dari server
  if (message.type === 'GET_BANKS') {

    fetch(`${API_BASE}/api/banks`)
      .then(res => res.json())
      .then(data => {
        sendResponse({
          success: true,
          banks: data
        });
      })
      .catch(err => {
        console.error('Gagal ambil bank:', err);

        sendResponse({
          success: false,
          error: err.message,
          banks: []
        });
      });

    return true;
  }
});