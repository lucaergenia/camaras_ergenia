"""Static configuration for Ergenia RTSP endpoints and station grouping."""

from __future__ import annotations

from typing import Final, List, TypedDict


class StreamConfig(TypedDict):
  id: str
  station_id: str
  station_name: str
  label: str
  description: str
  rtsp_url: str


STREAMS: Final[List[StreamConfig]] = [
  {
    "id": "salvio-554",
    "station_id": "salvio",
    "station_name": "Estación Salvio",
    "label": "Canal 1",
    "description": "Puerto principal",
    "rtsp_url": "rtsp://192.168.1.9:554/profile1",
  },
  {
    "id": "salvio-555",
    "station_id": "salvio",
    "station_name": "Estación Salvio",
    "label": "Canal 2",
    "description": "Vista alternativa",
    "rtsp_url": "rtsp://192.168.1.2:558/profile1",
  },
  {
    "id": "salvio-556",
    "station_id": "salvio",
    "station_name": "Estación Salvio",
    "label": "Canal 3",
    "description": "Ángulo lateral",
    "rtsp_url": "rtsp://192.168.1.3:556/profile1",
  },
  {
    "id": "salvio-557",
    "station_id": "salvio",
    "station_name": "Estación Salvio",
    "label": "Canal 4",
    "description": "Detalle de conectores",
    "rtsp_url": "rtsp://192.168.1.4:557/profile1",
  },
  {
    "id": "portobelo-554",
    "station_id": "portobelo",
    "station_name": "Estación Portobelo",
    "label": "Canal 1",
    "description": "Puerto público",
    "rtsp_url": "rtsp://186.31.138.165:554/profile1",
  },
  {
    "id": "portobelo-555",
    "station_id": "portobelo",
    "station_name": "Estación Portobelo",
    "label": "Canal 2",
    "description": "Vista secundaria",
    "rtsp_url": "rtsp://186.31.138.165:555/profile1",
  },
  {
    "id": "portobelo-556",
    "station_id": "portobelo",
    "station_name": "Estación Portobelo",
    "label": "Canal 3",
    "description": "Panorámica",
    "rtsp_url": "rtsp://186.31.138.165:556/profile1",
  },
]
