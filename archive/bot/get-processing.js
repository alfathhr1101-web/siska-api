import mysql from 'mysql2/promise';
import { execSync } from 'child_process';

function adb(cmd) {
  console.log('ADB:', cmd);
  execSync(`adb ${cmd}`, { stdio: 'inherit' });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// koneksi database
const db = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'test'
});

// ambil 1 transaksi Processing
const [rows] = await db.execute(`
  SELECT * FROM transactions
  WHERE status='Processing'
  ORDER BY id ASC
  LIMIT 1
`);

if (rows.length === 0) {
  console.log('Tidak ada transaksi Processing');
} else {
  const tx = rows[0];

  console.log('=== TRANSAKSI SIAP TRANSFER ===');
  console.log('Bank     :', tx.bank_name);
  console.log('Nama     :', tx.account_name);
  console.log('Rekening :', tx.account_number);
  console.log('Nominal  :', tx.amount);

  // bangunkan layar
  adb('shell input keyevent 224');
  await delay(1000);

  // buka browser / chrome
  adb('shell monkey -p com.android.chrome -c android.intent.category.LAUNCHER 1');
  await delay(4000);

  // fokus address bar
  adb('shell input keyevent 61');
  await delay(1000);

  // ketik rekening
  adb(`shell input text ${tx.account_number}`);

  console.log('Rekening berhasil diketik ke emulator');
}

await db.end();
console.log('Selesai.');