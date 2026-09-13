document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE = "https://api-v2.botwdsis4d.com";

  const loginInput = document.getElementById("loginUser");
  const bankSelect = document.getElementById("bankSelect");
  const saveBtn = document.getElementById("saveBank");
  const statusText = document.getElementById("statusText");
  const botToggle = document.getElementById("botEnabled");
  const botStatus = document.getElementById("botStatus");

  const liveIndicator = document.querySelector(".live-indicator");
  const connectionStatus = document.querySelector(".connection-status");

  let currentOperator = "unknown";

  /*
  |--------------------------------------------------------------------------
  | STATUS BACKEND REAL
  |--------------------------------------------------------------------------
  */

  async function checkBackendConnection() {
    try {
      const response = await fetch(`${API_BASE}/health`, {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Backend tidak merespons");
      }

      setConnectionStatus(true);
    } catch (error) {
      setConnectionStatus(false);
    }
  }

  function setConnectionStatus(isConnected) {
    if (liveIndicator) {
      liveIndicator.innerHTML = `
        <span></span>
        ${isConnected ? "LIVE" : "OFFLINE"}
      `;

      liveIndicator.style.color = isConnected
        ? "#55e6a5"
        : "#ff6b8a";

      const dot = liveIndicator.querySelector("span");

      if (dot) {
        dot.style.background = isConnected
          ? "#55e6a5"
          : "#ff6b8a";

        dot.style.boxShadow = isConnected
          ? "0 0 7px #55e6a5"
          : "0 0 7px #ff6b8a";
      }
    }

    if (connectionStatus) {
      connectionStatus.innerHTML = `
        <span></span>
        ${isConnected ? "CONNECTED" : "DISCONNECTED"}
      `;

      connectionStatus.style.color = isConnected
        ? "#55e6a5"
        : "#ff6b8a";

      const dot = connectionStatus.querySelector("span");

      if (dot) {
        dot.style.background = isConnected
          ? "#55e6a5"
          : "#ff6b8a";

        dot.style.boxShadow = isConnected
          ? "0 0 7px #55e6a5"
          : "0 0 7px #ff6b8a";
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | AMBIL OPERATOR DARI TAB AKTIF
  |--------------------------------------------------------------------------
  */

  async function getCurrentOperator() {
    return new Promise((resolve) => {
      chrome.tabs.query(
        {
          active: true,
          currentWindow: true
        },
        (tabs) => {
          const tab = tabs?.[0];

          if (!tab?.id) {
            resolve("unknown");
            return;
          }

          chrome.tabs.sendMessage(
            tab.id,
            {
              type: "GET_OPERATOR"
            },
            (response) => {
              if (chrome.runtime.lastError) {
                resolve("unknown");
                return;
              }

              resolve(response?.operator || "unknown");
            }
          );
        }
      );
    });
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD BANK DARI BACKEND
  |--------------------------------------------------------------------------
  */

  async function loadBanks(operator) {
    bankSelect.innerHTML = `
      <option value="">Memuat bank...</option>
    `;

    chrome.runtime.sendMessage(
      {
        type: "GET_BANKS"
      },
      (response) => {
        if (chrome.runtime.lastError) {
          bankSelect.innerHTML = `
            <option value="">Gagal terhubung ke extension</option>
          `;

          statusText.textContent = "Gagal mengambil daftar bank";
          return;
        }

        if (!response || !response.success) {
          bankSelect.innerHTML = `
            <option value="">Gagal memuat bank</option>
          `;

          statusText.textContent = "Backend bank tidak tersedia";
          return;
        }

        const banks = Array.isArray(response.data)
          ? response.data
          : [];

        bankSelect.innerHTML = "";

        if (banks.length === 0) {
          bankSelect.innerHTML = `
            <option value="">Belum ada bank tersedia</option>
          `;

          statusText.textContent = "Belum ada bank aktif";
          return;
        }

        banks.forEach((bank) => {
          const bankName =
            typeof bank === "string"
              ? bank
              : bank.name || bank.bankName || "";

          if (!bankName) return;

          const option = document.createElement("option");
          option.value = bankName;
          option.textContent = bankName;

          bankSelect.appendChild(option);
        });

        const storageKey = `sis4d_bank_${operator.toLowerCase()}`;

        chrome.storage.local.get([storageKey], (result) => {
          const savedBank = result[storageKey];

          if (savedBank) {
            const bankExists = [...bankSelect.options].some(
              (option) => option.value === savedBank
            );

            if (bankExists) {
              bankSelect.value = savedBank;
              statusText.textContent = `Bank aktif: ${savedBank}`;
            } else {
              statusText.textContent = "Bank tersimpan sudah tidak tersedia";
            }
          } else {
            statusText.textContent = "Belum memilih bank aktif";
          }
        });
      }
    );
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD STATUS BOT
  |--------------------------------------------------------------------------
  */

  function loadBotStatus(operator) {
    const storageKey = `sis4d_bot_${operator.toLowerCase()}`;

    chrome.storage.local.get([storageKey], (result) => {
      const savedStatus = result[storageKey];

      // Default BOT aktif jika belum pernah disimpan
      const isEnabled =
        typeof savedStatus === "boolean"
          ? savedStatus
          : true;

      botToggle.checked = isEnabled;
      updateBotLabel(isEnabled);
    });
  }

  function updateBotLabel(isEnabled) {
    if (!botStatus) return;

    botStatus.textContent = isEnabled
      ? "BOT AKTIF"
      : "BOT NONAKTIF";

    botStatus.style.color = isEnabled
      ? "#55e6a5"
      : "#ff6b8a";

    botStatus.style.borderColor = isEnabled
      ? "rgba(85, 230, 165, 0.15)"
      : "rgba(255, 107, 138, 0.2)";

    botStatus.style.background = isEnabled
      ? "rgba(85, 230, 165, 0.035)"
      : "rgba(255, 107, 138, 0.045)";
  }

  /*
  |--------------------------------------------------------------------------
  | SIMPAN BANK AKTIF
  |--------------------------------------------------------------------------
  */

  saveBtn.addEventListener("click", () => {
    const selectedBank = bankSelect.value;

    if (!selectedBank) {
      statusText.textContent = "Pilih bank terlebih dahulu";
      return;
    }

    const storageKey = `sis4d_bank_${currentOperator.toLowerCase()}`;

    chrome.storage.local.set(
      {
        [storageKey]: selectedBank
      },
      () => {
        statusText.textContent = `Bank aktif: ${selectedBank}`;

        saveBtn.innerHTML = `
          <span class="button-icon">✓</span>
          BANK BERHASIL DISIMPAN
          <span class="button-arrow">›</span>
        `;

        setTimeout(() => {
          saveBtn.innerHTML = `
            <span class="button-icon">↻</span>
            SIMPAN BANK AKTIF
            <span class="button-arrow">›</span>
          `;
        }, 1800);

        chrome.runtime.sendMessage({
          type: "ADMIN_STATUS",
          admin: currentOperator,
          activeBank: selectedBank
        });
      }
    );
  });

  /*
  |--------------------------------------------------------------------------
  | TOGGLE BOT
  |--------------------------------------------------------------------------
  */

  botToggle.addEventListener("change", () => {
    const enabled = botToggle.checked;
    const storageKey = `sis4d_bot_${currentOperator.toLowerCase()}`;

    chrome.storage.local.set(
      {
        [storageKey]: enabled
      },
      () => {
        updateBotLabel(enabled);

        chrome.runtime.sendMessage({
          type: "ADMIN_STATUS",
          admin: currentOperator,
          activeBank: bankSelect.value,
          botEnabled: enabled
        });
      }
    );
  });

  /*
  |--------------------------------------------------------------------------
  | INIT
  |--------------------------------------------------------------------------
  */

  currentOperator = await getCurrentOperator();

  console.log("ADMIN TERBACA:", currentOperator);

  loginInput.value = currentOperator;

  await loadBanks(currentOperator);
  loadBotStatus(currentOperator);

  // Cek backend langsung saat popup dibuka
  checkBackendConnection();

  // Cek ulang setiap 10 detik
  setInterval(checkBackendConnection, 10000);
});