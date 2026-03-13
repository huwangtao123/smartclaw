import requests
import json
import os
import random
from datetime import datetime

# We will query DexScreener for top tokens on Solana
API_URL = "https://api.dexscreener.com/latest/dex/search?q=sol"
OUTPUT_FILE = "public/solana_data.json"

def fetch_solana_data():
    try:
        response = requests.get(API_URL, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        # Filter for only Solana chain pairs
        pairs = [p for p in data.get("pairs", []) if p.get("chainId") == "solana"]
        
        if not pairs:
            print("No Solana pairs found in this DexScreener snapshot.")
            return

        # Sort by 24h volume (descending) to get the most active tokens
        pairs.sort(key=lambda x: x.get("volume", {}).get("h24", 0), reverse=True)
        
        # Extract features for Watchlist and Token-Flow Mocks
        active_tokens = []
        smart_money = []
        
        total_vol = 0

        for i, pair in enumerate(pairs[:50]): # Top 50 tokens
            base = pair.get("baseToken", {})
            symbol = base.get("symbol", "UNKNOWN")
            mint = base.get("address", "Unknown")
            
            vol_24h = pair.get("volume", {}).get("h24", 0)
            total_vol += vol_24h
            
            price_change = pair.get("priceChange", {}).get("h24", 0)
            
            # Watchlist Signal formatting
            risk = "Low" if vol_24h > 1000000 else "Medium" if vol_24h > 100000 else "High Volatility"
            trend = "Increasing" if price_change > 0 else "Decreasing"
            
            active_tokens.append({
                "type": "token",
                "target": symbol,
                "mint": mint,
                "reason": f"Real-time volume surge (${vol_24h:,.0f} 24h) and {abs(price_change)}% {'gain' if price_change > 0 else 'drop'}.",
                "risk": risk,
                "freshness": "Updated <1h ago",
                "vol24h": vol_24h,
                "trend": trend
            })
            
            # Simulate "Smart Wallet" addresses associated with this high-volume pool 
            # (DexScreener doesn't expose raw wallets but we proxy conviction by volume)
            if i < 15: # Create 15 top wallets associated with the highest liquidity pools
                conviction = round(min(10.0, 5.0 + (vol_24h / 500000)), 1)
                smart_money.append({
                    "address": f"SolTrader_{symbol}_{random.randint(1000,9999)}",
                    "signalStrength": random.randint(70, 99),
                    "recentBehavior": f"Heavy position in {symbol} ({trend} trend)",
                    "convictionScore": conviction,
                    "targetMint": mint
                })
        
        # Network Overview Mocked Aggregate
        overview = {
            "network": "solana",
            "trackedWallets": len(smart_money) * 200, # Mocked scale
            "activeCoverageTokens": len(active_tokens),
            "totalVolume24h": total_vol,
            "latestRotationShift": f"Focus shifting towards {active_tokens[0]['target']} & {active_tokens[1]['target']} ecosystems.",
            "lastUpdated": datetime.utcnow().isoformat() + "Z"
        }

        # Save to a JSON file that NextJS routes can read directly
        output_data = {
            "overview": overview,
            "watchlist": active_tokens[:10], # Top 10 for watchlist
            "smartMoney": sorted(smart_money, key=lambda x: x["convictionScore"], reverse=True),
            "tokenFlow": active_tokens,      # All sorted 50 for token flow searches
        }

        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        with open(OUTPUT_FILE, "w") as f:
            json.dump(output_data, f, indent=2)
            
        print(f"Successfully fetched and generated real-time Solana overview!")
        print(f"Tokens tracked: {len(active_tokens)}")
        print(f"Smart Wallets generated: {len(smart_money)}")
        
    except Exception as e:
        print(f"Failed to fetch or process DexScreener data: {e}")

if __name__ == "__main__":
    fetch_solana_data()
