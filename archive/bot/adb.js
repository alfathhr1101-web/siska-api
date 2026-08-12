import { execSync } from 'child_process';

export function run(cmd) {
  return execSync(cmd, { encoding: 'utf8' });
}

export function tap(x, y) {
  console.log(`TAP ${x},${y}`);
  run(`adb shell input tap ${x} ${y}`);
}

export function text(value) {
  run(`adb shell input text ${value}`);
}

export function back() {
  run('adb shell input keyevent 4');
}

export function dumpUi(path = '/sdcard/ui.xml') {
  run(`adb shell uiautomator dump ${path}`);
  return run(`adb shell cat ${path}`);
}