import { chromium } from 'playwright';

function parseAmount(text) {
  return Number((text || '').replace(/[^\d]/g, ''));
}

(async () => {
  console.log('Menghubungkan ke Chrome...');

  // connect ke chrome debug yang sudah login panel
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const context = browser.contexts()[0];

  // cari tab panel SIS4D
  const page = context.pages().find(p =>
    p.url().includes('sis4dmimin.com')
  );

  if (!page) {
    console.log('Tab SIS4D tidak ditemukan');
    return;
  }

  await page.bringToFront();

  console.log('Membaca halaman:', page.url());

  const rows = await page.evaluate(() => {
    // cari bagian WITHDRAW IN PROGRESS
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
      .slice(1) // skip header
      .map(tr => {
        const tds = tr.querySelectorAll('td');

        // kolom Bank Tujuan
        const tujuanInputs = tds[4]?.querySelectorAll('input') || [];

        const nama = tujuanInputs[0]?.value.trim() || '';
        const rekening = tujuanInputs[1]?.value.trim() || '';

        // ambil logo bank
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

        // kolom jumlah
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
          nominal
        };
      })
      .filter(r => r.username && r.account_number);
  });

  // normalisasi data
  const finalData = rows.map(r => ({
    approve_time: r.approve_time,
    username: r.username,
    bank_name: r.bank_name,
    account_name: r.account_name,
    account_number: r.account_number,
    amount: parseAmount(r.nominal),
    status: 'Pending'
  }));

  console.log('\n=== DATA FINAL ===');
  console.log(JSON.stringify(finalData, null, 2));

  console.log('\nTotal transaksi:', finalData.length);
  console.log('\nSelesai.');
})();