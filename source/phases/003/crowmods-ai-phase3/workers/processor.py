#!/usr/bin/env python3
import hashlib
import json
import sys
import zipfile
from pathlib import Path

def sha256(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def inspect_apk(path):
    result = {
        "file": path.name,
        "size_bytes": path.stat().st_size,
        "sha256": sha256(path),
        "is_zip": False,
        "has_android_manifest": False,
        "entries_count": 0
    }
    with zipfile.ZipFile(path, "r") as z:
        result["is_zip"] = True
        names = z.namelist()
        result["entries_count"] = len(names)
        result["has_android_manifest"] = "AndroidManifest.xml" in names
    return result

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: processor.py /path/to/file.apk")
    print(json.dumps(inspect_apk(Path(sys.argv[1])), indent=2))
