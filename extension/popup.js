// =====================================
// SIS4D EXTENSION POPUP
// =====================================

document.addEventListener('DOMContentLoaded', async () => {

  const loginInput = document.getElementById('loginUser');
  const bankSelect = document.getElementById('bankSelect');
  const saveBtn = document.getElementById('saveBank');
  const statusEl = document.getElementById('statusText');

  // =====================================
  // AMBIL ADMIN LOGIN DARI CONTENT SCRIPT
  // =====================================
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

    if(!tabs[0]) return;

    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: 'GET_OPERATOR' },
      async (res) => {

        const operator = res?.operator || 'unknown';

        loginInput.value = operator;

        // load bank dari server
        await loadBanks(operator);
      }
    );
  });

  // =====================================
  // LOAD DAFTAR BANK DARI SERVER
  // =====================================
  async function loadBanks(operator){

    chrome.runtime.sendMessage(
      { type: 'GET_BANKS' },
      (response) => {

        bankSelect.innerHTML = '';

        if(!response || !response.success){

          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'Gagal ambil bank';
          bankSelect.appendChild(opt);

          return;
        }

        response.banks.forEach(bank => {

          const opt = document.createElement('option');
          opt.value = bank.name;
          opt.textContent = bank.name;

          bankSelect.appendChild(opt);
        });

        // restore pilihan sebelumnya dari chrome.storage
        chrome.storage.local.get(
          [`sis4d_bank_${operator.toLowerCase()}`],
          (result) => {

            const saved =
              result[`sis4d_bank_${operator.toLowerCase()}`];

            if(saved){
              bankSelect.value = saved;
              updateStatus(operator, saved);
            }else{
              statusEl.textContent =
                'Belum memilih bank aktif';
            }
          }
        );
      }
    );
  }

  // =====================================
  // SIMPAN BANK AKTIF
  // =====================================
  saveBtn.addEventListener('click', () => {

    const operator = loginInput.value.trim();
    const bank = bankSelect.value;

    if(!operator || !bank){
      alert('Admin atau bank belum dipilih');
      return;
    }

    chrome.storage.local.set({
      [`sis4d_bank_${operator.toLowerCase()}`]: bank
    }, () => {

      updateStatus(operator, bank);

      console.log('BANK DISIMPAN:', operator, bank);
    });
  });

  // =====================================
  // UPDATE TEXT STATUS
  // =====================================
  function updateStatus(operator, bank){

    statusEl.textContent =
      `Bank aktif: ${bank}`;
  }
});