/* Las revisiones corresponden a cada pregunta de una cuenta. Una pestaña conserva
   solo sus cambios pendientes entre recargas, hasta que la API confirma el guardado. */
(() => {
  "use strict";
  if (location.protocol === "file:") return;
  const get = (selector) => document.querySelector(selector);
  const clean = (value) => ({
    mode: value.mode, text: value.text || "", choice: value.choice || ""
  });
  const sameDraft = (a, b) => a.mode === b.mode && a.text === b.text && a.choice === b.choice;
  const tabKey = (user) => "mba.pendientes.v1." + user;
  const state = { user: "", ready: false, revisions: new Map(), pending: new Map(), last: null };
  let hooks, run, delay, lastError = "", conflict, closing = false, epoch = 0;
  let activation = new URLSearchParams(location.hash.slice(1)).get("activar") || "";
  if (activation) history.replaceState(null, "", location.pathname + location.search);
  let channel;
  try { channel = new BroadcastChannel("mba.sesion.v1"); } catch { /* Sin avisos entre pestañas. */ }

  async function api(path, method = "GET", data, owner = "") {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const headers = { Accept: "application/json" };
    if (data !== undefined) headers["Content-Type"] = "application/json";
    if (owner) headers["X-MBA-User"] = owner;
    try {
      const response = await fetch("/api/" + path, {
        method, headers, credentials: "same-origin", mode: "same-origin", cache: "no-store",
        redirect: "error", signal: controller.signal,
        body: data === undefined ? undefined : JSON.stringify(data)
      });
      const payload = await response.json();
      if (!response.ok) {
        const error = new Error(payload.error || "request_failed");
        Object.assign(error, { status: response.status, payload });
        throw error;
      }
      return payload;
    } finally { clearTimeout(timer); }
  }
  const dirty = () => state.pending.size > 0 || state.last !== null;
  function journal() {
    if (!state.user) return;
    try {
      if (dirty()) {
        sessionStorage.setItem(tabKey(state.user), JSON.stringify({drafts: Object.fromEntries(state.pending), last: state.last}));
      } else sessionStorage.removeItem(tabKey(state.user));
    } catch { /* beforeunload protege los cambios pendientes que solo están en memoria. */ }
  }
  function restore(user) {
    if (state.user === user) return;
    state.pending.clear(); state.last = null;
    try {
      const saved = JSON.parse(sessionStorage.getItem(tabKey(user)) || "null");
      for (const [id, item] of Object.entries(saved?.drafts || {})) {
        if (hooks.hasQuestion(id) && typeof item.text === "string" &&
          typeof item.choice === "string" && ["eleccion","texto"].includes(item.mode) &&
          Number.isSafeInteger(item.revision) && item.revision >= 0) state.pending.set(id,item);
      }
      if (typeof saved?.last === "string") state.last = saved.last;
    } catch { /* Un almacenamiento de sesión restringido permite trabajar en memoria. */ }
  }
  const resetAlert = () => { const box = get("#save-warning"); box.replaceChildren(); box.hidden = true; };
  function action(box, label, callback) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "quiet"; button.textContent = label;
    button.addEventListener("click", callback); box.append(button);
  }
  function showStatus() {
    if (!state.ready) return;
    const status = get("#account-save"), box = get("#save-warning");
    const message = conflict ? "Hay dos versiones" : lastError ? "Cambios sin guardar" : dirty() ? "Guardando…" : "Guardado en tu cuenta";
    if (status.textContent !== message) status.textContent = message;
    const mobile = get("#mobile-account"); mobile.hidden = false; mobile.textContent = state.user + " · " + message;
    resetAlert();
    if (!conflict && !lastError) return;
    box.hidden = false;
    if (conflict) {
      const {id, remote} = conflict, local = state.pending.get(id);
      const title = document.createElement("strong");
      title.textContent = "Otra sesión modificó la respuesta " + id + "."; box.append(title);
      const compare = (name, draft) => {
        const section = document.createElement("details"), head = document.createElement("summary");
        head.textContent = name; section.append(head);
        const p = document.createElement("p");
        p.textContent = "Modalidad: " + (draft.mode === "texto" ? "texto" : "elección") +
          "\nSelección: " + (draft.choice || "Sin seleccionar") +
          "\nTexto: " + (draft.text || "Sin escribir"); section.append(p); box.append(section);
      };
      compare("Tu borrador", local); compare("Versión guardada", remote);
      action(box, "Guardar mi versión", () => {
        const local = state.pending.get(id); local.revision = remote.revision;
        conflict = null; journal(); schedule(0);
      });
      action(box, "Usar la versión guardada", () => {
        state.pending.delete(id); state.revisions.set(id, remote.revision);
        conflict = null; hooks.replace(id, remote); journal(); schedule(0);
      });
    } else {
      const p = document.createElement("p"); p.textContent = lastError; box.append(p);
      action(box, "Reintentar guardado", () => { lastError = ""; schedule(0); });
    }
  }
  function gate(message = "") {
    get("#figure-dialog").close();
    document.body.classList.remove("nav-open");
    document.body.classList.add("account-locked");
    get("#auth-screen").hidden = false;
    get("#account-tools").hidden = true; get("#mobile-account").hidden = true;
    get("#auth-status").textContent = message;
    get("#auth-form").hidden = false;
    get("#auth-retry").hidden = true;
    const sameAccount = !!(state.user && dirty());
    const username = get("#auth-name");
    username.readOnly = sameAccount;
    if (sameAccount) username.value = state.user;
    get("#auth-initial").hidden = !activation;
    get("#auth-new").required = !!activation;
    get("#auth-token").required = !!activation;
    if (activation) get("#auth-token").value = activation;
    resetAlert();
  }
  function lock(message) {
    ++epoch;
    clearTimeout(delay); state.ready = false; closing = false;
    get(".shell").inert = false; get("#sidebar").inert = false;
    journal(); hooks.clear(); gate(message);
    if (state.user && dirty()) {
      get("#auth-status").textContent += " Vuelve a entrar con tu cuenta para guardar los cambios pendientes.";
    }
  }
  function schedule(ms = 350) {
    clearTimeout(delay); showStatus();
    if (state.ready && !conflict && !lastError)
      delay = setTimeout(flush, ms);
  }
  async function drain() {
    const generation = epoch, user = state.user;
    while (state.ready && generation === epoch && dirty() && !conflict && !lastError) {
      const entry = state.pending.entries().next().value;
      try {
        if (entry) {
          const [id, item] = entry;
          const result = await api("drafts/" + encodeURIComponent(id), "PUT", item, user);
          if (generation !== epoch) return;
          state.revisions.set(id,result.revision);
          const current = state.pending.get(id);
          if (current === item) state.pending.delete(id);
          else if (current) current.revision = result.revision;
        } else {
          const last = state.last;
          await api("last", "PUT", {lastId:last}, user);
          if (generation !== epoch) return;
          if (state.last === last) state.last = null;
        }
        journal();
      } catch (error) {
        if (generation !== epoch) return;
        if (error.status === 401) { lock("La sesión ha terminado."); return; }
        if (error.status === 409 && entry && error.payload?.draft) {
          const [id] = entry, remote = error.payload.draft, current = state.pending.get(id);
          state.revisions.set(id, remote.revision);
          if (sameDraft(current,remote)) state.pending.delete(id);
          else if (sameDraft(entry[1], remote)) current.revision = remote.revision;
          else conflict = {id,remote};
          journal();
        } else {
          lastError = error.status === 422 || error.status === 400
            ? "No se pudo guardar la respuesta. Revisa su contenido y reintenta."
            : "No se ha podido guardar en el servidor. Esta pestaña conserva tus cambios.";
        }
      }
    }
  }
  function flush() {
    clearTimeout(delay);
    if (!run) run = drain().finally(() => { run = null; showStatus(); if (state.ready && dirty() && !conflict && !lastError) schedule(0); });
    return run;
  }
  function save(id, draft) {
    if (!state.ready) return;
    state.pending.set(id, {...clean(draft),revision:state.pending.get(id)?.revision ?? state.revisions.get(id) ?? 0});
    journal(); schedule();
  }
  function remember(id) {
    if (!state.ready) return;
    state.last = id; journal(); schedule();
  }
  async function open(user) {
    if (state.user && dirty() && state.user !== user) {
      lock("Hay cambios pendientes en otra cuenta de esta pestaña."); return;
    }
    const generation = ++epoch;
    const remote = await api("state", "GET", undefined, user);
    if (generation !== epoch) return;
    restore(user); state.user = user;
    state.revisions.clear(); conflict = null; lastError = "";
    const merged = {...remote.drafts};
    for (const [id,d] of Object.entries(remote.drafts)) state.revisions.set(id,d.revision);
    for (const [id,d] of state.pending) {
      if (remote.drafts[id] && sameDraft(d,remote.drafts[id])) state.pending.delete(id);
      else merged[id] = d;
    }
    if (remote.lastId === state.last) state.last = null;
    get("#auth-form").reset(); get("#auth-token").value = ""; activation = "";
    document.body.classList.remove("account-locked");
    get("#auth-screen").hidden = true; get("#account-tools").hidden = false;
    get("#account-user").textContent = user; get("#account-save").textContent = "";
    state.ready = true; journal(); hooks.load(merged,state.last ?? remote.lastId ?? "");
    schedule(0);
  }
  async function check() {
    gate("Comprobando sesión…"); get("#auth-form").hidden = true;
    try {
      const {user} = await api("session");
      if (user && (!dirty() || !state.user || state.user === user)) await open(user);
      else gate(state.user && dirty() ? "Vuelve a entrar para recuperar tus cambios." : "");
    } catch(error) {
      if(error.status===401){gate();return;}
      gate("No se ha podido conectar con el servidor."); get("#auth-form").hidden = true; get("#auth-retry").hidden = false;
    }
  }
  async function login(e) {
    e.preventDefault();
    const form = e.currentTarget, username = get("#auth-name").value.trim();
    const body = {username,password:get("#auth-pass").value};
    if (!get("#auth-initial").hidden) {
      body.bootstrapToken = get("#auth-token").value.trim(); body.newPassword = get("#auth-new").value;
    }
    get("#auth-submit").disabled = true;
    get("#auth-status").textContent = "Abriendo tu cuaderno…";
    try {
      const {user} = await api("login","POST",body);
      channel?.postMessage("session");
      activation = ""; form.reset(); get("#auth-token").value = "";
      try { await open(user); }
      catch (error) {
        gate("Has iniciado sesión. Vuelve a conectar para cargar tus respuestas.");
        get("#auth-form").hidden = true; get("#auth-retry").hidden = false;
      }
    } catch(error) {
      if(error.message==="activation_required") {
        get("#auth-initial").hidden = false;
        get("#auth-token").required = true; get("#auth-new").required = true;
        get("#auth-status").textContent = "Para el primer acceso, introduce el código de activación y elige tu contraseña.";
      } else {
        get("#auth-status").textContent = error.status===429 ? "Demasiados intentos. Espera unos minutos antes de volver a entrar." :
          error.message==="weak_password" ? "Escribe una contraseña nueva de al menos 12 caracteres." :
          error.status===401 ? "Usuario o contraseña incorrectos." : "No se ha podido abrir el cuaderno. Vuelve a intentarlo.";
      }
    } finally {get("#auth-submit").disabled = false;}
  }
  async function logout() {
    if(closing || !state.ready)return;
    closing = true;get(".shell").inert=true;get("#sidebar").inert=true;
    try {
      await flush();
      if(!state.ready || dirty())return;
      await api("logout","POST",{},state.user);
      journal(); state.user=""; channel?.postMessage("session");
      lock("Sesión cerrada.");get("#auth-form").reset();get("#auth-name").focus();
    } catch(error) {
      if(error.status===401)lock("La sesión ha terminado.");
      else {
        lastError="No se pudo cerrar la sesión. Comprueba la conexión y vuelve a pulsar Salir.";
        showStatus();
      }
    } finally {closing=false;get(".shell").inert=false;get("#sidebar").inert=false;}
  }
  async function verifySession() {
    if(!state.ready || closing)return;
    const generation=epoch;
    try {
      const {user}=await api("session");
      if(generation===epoch && state.ready && user!==state.user)lock("Inicia sesión para abrir tu cuaderno.");
    }catch{ /* Un fallo de red no elimina el borrador. */ }
  }
  function start(callbacks) {
    hooks=callbacks;
    get("#auth-form").addEventListener("submit",login);
    get("#auth-retry").addEventListener("click",check);
    get("#account-logout").addEventListener("click",logout);
    channel?.addEventListener("message",verifySession);
    window.addEventListener("focus",verifySession);
    window.addEventListener("pageshow",e=>{if(e.persisted)verifySession();});
    document.addEventListener("visibilitychange",()=>{
      if(document.hidden && state.ready && dirty() && !lastError && !conflict)flush();
      else if(!document.hidden)verifySession();
    });
    window.addEventListener("online",()=>{if(state.ready && lastError){lastError="";schedule(0);}});
    window.addEventListener("beforeunload",e=>{if(dirty()){e.preventDefault();e.returnValue="";}});
    check();
  }
  window.nube = {get ready(){return state.ready;}, start,save,remember};
})();
