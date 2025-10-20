import { state } from "../state.js";
import { updateMetric, setOverallStatus } from "./status.js";

export function renderLanding(onStationSelected) {
  const landing = document.getElementById("landing-view");
  const container = document.getElementById("station-buttons");
  if (!landing || !container) {
    return;
  }

  landing.classList.remove("hidden");
  container.innerHTML = "";

  if (state.stations.length <= 2) {
    container.classList.add("single-column");
  } else {
    container.classList.remove("single-column");
  }

  if (state.stations.length === 0) {
    const empty = document.createElement("div");
    empty.className = "station-empty";
    empty.textContent = "No hay estaciones configuradas.";
    container.appendChild(empty);
  } else {
    state.stations.forEach((station) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "station-button";
      button.innerHTML = `
        <span>${station.name}</span>
        <span>${station.feeds.length} cámaras</span>
      `;
      button.addEventListener("click", () => {
        if (typeof onStationSelected === "function") {
          onStationSelected(station.id);
        }
      });
      container.appendChild(button);
    });
  }

  updateMetric("metric-total", state.totalStreams || "--");
  updateMetric("metric-live", 0);
  updateMetric("metric-alerts", 0);
  setOverallStatus("Sin transmisión", "status-idle");
}

export function renderLandingError(error) {
  const landing = document.getElementById("landing-view");
  const container = document.getElementById("station-buttons");
  if (landing) {
    landing.classList.remove("hidden");
  }
  if (container) {
    container.innerHTML = `
      <div class="station-empty">
        No se pudo conectar al backend. Verifique el servidor FastAPI.
      </div>
    `;
  }

  updateMetric("metric-total", "--");
  updateMetric("metric-live", "--");
  updateMetric("metric-alerts", "--");
  setOverallStatus("Backend no disponible", "status-error");

  // Mantener el error visible en consola para depuración.
  if (error) {
    console.error("Error al cargar estaciones:", error);
  }
}
