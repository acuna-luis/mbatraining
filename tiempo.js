(() => {
  "use strict";

  const idleLimit = 120000;
  const uploadInterval = 30000;
  const maxSampleGap = 10000;
  const prefix = "mba.actividad.v1.";
  const memory = new Map();
  let storageAvailable = true;
  let session, checkpoint, lastInput, foreground = false, suspended = false;
  let lastPublished = 0;

  function read(key) {
    if (!storageAvailable) return memory.get(key);
    let raw;
    try { raw = localStorage.getItem(key); }
    catch { storageAvailable = false; return memory.get(key); }
    if (!raw) return undefined;
    try {
      const stored = JSON.parse(raw);
      memory.set(key, stored);
      return stored;
    } catch { return undefined; }
  }

  function write(key, value) {
    memory.set(key, value);
    if (storageAvailable) try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { storageAvailable = false; }
  }

  function newId() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
    return [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20)].join("-");
  }

  const secondsOf = (record) => Math.floor(record.ms / 1000);
  const validNumber = (value) => Number.isSafeInteger(value) && value >= 0;
  function recordFor(s) {
    const existing = read(s.key);
    if (existing && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(existing.id) &&
        validNumber(existing.ms) && validNumber(existing.until)) return existing;
    const record = { id: newId(), ms: 0, until: 0 };
    write(s.key, record);
    return record;
  }

  function confirmedFor(s, record) {
    const ack = read(s.ackKey);
    return ack?.id === record.id && validNumber(ack.recordSeconds) && validNumber(ack.activeSeconds)
      ? ack : { id: record.id, recordSeconds: 0, activeSeconds: 0 };
  }

  function segundos() {
    if (!session) return 0;
    const record = recordFor(session);
    const local = secondsOf(record);
    if (!session.send) return local;
    const ack = confirmedFor(session, record);
    // /state puede incluir un envío cuya respuesta se perdió antes de la recarga.
    // La próxima confirmación reconcilia el total con este mismo ID de dispositivo.
    const minimum = session.checked ? session.total : session.total + Math.max(0, local - session.atOpen);
    return Math.max(minimum, ack.activeSeconds + Math.max(0, local - ack.recordSeconds));
  }

  function notify() {
    const total = segundos();
    if (lastPublished === total) return;
    lastPublished = total;
    window.dispatchEvent(new CustomEvent("tiempoactualizado", { detail: total }));
  }

  function sample() {
    if (!session) return;
    const now = Date.now();
    const start = checkpoint;
    checkpoint = now;
    const listening = !document.hidden && window.voz?.reproduciendo;
    const end = listening ? now : Math.min(now, lastInput + idleLimit);
    // No reconstruimos tiempo tras una suspensión del sistema o un cambio del reloj.
    if ((foreground || listening) && !suspended && end > start && now - start <= maxSampleGap) {
      const record = recordFor(session);
      // Dos ventanas de la misma cuenta comparten intervalo y contador. Una muestra
      // solapada solo puede ampliar el extremo que la otra ventana ya registró.
      const covered = record.until > now + maxSampleGap ? 0 : record.until;
      const delta = end - Math.max(covered, start);
      if (delta > 0) {
        write(session.key, { ...record, ms: record.ms + delta, until: end });
        notify();
      }
    }
  }

  function establishFocus() {
    if (!session) return;
    sample();
    foreground = !document.hidden && document.hasFocus();
    if (foreground) lastInput = Date.now();
  }

  function leaveForeground() {
    if (!session) return;
    sample();
    foreground = false;
    void sincronizar();
  }

  function activity() {
    if (!session || suspended || document.hidden || !document.hasFocus()) return;
    const now = Date.now();
    if (!foreground || now - lastInput >= 1000) {
      sample();
      foreground = true;
      lastInput = now;
    }
  }

  async function sendSnapshot(s) {
    const snapshot = recordFor(s);
    const seconds = secondsOf(snapshot);
    const previous = confirmedFor(s, snapshot);
    if (s.checked && seconds <= previous.recordSeconds) return;
    try {
      const result = await s.send({ activityId: snapshot.id, seconds });
      if (!validNumber(result.activeSeconds) || !validNumber(result.recordSeconds) ||
          result.recordSeconds < seconds || result.activeSeconds < result.recordSeconds) return;
      const current = recordFor(s);
      if (current.id !== snapshot.id) return;
      const ack = confirmedFor(s, current);
      if (secondsOf(current) < result.recordSeconds)
        write(s.key, { ...current, ms: 1000 * result.recordSeconds });
      write(s.ackKey, { id: current.id, recordSeconds: Math.max(ack.recordSeconds, result.recordSeconds),
        activeSeconds: Math.max(ack.activeSeconds, result.activeSeconds) });
      s.checked = true;
      if (s === session) { s.total = Math.max(s.total, result.activeSeconds); notify(); }
    } catch { /* La siguiente conexión reenvía el mismo contador acumulativo. */ }
  }

  function sincronizar() {
    const s = session;
    if (!s?.send) return;
    const seconds = secondsOf(recordFor(s));
    if (s.pending && s.sending < seconds)
      return s.pending.then(() => { if (session === s) return sincronizar(); });
    if (!s.pending) {
      s.sending = seconds;
      s.pending = sendSnapshot(s).finally(() => { s.pending = null; });
    }
    return s.pending;
  }

  function cerrar() {
    if (!session) return;
    sample();
    session = undefined;
    foreground = false;
    notify();
  }

  function begin(key, total, send) {
    cerrar();
    session = { key: prefix + "registro." + key, ackKey: prefix + "confirmado." + key, total, send, checked: false, pending: null };
    checkpoint = lastInput = Date.now();
    foreground = !document.hidden && document.hasFocus();
    suspended = false;
    session.atOpen = secondsOf(recordFor(session));
    notify();
    void sincronizar();
  }

  function suspender() {
    sample();
    suspended = true;
  }

  function reanudar() {
    if (!session) return;
    suspended = false;
    checkpoint = Date.now();
    establishFocus();
  }

  for (const name of ["pointerdown", "pointermove", "touchstart", "keydown", "scroll", "input"]) {
    document.addEventListener(name, activity, { capture: true, passive: true });
  }
  window.addEventListener("focus", establishFocus);
  window.addEventListener("blur", leaveForeground);
  window.addEventListener("pagehide", leaveForeground);
  window.addEventListener("pageshow", establishFocus);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) leaveForeground();
    else establishFocus();
  });
  window.addEventListener("online", sincronizar);
  window.addEventListener("storage", (event) => {
    if (session && (event.key === session.key || event.key === session.ackKey)) notify();
  });
  setInterval(() => {
    if (document.hidden || !document.hasFocus()) foreground = false;
    sample();
  }, 1000);
  setInterval(sincronizar, uploadInterval);
  window.tiempo = Object.freeze({
    segundos, cerrar, suspender, reanudar, sincronizar,
    iniciarLocal() { begin("local." + location.pathname, 0, null); },
    iniciarCuenta(user, total, send) { begin("cuenta." + user, validNumber(total) ? total : 0, send); },
  });
})();
