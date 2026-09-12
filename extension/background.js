const API_BASE = "http://localhost:3001";

/*
|--------------------------------------------------------------------------
| BOT STATUS
|--------------------------------------------------------------------------
*/

async function getBotStatus(admin = "") {
  const keys = [
    "sis4d_bot_active",
    "botEnabled",
    "bot_enabled"
  ];

  if (admin) {
    keys.push(`sis4d_bot_${admin.toLowerCase()}`);
  }

  const data = await chrome.storage.local.get(keys);

  if (
    admin &&
    typeof data[`sis4d_bot_${admin.toLowerCase()}`] === "boolean"
  ) {
    return data[`sis4d_bot_${admin.toLowerCase()}`];
  }

  if (typeof data.sis4d_bot_active === "boolean") {
    return data.sis4d_bot_active;
  }

  if (typeof data.botEnabled === "boolean") {
    return data.botEnabled;
  }

  if (typeof data.bot_enabled === "boolean") {
    return data.bot_enabled;
  }

  return true;
}

/*
|--------------------------------------------------------------------------
| KIRIM STATUS ADMIN
|--------------------------------------------------------------------------
*/

async function sendAdminStatus(payload = {}) {
  try {
    const admin = String(payload.admin || "").trim();

    if (!admin || admin === "unknown") {
      throw new Error("Nama admin kosong atau tidak valid");
    }

    const cleanPayload = {
      admin,
      activeBank: payload.activeBank || "",
      botEnabled:
        typeof payload.botEnabled === "boolean"
          ? payload.botEnabled
          : await getBotStatus(admin)
    };

    const res = await fetch(`${API_BASE}/api/admin-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(cleanPayload)
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const result = JSON.parse(text);

    console.log("Status admin berhasil dikirim:", cleanPayload);

    return result;
  } catch (error) {
    console.error("Gagal kirim status admin:", error);
    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| KIRIM TRANSAKSI
|--------------------------------------------------------------------------
*/

async function sendTransaction(item = {}) {
  const admin = String(item.admin || "").trim();
  const botEnabled = await getBotStatus(admin);

  if (!botEnabled) {
    console.log("Bot OFF -> transaksi tidak dikirim");

    return {
      success: false,
      message: "Bot sedang OFF"
    };
  }

  try {
    const res = await fetch(`${API_BASE}/api/logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(item)
    });

    const text = await res.text();

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text}`);
    }

    const result = JSON.parse(text);

    console.log("Transaksi berhasil dikirim:", result);

    return result;
  } catch (error) {
    console.error("Gagal kirim transaksi:", error);

    return {
      success: false,
      message: error.message
    };
  }
}

/*
|--------------------------------------------------------------------------
| MESSAGE HANDLER
|--------------------------------------------------------------------------
*/

chrome.runtime.onMessage.addListener(
  (message, sender, sendResponse) => {
    if (!message || !message.type) {
      return false;
    }

    if (
      message.type === "SEND_TO_API" ||
      message.type === "SEND_WITHDRAWAL"
    ) {
      const transactionData =
        message.data ||
        message.payload ||
        message;

      sendTransaction(transactionData)
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            success: false,
            message: error.message
          });
        });

      return true;
    }

    if (message.type === "ADMIN_STATUS") {
      const statusData = {
        ...(message.data || {}),
        ...(message.payload || {})
      };

      if (message.admin) {
        statusData.admin = message.admin;
      }

      if (message.activeBank) {
        statusData.activeBank = message.activeBank;
      }

      if (typeof message.botEnabled === "boolean") {
        statusData.botEnabled = message.botEnabled;
      }

      sendAdminStatus(statusData)
        .then(sendResponse)
        .catch((error) => {
          sendResponse({
            success: false,
            message: error.message
          });
        });

      return true;
    }

    if (message.type === "GET_BANKS") {
      fetch(`${API_BASE}/api/banks`)
        .then(async (res) => {
          const text = await res.text();

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${text}`);
          }

          return JSON.parse(text);
        })
        .then((banks) => {
          sendResponse({
            success: true,
            data: Array.isArray(banks) ? banks : []
          });
        })
        .catch((error) => {
          console.error("Gagal ambil bank:", error);

          sendResponse({
            success: false,
            data: [],
            message: error.message
          });
        });

      return true;
    }

    return false;
  }
);