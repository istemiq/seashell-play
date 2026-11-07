#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = join(root, 'build');
const indexPath = join(buildDir, 'index.html');

if (!existsSync(indexPath)) {
  console.error('✗ Нет build/index.html — сначала: npm run build');
  process.exit(1);
}

const envProd = join(root, '.env.production');
if (!existsSync(envProd)) {
  console.error('✗ Нет .env.production');
  process.exit(1);
}
const envText = readFileSync(envProd, 'utf8');
if (!/VITE_API_URL\s*=\s*https:\/\/api\.sishel\.ru/.test(envText)) {
  console.error('✗ .env.production: нужен VITE_API_URL=https://api.sishel.ru');
  process.exit(1);
}

const hasAnalyticsToken = /VITE_TG_ANALYTICS_TOKEN\s*=\s*\S+/.test(envText);
const hasAnalyticsApp = /VITE_TG_ANALYTICS_APP_NAME\s*=\s*\S+/.test(envText);
if (!hasAnalyticsToken || !hasAnalyticsApp) {
  console.warn('⚠ .env.production: задайте VITE_TG_ANALYTICS_TOKEN и VITE_TG_ANALYTICS_APP_NAME (TON Builders / @DataChief_bot)');
}

const html = readFileSync(indexPath, 'utf8');
// Ищем именно тег подключения энтри-бандла: свободный поиск «assets/index-….js» по тексту HTML ловит
// упоминания в комментариях и inline-скриптах (сторож загрузки) и берёт несуществующий файл.
const jsRel =
  html.match(/<script[^>]+type=["']module["'][^>]*src=["'][^"']*assets\/(index-[^"']+\.js)[^"']*["']/)?.[1] ??
  html.match(/assets\/(index-[^"']+\.js)/)?.[1];
if (!jsRel) {
  console.error('✗ В index.html нет assets/index-*.js');
  process.exit(1);
}

const js = readFileSync(join(buildDir, 'assets', jsRel), 'utf8');
const assetJs = readdirSync(join(buildDir, 'assets'))
  .filter((name) => name.endsWith('.js'))
  .map((name) => readFileSync(join(buildDir, 'assets', name), 'utf8'))
  .join('\n');
const hasApi = js.includes('api.sishel.ru');
const hasVkui = assetJs.includes('@vkontakte/vkui') || assetJs.includes('vk-mini-apps');
const hasAnalyticsSdk = assetJs.includes('registerInvoice') && assetJs.includes('recordEvents');

console.log(`Проверка: ${jsRel} (${Math.round(js.length / 1024)} KB)`);
console.log(`${hasApi ? '✓' : '✗'} API → api.sishel.ru в бандле`);
console.log(`${!hasVkui ? '✓' : '✗'} без VKUI`);
console.log(`${hasAnalyticsSdk ? '✓' : '✗'} Telegram Analytics SDK в бандле`);
if (!hasApi || hasVkui || !hasAnalyticsSdk) process.exit(1);
console.log('✓ prod build OK');
