# Ergenia Stream Hub

Dashboard futurista y minimalista para monitorear las estaciones de carga de Ergenia. El backend en FastAPI toma los streams RTSP de las estaciones y los reexpone en MJPEG para que el frontend pueda mostrarlos directamente desde el navegador.

## Estructura del proyecto

- `backend/`
  - `config.py`: definición estática de los streams (RTSP y metadatos).
  - `main.py`: aplicación FastAPI, expone API, MJPEG y sirve activos estáticos.
  - `stream_manager.py`: gestor RTSP→MJPEG basado en FFmpeg con baja latencia.
- `index.html`: shell principal del dashboard.
- `css/main.css`: estilos globales con el tema minimalista gris/naranja.
- `js/`: frontend modular
  - `main.js`: punto de entrada (ES Modules).
  - `api.js`, `state.js`, `constants.js`: comunicación y estado compartido.
  - `ui/landing.js`, `ui/status.js`: vistas y métricas de la pantalla inicial.
  - `views/station.js`: lógica de la vista de cámaras por estación.
  - `stream.js`: creación y manejo de cada tarjeta de streaming.
- `requirements.txt`: dependencias del backend.

## Preparación del entorno

```bash
python3 -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

Es obligatorio contar con el binario `ffmpeg` en el `PATH`, ya que el backend lo emplea para abrir los RTSP con flags de baja latencia y producir MJPEG directo para el navegador.

## Ejecutar el backend

```bash
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

> Nota para despliegues (Render, Railway, etc.): si la plataforma espera encontrar el aplicativo como `app.main:app`, se incluye un wrapper en `app/main.py` que reexporta la instancia principal de FastAPI. Aun así, el punto de entrada real y la configuración viven en `backend/main.py`.

El dashboard estará disponible en `http://localhost:8000/`. Los recursos estáticos se sirven desde `/static/` y los streams MJPEG en `/streams/<stream_id>/mjpeg`.

## Endpoints principales

- `GET /` → Sirve `index.html`.
- `GET /api/stations` → Lista de estaciones y canales configurados.
- `GET /streams/{stream_id}/mjpeg` → Stream MJPEG generado a partir del RTSP correspondiente.

Cada stream se ejecuta en un hilo con un proceso `ffmpeg` dedicado (flags `nobuffer`, `low_delay`, `tcp`). Si la conexión cae, el backend reinicia el proceso aplicando un backoff corto.

Para minimizar el uso de memoria en despliegues con recursos limitados, los procesos de `ffmpeg` se inician bajo demanda (cuando el cliente solicita `/streams/<id>/mjpeg`) y se cierran en el shutdown de la aplicación.

## Personalización

- Modifica `backend/config.py` para agregar, quitar o ajustar streams (puertos, IPs, descripciones).
- Ajusta la estética en `css/main.css` modificando las variables CSS declaradas al inicio.
- El frontend modular bajo `js/` agrupa dinámicamente las estaciones, renderiza la vista de cámaras y administra el estado visual (en espera, transmitiendo, error).
- La vista principal muestra las estaciones disponibles; selecciona una para desplegar sus cámaras en un panel dedicado. Personaliza el estilo editando `css/main.css`.

## Recomendaciones adicionales

- Para entornos productivos, añade autenticación (Basic Auth, JWT, etc.) y cifrado (HTTPS) antes de exponer los streams.
- Considera integrar un mecanismo de caché de frames o compresión adicional si manejas muchos streams simultáneos.
- Si necesitas latencias muy bajas, evalúa migrar a WebRTC con un servidor como `rtsp-simple-server` o `go2rtc` y adaptar el frontend.
