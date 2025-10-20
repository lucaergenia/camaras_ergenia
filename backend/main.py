from __future__ import annotations

from collections import defaultdict
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from .config import STATIONS, STREAMS
from .stream_manager import FFmpegMJPEGStream, StreamRegistry, mjpeg_generator


ROOT_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = ROOT_DIR

app = FastAPI(title="Ergenia Stream Hub", version="1.0.0")


registry = StreamRegistry()
for stream_cfg in STREAMS:
  registry.register(
    FFmpegMJPEGStream(
      stream_id=stream_cfg["id"],
      rtsp_url=stream_cfg["rtsp_url"],
    )
  )


@app.on_event("shutdown")
def handle_shutdown() -> None:
  registry.stop_all()


@app.get("/", response_class=FileResponse, include_in_schema=False)
def get_root() -> FileResponse:
  return FileResponse(STATIC_DIR / "index.html")


@app.get("/api/stations")
async def list_stations() -> JSONResponse:
  grouped = defaultdict(list)

  for cfg in STREAMS:
    grouped[cfg["station_id"]].append(
      {
        "id": cfg["id"],
        "label": cfg["label"],
        "description": cfg["description"],
        "rtsp_url": cfg["rtsp_url"],
        "mjpeg_url": f"/streams/{cfg['id']}/mjpeg",
      }
    )

  stations = []
  for info in STATIONS:
    station_id = info["id"]
    stations.append(
      {
        "id": station_id,
        "name": info["name"],
        "description": info.get("description"),
        "feeds": grouped.get(station_id, []),
      }
    )

  payload = {"stations": stations}
  return JSONResponse(payload)


@app.get("/streams/{stream_id}/mjpeg")
async def stream_mjpeg(stream_id: str) -> StreamingResponse:
  stream = registry.get(stream_id)
  if stream is None:
    raise HTTPException(status_code=404, detail="Stream not found")

  boundary = "frame"
  generator = mjpeg_generator(stream, boundary=boundary)
  return StreamingResponse(
    generator,
    media_type=f"multipart/x-mixed-replace; boundary={boundary}",
  )


app.mount(
  "/static",
  StaticFiles(directory=str(STATIC_DIR), html=True),
  name="static",
)
