import { STATUS, STATUS_DICTIONARY } from "./constants.js";

export function createStreamCard(station, feed, position, total) {
  const card = document.createElement("article");
  card.className = "stream-card";
  card.dataset.streamId = feed.id;
  card.dataset.status = STATUS.IDLE;
  card.dataset.rtsp = feed.rtsp_url;
  card.dataset.mjpeg = feed.mjpeg_url;

  card.innerHTML = `
    <header class="stream-header">
      <div class="header-left">
        <span class="feed-label">${feed.label}</span>
        <span class="feed-meta">Puerto ${extractPort(feed.rtsp_url)} · ${position}/${total}</span>
      </div>
      <span class="status-chip status-idle" data-role="status-chip">${STATUS_DICTIONARY[STATUS.IDLE].label}</span>
    </header>
    <div class="stream-frame">
      <img class="stream-img" data-role="stream" alt="${feed.label}" decoding="async" />
      <div class="stream-overlay" data-role="overlay">
        <span class="status-tag" data-role="status-tag">${STATUS_DICTIONARY[STATUS.IDLE].tag}</span>
        <div class="indicator" data-role="indicator">${STATUS_DICTIONARY[STATUS.IDLE].indicator}</div>
      </div>
    </div>
    <footer class="stream-footer">
      <button type="button" data-role="action" class="action-btn" disabled>En espera</button>
    </footer>
  `;

  if (feed.description) {
    card.title = `${station.name} · ${feed.description}`;
  }

  return card;
}

export function initStreamCard(card, feed, onStatusChange) {
  const action = card.querySelector('[data-role="action"]');
  if (action) {
    action.addEventListener("click", () => {
      if (card.dataset.status === STATUS.ERROR) {
        reloadStream(card, feed, onStatusChange, true);
      }
    });
  }

  const img = card.querySelector('[data-role="stream"]');
  if (!img) return;

  img.addEventListener("load", () => {
    setStreamStatus(card, STATUS.LIVE, "Señal establecida", onStatusChange);
  });

  img.addEventListener("error", () => {
    setStreamStatus(card, STATUS.ERROR, "Fallo de conexión", onStatusChange);
    scheduleRetry(card, feed, onStatusChange);
  });

  reloadStream(card, feed, onStatusChange);
}

function reloadStream(card, feed, onStatusChange, manual = false) {
  const img = card.querySelector('[data-role="stream"]');
  if (!img) return;

  const url = `${feed.mjpeg_url}?stream=${encodeURIComponent(feed.id)}&t=${Date.now()}`;
  img.src = "";

  const indicator =
    manual && STATUS_DICTIONARY[STATUS.IDLE]
      ? "Reconectando..."
      : STATUS_DICTIONARY[STATUS.IDLE].indicator;

  setStreamStatus(card, STATUS.IDLE, indicator, onStatusChange);

  requestAnimationFrame(() => {
    img.src = url;
  });
}

function scheduleRetry(card, feed, onStatusChange) {
  if (card.dataset.retrying === "true") {
    return;
  }

  card.dataset.retrying = "true";
  setTimeout(() => {
    card.dataset.retrying = "false";
    reloadStream(card, feed, onStatusChange);
  }, 4000);
}

function setStreamStatus(card, status, indicatorOverride, onStatusChange) {
  const dictionary = STATUS_DICTIONARY[status] ?? STATUS_DICTIONARY[STATUS.IDLE];
  const chip = card.querySelector('[data-role="status-chip"]');
  const tag = card.querySelector('[data-role="status-tag"]');
  const indicator = card.querySelector('[data-role="indicator"]');
  const action = card.querySelector('[data-role="action"]');

  if (chip) {
    chip.textContent = dictionary.label;
    chip.classList.remove("status-live", "status-idle", "status-error");
    chip.classList.add(dictionary.chipClass);
  }

  if (tag) {
    tag.textContent = dictionary.tag;
    tag.dataset.status = status;
  }

  if (indicator) {
    indicator.textContent = indicatorOverride || dictionary.indicator;
    indicator.dataset.status = status;
  }

  if (action) {
    action.classList.remove("is-live", "is-error", "is-idle");
    if (status === STATUS.LIVE) {
      action.textContent = "Disponible";
      action.disabled = true;
      action.classList.add("is-live");
    } else if (status === STATUS.ERROR) {
      action.textContent = "Reintentar";
      action.disabled = false;
      action.classList.add("is-error");
    } else {
      action.textContent = "En espera";
      action.disabled = true;
      action.classList.add("is-idle");
    }
  }

  card.dataset.status = status;

  if (typeof onStatusChange === "function") {
    onStatusChange();
  }
}

function extractPort(rtspUrl) {
  const match = rtspUrl?.match(/:(\d+)(?:\/|$)/);
  return match ? match[1] : "--";
}
