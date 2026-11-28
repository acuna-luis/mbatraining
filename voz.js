(() => {
  "use strict";

  const controlsUI = window.controlesVoz;
  if (!controlsUI) return;
  const synth = window.speechSynthesis;
  const canSpeak = Boolean(synth && window.SpeechSynthesisUtterance);
  const storageKey = "mba.economia.lectura.v1";
  const recordingId = "grabacion";
  const recordingName = "Grabación del curso";
  const speeds = controlsUI.rates;
  let rate = 1, preferred = "";
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
    if (speeds.includes(saved.rate)) rate = saved.rate;
    if (typeof saved.voice === "string") preferred = saved.voice;
  } catch { /* La lectura también funciona sin almacenamiento del navegador. */ }

  let root, host, controls;
  let voices = [], catalogHasVoices = false;
  let status = "idle", message = "";
  let parts = [], index = 0, offset = 0;
  let utterance, readingVoice, audio, playRequest, startTimer, audioStartTimer;
  let triedSpeech = false, triedRecording = false;

  function savePreferences() {
    try { localStorage.setItem(storageKey, JSON.stringify({ rate, voice: preferred })); }
    catch { /* Las preferencias duran esta sesión. */ }
  }

  const voiceId = (voice) => JSON.stringify([voice.voiceURI, voice.lang, voice.name]);
  function voiceScore(voice) {
    // Los navegadores solo publican nombre, idioma y proveedor. Priorizamos
    // voces españolas identificables entre las que el dispositivo ofrece.
    const name = voice.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const known = /(?:^|[^a-z])(monica|paulina|angelica|marisol|sabina|helena|elena|laura|elvira|isidora|ximena|arabella|abril|estrella|irene|laia|triana|vera|dalia|salome|catalina|lucia|lupe|penelope|conchita|andrea|annie|paloma|maria|isabel|teresa)(?:neural|multilingual|[^a-z]|$)/.test(name);
    const enhanced = /natural|neural|premium|enhanced|mejorada/.test(name);
    const compact = /compact|e[- ]?speak/i.test(name + " " + voice.voiceURI);
    return Number(known || /\b(?:female\d*|femenina|mujer)\b/.test(name)) * 100 +
      Number(enhanced) * 60 - Number(compact) * 50 +
      Number(Boolean(voice.default)) * 6 +
      Number(/^es[-_]ES$/i.test(voice.lang) || (voice.lang === "es" && name.includes("(spain)"))) * 5;
  }

  function loadVoices() {
    let available = [];
    try { if (canSpeak) available = synth.getVoices(); }
    catch { /* El catálogo puede no estar disponible aunque exista la API. */ }
    catalogHasVoices = available.length > 0;
    const spanish = available.filter((voice) => /^es(?:[-_]|$)/i.test(voice.lang));
    voices = Array.from(new Map(spanish.map((v) => [voiceId(v), v])).values());
    voices.sort((a, b) => voiceScore(b) - voiceScore(a) || a.name.localeCompare(b.name, "es"));
    publish();
  }

  function publish() {
    if (!controls) return;
    const options = voices.map((v) => ({ id: voiceId(v), label: v.name + " · " + v.lang }));
    if (host.dataset.vozAudio) options.push({ id: recordingId, label: recordingName });
    const currentAutomatic = !preferred && (audio ? recordingName : readingVoice?.name);
    const automatic = currentAutomatic || voices[0]?.name || (host.dataset.vozAudio ? recordingName : "");
    controls.update({
      status, message, rate, voices: options,
      voice: options.some((option) => option.id === preferred) ? preferred : "",
      autoLabel: automatic ? "Automática · " + automatic : "Automática",
    });
  }

  function setStatus(next, text = "") {
    status = next;
    message = text;
    publish();
  }

  function visible(element) {
    if (!element?.isConnected || !element.getClientRects().length ||
        element.closest('[hidden], [aria-hidden="true"], [data-voz], input, textarea, select, script, style')) return false;
    const css = getComputedStyle(element);
    if (css.visibility === "hidden" || css.visibility === "collapse") return false;
    // Incluso un <summary> anidado desaparece al cerrar un <details> exterior.
    for (let node = element; node; node = node.parentElement) {
      if (node.tagName === "DETAILS" && !node.open && !node.querySelector(":scope > summary")?.contains(element)) return false;
    }
    return true;
  }

  function spokenText(element) {
    if (element.dataset.vozTexto) return element.dataset.vozTexto;
    if (element.tagName === "IMG") return element.alt;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const fragments = [];
    while (walker.nextNode()) {
      const node = walker.currentNode, parent = node.parentElement;
      if (!parent.closest("button, [data-voz]") && visible(parent)) fragments.push(node.textContent);
    }
    return fragments.join(" ");
  }

  function splitText(value) {
    let text = value.replace(/\s+/gu, " ").trim();
    const chunks = [];
    // En algunos motores móviles los enunciados largos se interrumpen antes de terminar.
    while (text.length > 140) {
      const window = text.slice(0, 141);
      const pause = [...window.matchAll(/[.!?…,;:]\s+/g)].pop();
      const space = window.lastIndexOf(" ");
      const end = pause ? pause.index + 1 : space > 0 ? space : 140;
      chunks.push(text.slice(0, end));
      text = text.slice(end).trimStart();
    }
    if (text) chunks.push(text);
    return chunks;
  }

  function readParts() {
    return [...root.querySelectorAll("[data-voz-texto]")].filter((element) =>
      visible(element) && !element.parentElement.closest("[data-voz-texto]")
    ).flatMap((element) => splitText(spokenText(element)).map((text) => ({ element, text })));
  }

  function cancelUtterance() {
    if (!utterance) return;
    clearTimeout(startTimer);
    utterance = undefined; // Descarta eventos tardíos de la locución cancelada.
    synth.cancel();
  }

  function releaseAudio() {
    if (!audio) return;
    const previous = audio;
    audio = undefined;
    clearTimeout(audioStartTimer);
    playRequest = undefined;
    previous.onended = previous.onerror = previous.onpause = previous.onplaying = null;
    previous.pause();
    previous.removeAttribute("src");
    previous.load();
  }

  function reset() {
    cancelUtterance();
    releaseAudio();
    parts = [];
    index = offset = 0;
    triedSpeech = triedRecording = false;
    readingVoice = undefined;
  }

  function detener() {
    reset();
    setStatus(canSpeak || host?.dataset.vozAudio ? "idle" : "unavailable");
  }

  function finish() {
    reset();
    setStatus("idle", "Lectura terminada.");
  }

  function fail(text) {
    reset();
    setStatus("error", text);
  }

  function speechFailed(text) {
    if (!host?.dataset.vozAudio || triedRecording) { fail(text); return; }
    cancelUtterance();
    parts = [];
    readingVoice = undefined;
    startRecording("La voz del navegador no ha podido leer. Se reproduce la grabación desde el inicio.");
  }

  function sayPart() {
    while (index < parts.length && !visible(parts[index].element)) {
      index++;
      offset = 0;
    }
    if (index >= parts.length) { finish(); return; }
    const start = offset;
    const line = new SpeechSynthesisUtterance(parts[index].text.slice(start));
    const voice = readingVoice;
    if (voice) line.voice = voice;
    line.lang = voice?.lang.replace("_", "-") || "es-ES";
    line.rate = rate;
    utterance = line;
    // Hay motores instalados que no notifican siquiera un error si no tienen voz.
    startTimer = setTimeout(() => {
      if (utterance !== line) return;
      cancelUtterance();
      loadVoices();
      if (!voice && voices.length) {
        readingVoice = selectedVoice();
        sayPart();
      } else speechFailed("La voz del dispositivo no ha empezado a leer. Comprueba los ajustes de voz en español.");
    }, host.dataset.vozAudio ? 5000 : 10000);
    line.onstart = () => { if (utterance === line) clearTimeout(startTimer); };
    line.onboundary = (event) => {
      if (utterance !== line) return;
      clearTimeout(startTimer);
      if (event.name !== "sentence" && Number.isInteger(event.charIndex) &&
          event.charIndex >= 0 && event.charIndex < line.text.length) offset = start + event.charIndex;
    };
    line.onend = () => {
      if (utterance !== line) return;
      clearTimeout(startTimer);
      utterance = undefined;
      index++;
      offset = 0;
      sayPart();
    };
    line.onerror = (event) => {
      if (utterance !== line) return;
      clearTimeout(startTimer);
      utterance = undefined;
      if (event.error === "canceled" || event.error === "interrupted") {
        setStatus("paused");
        return;
      }
      const unavailable = ["synthesis-unavailable", "language-unavailable", "voice-unavailable"].includes(event.error);
      speechFailed(unavailable
        ? "El dispositivo no tiene una voz española disponible. Puedes añadirla en los ajustes de voz."
        : "No se ha podido reproducir la voz.");
    };
    try {
      if (synth.paused) synth.resume();
      synth.speak(line);
    } catch { speechFailed("No se ha podido iniciar la lectura en este navegador."); }
  }

  function startSpeech(explanation = "") {
    if (!canSpeak) { fail("La voz no está disponible en este navegador."); return; }
    triedSpeech = true;
    readingVoice = selectedVoice();
    parts = readParts();
    index = offset = 0;
    if (!parts.length) { setStatus("idle", "No hay contenido visible para leer."); return; }
    setStatus("playing", explanation);
    sayPart();
  }

  function recordingStarted(track) {
    if (audio !== track || track.paused || track.ended) return;
    clearTimeout(audioStartTimer);
    if (status !== "playing") setStatus("playing", message);
  }

  function playRecording(explanation = "") {
    const track = audio;
    const attempt = Symbol();
    playRequest = attempt;
    setStatus("loading", explanation);
    clearTimeout(audioStartTimer);
    // Algunos reproductores dejan play() pendiente sin recibir datos ni emitir error.
    audioStartTimer = setTimeout(() => {
      if (audio === track && playRequest === attempt && status === "loading") {
        fallbackRecording(track);
      }
    }, 15000);

    function rejected(error) {
      if (audio !== track || playRequest !== attempt || status !== "loading") return;
      if (error.name === "NotAllowedError") {
        clearTimeout(audioStartTimer);
        setStatus("paused", "Pulsa Reanudar para escuchar la grabación del curso.");
      } else fallbackRecording(track);
    }
    try {
      track.play()?.then(() => {
        if (playRequest === attempt) recordingStarted(track);
      }, rejected);
    } catch (error) { rejected(error); }
  }

  function fallbackRecording(track) {
    if (audio !== track) return;
    releaseAudio();
    loadVoices();
    if (!triedSpeech && canSpeak && (voices.length || !catalogHasVoices) &&
        (status === "playing" || status === "loading"))
      startSpeech("La grabación no está disponible. Se usa la voz del navegador.");
    else fail("No se ha podido cargar el audio. Comprueba la conexión y vuelve a intentarlo.");
  }

  function startRecording(explanation = "") {
    triedRecording = true;
    const track = new Audio(host.dataset.vozAudio);
    audio = track;
    track.playbackRate = rate;
    track.onended = () => { if (audio === track) finish(); };
    track.onpause = () => {
      if (audio === track && track.paused && !track.ended && (status === "playing" || status === "loading")) {
        clearTimeout(audioStartTimer);
        playRequest = undefined;
        setStatus("paused");
      }
    };
    track.onplaying = () => recordingStarted(track);
    track.onerror = () => fallbackRecording(track);
    playRecording(explanation);
  }

  function useRecording() {
    return Boolean(host?.dataset.vozAudio && (preferred === recordingId || !voices.length));
  }

  function selectedVoice() {
    return voices.find((voice) => voiceId(voice) === preferred) || voices[0];
  }

  function play() {
    if (!host?.isConnected) return;
    reset();
    loadVoices();
    if (useRecording()) startRecording(preferred === recordingId ? "" :
      "Se usa la grabación del curso porque el navegador no ha ofrecido una voz en español.");
    else startSpeech();
  }

  function pause() {
    if (status !== "playing") return;
    // Android puede convertir pause() en cancel(). Conservamos la última palabra
    // notificada o, en voces sin límites de palabra, el inicio de la frase breve.
    if (audio) {
      playRequest = undefined;
      audio.pause();
    }
    else cancelUtterance();
    setStatus("paused");
  }

  function resume() {
    if (status !== "paused") return;
    if (audio) playRecording();
    else {
      setStatus("playing");
      sayPart();
    }
  }

  function setRate(value) {
    const next = Number(value);
    if (!speeds.includes(next) || next === rate) return;
    rate = next;
    savePreferences();
    if (audio) audio.playbackRate = rate;
    else if (status === "playing") {
      cancelUtterance();
      sayPart();
    }
    publish();
  }

  function setVoice(value) {
    if (value === preferred) return;
    if (value && !voices.some((voice) => voiceId(voice) === value) &&
        !(value === recordingId && host?.dataset.vozAudio)) return;
    preferred = value;
    savePreferences();
    if (!audio && parts.length) readingVoice = selectedVoice();
    if ((status === "playing" || status === "loading" || status === "paused") &&
        Boolean(audio) !== useRecording()) {
      if (status === "paused") detener();
      else play();
    } else if (status === "playing" && !audio) {
      cancelUtterance();
      sayPart();
    }
    publish();
  }

  function checkDisclosure() {
    if (utterance && parts[index] && !visible(parts[index].element)) {
      cancelUtterance();
      sayPart();
    }
  }

  function montar(container) {
    const nextHost = container.querySelector("[data-voz]");
    if (host === nextHost && host?.isConnected) return;
    reset();
    root?.removeEventListener("toggle", checkDisclosure, true);
    controls?.destroy();
    controls = undefined;
    root = container;
    host = nextHost;
    if (!host) return;
    controls = controlsUI.mount(host, {
      onPlay: play, onPause: pause, onResume: resume, onStop: detener,
      onRate: setRate, onVoice: setVoice,
    });
    root.addEventListener("toggle", checkDisclosure, true);
    setStatus(canSpeak || host.dataset.vozAudio ? "idle" : "unavailable",
      canSpeak || host.dataset.vozAudio ? "" : "Este navegador no dispone de lectura en voz alta.");
    loadVoices();
  }

  if (canSpeak) {
    synth.addEventListener("voiceschanged", loadVoices);
    loadVoices();
  }
  window.addEventListener("hashchange", detener);
  window.addEventListener("pagehide", detener);
  window.voz = Object.freeze({ montar, detener, get reproduciendo() { return status === "playing" && Boolean(host?.isConnected); } });
})();
