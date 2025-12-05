#!/usr/bin/env python3
"""
Generate a funding-rate CSV that matches the lending_rates.csv format.

For each UTC day that contains at least one funding window (as returned by the
fx-v-2-funding subgraph), we keep the existing aave_borrow_apr_pct value from
the reference file. Days without funding are set to 0. The output preserves the
column order of the reference CSV.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
from pathlib import Path
from typing import Iterable, Set

import json
import urllib.request


GRAPH_URL = (
    "https://api.studio.thegraph.com/query/43247/fx-v-2-funding/version/latest"
)


FUNDING_QUERY = """
query FundingWindows($fundingId: String!) {
  records(
    first: 1000
    orderBy: blockNumber
    orderDirection: desc
    where: { fundingId: $fundingId }
  ) {
    start
    end
  }
}
""".strip()


def fetch_funding_dates(funding_id: str) -> Set[str]:
    """Return the set of UTC dates (YYYY-MM-DD) that contain any funding hours."""
    body = json.dumps(
        {
            "operationName": "FundingWindows",
            "query": FUNDING_QUERY,
            "variables": {"fundingId": funding_id},
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        GRAPH_URL,
        data=body,
        headers={
            "content-type": "application/json",
            "user-agent": "funding-rate-script/1.0",
        },
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=30) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    records = payload.get("data", {}).get("records", []) or []
    dates: Set[str] = set()

    for record in records:
        start = record.get("start")
        end = record.get("end")
        if start is None or end is None:
            continue
        # API returns seconds; convert to integers and normalise to UTC
        start_dt = dt.datetime.fromtimestamp(int(start), dt.timezone.utc)
        end_dt = dt.datetime.fromtimestamp(int(end), dt.timezone.utc)
        if end_dt <= start_dt:
            continue

        # Walk the inclusive hour range and record each date touched.
        cursor = start_dt.replace(minute=0, second=0, microsecond=0)
        while cursor <= end_dt:
            dates.add(cursor.strftime("%Y-%m-%d"))
            cursor += dt.timedelta(hours=1)

    return dates


def iter_reference_rows(path: Path) -> Iterable[dict]:
    with path.open(newline="") as handle:
        yield from csv.DictReader(handle)


def build_rows(
    reference_rows: Iterable[dict],
    funding_dates: Set[str],
) -> Iterable[dict]:
    for row in reference_rows:
        row_date = row["date"].split(" ")[0]
        row = dict(row)  # copy to avoid mutating the iterator
        fx_rate = row["aave_borrow_apr_pct"] if row_date in funding_dates else "0"
        row["fxUSD_borrow_apr_pct"] = fx_rate
        yield row


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a funding rate CSV based on lending_rates.csv.",
    )
    parser.add_argument(
        "--funding-id",
        default="wstETH",
        help="Funding pool identifier (default: wstETH).",
    )
    parser.add_argument(
        "--reference",
        default="lending_rates.csv",
        type=Path,
        help="Path to the reference lending rate CSV.",
    )
    parser.add_argument(
        "--output",
        default="lending_rates_full.csv",
        type=Path,
        help="Where to write the funding CSV (default: lending_rates_full.csv).",
    )
    args = parser.parse_args()

    funding_dates = fetch_funding_dates(args.funding_id)
    if not funding_dates:
        raise SystemExit(f"No funding data returned for {args.funding_id}")

    rows = list(iter_reference_rows(args.reference))
    if not rows:
        raise SystemExit(f"No rows found in {args.reference}")

    fieldnames = [
        "date",
        "fxUSD_borrow_apr_pct",
        "aave_borrow_apr_pct",
        "crvusd_borrow_apr_pct",
    ]

    with args.output.open("w", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(build_rows(rows, funding_dates))

    print(
        f"Wrote {len(rows)} rows to {args.output} "
        f"(funding days: {len(funding_dates)})"
    )


if __name__ == "__main__":
    main()
