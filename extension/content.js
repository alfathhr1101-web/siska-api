// =====================================
// SIS4D REALTIME CONTENT SCRIPT
// =====================================

const DEBUG = false;

function log(...args){
  if(DEBUG) console.log(...args);
}

// =====================================
// CACHE TRANSAKSI
// =====================================
const sentIds = JSON.parse(
  localStorage.getItem('sis4d_sent_ids') || '[]'
);

const sentSet = new Set(sentIds);

let isScanning = false;

// =====================================
// AMBIL LOGIN ADMIN DARI HALAMAN
// =====================================
function getCurrentLogin(){

  const text = document.body.innerText;

  // ambil username di navbar
  const match = text.match(/([A-Z0-9_]+)\s+\|\s+[A-Z0-9_]+/i);

  return match ? match[1].toLowerCase() : 'unknown';
}

const currentLogin = getCurrentLogin();

localStorage.setItem('sis4d_operator', currentLogin);

log('LOGIN:', currentLogin);

// =====================================
// AMBIL BANK AKTIF DARI POPUP
// =====================================
async function getActiveBank(){

  return new Promise(resolve => {

    chrome.storage.local.get(
      [`sis4d_bank_${currentLogin}`],
      (result) => {

        resolve(
          result[`sis4d_bank_${currentLogin}`] || ''
        );
      }
    );
  });
}

// =====================================
// KIRIM STATUS ADMIN ONLINE
// =====================================
async function sendHeartbeat(){

  const bank = await getActiveBank();

  chrome.runtime.sendMessage({
    type: 'ADMIN_STATUS',
    data: {
      admin: currentLogin,
      activeBank: bank,
      lastSeen: Date.now()
    }
  });
}

// kirim pertama
sendHeartbeat();

// kirim tiap 30 detik
setInterval(sendHeartbeat, 30000);

// =====================================
// HELPER
// =====================================
function clean(text){

  return (text || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function money(text){

  return parseInt(
    clean(text).replace(/[^0-9]/g, '')
  ) || 0;
}

function extractAtasNama(bankText){

  if(!bankText) return '';

  const parts = bankText.split('-');

  return clean(parts[parts.length - 1] || '');
}

// =====================================
// KIRIM TRANSAKSI KE SERVER
// =====================================
function sendTransaction(data){

  chrome.runtime.sendMessage({
    type: 'SEND_TO_API',
    data: {
      ...data,
      activeBank: getActiveBank()
    }
  });
}

// =====================================
// CARI TABEL WITHDRAW APPROVED
// =====================================
function findApprovedTable(){

  const tables = document.querySelectorAll('table');

  for(const table of tables){

    const txt = clean(table.innerText);

    if(
      txt.includes('Bank Asal Transfer') &&
      txt.includes('Jumlah') &&
      txt.includes('Admin')
    ){
      return table;
    }
  }

  return null;
}

// =====================================
// SCAN TRANSAKSI APPROVED
// =====================================
function scanApproved(){

  if(isScanning) return;

  isScanning = true;

  try{

    const table = findApprovedTable();

    if(!table){
      return;
    }

    const rows = table.querySelectorAll('tr');

    // maksimal 40 transaksi
    [...rows].slice(1, 41).forEach(row => {

      const cols = row.querySelectorAll('td');

      if(cols.length < 8) return;

      const no = parseInt(clean(cols[0].innerText)) || 0;

      const tanggal = clean(cols[1].innerText);

      const username = clean(cols[2].innerText);

      const bankTujuanInput =
        cols[3].querySelector('input');

      const bankTujuan = bankTujuanInput
        ? bankTujuanInput.value.trim()
        : clean(cols[3].innerText);

      const bankAsalInput =
        cols[4].querySelector('input');

      const bankAsal = bankAsalInput
        ? bankAsalInput.value.trim()
        : clean(cols[4].innerText);

      const nominal = money(cols[5].innerText);

      const note = clean(cols[6].innerText);

      const admin = clean(cols[7].innerText).toLowerCase();

      if(!username || nominal <= 0) return;

      const atasNama = extractAtasNama(bankTujuan);

      const trxId =
        `APPROVED-${tanggal}-${username}-${nominal}`;

      // anti duplikat
      if(sentSet.has(trxId)) return;

      sentSet.add(trxId);

      localStorage.setItem(
        'sis4d_sent_ids',
        JSON.stringify([...sentSet])
      );

      log('KIRIM:', trxId);

      sendTransaction({
        panelNo: no,
        tanggal,
        userId: username,
        atasNama,
        nominal,
        username,
        bankTujuan,
        bankAsal,
        note,
        admin,
        operatorLogin: currentLogin,
        status: 'APPROVED',
        source: 'withdrawApprovedContent',
        trxId
      });
    });

  }catch(err){

    console.error('SCAN ERROR:', err);

  }finally{

    isScanning = false;
  }
}

// =====================================
// REALTIME OBSERVER
// =====================================

// scan awal
setTimeout(scanApproved, 1500);

// pantau perubahan ajax
const observer = new MutationObserver(() => {

  clearTimeout(window.__scanTimer);

  window.__scanTimer = setTimeout(() => {
    scanApproved();
  }, 300);
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true
});

// fallback scan tiap 2 detik
setInterval(scanApproved, 2000);

// =====================================
// KOMUNIKASI DENGAN POPUP
// =====================================
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if(msg.type === 'GET_OPERATOR'){

    sendResponse({
      operator: currentLogin
    });
  }

  return true;
});