"""API WSGI de mbatraining. Servir detrás de HTTPS con gunicorn server.app:application."""

import hmac
import ipaddress
import json
import os
import secrets
import sqlite3
import time
from contextlib import closing
from http import HTTPStatus
from http.cookies import CookieError, SimpleCookie
from pathlib import Path

from . import store

COOKIE = "__Host-mba_session"
LIFETIME = 14 * 24 * 3600
WINDOW = 10 * 60
TEXT_LIMIT = 32000
MAX_BODY = 256 * 1024
COOKIE_ATTRIBUTES = "; Path=/; HttpOnly; Secure; SameSite=Lax"
DUMMY_PASSWORD = store.encode_password(secrets.token_hex(32))


def load_catalog():
    src = (Path(__file__).resolve().parents[1] / "data" / "curso.js").read_text(encoding="utf8")
    modules = json.loads(src.split("=", 1)[1].strip().rstrip(";"))
    units = set()
    questions = {}
    for module in modules:
        for item in module["items"]:
            if item.get("questions"):
                units.add(item["id"])
                questions.update({q["id"]: q for q in item["questions"]})
    return units, questions


UNITS, QUESTIONS = load_catalog()


class Denied(Exception):
    def __init__(self, status, code, **extra):
        super().__init__(code)
        self.status = status
        self.payload = {"error": code, **extra}


def client_ip(env):
    peer = env.get("REMOTE_ADDR", "")
    try:
        if ipaddress.ip_address(peer).is_loopback:
            return str(ipaddress.ip_address(env.get("HTTP_X_REAL_IP", peer)))
        return str(ipaddress.ip_address(peer))
    except ValueError:
        return "unknown"


def body_for_write(env):
    origin = env.get("HTTP_ORIGIN")
    if ((origin is not None and origin != os.environ["MBA_ORIGIN"])
            or env.get("HTTP_SEC_FETCH_SITE") in ("same-site", "cross-site")):
        raise Denied(403, "invalid_origin")
    if env.get("CONTENT_TYPE", "").partition(";")[0].strip().lower() != "application/json":
        raise Denied(415, "json_required")
    length = env.get("CONTENT_LENGTH", "")
    if not length.isascii() or not length.isdigit():
        raise Denied(411, "length_required")
    size = int(length)
    if size > MAX_BODY:
        raise Denied(413, "body_too_large")
    try:
        data = json.loads(env["wsgi.input"].read(size).decode("utf8"))
        if not isinstance(data, dict):
            raise ValueError
        # JSON escape sequences can represent unpaired surrogates which SQLite cannot store.
        json.dumps(data, ensure_ascii=False, allow_nan=False).encode("utf8")
    except (ValueError, UnicodeError, RecursionError):
        raise Denied(400, "invalid_json") from None
    return data


def session_token(env):
    cookies = SimpleCookie()
    try:
        cookies.load(env.get("HTTP_COOKIE", ""))
    except CookieError:
        return None
    value = cookies.get(COOKIE)
    return store.digest(value.value) if value and len(value.value) == 43 else None


def session(db, env):
    return db.execute("""
        SELECT u.id,u.username,u.last_id FROM sessions s JOIN users u ON u.id=s.user_id
        WHERE s.token_hash=? AND s.expires>?
    """, (session_token(env), int(time.time()))).fetchone()


def login(db, env, data):
    name, password = data.get("username"), data.get("password")
    legitimate = store.username_valid(name) and store.secret_valid(password)
    # Reserve capacity before the expensive password check, across all WSGI workers.
    now = int(time.time())
    limits = [("ip:" + client_ip(env), 100)]
    if legitimate:
        limits.append(("user:" + name, 15))
    db.execute("BEGIN IMMEDIATE")
    db.execute("DELETE FROM attempts WHERE since<=?", (now - WINDOW,))
    for scope, limit in limits:
        row = db.execute("SELECT attempts FROM attempts WHERE scope=?", (scope,)).fetchone()
        if row and row["attempts"] >= limit:
            raise Denied(429, "rate_limited")
        db.execute("""INSERT INTO attempts(scope,since,attempts) VALUES(?,?,1)
                      ON CONFLICT(scope) DO UPDATE SET attempts=attempts+1""", (scope, now))
    account = db.execute("SELECT * FROM users WHERE username=?", (name,)).fetchone() if legitimate else None
    db.commit()
    encoded = account["password_hash"] if account else DUMMY_PASSWORD
    matches = store.verify_password(password if legitimate else "invalid", encoded)
    if not account or not matches:
        raise Denied(401, "invalid_credentials")
    replacement = None
    if account["activation_hash"]:
        token = data.get("bootstrapToken")
        if not store.secret_valid(token) or not hmac.compare_digest(store.digest(token), account["activation_hash"]):
            raise Denied(403, "activation_required")
        new = data.get("newPassword")
        if not store.password_valid(new) or new == password:
            raise Denied(422, "weak_password")
        replacement = store.encode_password(new)
    db.execute("BEGIN IMMEDIATE")
    updated = db.execute("SELECT password_hash,activation_hash FROM users WHERE id=?", (account["id"],)).fetchone()
    if not updated or updated["password_hash"] != encoded or updated["activation_hash"] != account["activation_hash"]:
        raise Denied(401, "invalid_credentials")
    if replacement is not None:
        db.execute("UPDATE users SET password_hash=?,activation_hash=NULL WHERE id=?", (replacement, account["id"]))
        db.execute("DELETE FROM sessions WHERE user_id=?", (account["id"],))
    for scope, _ in limits:
        db.execute("UPDATE attempts SET attempts=max(0,attempts-1) WHERE scope=?", (scope,))
    clear = secrets.token_urlsafe(32)
    db.execute("DELETE FROM sessions WHERE expires<=? OR token_hash=?", (now, session_token(env)))
    db.execute("INSERT INTO sessions(token_hash,user_id,expires) VALUES(?,?,?)",
               (store.digest(clear), account["id"], now + LIFETIME))
    return {"user": account["username"]}, [("Set-Cookie", COOKIE + "=" + clear + "; Max-Age=" + str(LIFETIME) + COOKIE_ATTRIBUTES)]


