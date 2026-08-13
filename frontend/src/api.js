const API_BASE = 'https://api.botwdsis4d.com';

// =========================
// LOGS
// =========================
export async function getLogs() {
  const res = await fetch(`${API_BASE}/logs`);
  return res.json();
}

// =========================
// ADMIN ONLINE
// =========================
export async function getAdmins() {
  const res = await fetch(`${API_BASE}/admin-status`);
  return res.json();
}

// =========================
// BANK MASTER
// =========================
export async function getBanks() {
  const res = await fetch(`${API_BASE}/banks`);
  return res.json();
}

export async function createBank(data) {
  const res = await fetch(`${API_BASE}/banks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function updateBank(id, data) {
  const res = await fetch(`${API_BASE}/banks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function deleteBank(id) {
  const res = await fetch(`${API_BASE}/banks/${id}`, {
    method: 'DELETE'
  });
  return res.json();
}