@echo off
REM Деплой фронта на front.sishel.ru (cmd.exe, не PowerShell)
set SEASHELL_VPS=root@193.41.4.206
cd /d "%~dp0"
echo Target: %SEASHELL_VPS%
echo Пароль SSH будет запрошен 4 раза.
node scripts/deploy-tg-web-vps.mjs
if errorlevel 1 (
  echo.
  echo ОШИБКА. Если upload прошел, распакуйте вручную:
  echo ssh %SEASHELL_VPS% "cd /var/www/seashell-tg && tar -xzf deploy.tar.gz && rm -f deploy.tar.gz"
)
pause
