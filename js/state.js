export const state = {
  stations: [],
  currentStationId: null,
  totalStreams: 0,
};

export function setStations(stations) {
  state.stations = Array.isArray(stations) ? stations : [];
  state.totalStreams = state.stations.reduce(
    (count, station) => count + (station.feeds ? station.feeds.length : 0),
    0,
  );
}

export function setCurrentStation(stationId) {
  state.currentStationId = stationId ?? null;
}

export function getStationById(stationId) {
  return state.stations.find((station) => station.id === stationId);
}
