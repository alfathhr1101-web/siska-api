// =====================================
// SIS4D EXTENSION BACKGROUND
// =====================================

const API_BASE = 'http://127.0.0.1:3001';

// helper request
async function post(url, data){

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

  // -----------------------------------
  // KIRIM TRANSAKSI KE SERVER
  // -----------------------------------
  if(message.type === 'SEND_TO_API'){

    post(`${API_BASE}/api/logs`, message.data)
      .then(result => {
        sendResponse(result);
      })
      .catch(err => {
        console.error('Gagal kirim transaksi:', err);
        sendResponse({
          success: false,
          error: err.message
        });
      });

    return true;
  }

  // -----------------------------------
  // KIRIM STATUS ADMIN ONLINE
  // -----------------------------------
  if(message.type === 'ADMIN_STATUS'){

    post(`${API_BASE}/api/admin-status`, message.data)
      .then(result => {
        sendResponse(result);
      })
      .catch(err => {
        console.error('Gagal kirim status admin:', err);
        sendResponse({
          success: false,
          error: err.message
        });
      });

    return true;
  }

  // -----------------------------------
  // AMBIL DAFTAR BANK DARI SERVER
  // -----------------------------------
  if(message.type === 'GET_BANKS'){

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