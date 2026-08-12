import fs from 'fs';
import { execSync } from 'child_process';

const xml = fs.readFileSync('ui.xml', 'utf8');

const m = xml.match(/text="Transfer"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);

if (!m) {
  console.log('Transfer tidak ditemukan');
  process.exit(1);
}

const x = Math.floor((+m[1] + +m[3]) / 2);
const y = Math.floor((+m[2] + +m[4]) / 2);

console.log(`Klik Transfer di ${x},${y}`);

execSync(`adb shell input tap ${x} ${y}`);