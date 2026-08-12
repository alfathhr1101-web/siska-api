// =====================================
// SIS4D EXTENSION POPUP
// =====================================

document.addEventListener('DOMContentLoaded', async () => {

  const loginInput = document.getElementById('loginUser');
  const bankSelect = document.getElementById('bankSelect');
  const saveBtn = document.getElementById('saveBank');
  const statusEl = document.getElementById('statusText');

  // ambil admin login dari content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

    if (!tabs[0]) return;

    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: 'GET_OPERATOR' },
      async (res) => {

        const operator = res?.operator || 'unknown';

        loginInput.value = operator;

        await loadBanks(operator);
      }
    );
  });

  // load daftar bank dari server
  async function loadBanks(operator) {

    chrome.runtime.sendMessage(
      { type: 'GET_BANKS' },
      (response) => {

        bankSelect.innerHTML = '';

        if (!response || !response.success) {

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

        // restore pilihan sebelumnya
        chrome.storage.local.get(
          [`sis4d_bank_${operator.toLowerCase()}`],
          (result) => {

            const saved =
              result[`sis4d_bank_${operator.toLowerCase()}`];

            if (saved) {

              bankSelect.value = saved;
              updateStatus(saved);

            } else {

              statusEl.textContent =
                'Belum memilih bank aktif';
            }
          }
        );
      }
    );
  }

  // simpan bank aktif TANPA POPUP
  saveBtn.addEventListener('click', () => {

    const operator = loginInput.value.trim();
    const bank = bankSelect.value;

    if (!operator || !bank) {

      statusEl.textContent =
        'Pilih bank terlebih dahulu';

      statusEl.style.color = '#ff6b6b';

      return;
    }

    chrome.storage.local.set({
      [`sis4d_bank_${operator.toLowerCase()}`]: bank
    }, () => {

      updateStatus(bank);

      statusEl.style.color = '#7cff8f';

      saveBtn.textContent = '✓ Tersimpan';

      setTimeout(() => {
        saveBtn.textContent = '💾 Simpan Bank Aktif';
      }, 1200);
    });
  });

  function updateStatus(bank) {
    statusEl.textContent = `✓ Bank aktif: ${bank}`;
  }
});