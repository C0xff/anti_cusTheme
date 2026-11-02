"""
Pure-Python reader/writer for Electron ASAR archives (no Node/npx needed).

Layout (Chromium Pickle header + payload):
  bytes 0..4    uint32 = 4
  bytes 4..8    uint32 = header_size_plus4 (8 + aligned JSON length)
  bytes 8..12   uint32 = header_size       (4 + aligned JSON length)
  bytes 12..16  uint32 = JSON string length
  bytes 16..    JSON header, padded to a 4-byte boundary
  then          payload; each file node has {"offset": "<str>", "size": <int>} relative to payload start

Nodes with "unpacked": true live in `app.asar.unpacked/` and have no payload bytes.
Nodes with "link" are symlinks and have no payload bytes.
"""

from __future__ import annotations

import hashlib
import json
import os
import struct
from pathlib import Path
from typing import Any, Dict, Iterator, Tuple


class AsarArchive:
    def __init__(self, asar_path: Path) -> None:
        raw = asar_path.read_bytes()
        if len(raw) < 16:
            raise ValueError(f"Invalid ASAR archive (too small): {asar_path}")
        _, header_size_plus4, _, header_str_len = struct.unpack("<IIII", raw[:16])
        self.header: Dict[str, Any] = json.loads(raw[16 : 16 + header_str_len].decode("utf-8"))
        self.payload = bytearray(raw[8 + header_size_plus4 :])

    def _node(self, rel_path: str) -> Dict[str, Any]:
        node = self.header
        for part in [p for p in rel_path.strip("/").split("/") if p]:
            files = node.get("files")
            if not files or part not in files:
                raise KeyError(f"Path not found in ASAR: {rel_path}")
            node = files[part]
        return node

    def has_file(self, rel_path: str) -> bool:
        try:
            return "offset" in self._node(rel_path)
        except KeyError:
            return False

    def read_file(self, rel_path: str) -> bytes:
        node = self._node(rel_path)
        offset = int(node["offset"])
        return bytes(self.payload[offset : offset + int(node["size"])])

    def write_file(self, rel_path: str, content: bytes) -> None:
        """Replace a packed file's content (appended to the payload; `save` compacts it)."""
        node = self._node(rel_path)
        node["offset"] = str(len(self.payload))
        node["size"] = len(content)
        self.payload.extend(content)
        if "integrity" in node:
            block_size = node["integrity"].get("blockSize", 4 * 1024 * 1024)
            node["integrity"] = {
                "algorithm": "SHA256",
                "hash": hashlib.sha256(content).hexdigest(),
                "blockSize": block_size,
                "blocks": [
                    hashlib.sha256(content[i : i + block_size]).hexdigest()
                    for i in range(0, max(1, len(content)), block_size)
                ],
            }

    def _packed_nodes(self) -> Iterator[Tuple[str, Dict[str, Any]]]:
        stack = [("", self.header)]
        while stack:
            prefix, node = stack.pop()
            for name, child in node.get("files", {}).items():
                path = f"{prefix}/{name}" if prefix else name
                if "files" in child:
                    stack.append((path, child))
                elif "offset" in child and not child.get("unpacked") and "link" not in child:
                    yield path, child

    def _compact(self) -> None:
        """Rebuild the payload with only referenced bytes, so repeated patches don't grow the file."""
        new_payload = bytearray()
        nodes = sorted(self._packed_nodes(), key=lambda item: int(item[1]["offset"]))
        for _, node in nodes:
            start = int(node["offset"])
            data = self.payload[start : start + int(node["size"])]
            node["offset"] = str(len(new_payload))
            new_payload.extend(data)
        self.payload = new_payload

    def save(self, out_path: Path) -> None:
        self._compact()
        header_bytes = json.dumps(self.header, separators=(",", ":")).encode("utf-8")
        pad = (4 - (len(header_bytes) % 4)) % 4
        aligned = len(header_bytes) + pad
        prefix = struct.pack("<IIII", 4, 8 + aligned, 4 + aligned, len(header_bytes))
        tmp_path = out_path.with_name(out_path.name + ".tmp")
        with open(tmp_path, "wb") as f:
            f.write(prefix)
            f.write(header_bytes)
            f.write(b"\x00" * pad)
            f.write(self.payload)
        os.replace(tmp_path, out_path)


def file_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()
