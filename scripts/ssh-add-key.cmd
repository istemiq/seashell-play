@echo off
set VPS=root@193.41.4.206
echo Добавляет ваш SSH-ключ на Aeza VPS (пароль — один раз).
echo.
type "%USERPROFILE%\.ssh\id_ed25519.pub" | ssh %VPS% "mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo key-added"
echo.
echo Проверка без пароля:
ssh -o BatchMode=yes %VPS% "echo ssh-ok"
pause
