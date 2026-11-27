#!/usr/bin/env bash
# Publica el árbol local. La base de datos y la configuración residen fuera de cada versión.
set -euo pipefail
cd "$(dirname "$0")/.."
target=${1:?Uso: deploy/publish.sh usuario@servidor}
[[ $target =~ ^[[:alnum:]_.@:-]+$ && $target != -* ]] || exit 2
release="$(date -u +%Y%m%dT%H%M%S)-$(git rev-parse --short HEAD)-$(python3 -c 'import secrets;print(secrets.token_hex(3))')"
local_stage=$(mktemp -d)
trap 'rm -rf -- "$local_stage"' EXIT
mkdir -p "$local_stage/public" "$local_stage/server"
cp -r index.html aula.css acceso.css escritorio.css estudio.css ./*.js assets data "$local_stage/public/"
cp server/{__init__,app,store,cli}.py "$local_stage/server/"
ln -s public/data "$local_stage/data"
tar -C "$local_stage" -czf - . | ssh -o BatchMode=yes "$target" "set -eu; mkdir /srv/mbatraining/releases/$release; tar --no-same-owner -xzf - -C /srv/mbatraining/releases/$release; chmod -R a+rX /srv/mbatraining/releases/$release"
ssh -o BatchMode=yes "$target" bash -s -- "$release" <<'REMOTE'
set -euo pipefail
release=$1
base=/srv/mbatraining
set -a; source /etc/mbatraining/app.env; set +a
old=$(readlink -f "$base/current" || :)
cd "$base/releases/$release"
if [[ -s "$MBA_DB" ]]; then
    install -d -m 0700 /var/backups/mbatraining
    python3 - "$MBA_DB" "/var/backups/mbatraining/before-$release.sqlite3" <<'PY'
import os,sqlite3,sys
os.umask(0o077)
with sqlite3.connect(sys.argv[1]) as src, sqlite3.connect(sys.argv[2]) as dst:
    src.backup(dst)
PY
fi
runuser -u mbatraining --preserve-environment -- /opt/mbatraining/venv/bin/python -B -m server.cli init
runuser -u mbatraining --preserve-environment -- /opt/mbatraining/venv/bin/python -B -c 'from server.app import application'
ln -s "releases/$release" "$base/.next-$release"
mv -Tf "$base/.next-$release" "$base/current"
if ! (systemctl enable mbatraining && systemctl restart mbatraining &&
      curl -fsS --retry-all-errors --retry 7 --retry-delay 1 http://127.0.0.1:18437/api/session | grep -Fq '"user":null'); then
    if [[ -d "$old/public" && "$old" != "$base/current" ]]; then
        ln -s "$old" "$base/.rollback-$release"
        mv -Tf "$base/.rollback-$release" "$base/current"; systemctl restart mbatraining
    fi
    exit 1
fi
printf 'Versión activa: %s\n' "$release"
REMOTE
