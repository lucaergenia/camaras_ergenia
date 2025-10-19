import { STATUS } from "../constants.js";
import { state, setCurrentStation, getStationById } from "../state.js";
import { createStreamCard, initStreamCard } from "../stream.js";
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

  const grid = view.querySelector('[data-role="grid"]');
  if (!grid) return;

  const refresh = () => refreshSummary(view);

  station.feeds.forEach((feed, index) => {
    const position = index + 1;
    const card = createStreamCard(station, feed, position, station.feeds.length);
    grid.appendChild(card);
    initStreamCard(card, feed, refresh);
  });

  refresh();
}

export function showLandingView() {
  const landing = document.getElementById("landing-view");
  const view = document.getElementById("station-view");

  if (view) {
    const streams = view.querySelectorAll(".stream-img");
    streams.forEach((img) => {
      img.src = "";
    });
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
