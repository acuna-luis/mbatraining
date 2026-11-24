"""Cuentas, sesiones y borradores en SQLite. MBA_DB debe estar fuera del directorio público."""

import hashlib
import hmac
import os
import re
import secrets
import sqlite3
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    activation_hash TEXT,
    last_id TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
CREATE TABLE IF NOT EXISTS drafts (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    qid TEXT NOT NULL,
    mode TEXT NOT NULL,
    text TEXT NOT NULL,
    choice TEXT NOT NULL,
    revision INTEGER NOT NULL CHECK(revision > 0),
    PRIMARY KEY(user_id, qid)
);
CREATE TABLE IF NOT EXISTS attempts (
    scope TEXT PRIMARY KEY,
    since INTEGER NOT NULL,
    attempts INTEGER NOT NULL
);
"""


def connect():
    db = sqlite3.connect(os.environ["MBA_DB"], timeout=5, isolation_level=None)
    db.row_factory = sqlite3.Row
    db.execute("PRAGMA foreign_keys=ON")
    return db


def initialize():
    path = Path(os.environ["MBA_DB"])
    path.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    path.touch(mode=0o600, exist_ok=True)
    db = connect()
    try:
        db.execute("PRAGMA journal_mode=WAL")
        db.executescript(SCHEMA)
    finally:
        db.close()


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def username_valid(name):
    return isinstance(name, str) and re.fullmatch(r"[a-zA-Z0-9_.-]{1,64}", name) is not None


def secret_valid(value):
    return isinstance(value, str) and 0 < len(value) <= 1024


def password_valid(value):
    return secret_valid(value) and len(value) >= 12


def encode_password(value, salt=None):
    salt = salt or secrets.token_hex(16)
    result = hashlib.scrypt(value.encode(), salt=bytes.fromhex(salt), n=32768, r=8,
                            p=1, dklen=32, maxmem=64 * 1024 * 1024)
    return salt + ":" + result.hex()


def verify_password(value, encoded):
    salt, _ = encoded.split(":", 1)
    return hmac.compare_digest(encode_password(value, salt), encoded)


def create_user(name, password, token=None):
    if not username_valid(name):
        raise ValueError("El usuario debe tener de 1 a 64 letras ASCII, cifras, puntos, guiones o guiones bajos.")
    if token is not None and (not secret_valid(token) or len(token) < 32):
        raise ValueError("El token de activación requiere al menos 32 caracteres aleatorios.")
    if not secret_valid(password) or (token is None and not password_valid(password)):
        raise ValueError("La contraseña definitiva requiere entre 12 y 1024 caracteres.")
    db = connect()
    try:
        db.execute("INSERT INTO users(username,password_hash,activation_hash) VALUES(?,?,?)",
                   (name, encode_password(password), digest(token) if token else None))
    finally:
        db.close()
