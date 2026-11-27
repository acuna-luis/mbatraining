# Despliegue del aula

## Actualizar producción

El dominio `mba.statistics.plus` sirve la versión activa de `enderhost1`. Desde el repositorio local puedes publicar el árbol de trabajo con este comando.

```sh
deploy/publish.sh root@enderhost1
```

El script copia los archivos públicos y la API en una versión nueva de `/srv/mbatraining/releases`, guarda una copia SQLite antes de actualizar, verifica el catálogo, cambia el enlace `current` y comprueba que el servicio responda. El estado del usuario permanece fuera de cada versión.

## Instalación por IPv4

El servicio se aloja en Ubuntu 24.04, con nginx, systemd y Python 3.12. El aula utiliza el puerto 8443 y el puerto 80 sirve las comprobaciones HTTP-01 de la IP. Los nombres virtuales existentes en 443 conservan su configuración. El archivo SQLite vive en el volumen persistente del VPS, en `/var/lib/mbatraining/aula.sqlite3`, fuera del directorio público y de las versiones de la aplicación.

En un servidor con nginx, Python (módulo venv), pip, curl y UFW, copia este directorio y ejecuta como root, sustituyendo la IP por la asignada al VPS:

```sh
./prepare-host.sh 65.20.96.181 8443
./enable-https.sh 65.20.96.181 8443
```

Los scripts configuran el usuario de servicio, instalan Certbot y Gunicorn en un entorno Python propio y habilitan HTTPS con un certificado de IP de Let's Encrypt. Solo se abre el nuevo puerto de la aplicación si UFW está activo. En una red con firewall adicional debe estar permitido el acceso público a 80 y 8443.

Para la primera cuenta ejecuta en el servidor, desde `/srv/mbatraining/current`:

```sh
runuser -u mbatraining -- env MBA_DB=/var/lib/mbatraining/aula.sqlite3 /opt/mbatraining/venv/bin/python -B -m server.cli create-user --bootstrap lacuna
```

La herramienta solicita una contraseña provisional y un token aleatorio de al menos 32 caracteres. Entrega a su propietario el enlace `https://IP:8443/#activar=TOKEN` por un canal privado. El formulario consume el token al establecer la contraseña definitiva. Para otra cuenta, la misma orden con `create-user NOMBRE` solicita su contraseña. Los secretos quedan fuera de Git.

## Comprobaciones y recuperación

- `systemctl status mbatraining` y `journalctl -u mbatraining` muestran el estado de Gunicorn. La API escucha en loopback, puerto 18437.
- `systemctl list-timers mbatraining-cert.timer` muestra la renovación programada. El timer utiliza directorios ACME propios bajo `/etc/mbatraining/acme` y recarga nginx después de una renovación. La CA requiere que el desafío siga accesible incluso cuando el usuario entra por otro puerto.
- Las copias previas a despliegues se guardan con permisos privados en `/var/backups/mbatraining`. Para una copia independiente utiliza la API de backup de SQLite (como en `publish.sh`) y guarda la copia cifrada fuera del VPS. Un snapshot local no cubre la pérdida del servidor.
- Para volver al código de una versión anterior, apunta `/srv/mbatraining/current` a esa versión y reinicia `mbatraining.service`. Comprueba antes que la versión acepte el esquema de la BD vigente. El servicio no borra ni restaura la BD en un rollback de código.

Fuente de la configuración TLS: [certificados de IP con Certbot y Let's Encrypt](https://letsencrypt.org/2026/03/11/shorter-certs-certbot).
