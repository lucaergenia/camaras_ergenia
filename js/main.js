import { fetchStations } from "./api.js";
import { setStations } from "./state.js";
import { renderLanding, renderLandingError } from "./ui/landing.js";
import { showStation, showLandingView } from "./views/station.js";

document.addEventListener("DOMContentLoaded", bootstrap);

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
  showStation(stationId, () => {
    showLandingView();
    renderLanding(handleStationSelected);
  });
}
