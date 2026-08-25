#!/bin/bash
# nginx + Let's Encrypt для front.sishel.ru (Reg.ru A → VPS).
set -euo pipefail

DOMAIN=front.sishel.ru
WEB_ROOT=/var/www/seashell-tg
NGINX_AVAIL=/etc/nginx/sites-available/seashell-tg-web
NGINX_ENABLED=/etc/nginx/sites-enabled/seashell-tg-web

mkdir -p "$WEB_ROOT"

cat > "$NGINX_AVAIL" <<EOF
server {
    listen 80;
    server_name ${DOMAIN};
    root ${WEB_ROOT};
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \\.(js|css|png|svg|webp|woff2?)\$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }
}
EOF

ln -sf "$NGINX_AVAIL" "$NGINX_ENABLED"
nginx -t
systemctl reload nginx

IP=$(dig +short "$DOMAIN" @8.8.8.8 | tail -1)
echo "DNS $DOMAIN -> ${IP:-?(empty)}"

certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m istemiwork@gmail.com || {
  echo "certbot пока не прошёл — подожди DNS (5–30 мин) и запусти:"
  echo "  certbot --nginx -d $DOMAIN"
  exit 0
}

echo "OK: https://${DOMAIN}/"
