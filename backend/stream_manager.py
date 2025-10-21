"""Utilities to manage RTSP → MJPEG restreaming using FFmpeg with low latency."""

from __future__ import annotations

import asyncio
import logging
import shutil
import subprocess
import threading
import time
from typing import Dict, Optional


LOGGER = logging.getLogger(__name__)

JPEG_SOI = b"\xff\xd8"
JPEG_EOI = b"\xff\xd9"


class FFmpegMJPEGStream:
  """Spawn FFmpeg to pull RTSP and expose fresh JPEG frames."""

  def __init__(
      self,
      stream_id: str,
      rtsp_url: str,
      *,
      ffmpeg_path: Optional[str] = None,
      reconnect_delay: float = 4.0,
      target_fps: float = 15.0,
      quality: int = 12,
  ) -> None:
    self.stream_id = stream_id
    self.rtsp_url = rtsp_url
    self.ffmpeg_path = ffmpeg_path or shutil.which("ffmpeg") or "ffmpeg"
    self.reconnect_delay = reconnect_delay
    self.target_fps = max(target_fps, 1.0)
    self.target_interval = 1.0 / self.target_fps
    self.quality = max(2, min(31, quality))

    self._process: Optional[subprocess.Popen[bytes]] = None
    self._frame_bytes: Optional[bytes] = None
    self._lock = threading.Lock()
    self._running = False
    self._thread: Optional[threading.Thread] = None
    self._frame_counter: int = 0

  def start(self) -> None:
    if self._running:
      return
    self._running = True
    self._thread = threading.Thread(target=self._loop, name=f"ffmpeg-{self.stream_id}", daemon=True)
    self._thread.start()

  def stop(self) -> None:
    self._running = False
    if self._thread and self._thread.is_alive():
      self._thread.join(timeout=1.0)
    self._terminate_process()

  def latest_frame(self) -> Optional[bytes]:
    with self._lock:
      return self._frame_bytes

  def latest_frame_info(self) -> tuple[int, Optional[bytes]]:
    with self._lock:
      return self._frame_counter, self._frame_bytes

  # Internal helpers -------------------------------------------------------
  def _loop(self) -> None:
    backoff = self.reconnect_delay

    while self._running:
      if self._process is None or self._process.poll() is not None:
        self._terminate_process()
        if not self._running:
          break
        try:
          self._spawn_process()
          backoff = self.reconnect_delay
        except FileNotFoundError:
          LOGGER.error("ffmpeg binary not found for stream %s", self.stream_id)
          time.sleep(5.0)
          continue
        except Exception as exc:
          LOGGER.exception("Failed to start ffmpeg for %s: %s", self.stream_id, exc)
          time.sleep(backoff)
          backoff = min(backoff * 1.5, 20.0)
          continue

      assert self._process and self._process.stdout
      buffer = bytearray()

      while self._running and self._process.poll() is None:
        try:
          chunk = self._process.stdout.read(4096)
        except Exception as exc:
          LOGGER.debug("Read error for %s: %s", self.stream_id, exc)
          break

        if not chunk:
          time.sleep(0.01)
          continue

        buffer.extend(chunk)

        while True:
          start = buffer.find(JPEG_SOI)
          if start == -1:
            # Drop any preamble data
            buffer.clear()
            break
          end = buffer.find(JPEG_EOI, start + 2)
          if end == -1:
            # Wait for more bytes.
            if start > 0:
              del buffer[:start]
            break

          frame = bytes(buffer[start:end + 2])
          del buffer[:end + 2]

          with self._lock:
            self._frame_bytes = frame
            self._frame_counter = (self._frame_counter + 1) % 1_000_000_000

      # process ended unexpectedly
      self._terminate_process()
      time.sleep(backoff)
      backoff = min(backoff * 1.5, 20.0)

  def _spawn_process(self) -> None:
    cmd = [
      self.ffmpeg_path,
      "-hide_banner",
      "-loglevel", "error",
      "-rtsp_transport", "tcp",
      "-fflags", "nobuffer",
      "-flags", "low_delay",
      "-reorder_queue_size", "0",
      "-analyzeduration", "500000",
      "-max_delay", "1000000",
      "-i", self.rtsp_url,
      "-vf", "scale=640:-2",
      "-r", f"{self.target_fps:.2f}".rstrip("0").rstrip("."),
      "-f", "mjpeg",
      "-q:v", str(self.quality),
      "pipe:1",
    ]
    LOGGER.info("Starting ffmpeg for %s", self.stream_id)
    self._process = subprocess.Popen(
      cmd,
      stdout=subprocess.PIPE,
      stderr=subprocess.DEVNULL,
      bufsize=0,
    )

  def _terminate_process(self) -> None:
    if self._process is None:
      return
    try:
      if self._process.poll() is None:
        self._process.terminate()
        try:
          self._process.wait(timeout=2.0)
        except subprocess.TimeoutExpired:
          self._process.kill()
    finally:
      self._process = None


class StreamRegistry:
  """Holds all RTSP worker instances and exposes helper APIs."""

  def __init__(self) -> None:
    self._streams: Dict[str, FFmpegMJPEGStream] = {}

  def register(self, stream: FFmpegMJPEGStream) -> None:
    self._streams[stream.stream_id] = stream

  def get(self, stream_id: str) -> Optional[FFmpegMJPEGStream]:
    return self._streams.get(stream_id)

  def start_all(self) -> None:
    for stream in self._streams.values():
      stream.start()

  def stop_all(self) -> None:
    for stream in self._streams.values():
      stream.stop()


async def mjpeg_generator(stream: FFmpegMJPEGStream, boundary: str = "frame") -> bytes:
  """Asynchronous generator that yields multipart MJPEG frames."""

  stream.start()

  last_counter = -1
  idle_sleep = max(stream.target_interval / 4, 0.01)

  while True:
    counter, frame = stream.latest_frame_info()

    if frame is None or counter == last_counter:
      await asyncio.sleep(idle_sleep)
      continue

    last_counter = counter
    payload = (
      f"--{boundary}\r\n"
      "Content-Type: image/jpeg\r\n"
      f"Content-Length: {len(frame)}\r\n\r\n"
    ).encode("utf-8") + frame + b"\r\n"
    yield payload
