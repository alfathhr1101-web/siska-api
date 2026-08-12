import fs from 'fs';
import { execSync } from 'child_process';

const text = process.argv.slice(2).join(' ');

execSync('adb shell uiautomator dump /sdcard/ui.xml', { stdio: 'inherit' });
execSync('adb pull /sdcard/ui.xml ui.xml', { stdio: 'inherit' });

const xml = fs.readFileSync('ui.xml', 'utf8');

const re = new RegExp(
  `text="${text}"[^>]*bounds="\\\\[(\\\\d+),(\\\\d+)\\\\]\\\\[(\\\\d+),(\\\\d+)\\\\]"`
);

const m = xml.match(re);

if (!m) {
  console.log('Tidak ditemukan:', text);
  process.exit(1);
}

// titik tengah XML
const xXml = Math.floor((+m[1] + +m[3]) / 2);
const yXml = Math.floor((+m[2] + +m[4]) / 2);

// konversi ke koordinat layar emulator kamu
const x = xXml - 1;
const y = yXml - 114;

console.log(`XML : ${xXml},${yXml}`);
console.log(`REAL: ${x},${y}`);

execSync(`adb shell input tap ${x} ${y}`, { stdio: 'inherit' });