# Ручной деплой фронта на Aeza (если deploy-tg-web-vps.mjs завис).
# Запуск: powershell -File scripts\deploy-front-manual.ps1

$ErrorActionPreference = 'Stop'
$VPS = if ($env:SEASHELL_VPS) { $env:SEASHELL_VPS } else { 'root@193.41.4.206' }
$RemoteDir = '/var/www/seashell-tg'
$Root = Split-Path $PSScriptRoot -Parent

Set-Location $Root
Write-Host "[1/4] build:prod..."
npm run build:prod

$index = Get-Content (Join-Path $Root 'build\index.html') -Raw
if ($index -notmatch 'index-([A-Za-z0-9]+)\.js') {
  throw 'Не найден hash в build/index.html'
}
$hash = $Matches[1]
Write-Host "[2/4] bundle: index-$hash.js"

$tar = Join-Path $Root ".deploy-tg-web.tar.gz"
if (Test-Path $tar) { Remove-Item $tar -Force }
tar -czf $tar -C (Join-Path $Root 'build') .

Write-Host "[3/4] upload → $VPS (введи пароль)..."
scp $tar "${VPS}:${RemoteDir}/deploy.tar.gz"

Write-Host "[4/4] unpack on server..."
ssh $VPS "cd $RemoteDir && tar -xzf deploy.tar.gz && rm -f deploy.tar.gz && chmod -R a+rX $RemoteDir && curl -s https://front.sishel.ru/ | grep -o 'index-[^.]*\.js' | head -1"

Remove-Item $tar -Force -ErrorAction SilentlyContinue
Write-Host "Готово. Закрой Mini App полностью и открой снова."
