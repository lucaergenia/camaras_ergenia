import { STATUS } from "../constants.js";
import { state, setCurrentStation, getStationById } from "../state.js";
import { createStreamCard, initStreamCard, suspendStreamCard, resumeStreamCard } from "../stream.js";
import { updateMetric, setOverallStatus } from "../ui/status.js";

export function showStation(stationId, onBack) {
  const station = getStationById(stationId);
  if (!station) {
    return;
  }

  setCurrentStation(stationId);

  const landing = document.getElementById("landing-view");
  const view = document.getElementById("station-view");
  if (!view) return;

  if (landing) {
    landing.classList.add("hidden");
  }

  view.innerHTML = `
    <div class="station-toolbar">
      <div class="toolbar-left">
        <button type="button" class="back-btn" data-role="back">Volver</button>
        <span class="station-title">${station.name}</span>
      </div>
      <div class="toolbar-meta">${station.feeds.length} cámaras</div>
    </div>
    <div class="stream-grid" data-role="grid"></div>
  `;

  const backButton = view.querySelector('[data-role="back"]');
  if (backButton && typeof onBack === "function") {
    backButton.addEventListener("click", onBack);
  }

  view.classList.remove("hidden");
  view.classList.add("active");
  delete view.dataset.suspended;

  const grid = view.querySelector('[data-role="grid"]');
  if (!grid) return;

  const refresh = () => refreshSummary(view);

  if (!station.feeds || station.feeds.length <= 2) {
    grid.classList.add("single-column");
  } else {
    grid.classList.remove("single-column");
  }

  if (!station.feeds || station.feeds.length === 0) {
    const message =
      station.description || "Cámaras no habilitadas por el momento.";
    grid.innerHTML = `<div class="station-empty station-unavailable">${message}</div>`;
    refresh();
    return;
  }

  station.feeds.forEach((feed, index) => {
    const position = index + 1;
    const card = createStreamCard(station, feed, position, station.feeds.length);
    grid.appendChild(card);
    initStreamCard(card, feed, refresh);
  });

  refresh();
}

export function showLandingView() {
  setCurrentStation(null);
  const landing = document.getElementById("landing-view");
  const view = document.getElementById("station-view");

  if (view) {
    const streams = view.querySelectorAll(".stream-img");
    streams.forEach((img) => {
      img.src = "";
    });
    delete view.dataset.suspended;
    view.classList.remove("active");
    view.classList.add("hidden");
    view.innerHTML = "";
  }

  if (landing) {
    landing.classList.remove("hidden");
  }
}

function refreshSummary(view) {
  const cards = Array.from(view.querySelectorAll(".stream-card"));
  const totalVisible = cards.length;
  const liveCount = cards.filter((card) => card.dataset.status === STATUS.LIVE).length;
  const errorCount = cards.filter((card) => card.dataset.status === STATUS.ERROR).length;

  updateMetric("metric-total", state.totalStreams || totalVisible || "--");
  updateMetric("metric-live", liveCount);
  updateMetric("metric-alerts", errorCount);

  if (totalVisible === 0) {
    setOverallStatus("Sin transmisión", "status-idle");
    return;
  }

  if (errorCount > 0) {
    const label = `${errorCount} transmisión${errorCount === 1 ? "" : "es"} con error`;
    setOverallStatus(label, "status-error");
    return;
  }

  if (liveCount > 0) {
    const label = `${liveCount} en vivo`;
    setOverallStatus(label, "status-live");
    return;
  }

  setOverallStatus("En espera", "status-idle");
}

export function suspendStationView() {
  const view = document.getElementById("station-view");
  if (!view || !view.classList.contains("active") || view.dataset.suspended === "true") {
    return;
  }

  const cards = Array.from(view.querySelectorAll(".stream-card"));
  if (cards.length === 0) {
    return;
  }

  view.dataset.suspended = "true";
  cards.forEach((card) => suspendStreamCard(card));
}

export function resumeStationView() {
  const view = document.getElementById("station-view");
  if (!view || !view.classList.contains("active") || view.dataset.suspended !== "true") {
    return;
  }

  const cards = Array.from(view.querySelectorAll(".stream-card"));
  if (cards.length === 0) {
    view.dataset.suspended = "false";
    return;
  }

  view.dataset.suspended = "false";
  cards.forEach((card) => resumeStreamCard(card));
}
