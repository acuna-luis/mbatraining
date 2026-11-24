"""python -m server.cli init | create-user [--bootstrap] USUARIO"""

import argparse
import getpass
import os
import sqlite3
import sys

from . import store


def read_secret(label):
    if sys.stdin.isatty():
        return getpass.getpass(label + ": ")
    line = sys.stdin.readline()
    if not line:
        raise ValueError("Faltan datos en la entrada estándar.")
    return line.rstrip("\r\n")


def main():
    parser = argparse.ArgumentParser(description="Administrar el cuaderno de economía")
    commands = parser.add_subparsers(dest="cmd", required=True)
    commands.add_parser("init")
    add = commands.add_parser("create-user")
    add.add_argument("username")
    add.add_argument("--bootstrap", action="store_true")
    args = parser.parse_args()
    if not os.environ.get("MBA_DB"):
        parser.error("Configure MBA_DB con la ruta privada de la base de datos.")
    os.umask(0o077)
    if args.cmd == "init":
        store.initialize()
        return
    try:
        password = read_secret("Contraseña inicial" if args.bootstrap else "Contraseña")
        token = read_secret("Token de activación") if args.bootstrap else None
        store.create_user(args.username, password, token)
    except sqlite3.IntegrityError:
        parser.exit(1, "El usuario ya existe. Se conserva su contraseña y sus respuestas.\n")
    except ValueError as error:
        parser.exit(1, str(error) + "\n")


if __name__ == "__main__":
    main()
