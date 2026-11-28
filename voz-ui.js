(() => {
  "use strict";

  const symbols = {
    play: '<path d="M8 4.8c0-.8.9-1.3 1.6-.8l10.2 7.2a1 1 0 0 1 0 1.6L9.6 20c-.7.5-1.6 0-1.6-.8z" fill="currentColor"/>',
    pause: '<path d="M8.5 5v14m7-14v14" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>',
    stop: '<rect x="5.5" y="5.5" width="13" height="13" rx="2" fill="currentColor"/>',
    voices: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 7h6m4 0h8M3 17h12m4 0h2"/><circle cx="11" cy="7" r="2"/><circle cx="17" cy="17" r="2"/></g>',
  };
  const icon = (name) =>
    `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">${symbols[name]}</svg>`;
  const rates = [0.75, 1, 1.25, 1.5, 1.75, 2];
  const rateText = (rate) => Number(rate).toLocaleString("es") + "×";
  let instanceNumber = 0;

  function mount(host, actions) {
    const voiceSettingsId = "voces-lectura-" + ++instanceNumber;
    const player = document.createElement("div");
    player.className = "voice-player";
    player.setAttribute("role", "group");
    player.setAttribute("aria-label", "Lectura en voz alta");
    player.innerHTML = `<div class="voice-row">
      <button type="button" class="voice-main">
        <span data-speech-play>${icon("play")}</span><span data-speech-pause hidden>${icon("pause")}</span>
        <span data-speech-label>Escuchar</span>
      </button>
      <button type="button" class="voice-control voice-stop" hidden aria-label="Detener lectura" title="Detener lectura">${icon("stop")}</button>
      <div class="voice-options">
        <select class="voice-rate" aria-label="Velocidad de lectura" title="Velocidad de lectura">
          ${rates.map((rate) => `<option value="${rate}"${rate === 1 ? " selected" : ""}>${rateText(rate)}</option>`).join("")}
        </select>
        <button type="button" class="voice-control voice-settings" aria-expanded="false"
          aria-controls="${voiceSettingsId}" aria-label="Elegir voz" title="Elegir voz" hidden>${icon("voices")}</button>
      </div></div>
      <label class="voice-choice" id="${voiceSettingsId}" hidden>
        <span>Voz de lectura</span><select></select></label>
      <p class="voice-status" role="status" aria-live="polite" aria-atomic="true"></p>`;
    host.replaceChildren(player);
    const find = (selector) => player.querySelector(selector);
    const toggle = find(".voice-main"), stop = find(".voice-stop");
    const playIcon = find("[data-speech-play]"), pauseIcon = find("[data-speech-pause]");
    const label = find("[data-speech-label]"), statusText = find(".voice-status");
    const rateSelect = find(".voice-rate"), settings = find(".voice-settings");
    const voiceField = find(".voice-choice"), voiceSelect = find(".voice-choice select");
    const header = host.closest(".shell")?.querySelector(".topbar");
    const headerSize = header && window.ResizeObserver && new ResizeObserver(() => {
      host.style.setProperty("--voice-header-height", header.getBoundingClientRect().height + "px");
    });
    headerSize?.observe(header);
    let currentStatus = "idle";

    toggle.addEventListener("click", () => {
      if (currentStatus === "playing") actions.onPause();
      else if (currentStatus === "paused") actions.onResume();
      else actions.onPlay();
    });
    stop.addEventListener("click", () => {
      actions.onStop();
      toggle.focus({ preventScroll: true });
    });
    rateSelect.addEventListener("change", () => actions.onRate(Number(rateSelect.value)));
    settings.addEventListener("click", () => {
      voiceField.hidden = !voiceField.hidden;
      settings.setAttribute("aria-expanded", String(!voiceField.hidden));
      if (!voiceField.hidden) voiceSelect.focus({ preventScroll: true });
    });
    voiceSelect.addEventListener("change", () => actions.onVoice(voiceSelect.value));

    function update({ status = "idle", rate = 1, voice = "", voices = [], message = "" }) {
      currentStatus = status;
      const playing = status === "playing", paused = status === "paused";
      host.classList.toggle("voice-active", playing || paused);
      const unavailable = status === "unavailable";
      const loading = status === "loading";
      label.textContent = playing ? "Pausar" : paused ? "Reanudar" :
        loading ? "Cargando…" : status === "error" ? "Reintentar" : "Escuchar";
      playIcon.hidden = playing;
      pauseIcon.hidden = !playing;
      toggle.disabled = unavailable || loading;
      stop.hidden = !(playing || paused || loading);
      rateSelect.hidden = unavailable;
      rateSelect.value = String(rate);

      const canChoose = !unavailable && voices.length > 1;
      settings.hidden = !canChoose;
      if (!canChoose) {
        voiceField.hidden = true;
        settings.setAttribute("aria-expanded", "false");
      } else {
        const options = [{ id: "", label: "Automática" }, ...voices];
        if (options.length !== voiceSelect.length || options.some((item, i) =>
          voiceSelect.options[i].value !== item.id || voiceSelect.options[i].text !== item.label)) {
          voiceSelect.replaceChildren(...options.map((item) => new Option(item.label, item.id)));
        }
        voiceSelect.value = voices.some((item) => item.id === voice) ? voice : "";
      }
      const feedback = message || (unavailable ? "La lectura en voz alta no está disponible en este navegador." :
        status === "error" ? "No se pudo reproducir la lectura. Puedes volver a intentarlo." : "");
      const announcement = feedback || (playing ? "Lectura en curso." : paused ? "Lectura en pausa." : "");
      statusText.classList.toggle("voice-status-hidden", !feedback);
      if (statusText.textContent !== announcement) statusText.textContent = announcement;
    }

    function destroy() {
      headerSize?.disconnect();
      host.style.removeProperty("--voice-header-height");
      host.classList.remove("voice-active");
      player.remove();
    }
    return { update, destroy };
  }
  window.controlesVoz = Object.freeze({ mount, rates: Object.freeze(rates) });
})();
