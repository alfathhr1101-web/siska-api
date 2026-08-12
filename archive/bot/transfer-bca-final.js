import fs from 'fs';
import { execSync } from 'child_process';

const cfg = JSON.parse(
  fs.readFileSync('./bot/config.json', 'utf8')
);

function adb(cmd) {
  console.log('ADB:', cmd);
  execSync(`adb ${cmd}`, { stdio: 'inherit' });
}

function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

(async () => {
  console.log('=== MULAI TRANSFER BCA ===');

  adb('shell input tap 96 796');
  await wait(2000);

  adb('shell input tap 360 327');
  await wait(2000);

  adb('shell input tap 148 320');
  await wait(2500);

  adb(`shell input text ${cfg.bank}`);
  await wait(1000);

  adb('shell input tap 330 330');
  await wait(2000);

  adb(`shell input text ${cfg.rekening}`);
  await wait(1000);

  adb('shell input keyevent 66');
  await wait(2000);

  adb('shell input tap 360 520');
  await wait(4000);

  adb(`shell input text ${cfg.nominal}`);
  await wait(4000);

  adb('shell input tap 360 660');
  await wait(1500);

  adb('shell input tap 300 360');
  await wait(2000);

  adb('shell input tap 300 890');
  await wait(1000);

  adb('shell input tap 300 1510');
  await wait(2000);

// Lanjut ke halaman konfirmasi
adb('shell input tap 202 1605');
await wait(3000);

  adb('shell input tap 300 1325');
  await wait(3000);

  console.log('=== BERHASIL SAMPAI HALAMAN KONFIRMASI ===');
})();