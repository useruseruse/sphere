"""
SPHERE — Daily Price Updater
yfinance에서 등록 종목의 가격·변동성·베타·거래량을 가져와
data/prices.json 으로 출력합니다.

Run locally:
    pip install yfinance pandas numpy
    python tools/update_prices.py

Run via GitHub Actions:
    .github/workflows/update-prices.yml 이 매일 자동 실행
"""

import json
import sys
import time
from pathlib import Path
from datetime import datetime, timezone

try:
    import yfinance as yf
    import pandas as pd
except ImportError:
    print("Missing dependency. Run: pip install yfinance pandas numpy")
    sys.exit(1)

# =========================================================
# 티커 소스 — data/tickers.json 우선 로드, 미존재 시 폴백 사용
# =========================================================
def load_catalog_tickers() -> list:
    catalog = Path(__file__).parent.parent / "public" / "data" / "tickers.json"
    if not catalog.exists():
        return []
    try:
        data = json.loads(catalog.read_text())
        return sorted({t["ticker"] for t in data.get("tickers", []) if t.get("ticker")})
    except Exception as exc:
        print(f"⚠ Failed to parse tickers.json: {exc}")
        return []


# 폴백 — ASSET_DB 핵심 종목 (catalog 미존재 시)
FALLBACK_TICKERS = [
    # ---- Korean Stocks ----
    "005930.KS", "000660.KS", "035420.KS", "035720.KS", "377300.KS", "251270.KS",
    "207940.KS", "068270.KS", "196170.KS", "128940.KS",
    "105560.KS", "055550.KS", "086790.KS", "316140.KS", "138930.KS",
    "005380.KS", "000270.KS", "012330.KS",
    "006400.KS", "051910.KS", "373220.KS", "010130.KS", "009540.KS",
    "015760.KS", "034730.KS", "096770.KS",
    "097950.KS", "271560.KS", "139480.KS", "282330.KS",
    "028260.KS", "003550.KS",
    "030200.KS", "017670.KS", "032640.KS",
    "036570.KS", "259960.KS", "112040.KS",
    "005490.KS", "003670.KS",
    "086520.KS", "247540.KS",
    "011200.KS", "003490.KS",
    "010140.KS", "161390.KS", "035250.KS",
    # ---- US Stocks ----
    "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "NFLX", "AMD", "CRM", "ORCL",
    "TSLA", "F", "GM", "JPM", "BAC", "V", "MA", "GS",
    "JNJ", "PFE", "LLY", "MRNA", "XOM", "CVX",
    "WMT", "KO", "PG", "HD", "DIS", "MCD", "SBUX", "O", "AMT",
    # ---- US ETFs ----
    "SPY", "VOO", "VTI", "QQQ", "DIA", "IWM",
    "ARKK", "XLK", "XLF", "XLE", "XLV", "VEA", "VWO",
    "BND", "TLT", "IEF", "LQD", "HYG", "GLD", "SLV", "USO", "DBC", "DBA",
    # ---- Korean ETFs ----
    "069500.KS", "102110.KS", "305720.KS",
    "360750.KS", "379800.KS", "381180.KS",
]

TICKERS = load_catalog_tickers() or FALLBACK_TICKERS

# 시장 벤치마크 — 베타 계산용
MARKET_BENCHMARK = "^GSPC"  # S&P 500


def fetch_market_returns():
    """벤치마크 일일 수익률"""
    market = yf.Ticker(MARKET_BENCHMARK)
    hist = market.history(period="6mo", auto_adjust=True)
    if hist.empty:
        return None
    return hist["Close"].pct_change().dropna()


def compute_metrics(ticker: str, market_returns):
    """단일 종목의 가격·변동성·베타·평균 거래량 계산"""
    try:
        tk = yf.Ticker(ticker)
        hist = tk.history(period="6mo", auto_adjust=True)
        if hist.empty or len(hist) < 30:
            return None

        latest_price = float(hist["Close"].iloc[-1])
        if latest_price <= 0 or pd.isna(latest_price):
            return None

        # 30일 연환산 변동성
        returns = hist["Close"].pct_change().dropna()
        recent = returns.iloc[-30:]
        if len(recent) < 10:
            return None
        volatility_30d = float(recent.std() * (252 ** 0.5))

        # 베타 (시장 vs 종목 공분산 / 시장 분산)
        if market_returns is not None:
            aligned = pd.concat([returns, market_returns], axis=1, join="inner").dropna()
            if len(aligned) > 30:
                cov = aligned.iloc[:, 0].cov(aligned.iloc[:, 1])
                mkt_var = aligned.iloc[:, 1].var()
                beta = float(cov / mkt_var) if mkt_var > 0 else 1.0
            else:
                beta = 1.0
        else:
            beta = 1.0

        # 30일 평균 거래량
        avg_volume = int(hist["Volume"].iloc[-30:].mean())

        # 배당수익률 (TTM)
        dividend_yield = 0.0
        try:
            info = tk.fast_info if hasattr(tk, "fast_info") else None
            if info:
                # fast_info 에 dividendYield가 없으면 .info 폴백
                dy = getattr(info, "dividend_yield", None) or getattr(info, "dividendYield", None)
                if dy is None:
                    dy = tk.info.get("dividendYield") or tk.info.get("trailingAnnualDividendYield") or 0
                dividend_yield = float(dy or 0)
                # yfinance 일부 버전이 % 로 반환 → 0.05 이상이면 그대로, 5 이상이면 /100
                if dividend_yield > 1:
                    dividend_yield = dividend_yield / 100
        except Exception:
            dividend_yield = 0.0

        return {
            "price": round(latest_price, 2),
            "volatility_30d": round(volatility_30d, 4),
            "beta": round(beta, 3),
            "volume": avg_volume,
            "dividend_yield": round(dividend_yield, 4),
        }
    except Exception as exc:
        print(f"  ! {ticker}: {exc}")
        return None


def main():
    print(f"SPHERE — Updating {len(TICKERS)} tickers...")
    market_returns = fetch_market_returns()
    if market_returns is None:
        print("⚠ Market benchmark fetch failed, betas will fallback to 1.0")

    results = {}
    failed = []
    for idx, ticker in enumerate(TICKERS, 1):
        print(f"[{idx:>3}/{len(TICKERS)}] {ticker}", end=" ", flush=True)
        metrics = compute_metrics(ticker, market_returns)
        if metrics:
            results[ticker] = metrics
            print(f"= {metrics['price']:>10,.2f}  σ={metrics['volatility_30d']:.2f}  β={metrics['beta']:>5.2f}")
        else:
            failed.append(ticker)
            print("FAILED")
        # rate limit (yfinance 서버 부하 방지)
        if idx % 10 == 0:
            time.sleep(0.5)

    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "count": len(results),
        "failed": failed,
        "prices": results,
    }

    out_path = Path(__file__).parent.parent / "public" / "data" / "prices.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False, sort_keys=False)
    )

    print()
    print(f"✓ Wrote {len(results)} entries → {out_path}")
    if failed:
        print(f"✗ {len(failed)} failed: {', '.join(failed[:8])}{'...' if len(failed) > 8 else ''}")


if __name__ == "__main__":
    main()