def save_draft(db, user, qid, data):
    q = QUESTIONS.get(qid)
    if not q:
        raise Denied(404, "unknown_question")
    mode, text, choice, rev = (data.get(key) for key in ("mode", "text", "choice", "revision"))
    if (mode not in ("texto", "eleccion") or not isinstance(text, str) or len(text) > TEXT_LIMIT
            or not isinstance(choice, str) or (choice and choice not in q.get("options", []))
            or (q["type"] == "desarrollo" and mode != "texto") or type(rev) is not int or not 0 <= rev < 2**53):
        raise Denied(422, "invalid_draft")
    current = db.execute("SELECT mode,text,choice,revision FROM drafts WHERE user_id=? AND qid=?",
                         (user, qid)).fetchone()
    revision = current["revision"] if current else 0
    if current and (mode, text, choice) == (current["mode"], current["text"], current["choice"]):
        return {"revision": revision}
    if rev != revision:
        blank = {"mode": "texto" if q["type"] == "desarrollo" else "eleccion",
                 "text": "", "choice": "", "revision": 0}
        raise Denied(409, "conflict", draft=dict(current) if current else blank)
    db.execute("""INSERT INTO drafts(user_id,qid,mode,text,choice,revision) VALUES(?,?,?,?,?,?)
        ON CONFLICT(user_id,qid) DO UPDATE SET mode=excluded.mode,text=excluded.text,
            choice=excluded.choice,revision=excluded.revision""", (user,qid,mode,text,choice,revision+1))
    return {"revision": revision+1}


def dispatch(db, env):
    method, path = env["REQUEST_METHOD"], env["PATH_INFO"]
    if method not in ("GET", "POST", "PUT"):
        raise Denied(405, "method_not_allowed")
    write = method != "GET"
    data = body_for_write(env) if write else {}
    if path == "/api/login" and method == "POST":
        return login(db, env, data)
    db.execute("BEGIN IMMEDIATE" if write else "BEGIN")
    account = session(db, env)
    if path == "/api/session" and method == "GET":
        return {"user": account["username"] if account else None}, []
    bound_user = env.get("HTTP_X_MBA_USER")
    if not account or (bound_user is not None and bound_user != account["username"]):
        raise Denied(401, "login_required")
    if path == "/api/logout" and method == "POST":
        db.execute("DELETE FROM sessions WHERE token_hash=?", (session_token(env),))
        return {}, [("Set-Cookie", COOKIE + "=; Max-Age=0" + COOKIE_ATTRIBUTES)]
    if path == "/api/state" and method == "GET":
        items = db.execute("SELECT qid,mode,text,choice,revision FROM drafts WHERE user_id=?", (account["id"],))
        drafts = {}
        for item in items:
            draft = dict(item)
            drafts[draft.pop("qid")] = draft
        return {"drafts": drafts, "lastId": account["last_id"]}, []
    if path == "/api/last" and method == "PUT":
        last = data.get("lastId")
        if not isinstance(last, str) or (last and last not in UNITS):
            raise Denied(422, "invalid_section")
        db.execute("UPDATE users SET last_id=? WHERE id=?", (last, account["id"]))
        return {}, []
    if path.startswith("/api/drafts/") and method == "PUT":
        return save_draft(db, account["id"], path[len("/api/drafts/"):], data), []
    raise Denied(404, "not_found")


def application(environ, start_response):
    headers = [("Cache-Control","no-store"), ("Content-Type","application/json; charset=utf-8"),
               ("X-Content-Type-Options","nosniff")]
    try:
        with closing(store.connect()) as db:
            with db:
                payload, extra = dispatch(db, environ)
        headers.extend(extra)
        status = 200
    except Denied as error:
        status, payload = error.status, error.payload
        if status == 429:
            headers.append(("Retry-After", str(WINDOW)))
    except sqlite3.OperationalError as error:
        if "locked" not in str(error).lower():
            raise
        status, payload = 503, {"error": "db_busy"}
        headers.append(("Retry-After", "1"))
    result = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf8")
    headers.append(("Content-Length", str(len(result))))
    start_response(str(status) + " " + HTTPStatus(status).phrase, headers)
    return [result]
