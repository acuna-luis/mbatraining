(() => {
  "use strict";
  const modules = window.CURSO;
  const main = document.getElementById("main");
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (ch) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[ch],
    );
  const formulas = new Map(window.FORMULAS);
  const alternatives = [...formulas.keys()]
    .sort((a, b) => b.length - a.length)
    .map(source => source.replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&"));
  const formulaPattern = alternatives.length && new RegExp(
    "(^|[^\\p{L}\\p{M}\\p{N}_])(" + alternatives.join("|") + ")(?![\\p{L}\\p{M}\\p{N}_])", "gu"
  );
  const renderedFormulas = new Map();
  function* formulaMatches(text) {
    if (!formulaPattern) return;
    for (const match of text.matchAll(formulaPattern)) {
      const source = match[2], start = match.index + match[1].length, end = start + source.length;
      // Una coincidencia parcial dentro de un decimal o un millar cambiaría el valor mostrado.
      if ((/^\d/.test(source) && /\d[.,]$/.test(text.slice(Math.max(0, start - 2), start))) ||
          (/\d$/.test(source) && /^[.,]\d/.test(text.slice(end, end + 2)))) continue;
      yield { source, start, end };
    }
  }
  function formulaHtml(source) {
    if (!renderedFormulas.has(source)) {
      try {
        const tex = formulas.get(source);
        const equation = window.katex.renderToString(tex.includes("\\frac") ? "\\displaystyle " + tex : tex, {
          output: "htmlAndMathml", trust: false, strict: "ignore",
        });
        renderedFormulas.set(source, '<span class="formula" data-formula="' + esc(source) + '">' + equation + '</span>');
      } catch {
        renderedFormulas.set(source, esc(source));
      }
    }
    return renderedFormulas.get(source);
  }
  function mathText(text, includeVariables = true) {
    text = String(text ?? "");
    if (!window.katex) return esc(text);
    let html = "", cursor = 0;
    for (const { source, start, end } of formulaMatches(text)) {
      if (!includeVariables && /^\p{L}+$/u.test(source)) continue;
      html += esc(text.slice(cursor, start)) + '<span class="math-run">' + formulaHtml(source);
      cursor = end;
      // La puntuación permanece en la última línea de las fórmulas que se parten en móvil.
      const punctuation = text.slice(end).match(/^[.,;:!?…)\]]+/);
      if (punctuation) {
        html += esc(punctuation[0]);
        cursor += punctuation[0].length;
      }
      html += "</span>";
    }
    return html + esc(text.slice(cursor));
  }
  const fold = (s) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const wordCount = (s) => (s.trim().match(/\S+/gu) || []).length;
  const paths = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    sheet: '<path d="M6 3h9l4 4v14H6z M14 3v5h5 M9 12h7 M9 16h5"/>',
    book: '<path d="M3 5c3-1 6 0 9 2 3-2 6-3 9-2v14c-3-1-6 0-9 2-3-2-6-3-9-2z M12 7v14"/>',
    save: '<path d="M3 5h15l3 3v13H3z M7 5v6h9V5 M7 21v-7h10v7"/>',
    close: '<path d="m6 6 12 12 M18 6 6 18"/>',
    user: '<circle cx="12" cy="8" r="3.4"/><path d="M5 20v-2a7 7 0 0 1 14 0v2"/>',
    logout: '<path d="M10 4H4v16h6 M9 12h12 m-5-5 5 5-5 5"/>',
    search: '<circle cx="10" cy="10" r="6.5"/><path d="m15 15 5 5"/>',
    trend: '<path d="M3 19h18 M5 15l5-5 4 3 6-8 M16 5h4v4"/>',
    layers: '<path d="m3 8 9-5 9 5-9 5z M3 12l9 5 9-5 M3 16l9 5 9-5"/>',
    users:
      '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2 M16 5a3 3 0 1 1 0 6 M17 14a5 5 0 0 1 4 5"/>',
    scales:
      '<path d="M12 3v17 M5 21h14 M3 7l18-2 M5 7l-3 7h6z M18 6l-3 7h6z"/>',
    bars: '<path d="M3 20h18 M6 17v-5 M12 17V7 M18 17V3"/>',
    bank: '<path d="m2 9 10-6 10 6z M3 21h18 M6 11v7 M10 11v7 M14 11v7 M18 11v7"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    cycle:
      '<path d="M20 9a8 8 0 0 0-14-3L3 9 M3 4v5h5 M4 15a8 8 0 0 0 14 3l3-3 M21 20v-5h-5"/>',
    target:
      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    download: '<path d="M12 3v12 M7 10l5 5 5-5 M4 15v5h16v-5"/>',
    check: '<path d="m4 12 5 5L20 6"/>',
    edit: '<path d="m5 16-1 5 5-1L20 9l-4-4z M13 8l4 4"/>',
    tag: '<path d="M4 3h8l9 9-9 9-9-9z"/><circle cx="8" cy="8" r="1"/>',
  };
  const icon = (key) =>
    '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">' +
    (paths[key] || paths.book) +
    "</svg>";
  const moduleIcons = [
    "bank",
    "users",
    "trend",
    "tag",
    "bars",
    "globe",
    "cycle",
    "layers",
    "scales",
    "bank",
    "bars",
  ];
  const link = (item) => "#apartado/" + encodeURIComponent(item.id);
  const modLink = (n) => "#modulo/" + n;
  const items = new Map(),
    questions = new Map();
  const finals = [...window.FINALES, ...window.FINALES_CUALITATIVOS];
  for (const m of modules) {
    for (const q of finals.filter((q) => q.module === m.number)) {
      m.items.push({ id: q.id, title: q.title || caseType(q), questions: [q], isFinal: true });
    }
    m.questions = [];
    for (const a of m.items) {
      items.set(a.id, { a, m });
      if (a.questions) {
        for (const q of a.questions) {
          questions.set(q.id, q);
          m.questions.push(q);
        }
      }
    }
  }
  const cloud = window.nube;
  if (location.protocol !== "file:" && !cloud) {
    document.body.classList.add("account-locked");
    $("#auth-screen").hidden = false;
    $("#auth-form").hidden = true;
    $("#auth-status").textContent =
      "No se pudo cargar el acceso a tu cuenta. Recarga la página para volver a intentarlo.";
    return;
  }
  const prefix = "mba.economia.cv0303.v1.";
  const drafts = new Map();
  let pendingMarkup;
  const renderedPending = new WeakMap();
  const pendingModuleStates = new Map();
  let lastId = "",
    showPending = false,
    includeModels = true,
    query = "";
  const storageError = () => {
    const warning = $("#save-warning");
    warning.hidden = false;
    warning.textContent =
      "El navegador no ha podido guardar los últimos cambios. Puedes seguir trabajando y descargar tus respuestas antes de cerrar la página.";
    $(".side-foot small").textContent = "Descarga antes de cerrar";
  };
  function normalized(q, obj) {
    return {
      mode:
        q.type === "desarrollo" || (q.type === "comprension" && obj?.mode === "texto") ? "texto" : "eleccion",
      text: typeof obj?.text === "string" ? obj.text : "",
      choice: q.options?.includes(obj?.choice) ? obj.choice : "",
    };
  }
  if (!cloud) try {
    localStorage.setItem(prefix + "test", "1");
    localStorage.removeItem(prefix + "test");
    lastId = localStorage.getItem(prefix + "ultimo") || "";
    for (const q of questions.values()) {
      const raw = localStorage.getItem(prefix + "r." + q.id);
      if (raw) {
        try {
          drafts.set(q.id, normalized(q, JSON.parse(raw)));
        } catch {
          storageError();
        }
      }
    }
  } catch {
    storageError();
  }
  function draft(q) {
    return drafts.get(q.id) || normalized(q);
  }
  function response(q) {
    const d = draft(q);
    return (d.mode === "texto" ? d.text : d.choice).trim();
  }
  const done = (list) => list.reduce((n, q) => n + Boolean(response(q)), 0);
  const answered = () => done([...questions.values()]);
  function reference(q) {
    return q.type === "final" ? q.options[q.correctIndex] : window.REFERENCIAS[q.id];
  }
  function choiceGrade(q) {
    const d = draft(q);
    if (!q.options || d.mode !== "eleccion" || !d.choice) return null;
    return d.choice === reference(q);
  }
  function scoreSummary() {
    let aciertos = 0, errores = 0, escritas = 0, maximo_curso = 0;
    for (const q of questions.values()) {
      if (q.options) maximo_curso++;
      const grade = choiceGrade(q);
      if (grade === true) aciertos++;
      else if (grade === false) errores++;
      else if (response(q)) escritas++;
    }
    const evaluadas = aciertos + errores;
    return { aciertos, errores, evaluadas, maximo_curso, escritas,
      porcentaje: evaluadas ? Math.round(100 * aciertos / evaluadas) : null };
  }
  const progressPercent = new Intl.NumberFormat("es-ES", {style: "percent", maximumFractionDigits: 1});
  const minutesPerQuestion = { comprension: 1, desarrollo: 5, final: 3 };
  function duration(seconds) {
    if (seconds < 60) return seconds + " s";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + " min";
    const hours = Math.floor(minutes / 60), rest = minutes % 60;
    return hours + " h" + (rest ? " " + rest + " min" : "");
  }
  function updateStudyTime() {
    const el = $("#stat-active-time");
    const value = duration(window.tiempo?.segundos() || 0);
    if (el.textContent !== value) el.textContent = value;
  }
  let sidebarModule;
  function updateSidebarStats() {
    if (!sidebarModule) return;
    const moduleCount = done(sidebarModule.questions);
    const score = scoreSummary();
    const totalCount = score.evaluadas + score.escritas;
    $("#pending-nav-counts").textContent = score.errores + (score.errores === 1 ? " incorrecta" : " incorrectas") +
      " · " + (questions.size - totalCount) + " sin contestar";
    if ($("#pending-sidebar-details").open) renderPendingList($("#pending-sidebar-list"));
    const fillProgress = (name, count, total) => {
      const el = $("#stat-" + name + "-progress");
      el.textContent = progressPercent.format(count / total);
      el.title = count + " de " + total + " preguntas respondidas";
      $("#stat-" + name + "-meter").value = 100 * count / total;
    };
    $("#stat-module-label").textContent = "Módulo " + sidebarModule.number;
    $("#stat-module-label").title = sidebarModule.title;
    fillProgress("module", moduleCount, sidebarModule.questions.length);
    fillProgress("course", totalCount, questions.size);
    const accuracy = $("#stat-accuracy");
    accuracy.textContent = score.evaluadas ? score.porcentaje + " %" : "Sin evaluar";
    accuracy.title = score.evaluadas ? score.aciertos + " de " + score.evaluadas + " elecciones correctas"
      : "Responde una pregunta de elección para ver tu porcentaje de aciertos";
    let minutes = 0;
    for (const q of questions.values()) {
      if (!response(q)) minutes += minutesPerQuestion[q.type];
    }
    $("#stat-remaining-time").textContent = minutes ? "≈ " + duration(minutes * 60) : "0 min";
  }
  function scorePanel() {
    const s = scoreSummary();
    return `<section class="panel score-panel" aria-labelledby="score-title">
      <div class="score-heading"><h2 id="score-title">Resultados</h2>
        ${s.evaluadas ? `<span class="accuracy">${s.porcentaje} % de acierto</span>` : ""}</div>
      <dl class="score-breakdown">
        <div><dt>Aciertos</dt><dd>${s.aciertos}</dd></div>
        <div><dt>Errores</dt><dd>${s.errores}</dd></div>
        <div><dt>Escritas</dt><dd>${s.escritas}</dd></div>
      </dl>
      <p class="meta">Cada acierto suma un punto. Llevas ${s.aciertos} de ${s.maximo_curso} puntos posibles.
        Las respuestas escritas se revisan aparte.</p>
    </section>`;
  }
  function save(q, d, updateStats = true) {
    const previous = draft(q);
    drafts.set(q.id, d);
    if (previous.mode !== d.mode || previous.choice !== d.choice ||
        Boolean(previous.text.trim()) !== Boolean(d.text.trim())) {
      pendingMarkup = undefined;
      if (updateStats) updateSidebarStats();
    }
    if (cloud) { cloud.save(q.id, d); return; }
    try {
      localStorage.setItem(prefix + "r." + q.id, JSON.stringify(d));
    } catch {
      storageError();
    }
  }
  function remember(id) {
    if (id === lastId) return;
    lastId = id;
    if (cloud) { cloud.remember(id); return; }
    try {
      localStorage.setItem(prefix + "ultimo", id);
    } catch {
      storageError();
    }
  }
  const meter = (value, max) =>
    '<div class="meter" aria-hidden="true"><b style="width:' +
    (100 * value) / max +
    '%"></b></div>';
  function crumb(parts) {
    $("#crumb").innerHTML =
      '<a class="homecrumb" href="#inicio">Mi aula</a><span class="sep" aria-hidden="true">/</span>' +
      parts;
  }
  function nav(current = "", mod = 0) {
    const pendingLink = $("#pending-nav-link");
    if (current === "pending") pendingLink.setAttribute("aria-current", "page");
    else pendingLink.removeAttribute("aria-current");
    const selectedTab = current === "pending" ? "modules" : current || "modules";
    document.querySelectorAll("[data-tab]").forEach((tab) => {
      if (tab.dataset.tab === selectedTab) {
        tab.setAttribute("aria-current", selectedTab === "modules" ? "location" : "page");
      } else tab.removeAttribute("aria-current");
    });
    const destinations = [
      ["home", "#inicio", "grid", "Vista general"],
      ["answers", "#respuestas", "sheet", "Mis respuestas"],
      ["solutions", "#solucionario", "book", "Solucionario"],
    ];
    const links = destinations.map(([key, url, symbol, title]) =>
      `<a href="${url}" class="nav-main${current === key ? " active" : ""}"
        ${current === key ? 'aria-current="page"' : ""}>${icon(symbol)}${title}</a>`
    );
    const syllabus = modules.map((m) =>
      `<a href="${modLink(m.number)}" class="nav-mod${m.number === mod ? " active" : ""}"
        ${m.number === mod ? 'aria-current="location"' : ""}>
        <span class="num">${String(m.number).padStart(2, "0")}</span><span>${esc(m.title)}</span></a>`
    );
    $("#navigation").innerHTML = links.join("") +
      '<div class="nav-label">Módulos del curso</div>' + syllabus.join("");
  }
  function progressCard(list) {
    const count = done(list);
    return `<section class="progress-card" aria-label="Progreso">
      <span class="icon-tile">${icon("trend")}</span>
      <div class="progress-info"><div class="progress-line"><strong>Tu progreso</strong>
        <span class="meta">${count} de ${list.length} preguntas respondidas</span></div>
        ${meter(count, list.length)}</div>
      <a class="quiet" href="#respuestas">Mis respuestas</a></section>`;
  }
  function card(m) {
    const sections = m.items.filter((a) => a.questions && !a.isFinal).length;
    const finished = done(m.questions);
    const number = String(m.number).padStart(2, "0");
    return `<a class="catalog-card" href="${modLink(m.number)}">
      <span class="catalog-icon">${icon(moduleIcons[m.number - 1])}</span>
      <div class="catalog-card-copy"><span class="catalog-number">Módulo ${number}</span>
        <h3>${esc(m.title)}</h3>
        <p>${sections} apartados · ${m.questions.length} preguntas</p>
        ${finished ? `<div class="catalog-completed">${meter(finished, m.questions.length)}
          <span>${finished} de ${m.questions.length} respondidas</span></div>` : ""}</div>
    </a>`;
  }
  function results() {
    const terms = fold(query.trim()).split(/\s+/).filter(Boolean);
    const out = $("#module-list"), status = $("#catalog-status");
    const clear = $("#clear-search");
    clear.hidden = !query;
    if (!terms.length) {
      status.textContent = "";
      out.className = "catalog-grid";
      out.innerHTML = modules.map(card).join("");
      return;
    }
    const matches = [];
    function match(text) {
      const normalizedText = fold(text);
      return terms.every((term) => normalizedText.includes(term));
    }
    function resultLink(url, context, title, symbol) {
      return `<a class="catalog-result" href="${url}"><span class="result-icon">${icon(symbol)}</span>
        <div><span class="meta">${esc(context)}</span><strong>${mathText(title)}</strong></div></a>`;
    }
    for (const m of modules) {
      if (match("Módulo " + m.number + " " + m.title))
        matches.push(resultLink(modLink(m.number), "Módulo " + m.number, m.title, "layers"));
      for (const a of m.items) {
        const name = itemName(a);
        if (match("Apartado " + a.id + " " + name))
          matches.push(resultLink(link(a), "Módulo " + m.number + " · " + m.title, name, "book"));
      }
    }
    status.textContent = matches.length === 1 ? "1 resultado" : matches.length + " resultados";
    out.className = "catalog-results";
    out.innerHTML = matches.length ? matches.join("") :
      '<p class="catalog-empty">Prueba con otro título o con el número del apartado.</p>';
  }
  function resumeLink(a) {
    if (a.isFinal || !a.questions || !done(a.questions)) return link(a);
    const next = a.questions.findIndex((q) => !response(q));
    return next < 0 ? link(a) : practiceLink(a, next + 1);
  }
  function home() {
    nav("home");
    crumb("Vista general");
    const last = items.get(lastId);
    const first = modules[0].items.find((a) => a.questions);
    const sectionCount = [...items.values()].filter(({a}) => a.questions && !a.isFinal).length;
    main.innerHTML = `<div class="desk-home">
      <section class="course-cover" aria-labelledby="course-title">
        <div class="cover-copy"><p class="cover-code">Curso CV-0303</p>
          <h1 id="course-title">Fundamentos <em>de Economía</em></h1>
          <p class="cover-stats">${modules.length} módulos <span aria-hidden="true">·</span> ${sectionCount} apartados</p>
          <div class="cover-action"><a class="button" href="${resumeLink(last?.a || first)}">${icon("book")}
            ${last ? "Continuar estudio" : "Empezar a estudiar"}</a>
            ${last ? `<span>Módulo ${last.m.number} · ${last.a.isFinal ? caseType(last.a.questions[0]) : "Apartado " + esc(last.a.id)}</span>` : ""}
          </div></div>
        <a class="cover-figure" href="#apartado/4.7" aria-label="Estudiar el equilibrio de mercado en el apartado 4.7">
          <img src="assets/mercado.svg" alt="Curvas de oferta y demanda en equilibrio" width="350" height="198">
          <span class="cover-caption">Equilibrio de mercado <b>4.7</b></span>
          <span class="cover-compact-caption">${icon("trend")} Gráfico 4.7</span>
        </a>
      </section>
      ${progressCard([...questions.values()])}
      <section id="catalogo" class="course-catalog" aria-labelledby="catalog-title">
        <div class="catalog-heading"><h2 id="catalog-title">Módulos del curso</h2>
          <div class="catalog-search">${icon("search")}
            <input type="search" id="find" placeholder="Buscar módulo o apartado"
              aria-label="Buscar módulo o apartado" value="${esc(query)}" autocomplete="off">
            <button type="button" id="clear-search" aria-label="Borrar búsqueda" hidden>×</button>
          </div></div>
        <p id="catalog-status" role="status" aria-live="polite"></p><div id="module-list"></div>
      </section></div>`;
    $("#clear-search").addEventListener("click", () => {
      query = "";
      $("#find").value = "";
      results();
      $("#find").focus();
    });
    results();
  }
  function itemName(a) {
    if (a.isFinal && a.questions[0].title) return caseType(a.questions[0]) + " · " + a.title;
    return /^\d/.test(a.id) ? a.id + ". " + a.title : a.title;
  }
  const solutionLink = (a) => "#solucionario/" + encodeURIComponent(a.id);
  const practiceLink = (a, number) => link(a) + "/practica/" + number;
  const questionLink = (a, q) => a.isFinal ? link(a) : practiceLink(a, a.questions.indexOf(q) + 1);

  function courseSequence(m, a, solutions = false, questionNumber = 0) {
    const index = m.items.indexOf(a);
    const previous = m.items.slice(0, index).reverse().find((item) => item.questions);
    const next = m.items.slice(index + 1).find((item) => item.questions);
    const getLink = solutions ? solutionLink : link;
    const position = modules.indexOf(m);
    const previousModule = modules[position - 1];
    const nextModule = modules[position + 1];
    let back, forward;
    if (questionNumber > 1) back = [practiceLink(a, questionNumber - 1), "Pregunta anterior"];
    else if (questionNumber) back = [link(a), "Volver a la lectura"];
    else if (previous) back = [getLink(previous), previous.isFinal ? caseType(previous.questions[0]) : "Apartado anterior"];
    else if (!solutions) back = [modLink(m.number), "Índice del módulo"];
    else if (previousModule) {
      const last = previousModule.items.filter((item) => item.questions).at(-1);
      back = [solutionLink(last), "Módulo anterior"];
    }
    if (questionNumber && questionNumber < a.questions.length) forward = [practiceLink(a, questionNumber + 1), "Siguiente pregunta"];
    else if (next) forward = [getLink(next), next.isFinal ? caseType(next.questions[0]) : "Siguiente apartado"];
    else if (nextModule) forward = [solutions ? "#solucionario/" + nextModule.number : modLink(nextModule.number), "Siguiente módulo"];
    else forward = ["#respuestas", "Mis respuestas"];
    return `<nav class="study-pager" aria-label="Continuar el estudio">
      ${back ? `<a class="quiet" href="${back[0]}" rel="prev">${back[1]}</a>` : ""}
      <a class="button" href="${forward[0]}" rel="next">${forward[1]}</a>
    </nav>`;
  }

  function sectionPicker(m, a, solutions = false) {
    const study = m.items.filter((item) => item.questions);
    const notes = m.items.filter((item) => !item.questions);
    const options = (list) => list.map((item) =>
      `<option value="${esc(item.id)}"${item === a ? " selected" : ""}>${esc(itemName(item))}</option>`
    ).join("");
    return `<label class="reader-picker">${icon("layers")}<span>Apartados</span>
      <select ${solutions ? "data-solution-jump" : 'id="item-select"'} aria-label="Cambiar de apartado">
        <optgroup label="Apartados de estudio">${options(study)}</optgroup>
        ${!solutions && notes.length ? `<optgroup label="Notas del temario">${options(notes)}</optgroup>` : ""}
      </select></label>`;
  }

  function modulePage(m, a, questionNumber) {
    nav("", m.number);
    crumb("Módulo " + m.number);
    if (a) {
      main.innerHTML = `<div class="study-reader"><div class="reader-tools">
        <a class="reader-return" href="${modLink(m.number)}">${icon("book")} Módulo ${m.number}</a>
        ${sectionPicker(m, a)}
      </div>${unitSection(a, questionNumber)}${courseSequence(m, a, false, questionNumber)}</div>`;
      return;
    }
    const study = m.items.filter((item) => item.questions);
    const notes = m.items.filter((item) => !item.questions);
    const last = study.find((item) => item.id === lastId);
    const start = last || study.find((item) => done(item.questions) < item.questions.length) || study[0];
    const rows = study.map((item) => {
      const count = done(item.questions);
      const detail = item.isFinal ? [item.questions[0].title, unitCount(item)].filter(Boolean).join(" · ")
        : count ? unitCount(item) : item.questions.length + " preguntas";
      return `<li><a class="syllabus-row" href="${link(item)}">
        <span class="syllabus-code${count === item.questions.length ? " complete" : ""}">${item.isFinal ? icon("target") : esc(item.id)}</span>
        <span class="syllabus-copy"><strong>${mathText(item.isFinal ? caseType(item.questions[0]) : item.title)}</strong>
        <small>${esc(detail)}</small></span>
        <span class="syllabus-marker" aria-hidden="true"></span></a></li>`;
    }).join("");
    main.innerHTML = `<div class="study-reader"><header class="study-heading">
      <p class="eyebrow kicker">Módulo ${m.number} de ${modules.length}</p>
      <h1 class="page-title">${esc(m.title)}</h1>
      <p class="study-meta">${study.filter((item) => !item.isFinal).length} apartados · ${m.questions.length} preguntas</p>
      <a class="button" href="${link(start)}">${icon("book")}${last || done(m.questions) ? "Continuar módulo" : "Empezar módulo"}</a>
      </header>${progressCard(m.questions)}
      <section aria-labelledby="syllabus-title"><h2 class="study-subtitle" id="syllabus-title">Índice del módulo</h2>
      <ol class="syllabus-list">${rows}</ol></section>
      ${notes.length ? `<details class="syllabus-notes"><summary>Notas del temario (${notes.length})</summary>
        <ul>${notes.map((item) => `<li><a href="${link(item)}">${esc(itemName(item))}</a></li>`).join("")}</ul></details>` : ""}
      <nav class="study-pager" aria-label="Navegación entre módulos">
        ${m.number > 1 ? `<a class="quiet" href="${modLink(m.number - 1)}">Módulo anterior</a>` : ""}
        ${m.number < modules.length ? `<a class="button" href="${modLink(m.number + 1)}">Siguiente módulo</a>` : '<a class="button" href="#respuestas">Mis respuestas</a>'}
      </nav></div>`;
  }
  function questionCard(q, num, keepSolutionOpen = false) {
    const d = draft(q),
      isLong = q.type === "desarrollo";
    const qid = esc(q.id),
      titleId = "title-" + qid;
    const heading = q.type === "final" ? "h2" : "h3";
    let field = "";
    if (q.type === "comprension") {
      field =
        '<div class="mode-switch" role="group" aria-label="Forma de responder"><button type="button" data-mode="eleccion" aria-pressed="' +
        (d.mode === "eleccion") +
        '">Elegir opción</button><button type="button" data-mode="texto" aria-pressed="' +
        (d.mode === "texto") +
        '">Escribir respuesta</button></div>';
    }
    if (d.mode === "texto") {
      field +=
        '<div class="field-wrap"><label class="field-label" for="text-' +
        qid +
        '">' +
        (isLong
          ? "Desarrolla tu respuesta en unas 100 palabras."
          : "Tu respuesta escrita") +
        '</label><textarea maxlength="32000" class="answer-text ' +
        (isLong ? "long-answer" : "") +
        '" id="text-' +
        qid +
        '" aria-describedby="' +
        titleId +
        '" placeholder="Escribe aquí…">' +
        esc(d.text) +
        '</textarea><div class="field-foot"><span class="meta" data-words>' +
        wordCount(d.text) +
        " palabras</span></div></div>";
    } else {
      field +=
        '<fieldset class="choice-group" aria-labelledby="' +
        titleId +
        '">' +
        q.options
          .map(
            (opt, k) =>
              '<label class="answer-choice"><input type="radio" name="' +
              qid +
              '" value="' +
              k +
              '" ' +
              (d.choice === opt ? 'checked aria-describedby="resultado-' + qid + '"' : "") +
              "><span data-voz-texto>" +
              mathText(q.type === "final" ? optionLabel(q, k) : opt) +
              "</span></label>",
          )
          .join("") +
        "</fieldset>";
      if (d.choice)
        field +=
          '<button class="plain" data-clear-choice>Quitar selección</button>';
    }
    const label = isLong ? "modelo de respuesta" : "respuesta correcta";
    const grade = choiceGrade(q);
    const verdict = grade !== null
      ? '<strong class="choice-verdict" data-voz-texto>' +
        (grade ? "Tu opción es correcta." : "Tu opción es incorrecta.") +
        '</strong>'
      : "";
    const solution =
      '<details class="question-solution"' + (grade !== null || keepSolutionOpen ? " open" : "") + '>' +
      '<summary><span class="when-closed">Ver ' + label + '</span>' +
      '<span class="when-open">Ocultar ' + label + '</span></summary>' +
      '<div class="solution-content" id="resultado-' + qid + '">' + verdict + answerMarkup(q) + '</div></details>';
    return (
      '<article class="q-card" data-q="' +
      qid +
      '"><span class="eyebrow">' +
      questionLabel(q, num) +
      '</span>' + caseMarkup(q) + '<' + heading + ' data-voz-texto id="' +
      titleId +
      '">' +
      mathText(q.prompt) +
      "</" + heading + ">" +
      field +
      solution +
      "</article>"
    );
  }
  function optionLabel(q, k) {
    return String.fromCharCode(65 + k) + ". " + q.options[k];
  }
  function caseType(q) {
    return q.qualitative ? "Caso cualitativo" : "Caso cuantitativo";
  }
  function questionLabel(q, num) {
    if (q.type === "final") return caseType(q) + " · Elige una opción";
    return q.type === "desarrollo" ? "Pregunta de desarrollo" : "Comprensión · " + num + " de 5";
  }
  function caseMarkup(q) {
    return q.case ? '<div class="case-text">' + paragraphs(q.case) + '</div>' : "";
  }
  function paragraphs(text) {
    return text.split(/\n\s*\n/).map((p) => "<p data-voz-texto>" + mathText(p) + "</p>").join("");
  }
  function answerMarkup(q) {
    if (q.type !== "final") return '<p class="answer-preview" data-voz-texto>' + mathText(reference(q)) + '</p>';
    return '<p class="answer-preview" data-voz-texto><strong>' + mathText(optionLabel(q, q.correctIndex)) +
      '</strong></p><div class="case-reason">' + paragraphs(q.explanation) + '</div>';
  }
  function unitCount(a) {
    if (a.isFinal) return done(a.questions) ? "Respondida" : "Pendiente";
    return done(a.questions) + " de " + a.questions.length + " respondidas";
  }
  function practiceMarkup(a, number) {
    const q = a.questions[number - 1];
    return `<section class="practice" aria-label="Práctica del apartado">
      <div class="practice-heading"><h2 id="current-question" tabindex="-1">Pregunta ${number} de ${a.questions.length}</h2>
        <span class="meta" data-unit-progress aria-live="polite">${unitCount(a)}</span></div>
      <nav class="question-steps" aria-label="Elegir pregunta">${a.questions.map((item, i) => {
        const answered = Boolean(response(item));
        return `<a href="${practiceLink(a, i + 1)}" data-step="${esc(item.id)}" class="${answered ? "answered" : ""}"
          aria-label="Pregunta ${i + 1}${answered ? ", respondida" : ""}"${i + 1 === number ? ' aria-current="step"' : ""}>${i + 1}</a>`;
      }).join("")}</nav>
      <div data-voz></div>${questionCard(q, number)}</section>`;
  }

  function readingMarkup(a, practiceUrl) {
    const table = a.table ? `<div class="reading-table" data-voz-texto="${esc(a.table.map(row => row.join(", ")).join(". "))}"><table><thead><tr>
      ${a.table[0].map((cell) => `<th scope="col">${mathText(cell)}</th>`).join("")}</tr></thead>
      <tbody>${a.table.slice(1).map((row) => `<tr>${row.map((cell) => `<td>${mathText(cell)}</td>`).join("")}</tr>`).join("")}</tbody>
      </table></div>` : "";
    const chartEquations = a.figure ? [...new Set(Array.from(formulaMatches(a.figure.alt), (match) => match.source)
      .filter(source => /[=≈<>≤≥×÷/]| [−+] /.test(source)))] : [];
    const figure = a.figure ? `<button class="figure-btn" data-zoom="${esc(a.id)}">
        <img loading="lazy" src="${esc(a.figure.src)}" alt="${esc(a.figure.alt)}" data-voz-texto="${esc(a.figure.alt)}">
        <span>${icon("search")} Ampliar gráfico</span></button>
        ${chartEquations.length ? `<details class="chart-equations"><summary>Fórmulas del gráfico</summary>
          <ul>${chartEquations.map(source => "<li>" + mathText(source) + "</li>").join("")}</ul></details>` : ""}` : "";
    return `<div data-voz data-voz-audio="assets/audio/lectura/${encodeURIComponent(a.id)}.mp3"></div>
      <section class="read-card"><h2 class="study-subtitle">Ideas clave</h2>
      ${a.ideas.map((idea) => `<p data-voz-texto>${mathText(idea)}</p>`).join("")}${table}${figure}
      <footer class="reading-sources"><span>Lectura de origen, pp. ${esc(a.source)}</span>
        <a href="assets/compendio-color.pdf#page=${a.page}" target="_blank" rel="noopener">${icon("book")} Compendio, p. ${a.page}</a>
        <a href="assets/audio/CREDITOS.txt" target="_blank" rel="noopener">Créditos de voz</a></footer></section>
      <a class="button practice-start" href="${practiceUrl}">${icon("edit")} Practicar este apartado</a>`;
  }

  function unitSection(a, questionNumber) {
    const code = a.isFinal ? "Cierre del módulo " + a.questions[0].module : "Apartado " + esc(a.id);
    const header = `<p class="eyebrow kicker">${code}</p><h1 class="page-title" data-voz-texto>${mathText(a.title)}</h1>`;
    let body;
    if (!a.questions) {
      body = `<div data-voz></div><p class="note-content" data-voz-texto>${mathText(a.note)}</p>`;
    } else if (a.isFinal) {
      body = `<div class="practice-heading"><span class="meta" data-unit-progress aria-live="polite">${unitCount(a)}</span></div>
        <div data-voz></div>${questionCard(a.questions[0], 1)}`;
    } else {
      const firstPending = a.questions.findIndex((q) => !response(q)) + 1;
      const practiceUrl = practiceLink(a, questionNumber || firstPending || 1);
      body = `<nav class="reader-tabs" aria-label="Actividad del apartado">
        <a href="${link(a)}"${!questionNumber ? ' aria-current="page"' : ""}>${icon("book")} Lectura</a>
        <a href="${practiceUrl}"${questionNumber ? ' aria-current="page"' : ""}>${icon("edit")} Práctica</a>
        </nav>${questionNumber ? practiceMarkup(a, questionNumber) : readingMarkup(a, practiceUrl)}`;
    }
    return `<section class="study-unit current-unit" id="apartado-${esc(encodeURIComponent(a.id))}" data-unit="${esc(a.id)}">
      ${header}${body}</section>`;
  }
  function report() {
    const result = {
      version: 1,
      curso: "Fundamentos de Economía",
      codigo: "CV-0303",
      fecha: new Date().toISOString(),
      total: questions.size,
      respondidas: answered(),
      puntuacion: scoreSummary(),
      incluye_pendientes: showPending,
      incluye_referencias: includeModels,
      modulos: [],
    };
    for (const m of modules) {
      const apartados = [];
      for (const a of m.items) {
        if (!a.questions) continue;
        const selected = a.questions.filter((q) => showPending || response(q));
        if (!selected.length) continue;
        apartados.push({
          numero: a.id,
          titulo: a.isFinal ? itemName(a) : a.title,
          pagina_compendio: a.page,
          paginas_origen: a.source,
          preguntas: selected.map((q) => {
            const value = response(q),
              d = draft(q);
            const row = {
              id: q.id,
              tipo: q.type,
              enunciado: q.prompt,
              modalidad: value ? d.mode : null,
              respuesta: value || null,
            };
            if (q.case) row.caso = q.case;
            if (q.type === "final" || (value && d.mode === "eleccion")) row.opciones = q.options;
            if (value && d.mode === "eleccion") {
              row.correcta = choiceGrade(q);
            }
            if (includeModels) {
              row.referencia = reference(q);
              if (q.explanation) row.explicacion = q.explanation;
            }
            return row;
          }),
        });
      }
      if (apartados.length)
        result.modulos.push({ numero: m.number, titulo: m.title, apartados });
    }
    return result;
  }
  function groupedQuestions(matches) {
    const groups = [];
    for (const m of modules) {
      const sections = [];
      for (const a of m.items) {
        if (!a.questions) continue;
        const selected = a.questions.filter(matches);
        if (selected.length) sections.push({ a, selected });
      }
      if (sections.length) groups.push({ m, sections, total: sections.reduce((n, s) => n + s.selected.length, 0) });
    }
    return groups;
  }
  function pendingGroup(kind, title, groups) {
    const count = groups.reduce((sum, group) => sum + group.total, 0);
    const blocks = groups.map(({ m, sections, total }) => {
      const rows = sections.flatMap(({ a, selected }) => selected.map((q) => {
        const label = a.isFinal ? caseType(q) : "Apartado " + a.id + " · Pregunta " + (a.questions.indexOf(q) + 1);
        return `<li><a class="pending-question" href="${questionLink(a, q)}">
          <small>${esc(label)}</small><span>${mathText(q.prompt)}</span></a></li>`;
      }));
      return `<details class="pending-module" data-module="${m.number}" data-group-key="${kind}-${m.number}">
        <summary><span>Módulo ${m.number} · ${esc(m.title)}</span><span class="pending-count">${total}</span></summary>
        <ul class="pending-questions">${rows.join("")}</ul></details>`;
    });
    return `<section class="pending-group" data-count="${count}"><h2>${title} <span class="pending-count">${count}</span></h2>
      ${blocks.length ? blocks.join("") : '<p class="pending-empty">' +
        (kind === "errors" ? "No tienes respuestas incorrectas." : "Has contestado todas las preguntas.") + '</p>'}
      </section>`;
  }
  function renderPendingList(container) {
    if (pendingMarkup === undefined) {
      const errors = groupedQuestions((q) => choiceGrade(q) === false);
      const unanswered = groupedQuestions((q) => !response(q));
      pendingMarkup = pendingGroup("errors", "Incorrectas", errors) +
        pendingGroup("unanswered", "Sin contestar", unanswered);
    }
    if (renderedPending.get(container) === pendingMarkup) return;
    const focused = container.contains(document.activeElement) ? document.activeElement : null;
    const focusModule = focused?.closest(".pending-module")?.dataset.groupKey;
    container.innerHTML = pendingMarkup;
    renderedPending.set(container, pendingMarkup);
    for (const group of container.querySelectorAll(".pending-module")) {
      const showQuestions = container.id === "pending-page-list" && Number(group.parentElement.dataset.count) <= 5;
      group.open = pendingModuleStates.get(container.id + "/" + group.dataset.groupKey) ?? showQuestions;
    }
    if (focused) {
      const links = [...container.querySelectorAll(".pending-module[open] a")];
      const target = links.find((a) => a.href === focused.href) ||
        container.querySelector('[data-group-key="' + focusModule + '"] summary') ||
        container.querySelector("summary") || (container.id === "pending-sidebar-list" ? $("#pending-nav-link") : main);
      target.focus({ preventScroll: true });
    }
  }
  function pendingPage() {
    nav("pending");
    crumb("Preguntas pendientes");
    main.innerHTML = `<div class="pending-page"><header class="review-heading">
      <h1 class="page-title">Preguntas pendientes</h1></header><div id="pending-page-list"></div></div>`;
    renderPendingList($("#pending-page-list"));
  }
  function reviewOutline(filter = "answered") {
    const groups = groupedQuestions((q) => {
      if (filter === "all") return true;
      if (filter === "errors") return choiceGrade(q) === false;
      if (filter === "written") return draft(q).mode === "texto" && Boolean(response(q));
      return Boolean(response(q));
    });
    if (!groups.length) {
      const message = filter === "errors" ? "No tienes respuestas incorrectas." :
        filter === "written" ? "Aún no tienes respuestas escritas." : "Aún no has respondido ninguna pregunta.";
      const item = items.get(lastId)?.a || modules[0].items.find((a) => a.questions);
      return `<div class="review-empty">${icon("sheet")}<p>${message}</p>
        <a class="link" href="${resumeLink(item)}">${lastId ? "Continuar estudio" : "Empezar a estudiar"}</a></div>`;
    }
    return groups.map(({ m, sections, total }) => {
      return `<details class="review-module" ${groups.length === 1 ? "open" : ""}>
        <summary><span><small>Módulo ${m.number}</small><strong>${esc(m.title)}</strong></span>
          <span class="review-tally">${total}<span class="sr"> preguntas</span></span></summary>
        <div class="review-units">${sections.map(({ a, selected }) =>
          `<details class="review-unit" ${sections.length === 1 ? "open" : ""}>
            <summary>${mathText(itemName(a))}</summary><div class="review-unit-body">
            ${selected.map((q) => {
              const answer = response(q), grade = choiceGrade(q);
              const verdict = !answer ? "Pendiente" : grade === null ? "Respuesta escrita" : grade ? "Correcta" : "Incorrecta";
              const url = questionLink(a, q);
              return `<article class="review-entry"><span class="review-verdict${grade === false ? " error" : ""}">${verdict}</span>
                ${caseMarkup(q)}<h4>${mathText(q.prompt)}</h4>
                ${answer ? `<p class="answer-preview">${mathText(answer, grade !== null)}</p>` : ""}
                <a class="link review-edit" href="${url}">${icon("edit")} ${answer ? "Revisar respuesta" : "Responder"}</a></article>`;
            }).join("")}
            </div></details>`
        ).join("")}</div></details>`;
    }).join("");
  }
  function readImportedAnswers(data) {
    if (data?.version !== 1 || data.codigo !== "CV-0303" ||
        data.curso !== "Fundamentos de Economía" || !Array.isArray(data.modulos))
      throw new Error("Elige un JSON de respuestas de este curso.");
    const ready = [], seen = new Set();
    let pending = 0, existing = 0;
    for (const module of data.modulos) {
      if (!Array.isArray(module?.apartados)) throw new Error("El índice del archivo es incorrecto.");
      for (const unit of module.apartados) {
        const current = items.get(unit?.numero);
        if (!current?.a.questions || current.m.number !== module.numero || !Array.isArray(unit.preguntas))
          throw new Error("El archivo contiene un apartado que no corresponde al curso.");
        for (const row of unit.preguntas) {
          const q = questions.get(row?.id);
          if (!q || !current.a.questions.includes(q) || row.tipo !== q.type || seen.has(q.id))
            throw new Error("El archivo contiene una pregunta desconocida, repetida o mal ubicada.");
          seen.add(q.id);
          if (row.respuesta === null && row.modalidad === null) { pending++; continue; }
          const choice = row.modalidad === "eleccion";
          if (typeof row.respuesta !== "string" || !row.respuesta.trim() || (!choice && [...row.respuesta].length > 32000) ||
              (choice ? !q.options?.includes(row.respuesta) : row.modalidad !== "texto" || q.type === "final"))
            throw new Error("La respuesta de " + q.id + " no corresponde al tipo de pregunta o a sus opciones.");
          if (drafts.has(q.id)) { existing++; continue; }
          ready.push([q, choice
            ? {mode:"eleccion", text:"", choice:row.respuesta}
            : {mode:"texto", text:row.respuesta, choice:""}]);
        }
      }
    }
    return {ready, pending, existing};
  }
  function attachImport(panel) {
    const fileInput = panel.querySelector('input[type=file]');
    const preview = panel.querySelector('[role=status]');
    const confirm = panel.querySelector('button');
    let ready = [];
    fileInput.addEventListener("change", async () => {
      ready = [];
      confirm.disabled = true;
      preview.textContent = "";
      const file = fileInput.files[0];
      if (!file) return;
      try {
        if (file.size > 128 * 1024 * 1024) throw new Error("El archivo supera el límite de 128 MiB.");
        const contents = await file.text();
        if (!panel.isConnected || fileInput.files[0] !== file) return;
        const result = readImportedAnswers(JSON.parse(contents));
        ready = result.ready;
        preview.textContent = "Respuestas para añadir: " + ready.length +
          ". Preguntas que ya tienen un borrador en esta cuenta: " + result.existing +
          ". Preguntas pendientes en el archivo: " + result.pending + ".";
        confirm.disabled = ready.length === 0;
      } catch (error) {
        if (panel.isConnected && fileInput.files[0] === file)
          preview.textContent = error instanceof SyntaxError ? "El archivo no contiene JSON válido." : error.message;
      }
    });
    confirm.addEventListener("click", () => {
      if (!panel.isConnected || !window.nube?.ready || !ready.length) return;
      confirm.disabled = true;
      let added = 0;
      for (const [q, d] of ready) {
        if (drafts.has(q.id)) continue;
        save(q, d, false);
        added++;
      }
      review();
      updateSidebarStats();
      notice("Se han añadido " + added + " respuestas al cuaderno.");
    });
  }
  function review() {
    nav("answers");
    crumb("Mis respuestas");
    const count = answered();
    const filter = $("#review-filter")?.value || "answered";
    main.innerHTML = `<div class="desk-review">
      <header class="review-heading"><p class="eyebrow kicker">Cuaderno personal</p>
        <h1 class="page-title">Mis respuestas</h1>
        <p>${count} de ${questions.size} preguntas respondidas</p></header>
      ${scorePanel()}
      <div class="review-layout"><section class="panel review-list">
        <h2>Revisar por módulo</h2>
        <label class="review-filter">Mostrar <select id="review-filter">
          <option value="answered">Preguntas respondidas</option>
          <option value="errors">Respuestas incorrectas</option>
          <option value="written">Respuestas escritas</option>
          <option value="all">Todas las preguntas</option>
        </select></label>
        <div id="review-outline">${reviewOutline(filter)}</div>
      </section>
      <aside class="review-files" aria-label="Archivos de respuestas">
        <details class="file-panel"><summary>${icon("download")} Descargar respuestas</summary>
          <div class="file-body"><p>Guarda el cuaderno en Word para leerlo o en JSON para importarlo o evaluarlo.</p>
            <label class="export-options"><input type="checkbox" id="models" ${includeModels ? "checked" : ""}>Incluir las respuestas de referencia</label>
            <label class="export-options"><input type="checkbox" id="pending" ${showPending ? "checked" : ""}>Incluir las preguntas pendientes</label>
            <div class="actions">
              <button class="button" data-format="docx" ${!count && !showPending ? "disabled" : ""}>Descargar Word (.docx)</button>
              <button class="button line" data-format="json" ${!count && !showPending ? "disabled" : ""}>Descargar JSON</button>
            </div></div></details>
        ${window.nube?.ready ? `<details class="file-panel" id="import-answers">
          <summary>${icon("sheet")} Importar respuestas</summary>
          <div class="file-body"><p>Elige un JSON de este curso. Se añadirán las respuestas a preguntas que aún no tengan borrador en tu cuenta.</p>
            <label class="field-label" for="import-file">Archivo de respuestas (.json)</label>
            <input type="file" id="import-file" accept=".json,application/json">
            <p role="status" aria-live="polite"></p>
            <button type="button" class="button line" disabled>Confirmar importación</button>
          </div></details>` : ""}
      </aside></div></div>`;
    const selector = $("#review-filter");
    selector.value = filter;
    selector.addEventListener("change", () => {
      $("#review-outline").innerHTML = reviewOutline(selector.value);
    });
    const importPanel = $("#import-answers");
    if (importPanel) attachImport(importPanel);
  }
  function download(format) {
    const doc = report();
    if (!doc.respondidas && !doc.incluye_pendientes) return;
    const blob =
      format === "docx"
        ? window.crearDocumentoWord(doc)
        : new Blob([JSON.stringify(doc, null, 2)], {
            type: "application/json;charset=utf-8",
          });
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download =
      "Respuestas-Fundamentos-de-Economia-" +
      doc.fecha.slice(0, 23).replace(/[T:.]/g, "-") +
      "." +
      format;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    notice("Documento de respuestas generado.");
  }
  let timer;
  function notice(s) {
    $("#notice").textContent = s;
    $("#notice").classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => $("#notice").classList.remove("show"), 2300);
  }
  function closeNav() {
    if (!document.body.classList.contains("nav-open")) return;
    document.body.classList.remove("nav-open");
    $("#shade").hidden = true;
    $("#open-nav").setAttribute("aria-expanded", "false");
    $("#sidebar").setAttribute("role", "complementary");
    $("#sidebar").removeAttribute("aria-modal");
    $(".shell").inert = false;
    $(".skip").inert = false;
  }
  function solutionSection(a) {
    const answers = a.questions.map((q, i) => {
      const options = q.type === "final" ? '<ol type="A" class="case-options">' +
        q.options.map((opt) => "<li data-voz-texto>" + mathText(opt) + "</li>").join("") + "</ol>" : "";
      return `<details class="solution-entry" data-solution-id="${esc(q.id)}"${i === 0 ? " open" : ""}>
        <summary><span><small class="eyebrow">${q.type === "final" ? caseType(q) : questionLabel(q, i + 1)}</small>
          <strong data-voz-texto>${mathText(q.prompt)}</strong></span></summary>
        <div class="solution-answer">${caseMarkup(q)}${options}
          <h2 data-voz-texto>${q.type === "desarrollo" ? "Modelo de respuesta" : "Respuesta correcta"}</h2>${answerMarkup(q)}</div>
        </details>`;
    }).join("");
    return `<section id="solucion-${esc(encodeURIComponent(a.id))}" aria-labelledby="solution-heading">
      <p class="eyebrow kicker">${a.isFinal ? "Cierre del módulo " + a.questions[0].module : "Apartado " + esc(a.id)}</p>
      <h1 class="page-title" id="solution-heading" data-voz-texto>${mathText(a.title)}</h1>
      <div data-voz></div>
      <a class="solution-practice" href="${a.isFinal ? link(a) : practiceLink(a, 1)}">${icon("edit")} Practicar este apartado</a>
      ${answers}</section>`;
  }
  function solutionPage(m, current) {
    nav("solutions");
    crumb("Solucionario");
    const a = current || m.items.find((item) => item.questions);
    const options = modules.map((module) =>
      `<option value="${module.number}"${module === m ? " selected" : ""}>${module.number}. ${esc(module.title)}</option>`
    ).join("");
    main.innerHTML = `<div class="study-reader solution-reader"><div class="reader-tools">
      <label class="reader-picker">${icon("book")}<span>Módulo ${m.number}</span>
        <select data-solution-select aria-label="Cambiar de módulo en el solucionario">${options}</select></label>
      ${sectionPicker(m, a, true)}</div>${solutionSection(a)}${courseSequence(m, a, true)}</div>`;
    main.querySelector("[data-solution-select]").onchange = (event) => goToHash("#solucionario/" + event.target.value);
    main.querySelector("[data-solution-jump]").onchange = (event) => goToHash("#solucionario/" + encodeURIComponent(event.target.value));
  }
  function goToHash(hash) {
    if (location.hash === hash) render(true);
    else location.hash = hash;
  }
  function locate() {
    const [page, id, activity, step] = location.hash.slice(1).split("/");
    let item;
    try { item = items.get(decodeURIComponent(id || "")); } catch {}
    const m = modules.find((module) => String(module.number) === id);
    if (page === "apartado" && item) {
      const practice = activity === "practica" && item.a.questions && !item.a.isFinal;
      const number = Number(step);
      const questionNumber = practice
        ? Number.isInteger(number) && number > 0 && number <= item.a.questions.length ? number : 1
        : undefined;
      return { page: "modulo", ...item, questionNumber };
    }
    if (page === "modulo" && m) return { page, m };
    if (page === "solucionario") {
      const section = id ? item : items.get(lastId);
      return section?.a.questions ? { page, ...section } : { page, m: m || modules[0] };
    }
    return { page: ["respuestas", "pendientes"].includes(page) ? page : "inicio" };
  }
  let renderedPage, renderedRoute;
  function render(navigation = false) {
    if (cloud && !cloud.ready) return;
    closeNav();
    const route = locate();
    const changed = renderedRoute !== location.hash;
    if (changed || !navigation) {
      if (route.page === "modulo") modulePage(route.m, route.a, route.questionNumber);
      else if (route.page === "respuestas") review();
      else if (route.page === "pendientes") pendingPage();
      else if (route.page === "solucionario") solutionPage(route.m, route.a);
      else home();
      window.voz?.montar(main);
      renderedPage = route.page;
      renderedRoute = location.hash;
    }
    document.title =
      (route.page === "solucionario" ? "Solucionario · " : "") +
      (route.questionNumber ? "Pregunta " + route.questionNumber + " · " : "") +
      (route.a ? itemName(route.a) : route.m?.title ||
        ({ respuestas: "Mis respuestas", pendientes: "Preguntas pendientes" }[route.page] || "Fundamentos de Economía")) + " · MBA Training";
    if (route.page === "modulo" && route.a?.questions) remember(route.a.id);
    sidebarModule = route.m || sidebarModule || items.get(lastId)?.m || modules[0];
    updateSidebarStats();
    updateStudyTime();
    if (navigation) {
      const practiceHeading = route.questionNumber && main.querySelector("#current-question");
      if (practiceHeading) {
        practiceHeading.focus({ preventScroll: true });
        practiceHeading.scrollIntoView({ block: "start", behavior: "instant" });
      } else {
        main.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }
  }
  function updateUnitProgress(section, q) {
    const { a } = items.get(section.dataset.unit);
    const counter = $("[data-unit-progress]", section);
    const label = unitCount(a);
    if (counter.textContent !== label) counter.textContent = label;
    const step = section.querySelector('[data-step="' + CSS.escape(q.id) + '"]');
    if (step) {
      const answered = Boolean(response(q));
      step.classList.toggle("answered", answered);
      step.setAttribute("aria-label", "Pregunta " + step.textContent + (answered ? ", respondida" : ""));
    }
  }
  function redrawCard(card, q, focusSel) {
    window.voz?.detener();
    const { a } = items.get(card.closest("[data-unit]").dataset.unit);
    const wrap = document.createElement("div");
    // Una solución consultada manualmente sigue abierta. Al borrar una elección,
    // se cierra la corrección que apareció automáticamente al responder.
    const manuallyOpen = $(".question-solution", card).open && !$(".choice-verdict", card);
    wrap.innerHTML = questionCard(q, a.questions.indexOf(q) + 1, manuallyOpen);
    const fresh = wrap.firstElementChild;
    card.replaceWith(fresh);
    if (focusSel) $(focusSel, fresh)?.focus({ preventScroll: true });
    updateUnitProgress(fresh.closest("[data-unit]"), q);
  }
  function refreshDraft(q) {
    pendingMarkup = undefined;
    updateSidebarStats();
    if (renderedPage === "pendientes") {
      renderPendingList($("#pending-page-list"));
      return;
    }
    const card = main.querySelector('[data-q="' + CSS.escape(q.id) + '"]');
    if (card) redrawCard(card, q);
    else if (renderedPage !== "solucionario") {
      const section = main.querySelector("[data-unit]");
      if (!section) render();
      else if (items.get(section.dataset.unit).a.questions?.includes(q)) {
        if (section.querySelector("[data-unit-progress]")) updateUnitProgress(section, q);
        else render();
      }
    }
  }
  main.addEventListener("input", (e) => {
    if (e.target.id === "find") {
      query = e.target.value;
      results();
      return;
    }
    const card = e.target.closest("[data-q]");
    if (!card || !e.target.matches("textarea")) return;
    const q = questions.get(card.dataset.q),
      d = draft(q);
    save(q, { ...d, text: e.target.value, mode: "texto" });
    $("[data-words]", card).textContent =
      wordCount(e.target.value) + " palabras";
    updateUnitProgress(card.closest("[data-unit]"), q);
  });
  main.addEventListener("change", (e) => {
    if (e.target.id === "item-select") {
      if (!e.target.value) return;
      const hash = "#apartado/" + encodeURIComponent(e.target.value);
      goToHash(hash);
      return;
    }
    if (["models", "pending"].includes(e.target.id)) {
      if (e.target.id === "models") includeModels = e.target.checked;
      else showPending = e.target.checked;
      main
        .querySelectorAll("[data-format]")
        .forEach((b) => (b.disabled = !answered() && !showPending));
      return;
    }
    const card = e.target.closest("[data-q]");
    if (!card || e.target.type !== "radio") return;
    const q = questions.get(card.dataset.q),
      d = draft(q);
    save(q, {
      ...d,
      choice: q.options[Number(e.target.value)],
      mode: "eleccion",
    });
    redrawCard(card, q, "input:checked");
  });
  main.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (!button) return;
    if (button.dataset.format) {
      download(button.dataset.format);
      return;
    }
    if (button.dataset.zoom) {
      const fig = items.get(button.dataset.zoom).a.figure,
        img = $("#figure-dialog img");
      img.src = fig.src;
      img.alt = fig.alt;
      $("#figure-title").textContent = "Gráfico · " + button.dataset.zoom;
      setFigureZoom(false);
      $("#figure-dialog").showModal();
      return;
    }
    const card = button.closest("[data-q]");
    if (!card) return;
    const q = questions.get(card.dataset.q),
      d = draft(q);
    if (button.dataset.mode) {
      save(q, { ...d, mode: button.dataset.mode });
      redrawCard(
        card,
        q,
        button.dataset.mode === "texto" ? "textarea" : '[data-mode="eleccion"]',
      );
    } else if (button.hasAttribute("data-clear-choice")) {
      save(q, { ...d, choice: "" });
      redrawCard(card, q, "input[type=radio]");
    }
  });
  window.addEventListener("storage", (event) => {
    if (cloud) return;
    if (event.key === null) {
      drafts.clear();
      pendingMarkup = undefined;
      lastId = "";
      sidebarModule = undefined;
      render();
      return;
    }
    if (!event.key.startsWith(prefix + "r.")) return;
    const q = questions.get(event.key.slice((prefix + "r.").length));
    if (!q) return;
    try {
      drafts.set(q.id, normalized(q, JSON.parse(event.newValue)));
    } catch {
      return;
    }
    refreshDraft(q);
  });
  const toggle = $("#open-nav");
  toggle.addEventListener("click", () => {
    document.body.classList.add("nav-open");
    $("#shade").hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    $("#sidebar").setAttribute("role", "dialog");
    $("#sidebar").setAttribute("aria-modal", "true");
    $("#close-nav").focus();
    $(".shell").inert = true;
    $(".skip").inert = true;
  });
  $("#close-nav").onclick = $("#shade").onclick = () => {
    closeNav();
    toggle.focus();
  };
  document.addEventListener("keydown", (e) => {
    if (!document.body.classList.contains("nav-open")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeNav();
      toggle.focus();
    }
    if (e.key === "Tab") {
      const links = [...$("#sidebar").querySelectorAll("a[href], button:enabled, summary")].filter(el => {
        // El resumen de un grupo cerrado sigue admitiendo el foco.
        const scope = el.matches("details > summary") ? el.parentElement.parentElement : el;
        return !scope.closest("details:not([open])") && el.getClientRects().length;
      });
      const target = e.shiftKey ? links.at(-1) : links[0];
      if (document.activeElement === (e.shiftKey ? links[0] : links.at(-1))) {
        e.preventDefault();
        target.focus();
      }
    }
  });
  matchMedia("(max-width: 880px)").addEventListener("change", (e) => {
    if (!e.matches && document.body.classList.contains("nav-open")) {
      closeNav();
      $("#sidebar .identity a").focus({ preventScroll: true });
    }
  });
  $("#pending-sidebar-details").addEventListener("toggle", (e) => {
    const list = $("#pending-sidebar-list");
    if (e.currentTarget.open) renderPendingList(list);
    else {
      renderedPending.delete(list);
      list.replaceChildren();
    }
  });
  document.addEventListener("toggle", (e) => {
    const group = e.target;
    if (!group.matches?.(".pending-module") || !group.isConnected) return;
    const key = group.closest("#pending-sidebar-list, #pending-page-list").id + "/" + group.dataset.groupKey;
    pendingModuleStates.set(key, group.open);
  }, true);
  $("#sidebar").addEventListener("click", (e) => {
    if (e.target.closest("a")) closeNav();
  });
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const hash = e.target.closest('a[href^="#"]')?.getAttribute("href");
    if (hash === "#main") {
      e.preventDefault();
      main.focus({ preventScroll: true });
      main.scrollIntoView({ behavior: "instant" });
    } else if (hash && hash === location.hash) {
      e.preventDefault();
      render(true);
    }
  });
  function setFigureZoom(enlarged) {
    const button = $("#figure-zoom");
    $(".zoom-area").classList.toggle("enlarged", enlarged);
    button.setAttribute("aria-pressed", String(enlarged));
    button.textContent = enlarged ? "Ajustar" : "Ampliar";
    $(".zoom-area").scrollTo(0, 0);
  }
  $("#figure-zoom").onclick = () => setFigureZoom(!$(".zoom-area").classList.contains("enlarged"));
  $(".close-dialog").onclick = () => $("#figure-dialog").close();
  $("#figure-dialog").addEventListener("click", (e) => {
    if (e.target === $("#figure-dialog")) $("#figure-dialog").close();
  });
  document
    .querySelectorAll("[data-icon]")
    .forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
  window.addEventListener("hashchange", () => render(true));
  window.addEventListener("tiempoactualizado", updateStudyTime);
  if (cloud) {
    cloud.start({
      closeNav,
      hasQuestion: (id) => questions.has(id),
      load(values, last) {
        drafts.clear();
        pendingMarkup = undefined;
        sidebarModule = undefined;
        for (const [id, value] of Object.entries(values)) {
          const q = questions.get(id);
          if (q) drafts.set(id, normalized(q, value));
        }
        lastId = items.get(last)?.a.questions ? last : "";
        render();
      },
      replace(id, value) {
        const q = questions.get(id);
        drafts.set(id, normalized(q, value));
        refreshDraft(q);
      },
      clear() {
        window.voz?.detener();
        drafts.clear(); lastId = ""; query = ""; showPending = false; includeModels = true;
        renderedRoute = undefined; renderedPage = undefined;
        sidebarModule = undefined;
        pendingMarkup = undefined;
        pendingModuleStates.clear();
        $("#pending-sidebar-details").open = false;
        renderedPending.delete($("#pending-sidebar-list"));
        $("#pending-sidebar-list").replaceChildren();
        $("#pending-nav-counts").textContent = "";
        $("#pending-nav-link").removeAttribute("aria-current");
        $("#stat-module-meter").value = $("#stat-course-meter").value = 0;
        $("#stat-module-label").textContent = "Módulo actual";
        $("#stat-module-label").removeAttribute("title");
        for (const el of document.querySelectorAll("#stat-module-progress, #stat-course-progress, #stat-accuracy, #stat-active-time, #stat-remaining-time")) {
          el.textContent = "—";
          el.removeAttribute("title");
        }
        closeNav(); main.replaceChildren();
        $("#navigation").replaceChildren();
        $("#crumb").replaceChildren();
        $("#account-user").textContent = "";
        $("#account-save").textContent = "";
      }
    });
  } else {
    document.body.classList.remove("account-locked");
    $("#auth-screen").hidden = true;
    window.tiempo?.iniciarLocal();
    render();
  }
})();
