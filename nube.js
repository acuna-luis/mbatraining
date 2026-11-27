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
  let hooks, run, delay, lastError = "", logoutError = "", conflict, warningKey, closing = false, epoch = 0;
  function activationFromLink() {
    const token = new URLSearchParams(location.hash.slice(1)).get("activar") || "";
    if (token) history.replaceState(null, "", location.pathname + location.search);
    return token;
  }
  let activation = activationFromLink();
  let activating = Boolean(activation);
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
        // Firefox necesita esta política para enviar Origin en escrituras a la API.
        referrerPolicy: "same-origin",
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
  function resetAlert() {
    warningKey = null;
    const box = get("#save-warning");
    if (!box.hidden) { box.replaceChildren(); box.hidden = true; }
  }
  function action(box, label, callback) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "quiet"; button.textContent = label;
    button.addEventListener("click", callback); box.append(button);
  }
  function showStatus() {
    if (!state.ready) return;
    const status = get("#account-save"), box = get("#save-warning");
    const pending = dirty(), statusKey = conflict ? "conflict" : lastError ? "error" : pending ? "pending" : "saved";
    const message = conflict ? "Hay dos versiones" : lastError ? "Cambios sin guardar" : pending ? "Guardando…" : "Guardado en tu cuenta";
    if (status.textContent !== message) status.textContent = message;
    status.dataset.state = statusKey;
    const mobile = get("#mobile-account");
    mobile.hidden = false;
    if (mobile.dataset.state !== statusKey || mobile.title !== state.user + " · " + message) {
      mobile.dataset.state = statusKey;
      mobile.title = state.user + " · " + message;
      const label = { saved: "Guardado", pending: "Guardando…", error: "Pendiente", conflict: "Dos versiones" }[statusKey];
      if (conflict || lastError) {
        const review = document.createElement("button");
        review.type = "button";
        review.textContent = label;
        review.setAttribute("aria-label", message + ". Revisar guardado");
        review.addEventListener("click", () => {
          box.scrollIntoView({block: "start"});
          box.querySelector("summary, button")?.focus({preventScroll: true});
        });
        mobile.replaceChildren(review);
      } else mobile.textContent = label;
    }
    const key = conflict || lastError || logoutError;
    if (!key) { resetAlert(); return; }
    if (key === warningKey) {
      if (conflict) box.querySelector("[data-local-draft]").textContent = describeDraft(state.pending.get(conflict.id));
      return;
    }
    box.replaceChildren();
    warningKey = key;
    box.hidden = false;
    if (conflict) {
      const {id, remote} = conflict, local = state.pending.get(id);
      const title = document.createElement("strong");
      title.textContent = "Otra sesión modificó la respuesta " + id + "."; box.append(title);
      const compare = (name, draft, isLocal) => {
        const section = document.createElement("details"), head = document.createElement("summary");
        head.textContent = name; section.append(head);
        const p = document.createElement("p");
        if (isLocal) p.dataset.localDraft = "";
        p.textContent = describeDraft(draft); section.append(p); box.append(section);
      };
      compare("Tu borrador", local, true); compare("Versión guardada", remote);
      action(box, "Guardar mi versión", () => {
        const local = state.pending.get(id); local.revision = remote.revision;
        conflict = null; journal(); schedule(0);
      });
      action(box, "Usar la versión guardada", () => {
        state.pending.delete(id); state.revisions.set(id, remote.revision);
        conflict = null; hooks.replace(id, remote); journal(); schedule(0);
      });
    } else {
      const p = document.createElement("p"); p.textContent = lastError || logoutError; box.append(p);
      if (lastError) action(box, "Reintentar guardado", () => { lastError = ""; schedule(0); });
      else action(box, "Reintentar salida", logout);
    }
  }
  function describeDraft(draft) {
    return "Modalidad: " + (draft.mode === "texto" ? "texto" : "elección") +
      "\nSelección: " + (draft.choice || "Sin seleccionar") +
      "\nTexto: " + (draft.text || "Sin escribir");
  }
  function authMode(enabled) {
    activating = enabled;
    const initial = get("#auth-initial");
    initial.hidden = initial.disabled = !enabled;
    get("#auth-code-field").hidden = Boolean(activation);
    get("#auth-token").required = enabled && !activation;
    get("#auth-new").required = enabled;
    get("#auth-title").textContent = enabled ? "Activar cuenta" : "Iniciar sesión";
    document.title = get("#auth-title").textContent + " · MBA Training";
    get("#auth-intro").textContent = enabled
      ? "Entra con tus datos provisionales y elige la contraseña de tu cuaderno."
      : "Entra en tu cuaderno para continuar donde lo dejaste.";
    get("#auth-pass-label").textContent = enabled ? "Contraseña provisional" : "Contraseña";
    get("#auth-submit").textContent = enabled ? "Activar y entrar" : "Entrar al cuaderno";
    get("#auth-mode").textContent = enabled ? "Volver a iniciar sesión" : "Activar mi cuenta";
  }
  function passwordVisibility(button, visible) {
    const input = document.getElementById(button.dataset.password);
    input.type = visible ? "text" : "password";
    const verb = visible ? "Ocultar" : "Mostrar";
    button.textContent = verb;
    button.setAttribute("aria-label", verb + (input.id === "auth-new" ? " nueva contraseña" : " contraseña"));
  }
  function clearFields() {
    get("#auth-form").reset();
    for (const button of document.querySelectorAll("[data-password]")) passwordVisibility(button, false);
    for (const field of document.querySelectorAll("#auth-form [aria-invalid]")) field.removeAttribute("aria-invalid");
  }
  function gate(message = "", stage = "form") {
    get("#figure-dialog").close();
    document.body.classList.remove("nav-open");
    document.body.classList.add("account-locked");
    get("#auth-screen").hidden = false;
    get("#account-tools").hidden = true; get("#mobile-account").hidden = true;
    get("#auth-status").textContent = message;
    get("#auth-form").hidden = stage !== "form";
    get("#auth-mode").hidden = stage !== "form";
    get("#auth-retry").hidden = stage !== "retry";
    const sameAccount = !!(state.user && dirty());
    const username = get("#auth-name");
    username.readOnly = sameAccount;
    if (sameAccount) username.value = state.user;
    if (sameAccount) get("#auth-mode").hidden = true;
    authMode(activating);
    if (stage !== "form") {
      get("#auth-title").textContent = stage === "retry" ? "Conecta con el aula" : "Abriendo el aula";
      get("#auth-intro").textContent = "";
      document.title = get("#auth-title").textContent + " · MBA Training";
    }
    resetAlert();
  }
  function lock(message) {
    ++epoch;
    clearTimeout(delay); state.ready = false; closing = false;
    logoutError = "";
    clearFields(); journal(); hooks.clear(); gate(message);
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
    state.revisions.clear(); conflict = null; lastError = ""; logoutError = "";
    const merged = {...remote.drafts};
    for (const [id,d] of Object.entries(remote.drafts)) state.revisions.set(id,d.revision);
    for (const [id,d] of state.pending) {
      if (remote.drafts[id] && sameDraft(d,remote.drafts[id])) state.pending.delete(id);
      else merged[id] = d;
    }
    if (remote.lastId === state.last) state.last = null;
    clearFields(); activation = ""; activating = false;
    document.body.classList.remove("account-locked");
    get("#auth-screen").hidden = true; get("#account-tools").hidden = false;
    get("#account-user").textContent = user; get("#account-save").textContent = "";
    state.ready = true; journal(); hooks.load(merged,state.last ?? remote.lastId ?? "");
    schedule(0);
  }
  async function check() {
    gate("Comprobando tu sesión…", "loading");
    try {
      const {user} = await api("session");
      if (user && !activation && (!dirty() || !state.user || state.user === user)) await open(user);
      else gate(state.user && dirty() ? "Vuelve a entrar para recuperar tus cambios." : "");
    } catch(error) {
      if(error.status===401){gate();return;}
      gate("Comprueba tu conexión y vuelve a intentarlo.", "retry");
    }
  }
  async function login(e) {
    e.preventDefault();
    const form = e.currentTarget, username = get("#auth-name").value.trim();
    if (get("#auth-submit").disabled) return;
    const body = {username,password:get("#auth-pass").value};
    if (activating) {
      body.bootstrapToken = activation || get("#auth-token").value.trim();
      body.newPassword = get("#auth-new").value;
      if (body.newPassword === body.password) {
        authError("Elige una contraseña distinta de la provisional.", "#auth-new");
        return;
      }
    }
    get("#auth-submit").disabled = get("#auth-mode").disabled = true;
    form.setAttribute("aria-busy", "true");
    get("#auth-status").textContent = "Abriendo tu cuaderno…";
    try {
      const {user} = await api("login","POST",body);
      channel?.postMessage("session");
      activation = ""; activating = false; clearFields();
      try {
        await open(user);
        if (state.ready) get("#main").focus({ preventScroll: true });
      }
      catch (error) {
        gate("Has iniciado sesión. Vuelve a conectar para cargar tus respuestas.", "retry");
      }
    } catch(error) {
      if(error.message==="activation_required") {
        const triedCode = activating;
        activation = ""; authMode(true);
        if (triedCode) authError("Revisa el código de activación que recibiste.", "#auth-token");
        else {
          get("#auth-status").textContent = "Para el primer acceso necesitas tu código de activación.";
          get("#auth-token").focus();
        }
      } else {
        if (error.message === "weak_password") authError("Elige una contraseña de al menos 12 caracteres, distinta de la provisional.", "#auth-new");
        else if (error.status === 401) authError("Revisa el usuario y la contraseña.", "#auth-pass");
        else get("#auth-status").textContent = error.status === 429
          ? "Demasiados intentos. Espera unos minutos antes de volver a entrar."
          : "Comprueba tu conexión y vuelve a entrar.";
      }
    } finally {
      get("#auth-submit").disabled = get("#auth-mode").disabled = false;
      form.removeAttribute("aria-busy");
    }
  }
  function authError(message, selector) {
    get("#auth-status").textContent = message;
    const field = get(selector);
    field.setAttribute("aria-invalid", "true");
    field.setAttribute("aria-errormessage", "auth-status");
    field.focus();
  }
  async function logout() {
    if(closing || !state.ready)return;
    hooks.closeNav?.();
    const shell = get(".shell"), sidebar = get("#sidebar");
    const shellWasInert = shell.inert, sidebarWasInert = sidebar.inert;
    closing = true; logoutError = ""; shell.inert = sidebar.inert = true;
    try {
      await flush();
      if(!state.ready || dirty())return;
      await api("logout","POST",{},state.user);
      journal(); state.user=""; channel?.postMessage("session");
      lock("Sesión cerrada.");
      get("#auth-title").focus();
    } catch(error) {
      if(error.status===401)lock("La sesión ha terminado.");
      else {
        logoutError="No se pudo cerrar la sesión. Comprueba tu conexión y vuelve a intentarlo.";
        showStatus();
      }
    } finally {
      closing = false; shell.inert = shellWasInert; sidebar.inert = sidebarWasInert;
      const warning = get("#save-warning");
      if (state.ready && !warning.hidden) warning.querySelector("button")?.focus();
    }
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
    get("#auth-form").addEventListener("input", (event) => {
      if (event.target.hasAttribute("aria-invalid")) event.target.removeAttribute("aria-invalid");
    });
    for (const button of document.querySelectorAll("[data-password]")) {
      button.addEventListener("click", () => {
        passwordVisibility(button, document.getElementById(button.dataset.password).type === "password");
      });
    }
    get("#auth-mode").addEventListener("click", () => {
      activation = "";
      get("#auth-token").value = get("#auth-new").value = "";
      get("#auth-status").textContent = "";
      authMode(!activating);
      get("#auth-title").focus();
    });
    get("#auth-retry").addEventListener("click",check);
    get("#account-logout").addEventListener("click",logout);
    window.addEventListener("hashchange", () => {
      const token = activationFromLink();
      if (!token) return;
      activation = token;
      activating = true;
      if (state.ready) lock("Introduce los datos de la cuenta que vas a activar.");
      else gate();
    });
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
