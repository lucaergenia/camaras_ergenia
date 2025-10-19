export const STATUS = {
  IDLE: "idle",
  LIVE: "live",
  ERROR: "error",
};

export const STATUS_DICTIONARY = {
  [STATUS.IDLE]: {
    label: "En espera",
    chipClass: "status-idle",
    tag: "Sin señal",
    indicator: "Esperando transmisión",
  },
  [STATUS.LIVE]: {
    label: "Disponible",
    chipClass: "status-live",
    tag: "En vivo",
    indicator: "Streaming activo",
  },
  [STATUS.ERROR]: {
    label: "Error",
    chipClass: "status-error",
    tag: "Sin señal",
    indicator: "Fallo de conexión",
  },
};
