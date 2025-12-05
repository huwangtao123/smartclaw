#!/usr/bin/env python3
"""
Download lending_rates.csv from Dune (CSV endpoint) for build-time fallback.

Equivalent to:
  curl -H "x-dune-api-key: $DUNE_API_KEY" "https://api.dune.com/api/v1/query/6297890/results/csv?limit=1000"

Environment:
  DUNE_API_KEY   (required)
  DUNE_QUERY_ID  (optional, default 6297890)
  DUNE_CSV_LIMIT (optional, default 1000)
"""

from __future__ import annotations

import os
import sys
import urllib.error
import urllib.parse
import urllib.request

DEFAULT_QUERY_ID = 6297890
DEFAULT_LIMIT = 1000
OUTPUT_FILE = "lending_rates.csv"


def load_env_file(path: str = ".env") -> None:
  if not os.path.isfile(path):
    return
  try:
    with open(path, "r", encoding="utf-8") as fh:
      for line in fh:
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
          continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        if key and key not in os.environ:
          os.environ[key] = value
  except Exception as err:  # noqa: BLE001
    print(f"[generate_lending_rates] warning: failed to read {path}: {err}", file=sys.stderr)


def download_csv(api_key: str, query_id: int, limit: int) -> bytes:
  base = f"https://api.dune.com/api/v1/query/{query_id}/results/csv"
  url = f"{base}?{urllib.parse.urlencode({'limit': limit})}"
  req = urllib.request.Request(url, headers={"x-dune-api-key": api_key})
  try:
    with urllib.request.urlopen(req) as resp:  # noqa: S310
      return resp.read()
  except urllib.error.HTTPError as err:
    body = err.read().decode("utf-8", errors="ignore")
    raise SystemExit(f"Dune request failed: {err.code} {err.reason} {body}") from err
  except Exception as err:  # noqa: BLE001
    raise SystemExit(f"Dune request failed: {err}") from err


def main() -> None:
  # Try loading .env into environment if present.
  load_env_file()

  api_key = os.getenv("DUNE_API_KEY")
  if not api_key:
    raise SystemExit("DUNE_API_KEY is required to generate lending_rates.csv")

  query_id = int(os.getenv("DUNE_QUERY_ID") or DEFAULT_QUERY_ID)
  limit = int(os.getenv("DUNE_CSV_LIMIT") or DEFAULT_LIMIT)

  data = download_csv(api_key, query_id, limit)
  output_path = os.path.join(os.getcwd(), OUTPUT_FILE)
  with open(output_path, "wb") as fh:
    fh.write(data)

  print(
    f"[generate_lending_rates] downloaded CSV for query {query_id} "
    f"(limit={limit}) to {OUTPUT_FILE}",
  )


if __name__ == "__main__":
  main()
