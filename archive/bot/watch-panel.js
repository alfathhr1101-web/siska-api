import { chromium } from 'playwright';
import mysql from 'mysql2/promise';

function parseAmount(text) {
  return Number((text || '').replace(/[^\d]/g, ''));
}

const db = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test'
});

console.log('MySQL connected');

async function fetchPending(page) {
  return await page.evaluate(() => {
    const headers = [...document.querySelectorAll('div, h4, h5, span')];

    const target = headers.find(el =>
      el.innerText &&
      el.innerText.toUpperCase().includes('WITHDRAW IN PROGRESS')
    );

    if (!target) return [];

    let node = target.parentElement;

    while (node && !node.querySelector('table')) {
      node = node.parentElement;
    }

    const table = node?.querySelector('table');
    if (!table) return [];

    const trs = table.querySelectorAll('tr');

    return [...trs]
      .slice(1)
      .map(tr => {
        const tds = tr.querySelectorAll('td');

        const tujuanInputs = tds[4]?.querySelectorAll('input') || [];

        const nama = tujuanInputs[0]?.value.trim() || '';
        const rekening = tujuanInputs[1]?.value.trim() || '';

        const imgSrc = tds[4]?.querySelector('img')?.src || '';

        let bank = 'UNKNOWN';

        const upperSrc = imgSrc.toUpperCase();

        if (upperSrc.includes('DANA')) bank = 'DANA';
        else if (upperSrc.includes('GOPAY')) bank = 'GOPAY';
        else if (upperSrc.includes('OVO')) bank = 'OVO';
        else if (upperSrc.includes('SEABANK')) bank = 'SeaBank';
        else if (upperSrc.includes('BCA')) bank = 'BCA';
        else if (upperSrc.includes('BNI')) bank = 'BNI';
        else if (upperSrc.includes('BRI')) bank = 'BRI';
        else if (upperSrc.includes('MANDIRI')) bank = 'Mandiri';
        else if (upperSrc.includes('LINKAJA')) bank = 'LinkAja';

        const jumlahCell = tds[7] || tds[8];

        const nominal =
          jumlahCell?.querySelector('strong')?.innerText.trim() ||
          jumlahCell?.querySelector('input')?.value.trim() ||
          jumlahCell?.innerText.trim() ||
          '';

        return {
          approve_time: tds[2]?.innerText.trim() || '',
          username: tds[3]?.innerText.trim() || '',
          bank_name: bank,
          account_name: nama,
          account_number: rekening,
          amount: nominal
        };
      })
      .filter(r => r.username && r.account_number);
  });
}

async function insertTransaction(tx) {
  try {
    await db.execute(
      `INSERT INTO transactions
      (approve_time, username, bank_name, account_name, account_number, amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
      [
        tx.approve_time,
        tx.username,
        tx.bank_name,
        tx.account_name,
        tx.account_number,
        parseAmount(tx.amount)
      ]
    );

    console.log('Insert:', tx.username, parseAmount(tx.amount));
  } catch (err) {
    // duplicate transaction
    if (err.code !== 'ER_DUP_ENTRY') {
      console.error(err.message);
    }
  }
}

(async () => {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];

  const page = context.pages().find(p =>
    p.url().includes('sis4dmimin.com')
  );

  if (!page) {
    console.log('Tab SIS4D tidak ditemukan');
    return;
  }

  await page.bringToFront();

  console.log('Bot realtime berjalan...');

while (true) {
  try {
    // pastikan tabel pending ada
    await page.waitForSelector('table.table.table-hover', {
  timeout: 30000,
  state: 'visible'
});

    const rows = await fetchPending(page);

    for (const row of rows) {
      await insertTransaction(row);
    }

    console.log('Cek selesai. Pending:', rows.length);

    // refresh data tanpa reload penuh
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });

  } catch (err) {
    console.error('Loop error:', err.message);
  }

  // jeda 5 detik
  await new Promise(r => setTimeout(r, 5000));
}
})();