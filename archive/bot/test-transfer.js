import { execSync } from 'child_process';

execSync('adb shell input tap 74 1492', { stdio: 'inherit' });
console.log('Klik transfer dikirim');