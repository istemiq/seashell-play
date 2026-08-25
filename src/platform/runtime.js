import { Capacitor } from '@capacitor/core';

/** Google Play / Capacitor build — always true in this repo. */
export function isPlayApp() {
  return true;
}

export function isCapacitorNative() {
  return Capacitor.isNativePlatform();
}

export function isAndroidNative() {
  return Capacitor.getPlatform() === 'android';
}

/** Dev auth without Google Cloud (emulator / local only). */
export function isPlayDevAuth() {
  return String(import.meta.env.VITE_PLAY_DEV_AUTH ?? '').trim() === '1';
}
