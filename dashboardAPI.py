import requests
import json
import re
import pandas as pd

# --- API CONFIG ---
url = "https://fx.aladdin.club/LEADERBOARD_HOST/Rank/"

headers = {
    "Content-Type": "application/json",
    "Origin": "https://fx.aladdin.club",
    "Referer": "https://fx.aladdin.club/v2/leaderboard/",
}

payload = {
    "metric": "roi",       # or "pnl", "net", "vol"
    "period": "all",       # "1D", "7D", "30D", or "all"
    "reverse": False,
    "limit": 5000,         # number of records per call
    "offset": 0
}

# --- REQUEST DATA ---
response = requests.post(url, headers=headers, json=payload)
print("Status:", response.status_code)

if response.status_code != 200:
    raise RuntimeError(f"Request failed: {response.text}")

data = response.json()

# Some APIs wrap data inside 'data' or 'result'
# unwrap common payload containers
rows = data.get("data") or data.get("result") or data
if isinstance(rows, dict) and "ranklist" in rows:
    rows = rows["ranklist"]

# --- CONVERT TO DATAFRAME ---
df = pd.DataFrame(rows)
print(f"✅ Loaded {len(df)} total records")

# --- BASIC ANALYSIS ---
total_count = len(df)
print(f"Total records: {total_count}")

# --- FILTER: Volume > 10 ---
if "vol" in df.columns:
    def _parse_numeric(value):
        if pd.isna(value):
            return None
        if isinstance(value, (int, float)):
            return float(value)
        cleaned = str(value).replace(",", "").strip()
        cleaned = re.sub(r"[^0-9\.\-eE]", "", cleaned)
        try:
            return float(cleaned)
        except ValueError:
            return None

    df["vol_clean"] = df["vol"].apply(_parse_numeric)
    if "pnl" in df.columns:
        df["pnl_clean"] = df["pnl"].apply(_parse_numeric)

    df_filtered = df[df["vol_clean"] > 10]
    print(f"Filtered records (Volume > 10): {len(df_filtered)}")

    missing_vol = df["vol_clean"].isna().sum()
    if missing_vol:
        print(f"⚠️  Skipped {missing_vol} rows with non-numeric Volume values.")
else:
    df_filtered = pd.DataFrame()
    print("⚠️  'vol' column not found in data — available columns:", df.columns.tolist())

# --- OPTIONAL: Save both datasets ---
df.to_csv("fx_leaderboard_full.csv", index=False)
df_filtered.to_csv("fx_leaderboard_filtered.csv", index=False)

print("\n📊 Files saved:")
print(" - fx_leaderboard_full.csv  (all records)")
print(" - fx_leaderboard_filtered.csv  (Volume > 10)")
