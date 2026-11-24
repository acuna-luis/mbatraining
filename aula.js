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
    menu: '<path d="M3 6h18 M3 12h18 M3 18h18"/>',
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
    questions = new Map(),
    units = [];
  for (const m of modules) {
    m.questions = [];
    for (const a of m.items) {
      items.set(a.id, { a, m });
      if (a.questions) {
        units.push(a);
        for (const q of a.questions) {
          questions.set(q.id, q);
          m.questions.push(q);
        }
      }
    }
  }
  const prefix = "mba.economia.cv0303.v1.";
  const drafts = new Map();
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
        q.type === "desarrollo" || obj?.mode === "texto" ? "texto" : "eleccion",
      text: typeof obj?.text === "string" ? obj.text : "",
      choice: q.options?.includes(obj?.choice) ? obj.choice : "",
    };
  }
  try {
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
  function choiceGrade(q) {
    const d = draft(q);
    if (q.type !== "comprension" || d.mode !== "eleccion" || !d.choice) return null;
    return d.choice === window.REFERENCIAS[q.id];
  }
  function scoreSummary() {
    let aciertos = 0, errores = 0, escritas = 0, maximo_curso = 0;
    for (const q of questions.values()) {
      if (q.type === "comprension") maximo_curso++;
      const grade = choiceGrade(q);
      if (grade === true) aciertos++;
      else if (grade === false) errores++;
      else if (response(q)) escritas++;
    }
    const evaluadas = aciertos + errores;
    return { aciertos, errores, evaluadas, maximo_curso, escritas,
      porcentaje: evaluadas ? Math.round(100 * aciertos / evaluadas) : null };
  }
  function scorePanel() {
    const s = scoreSummary();
    return `<section class="panel score-panel" aria-labelledby="score-title">
      <h2 id="score-title">Puntuación automática</h2>
      <p class="score-result">${s.evaluadas
        ? `<strong>${s.aciertos} / ${s.evaluadas}</strong> puntos · ${s.porcentaje} % de acierto`
        : "Aún no has contestado ninguna pregunta por elección."}</p>
      <dl class="score-breakdown">
        <div><dt>Aciertos</dt><dd>${s.aciertos}</dd></div>
        <div><dt>Errores</dt><dd>${s.errores}</dd></div>
        <div><dt>Respuestas escritas para revisar</dt><dd>${s.escritas}</dd></div>
      </dl>
      <p class="meta">Cada elección correcta suma 1 punto. Has contestado por elección ${s.evaluadas} de las ${s.maximo_curso} preguntas autocorregibles del curso.</p>
    </section>`;
  }
  function save(q, d) {
    drafts.set(q.id, d);
    try {
      localStorage.setItem(prefix + "r." + q.id, JSON.stringify(d));
    } catch {
      storageError();
    }
  }
  function remember(id) {
    lastId = id;
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
    $("#navigation").innerHTML =
      '<a href="#inicio" class="nav-main ' +
      (current === "home" ? "active" : "") +
      '" ' +
      (current === "home" ? 'aria-current="page"' : "") +
      ">" +
      icon("grid") +
      "Vista general</a>" +
      '<a href="#respuestas" class="nav-main ' +
      (current === "answers" ? "active" : "") +
      '" ' +
      (current === "answers" ? 'aria-current="page"' : "") +
      ">" +
      icon("sheet") +
      "Mis respuestas</a>" +
      '<a href="#solucionario" class="nav-main ' +
      (current === "solutions" ? 'active" aria-current="page">' : '">') +
      icon("book") +
      "Solucionario</a>" +
      '<div class="nav-label">Módulos del curso</div>' +
      modules
        .map(
          (m) =>
            '<a href="' +
            modLink(m.number) +
            '" class="nav-mod ' +
            (m.number === mod ? "active" : "") +
            '" ' +
            (m.number === mod ? 'aria-current="location"' : "") +
            '><span class="num">' +
            String(m.number).padStart(2, "0") +
            "</span><span>" +
            esc(m.title) +
            "</span></a>",
        )
        .join("");
  }
  function progressCard(list) {
    const count = done(list);
    return (
      '<section class="progress-card" aria-label="Progreso"><span class="icon-tile">' +
      icon("trend") +
      '</span><div class="progress-info"><div class="progress-line"><strong>Tu progreso</strong><span class="meta">' +
      count +
      " de " +
      list.length +
      " preguntas respondidas</span></div>" +
      meter(count, list.length) +
      '</div><a class="quiet" href="#respuestas">Mis respuestas</a></section>'
    );
  }
  function card(m) {
    const count = m.items.filter((a) => a.questions).length,
      finished = done(m.questions);
    return (
      '<a class="module-card" href="' +
      modLink(m.number) +
      '"><div class="card-top"><span class="icon-tile">' +
      icon(moduleIcons[m.number - 1]) +
      '</span><span class="eyebrow">Módulo ' +
      String(m.number).padStart(2, "0") +
      "</span></div><h3>" +
      esc(m.title) +
      '</h3><span class="meta">' +
      count +
      " apartados de estudio · " +
      m.questions.length +
      " preguntas</span>" +
      meter(finished, m.questions.length) +
      "</a>"
    );
  }
  function results() {
    const value = fold(query.trim()),
      out = $("#module-list");
    if (!value) {
      out.className = "cards";
      out.innerHTML = modules.map(card).join("");
      return;
    }
    const matches = [];
    for (const m of modules) {
      if (fold("Módulo " + m.number + " " + m.title).includes(value))
        matches.push(
          '<a class="result" href="' +
            modLink(m.number) +
            '"><span class="meta">Módulo ' +
            m.number +
            '</span><span class="rowtitle">' +
            esc(m.title) +
            "</span></a>",
        );
      for (const a of m.items)
        if (fold(a.id + " " + a.title).includes(value))
          matches.push(
            '<a class="result" href="' +
              link(a) +
              '"><span class="meta">Módulo ' +
              m.number +
              " · " +
              esc(a.id) +
              '</span><span class="rowtitle">' +
              esc(a.title) +
              "</span></a>",
          );
    }
    out.className = "panel";
    out.innerHTML = matches.length
      ? matches.join("")
      : '<p class="empty">No se han encontrado módulos ni apartados con ese nombre.</p>';
  }
  function home() {
    nav("home");
    crumb("Vista general");
    const last = items.get(lastId)?.a,
      go = last?.questions ? last : units[0];
    main.innerHTML =
      '<section class="hero"><div><p class="eyebrow">Economía · CV-0303</p><h1>Fundamentos<br>de Economía</h1><p class="hero-sub">11 módulos · 102 apartados de estudio · 612 preguntas</p><a class="button light" href="' +
      link(go) +
      '">' +
      icon("book") +
      (last ? "Continuar estudio" : "Empezar a estudiar") +
      '</a></div><a class="hero-art" href="#apartado/4.7" aria-label="Estudiar el equilibrio de mercado, apartado 4.7"><img src="assets/mercado.svg" alt="Curvas de oferta y demanda que se cruzan en el equilibrio E"><small>Equilibrio de mercado · Apartado 4.7</small></a></section>' +
      progressCard([...questions.values()]) +
      '<section><div class="section-head"><h2>Módulos del curso</h2><label class="searchbox">' +
      icon("search") +
      '<input type="search" id="find" placeholder="Buscar módulo o apartado" aria-label="Buscar módulo o apartado" value="' +
      esc(query) +
      '"></label></div><div id="module-list"></div></section>';
    results();
  }
  function itemName(a) {
    return /^\d/.test(a.id) ? a.id + ". " + a.title : a.title;
  }
  function modulePage(m) {
    nav("", m.number);
    crumb("Módulo " + m.number);
    const first = m.items.find((a) => a.questions);
    main.innerHTML =
      '<div class="eyebrow kicker">Módulo ' +
      String(m.number).padStart(2, "0") +
      " · Sesión " +
      m.number +
      '</div><h1 class="page-title">' +
      esc(m.title) +
      '</h1><div class="page-tools"><a class="button" href="' +
      link(first) +
      '">' +
      icon("book") +
      "Abrir primer apartado</a></div>" +
      progressCard(m.questions) +
      '<section class="panel"><h2>Índice del módulo</h2><div class="outline">' +
      m.items
        .map(
          (a) =>
            '<div class="list-row' +
            (a.questions ? "" : " inactive") +
            '"><a href="' +
            link(a) +
            '">' +
            (/^\d/.test(a.id)
              ? '<span class="code">' + esc(a.id) + "</span>"
              : "") +
            '<div><span class="rowtitle">' +
            esc(a.title) +
            "</span>" +
            (!a.questions
              ? '<p class="null-note">' + esc(a.note) + "</p>"
              : "") +
            "</div></a>" +
            (a.questions
              ? '<span class="meta">' + done(a.questions) + " / 6</span>"
              : "") +
            "</div>",
        )
        .join("") +
      "</div></section>";
  }
  function questionCard(q, num, solutionOpen = false) {
    const d = draft(q),
      isLong = q.type === "desarrollo";
    const qid = esc(q.id),
      titleId = "title-" + qid;
    let field = "";
    if (!isLong) {
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
        '</label><textarea class="answer-text ' +
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
              (d.choice === opt ? "checked" : "") +
              "><span>" +
              esc(opt) +
              "</span></label>",
          )
          .join("") +
        "</fieldset>";
      if (d.choice)
        field +=
          '<button class="plain" data-clear-choice>Quitar selección</button>';
    }
    const reference = window.REFERENCIAS[q.id];
    const label = isLong ? "modelo de respuesta" : "respuesta correcta";
    const grade = choiceGrade(q);
    const verdict = grade !== null
      ? '<strong class="choice-verdict">' +
        (grade ? "Tu opción es correcta." : "Tu opción es incorrecta.") +
        '</strong>'
      : "";
    const solution =
      '<details class="question-solution"' + (solutionOpen ? " open" : "") + '>' +
      '<summary><span class="when-closed">Ver ' + label + '</span>' +
      '<span class="when-open">Ocultar ' + label + '</span></summary>' +
      '<div class="solution-content">' + verdict + '<p>' + esc(reference) +
      '</p></div></details>';
    return (
      '<article class="q-card" data-q="' +
      qid +
      '"><span class="eyebrow">' +
      (isLong ? "Pregunta de desarrollo" : "Comprensión · " + num + " de 5") +
      '</span><h3 id="' +
      titleId +
      '">' +
      esc(q.prompt) +
      "</h3>" +
      field +
      solution +
      "</article>"
    );
  }
  function unitPage(a, m) {
    nav("", m.number);
    crumb(
      '<a href="' +
        modLink(m.number) +
        '">Módulo ' +
        m.number +
        '</a><span class="sep">/</span>Apartado ' +
        (/^\d/.test(a.id) ? esc(a.id) : "complementario"),
    );
    if (a.questions) remember(a.id);
    const navSelect =
      '<label class="section-menu"><span class="meta">Ir a un apartado</span><select id="item-select">' +
      m.items
        .map(
          (z) =>
            '<option value="' +
            esc(z.id) +
            '" ' +
            (a.id === z.id ? "selected" : "") +
            ">" +
            esc(itemName(z)) +
            "</option>",
        )
        .join("") +
      "</select></label>";
    const top =
      '<a class="link" href="' +
      modLink(m.number) +
      '">Módulo ' +
      m.number +
      " · " +
      esc(m.title) +
      '</a><h1 class="unit-title">' +
      esc(itemName(a)) +
      "</h1>" +
      navSelect;
    if (!a.questions) {
      main.innerHTML = top + '<div class="panel">' + esc(a.note) + "</div>";
      return;
    }
    const j = units.indexOf(a);
    const pageNav =
      '<div class="split section-foot">' +
      (j > 0
        ? '<a class="quiet" href="' +
          link(units[j - 1]) +
          '">Apartado anterior</a>'
        : "<span></span>") +
      (j < units.length - 1
        ? '<a class="button" href="' +
          link(units[j + 1]) +
          '">Siguiente apartado</a>'
        : '<a class="button" href="#respuestas">Revisar respuestas</a>') +
      "</div>";
    main.innerHTML =
      top +
      '<div class="meta">Compendio, p. ' +
      a.page +
      " · Lectura de origen, pp. " +
      esc(a.source) +
      ' · <a href="assets/compendio-color.pdf#page=' +
      a.page +
      '" target="_blank" rel="noopener">Ver página en PDF</a></div>' +
      '<section class="read-card"><h2>Ideas clave</h2>' +
      a.ideas.map((s) => "<p>" + esc(s) + "</p>").join("") +
      (a.table
        ? "<table><thead><tr>" +
          a.table[0]
            .map((c) => '<th scope="col">' + esc(c) + "</th>")
            .join("") +
          "</tr></thead><tbody>" +
          a.table
            .slice(1)
            .map(
              (r) =>
                "<tr>" +
                r.map((c) => "<td>" + esc(c) + "</td>").join("") +
                "</tr>",
            )
            .join("") +
          "</tbody></table>"
        : "") +
      (a.figure
        ? '<button class="figure-btn" data-zoom="' +
          esc(a.id) +
          '" aria-label="Ampliar gráfico"><img src="' +
          esc(a.figure.src) +
          '" alt="' +
          esc(a.figure.alt) +
          '"></button>'
        : "") +
      "</section>" +
      '<section class="practice"><div class="section-head"><h2>Preguntas del apartado</h2><span class="meta" id="unit-progress" aria-live="polite">' +
      done(a.questions) +
      " de 6 respondidas</span></div>" +
      a.questions.map((q, k) => questionCard(q, k + 1)).join("") +
      "</section>" +
      pageNav;
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
          titulo: a.title,
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
            if (value && d.mode === "eleccion") {
              row.opciones = q.options;
              row.correcta = choiceGrade(q);
            }
            if (includeModels) row.referencia = window.REFERENCIAS[q.id];
            return row;
          }),
        });
      }
      if (apartados.length)
        result.modulos.push({ numero: m.number, titulo: m.title, apartados });
    }
    return result;
  }
  function reviewOutline() {
    if (!answered() && !showPending)
      return (
        '<div class="empty">Aún no has respondido ninguna pregunta. <a class="link" href="' +
        link(units[0]) +
        '">Abrir el primer apartado</a></div>'
      );
    return modules
      .filter((m) => showPending || done(m.questions))
      .map(
        (m) =>
          '<details class="review-group"><summary>Módulo ' +
          m.number +
          " · " +
          esc(m.title) +
          " (" +
          done(m.questions) +
          " de " +
          m.questions.length +
          ")</summary>" +
          m.items
            .filter((a) => a.questions && (showPending || done(a.questions)))
            .map(
              (a) =>
                '<h3><a class="link" href="' +
                link(a) +
                '">' +
                esc(itemName(a)) +
                "</a></h3>" +
                a.questions
                  .filter((q) => showPending || response(q))
                  .map(
                    (q) =>
                      "<h4>" +
                      esc(q.prompt) +
                      '</h4><div class="answer-preview">' +
                      (response(q)
                        ? esc(response(q))
                        : '<span class="meta">Pendiente</span>') +
                      "</div>",
                  )
                  .join(""),
            )
            .join("") +
          "</details>",
      )
      .join("");
  }
  function review() {
    nav("answers");
    crumb("Mis respuestas");
    const count = answered();
    main.innerHTML =
      '<div class="eyebrow kicker">Cuaderno personal</div><h1 class="page-title">Mis respuestas</h1><p>' +
      count +
      " de " +
      questions.size +
      ' preguntas respondidas en este navegador.</p>' +
      scorePanel() +
      '<section class="panel"><h2>Descargar respuestas</h2><p>El documento reúne tus respuestas con su enunciado, módulo y apartado. Puedes compartirlo con la IA que elijas para la corrección.</p>' +
      '<label class="export-options"><input type="checkbox" id="models" ' +
      (includeModels ? "checked" : "") +
      '>Añadir las respuestas de referencia del solucionario para la evaluación</label><label class="export-options"><input type="checkbox" id="pending" ' +
      (showPending ? "checked" : "") +
      ">Incluir las preguntas pendientes</label>" +
      '<div class="actions"><button class="button" data-format="docx" ' +
      (!count && !showPending ? "disabled" : "") +
      ">" +
      icon("download") +
      'Descargar Word (.docx)</button><button class="button line" data-format="json" ' +
      (!count && !showPending ? "disabled" : "") +
      ">" +
      icon("download") +
      "Descargar JSON</button></div></section>" +
      '<section class="panel"><h2>Revisar por módulo</h2><div id="review-outline">' +
      reviewOutline() +
      "</div></section>";
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
    document.body.classList.remove("nav-open");
    $("#shade").hidden = true;
    $("#open-nav").setAttribute("aria-expanded", "false");
  }
  function solutionPage(m, a) {
    nav("solutions");
    crumb("Solucionario");
    const moduleOptions = modules.map((module) => {
      const first = module.items.find((item) => item.questions);
      return `<option value="${esc(first.id)}"${module === m ? " selected" : ""}>${module.number}. ${esc(module.title)}</option>`;
    }).join("");
    const itemOptions = m.items.filter((item) => item.questions).map((item) =>
      `<option value="${esc(item.id)}"${item === a ? " selected" : ""}>${esc(itemName(item))}</option>`
    ).join("");
    const answers = a.questions.map((q, i) => {
      const isEssay = q.type === "desarrollo";
      const questionLabel = isEssay ? "Pregunta de desarrollo" : `Comprensión · ${i + 1} de 5`;
      return `<article class="q-card" data-solution-id="${esc(q.id)}">
        <span class="eyebrow">${questionLabel}</span><h3>${esc(q.prompt)}</h3>
        <strong>${isEssay ? "Modelo de respuesta" : "Respuesta correcta"}</strong>
        <p class="answer-preview">${esc(window.REFERENCIAS[q.id])}</p>
      </article>`;
    }).join("");
    const navigate = (unit, text) =>
      unit ? `<a class="quiet" href="#solucionario/${encodeURIComponent(unit.id)}">${text}</a>` : "<span></span>";
    const position = units.indexOf(a);
    main.innerHTML = `<h1 class="page-title">Solucionario</h1>
      <p>Consulta las 510 respuestas de comprensión y los 102 modelos de desarrollo del curso.</p>
      <div class="panel">
        <label class="section-menu"><span class="meta">Módulo</span><select data-solution-select>${moduleOptions}</select></label>
        <label class="section-menu"><span class="meta">Apartado</span><select data-solution-select>${itemOptions}</select></label>
      </div>
      <div class="section-head"><h2>${esc(itemName(a))}</h2><a class="quiet" href="${link(a)}">Practicar este apartado</a></div>
      ${answers}
      <div class="split section-foot">${navigate(units[position - 1], "Apartado anterior")}${navigate(units[position + 1], "Siguiente apartado")}</div>`;
    main.querySelectorAll("[data-solution-select]").forEach((select) => {
      select.onchange = () => { location.hash = "#solucionario/" + encodeURIComponent(select.value); };
    });
  }
  function locate() {
    const [page, id] = location.hash.slice(1).split("/");
    if (page === "solucionario") {
      const selected = items.get(id);
      return { page, ...(selected?.a.questions ? selected : items.get(units[0].id)) };
    }
    if (page === "apartado") {
      try {
        const found = items.get(decodeURIComponent(id));
        if (found) return { page, ...found };
      } catch {}
    }
    if (page === "modulo") {
      const m = modules.find((m) => String(m.number) === id);
      if (m) return { page, m };
    }
    return { page: page === "respuestas" ? "respuestas" : "inicio" };
  }
  function render(focus = false) {
    closeNav();
    const route = locate();
    if (route.page === "modulo") modulePage(route.m);
    else if (route.page === "apartado") unitPage(route.a, route.m);
    else if (route.page === "respuestas") review();
    else if (route.page === "solucionario") solutionPage(route.m, route.a);
    else home();
    document.title =
      (route.a
        ? (route.page === "solucionario" ? "Solucionario · " : "") + itemName(route.a)
        : route.m
          ? route.m.title
          : route.page === "respuestas"
            ? "Mis respuestas"
            : "Fundamentos de Economía") + " · MBA Training";
    if (focus) {
      main.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }
  function updateCount() {
    const item = locate().a,
      elm = $("#unit-progress");
    if (elm && item) {
      const text = done(item.questions) + " de 6 respondidas";
      if (elm.textContent !== text) elm.textContent = text;
    }
  }
  function redrawCard(card, q, focusSel) {
    const a = locate().a;
    if (!a) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = questionCard(q, a.questions.indexOf(q) + 1, $(".question-solution", card).open);
    const fresh = wrap.firstElementChild;
    card.replaceWith(fresh);
    if (focusSel) $(focusSel, fresh)?.focus({ preventScroll: true });
    updateCount();
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
    updateCount();
  });
  main.addEventListener("change", (e) => {
    if (e.target.id === "item-select") {
      location.hash = "#apartado/" + encodeURIComponent(e.target.value);
      return;
    }
    if (["models", "pending"].includes(e.target.id)) {
      if (e.target.id === "models") includeModels = e.target.checked;
      else {
        showPending = e.target.checked;
        $("#review-outline").innerHTML = reviewOutline();
      }
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
    if (event.key === null) {
      drafts.clear();
      lastId = "";
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
    const card = main.querySelector('[data-q="' + q.id + '"]');
    if (card) redrawCard(card, q);
    else render();
  });
  const toggle = $("#open-nav");
  toggle.addEventListener("click", () => {
    document.body.classList.add("nav-open");
    $("#shade").hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    $("#close-nav").focus();
  });
  $("#close-nav").onclick = $("#shade").onclick = () => {
    closeNav();
    toggle.focus();
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
      closeNav();
      toggle.focus();
    }
  });
  $("#navigation").addEventListener("click", (e) => {
    if (e.target.closest("a")) closeNav();
  });
  $(".close-dialog").onclick = () => $("#figure-dialog").close();
  $("#figure-dialog").addEventListener("click", (e) => {
    if (e.target === $("#figure-dialog")) $("#figure-dialog").close();
  });
  document
    .querySelectorAll("[data-icon]")
    .forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
  window.addEventListener("hashchange", () => render(true));
  render();
})();
