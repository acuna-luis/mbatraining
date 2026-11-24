#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
address=${1:?Indica la IPv4 pública}
port=${2:-8443}
python3 - "$address" "$port" <<'PY'
import sys, ipaddress
ipaddress.IPv4Address(sys.argv[1])
assert 1024 <= int(sys.argv[2]) <= 65535
PY
/opt/mbatraining/venv/bin/certbot certonly --non-interactive --agree-tos --register-unsafely-without-email \
    --config-dir /etc/mbatraining/acme --work-dir /var/lib/mbatraining-acme --logs-dir /var/log/mbatraining-acme \
    --cert-name mbatraining-ip --keep-until-expiring --preferred-profile shortlived \
    --webroot --webroot-path /var/www/mbatraining-acme --ip-address "$address"
sed -e "s/@IP@/$address/g" -e "s/@PORT@/$port/g" nginx-https.conf.in > /etc/nginx/sites-available/mbatraining-https
ln -sfn /etc/nginx/sites-available/mbatraining-https /etc/nginx/sites-enabled/zz-mbatraining-https
nginx -t
systemctl reload nginx
systemctl enable --now mbatraining-cert.timer
if ufw status | grep -q '^Status: active'; then ufw allow proto tcp to "$address" port "$port" comment 'MBA Training HTTPS'; fi
