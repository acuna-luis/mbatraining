#!/usr/bin/env bash
# Ubuntu, como root. Se ejecuta desde una copia del directorio deploy/.
set -euo pipefail
cd "$(dirname "$0")"
address=${1:?Indica la IPv4 pública}
port=${2:-8443}
python3 - "$address" "$port" <<'PY'
import sys, ipaddress
ipaddress.IPv4Address(sys.argv[1])
assert 1024 <= int(sys.argv[2]) <= 65535
PY
getent passwd mbatraining >/dev/null || useradd --system --user-group --home-dir /var/lib/mbatraining --no-create-home --shell /usr/sbin/nologin mbatraining
install -d -o mbatraining -g mbatraining -m 0700 /var/lib/mbatraining
install -d -m 0755 /opt/mbatraining /srv/mbatraining/releases /var/www/mbatraining-acme/.well-known/acme-challenge /etc/mbatraining
install -d -m 0700 /etc/mbatraining/acme /var/lib/mbatraining-acme /var/log/mbatraining-acme
if [[ ! -x /opt/mbatraining/venv/bin/python ]]; then
    python3 -m venv --without-pip /opt/mbatraining/venv
fi
python3 -m pip --python /opt/mbatraining/venv/bin/python install --disable-pip-version-check 'certbot>=5.4,<7' 'gunicorn>=23,<27'
sed -e "s/@IP@/$address/g" -e "s/@PORT@/$port/g" nginx-http.conf.in > /etc/nginx/sites-available/mbatraining-http
ln -sfn /etc/nginx/sites-available/mbatraining-http /etc/nginx/sites-enabled/zz-mbatraining-http
nginx -t
systemctl reload nginx
printf 'MBA_DB=/var/lib/mbatraining/aula.sqlite3\nMBA_ORIGIN=https://%s:%s\n' "$address" "$port" > /etc/mbatraining/app.env
install -m 0644 mbatraining.service mbatraining-cert.service mbatraining-cert.timer /etc/systemd/system/
systemctl daemon-reload
