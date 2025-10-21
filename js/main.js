import { fetchStations } from "./api.js";
import { state, setStations } from "./state.js";
import { renderLanding, renderLandingError } from "./ui/landing.js";
import { showStation, showLandingView, suspendStationView, resumeStationView } from "./views/station.js";

document.addEventListener("DOMContentLoaded", bootstrap);
document.addEventListener("visibilitychange", handleVisibilityChange);

let shouldResumeStreams = false;

async function bootstrap() {
  try {
    const stations = await fetchStations();
    setStations(stations);
    showLandingView();
    renderLanding(handleStationSelected);
  } catch (error) {
    showLandingView();
    renderLandingError(error);
  }
}

function handleStationSelected(stationId) {
  shouldResumeStreams = false;

  const onBack = () => {
    shouldResumeStreams = false;
    showLandingView();
    renderLanding(handleStationSelected);
  };

  showStation(stationId, onBack);
}

function handleVisibilityChange() {
  if (document.visibilityState === "hidden") {
    if (!state.currentStationId) {
      shouldResumeStreams = false;
      return;
    }

    suspendStationView();
    const view = document.getElementById("station-view");
    shouldResumeStreams = Boolean(view && view.dataset.suspended === "true");
    return;
  }

  if (document.visibilityState === "visible") {
    if (!shouldResumeStreams || !state.currentStationId) {
      return;
    }

    shouldResumeStreams = false;
    resumeStationView();
  }
}
