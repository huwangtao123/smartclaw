#!/usr/bin/env python3
"""
Fetch lending rate data from Dune and write lending_rates.csv for build-time fallback.

Environment:
  DUNE_API_KEY   (required)
  DUNE_QUERY_ID  (optional, default 6297890)
  DUNE_DATE_COLUMN (optional, comma-separated candidates; default: date,day,timestamp,time)
  DUNE_AAVE_COLUMN (optional, comma-separated candidates; default: aave_borrow_apr_pct,aave_usdc_borrow_rate,aave_apr)
  DUNE_CRV_COLUMN  (optional, comma-separated candidates; default: crvusd_borrow_apr_pct,crvusd_wbtc_borrow_rate,crvusd_apr)
"""

from __future__ import annotations

import csv
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime
from typing import Any, Iterable


DEFAULT_QUERY_ID = 6297890
OUTPUT_FILE = "lending_rates.csv"


def pick_first(row: dict[str, Any], candidates: Iterable[str]) -> Any:
  for key in candidates:
    if key in row:
      return row[key]
  return None


def to_date_key(value: Any) -> str | None:
  if value is None:
    return None
  # Try ISO-ish string
  if isinstance(value, str):
    text = value.strip()
    if not text:
      return None
    try:
      dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
      return dt.date().isoformat()
    except ValueError:
      pass
    # Fallback: take leading date-like part
    if len(text) >= 10:
      return text[:10]
    return text
  # Try numeric timestamp (seconds)
  if isinstance(value, (int, float)):
    try:
      dt = datetime.utcfromtimestamp(value)
      return dt.date().isoformat()
    except (OverflowError, OSError, ValueError):
      return None
  return None


def to_number(value: Any) -> float | None:
  if value is None:
    return None
  if isinstance(value, (int, float)):
    return float(value) if value == value else None  # NaN check
  if isinstance(value, str):
    try:
      num = float(value.replace(",", ""))
      return num if num == num else None
    except ValueError:
      return None
  return None


def fetch_rows(api_key: str, query_id: int) -> list[dict[str, Any]]:
  url = f"https://api.dune.com/api/v1/query/{query_id}/results"
  req = urllib.request.Request(url, headers={"x-dune-api-key": api_key})
  try:
    with urllib.request.urlopen(req) as resp:  # noqa: S310
      payload = json.loads(resp.read().decode("utf-8"))
  except urllib.error.HTTPError as err:
    body = err.read().decode("utf-8", errors="ignore")
    raise SystemExit(f"Dune request failed: {err.code} {err.reason} {body}") from err
  except Exception as err:  # noqa: BLE001
    raise SystemExit(f"Dune request failed: {err}") from err

  rows = payload.get("result", {}).get("rows")
  if not isinstance(rows, list) or not rows:
    raise SystemExit("Dune response contained no rows")
  return rows  # type: ignore[return-value]


def main() -> None:
  api_key = os.getenv("DUNE_API_KEY")
  if not api_key:
    raise SystemExit("DUNE_API_KEY is required to generate lending_rates.csv")

  query_id = int(os.getenv("DUNE_QUERY_ID") or DEFAULT_QUERY_ID)
  date_columns = (os.getenv("DUNE_DATE_COLUMN") or "date,day,timestamp,time").split(",")
  aave_columns = (
    os.getenv("DUNE_AAVE_COLUMN")
    or "aave_borrow_apr_pct,aave_usdc_borrow_rate,aave_apr"
  ).split(",")
  crv_columns = (
    os.getenv("DUNE_CRV_COLUMN")
    or "crvusd_borrow_apr_pct,crvusd_wbtc_borrow_rate,crvusd_apr"
  ).split(",")

  rows = fetch_rows(api_key, query_id)

  output_path = os.path.join(os.getcwd(), OUTPUT_FILE)
  written = 0
  with open(output_path, "w", newline="", encoding="utf-8") as fh:
    writer = csv.writer(fh)
    writer.writerow(["date", "aave_borrow_apr_pct", "crvusd_borrow_apr_pct"])
    for row in rows:
      if not isinstance(row, dict):
        continue
      date_val = to_date_key(pick_first(row, date_columns))
      aave_val = to_number(pick_first(row, aave_columns))
      crv_val = to_number(pick_first(row, crv_columns))
      if not date_val or (aave_val is None and crv_val is None):
        continue
      writer.writerow(
        [date_val, "" if aave_val is None else aave_val, "" if crv_val is None else crv_val],
      )
      written += 1

  if written == 0:
    raise SystemExit("No usable rows written to lending_rates.csv")
  print(f"[generate_lending_rates] wrote {written} rows to {OUTPUT_FILE}")


if __name__ == "__main__":
  main()
