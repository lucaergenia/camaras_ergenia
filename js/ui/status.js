const STATUS_CLASSES = ["status-live", "status-error", "status-idle"];

export function updateMetric(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent =
    typeof value === "number" && Number.isFinite(value) ? value : value ?? "--";
}

export function setOverallStatus(text, statusClass) {
  const chip = document.getElementById("overall-status");
  if (!chip) return;
  chip.textContent = text;
  chip.classList.remove(...STATUS_CLASSES);
  if (statusClass) {
    chip.classList.add(statusClass);
  }
}
