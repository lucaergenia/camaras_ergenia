export async function fetchStations() {
  const response = await fetch("/api/stations");
  if (!response.ok) {
    throw new Error("No se pudo obtener la configuración de estaciones");
  }
  const payload = await response.json();
  return payload.stations ?? [];
}
