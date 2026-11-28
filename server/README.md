# API del cuaderno

La API sirve los datos privados. Los archivos de la web se sirven por separado. Ejecuta los comandos desde la raíz del proyecto con el usuario del servicio. El servicio necesita lectura del código y de `data/curso.js` y escritura en una carpeta privada para SQLite, su WAL y los archivos de control.

Configura `MBA_DB` con la ruta completa a la base de datos y `MBA_ORIGIN` con el origen HTTPS exacto que usarán los navegadores (incluido el puerto si no es el 443, sin barra final). El proxy inverso debe sobrescribir `X-Real-IP` con la IP del cliente y reenviar `/api/` sin quitarle ese prefijo. Gunicorn se enlaza a una dirección de loopback, por ejemplo:

```sh
export MBA_DB=/var/lib/mbatraining/aula.sqlite3
python3 -m server.cli init
python3 -m server.cli create-user --bootstrap lacuna
gunicorn --bind 127.0.0.1:8719 --workers 2 --threads 2 server.app:application
```

Para la cuenta inicial, la CLI pide la contraseña provisional y un token aleatorio de al menos 32 caracteres. Si lee desde una tubería, espera ambos en líneas sucesivas. En el primer acceso se presentan esos dos valores y una contraseña definitiva de al menos 12 caracteres. La misma transacción reemplaza la contraseña y da por consumido el token. Para crear otra cuenta usa `python3 -m server.cli create-user NOMBRE`, que solicita la contraseña definitiva. La CLI rechaza nombres duplicados. Prepara un respaldo de la BD con el mecanismo de copia de SQLite antes de migrar el servicio.

Las sesiones expiran a los 14 días y se revocan al cerrar sesión. La API devuelve un error de conflicto (409) cuando un dispositivo intenta cambiar una revisión que ya editó otro dispositivo. El conflicto incorpora la versión actual para que el cliente pueda elegir qué conservar. Se aceptan reintentos de la misma escritura sin duplicar la revisión.

`GET /api/state` incluye `activeSeconds`, los segundos de estudio registrados en la cuenta. Las cuentas anteriores empiezan en cero. El despliegue añade la tabla de actividad al ejecutar `python3 -m server.cli init`.

Cada registro de medición usa su propio UUID. El cliente envía `PUT /api/activity` con la cabecera `X-MBA-User`, la cookie de sesión y un objeto como `{"activityId":"7a970454-21bd-40ce-a54f-fa7e5be47102","seconds":25}`. El valor es el total observado para ese UUID, un entero entre 0 y 2147483647. La API conserva el máximo recibido y devuelve los segundos confirmados en `recordSeconds` y el total de la cuenta en `activeSeconds`. Al reintentar hay que reutilizar el mismo UUID. Enviar cero permite consultar la cantidad ya confirmada.

Para comprobar el aislamiento por cuenta, la activación, la revocación, los límites de acceso, los conflictos y la persistencia en una base temporal:

```sh
python3 -m unittest server.test_app -v
```
