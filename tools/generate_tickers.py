"""
SPHERE — Ticker Catalog Generator
yfinance에서 주요 지수(S&P500, NASDAQ100, KOSPI200, KOSDAQ150 등)에 속한
종목들의 이름·섹터·시가총액 메타데이터를 가져와 data/tickers.json 으로 출력합니다.

ASSET_DB 에 하드코딩된 핵심 종목과는 별개의 카탈로그이며,
앱 로드 시 JS가 두 데이터를 머지해서 검색 가능한 자산 풀을 확장합니다.

Run:
    pip install yfinance pandas
    python tools/generate_tickers.py

권장 빈도: 주 1회 (메타데이터는 자주 변하지 않음).
"""

import json
import sys
import time
import re
from pathlib import Path
from datetime import datetime, timezone

try:
    import yfinance as yf
except ImportError:
    print("Missing dependency. Run: pip install yfinance pandas")
    sys.exit(1)


# =========================================================
# 1. 대상 티커 목록 — 주요 지수 구성종목
# =========================================================
# S&P 500 + NASDAQ 100 + 주요 ADR (~520)
US_TICKERS = [
    # ---- Mega cap tech ----
    "AAPL","MSFT","GOOGL","GOOG","AMZN","META","NVDA","TSLA","AVGO","ORCL",
    "CRM","ADBE","CSCO","ACN","IBM","QCOM","INTC","AMD","TXN","MU",
    "AMAT","LRCX","KLAC","ASML","ANET","FTNT","PANW","CRWD","ZS","DDOG",
    "NET","SNOW","MDB","TEAM","WDAY","NOW","INTU","ADP","PAYX","FISV",
    "FIS","V","MA","PYPL","SQ","COIN","HOOD","SOFI","AFRM","UPST",
    # ---- Communication / Internet ----
    "NFLX","DIS","CMCSA","T","VZ","TMUS","CHTR","WBD","PARA","FOX",
    "FOXA","SPOT","ROKU","TTD","SNAP","PINS","ZM","DOCU","EA","TTWO",
    "ATVI","RBLX","U","DUOL","SHOP","EBAY","ETSY","BKNG","ABNB","UBER",
    "LYFT","DASH","CVNA","CHWY","BABA","JD","PDD","BIDU","NTES","TCEHY",
    # ---- Healthcare / Biotech ----
    "JNJ","UNH","LLY","PFE","ABBV","MRK","TMO","ABT","DHR","BMY",
    "AMGN","GILD","REGN","VRTX","BIIB","MRNA","BNTX","NVAX","ISRG","ZTS",
    "BSX","SYK","MDT","EW","BAX","BDX","HOLX","ALGN","DXCM","IDXX",
    "ILMN","WAT","RMD","HUM","CI","CVS","ELV","CAH","MCK","COR",
    "HCA","UHS","DGX","LH","MOH","CNC","BIO","TECH","INCY","ALNY",
    "BMRN","SGEN","NBIX","EXAS","NTRA","PODD","TDOC","HRTX","ARWR","BLUE",
    "CRSP","NTLA","BEAM","EDIT","SANA","RPRX","ZBH","STE","HSIC","IQV",
    # ---- Financials / Banks / Insurance ----
    "JPM","BAC","WFC","C","USB","PNC","TFC","SCHW","GS","MS",
    "BLK","BX","KKR","APO","CG","TROW","BEN","IVZ","NTRS","STT",
    "BK","COF","DFS","AXP","SYF","ALLY","FITB","CFG","MTB","HBAN",
    "RF","KEY","ZION","CMA","WAL","WTFC","FRC","SBNY","SIVB","ACGL",
    "BRK-B","AIG","ALL","TRV","CB","PGR","MET","PRU","HIG","MMC",
    "AON","WTW","AJG","BRO","RNR","RGA","RE","EVR","LAZ","HLI",
    "MCO","SPGI","MSCI","FDS","NDAQ","ICE","CME","CBOE","TRU","EFX",
    # ---- Consumer ----
    "WMT","KO","PEP","COST","PG","MCD","SBUX","NKE","TGT","HD",
    "LOW","TJX","ROST","DG","DLTR","BBY","ULTA","LULU","DECK","CROX",
    "RL","TPR","CPRI","KSS","M","JWN","GPS","ANF","AEO","URBN",
    "CMG","DPZ","YUM","WEN","DRI","TXRH","CAVA","SHAK","MCD","QSR",
    "PM","MO","BTI","STZ","BUD","DEO","TAP","SAM","KHC","MDLZ",
    "GIS","K","CPB","HSY","CAG","SJM","MKC","CLX","CHD","CL",
    "EL","ULVR","UL","CHL","KDP","KO","KEYS","TPR","CRI","HBI",
    # ---- Industrial / Energy / Materials ----
    "XOM","CVX","COP","EOG","SLB","OXY","PXD","HES","DVN","MRO",
    "FANG","HAL","BKR","KMI","WMB","ENB","TRP","ET","EPD","MPLX",
    "PSX","VLO","MPC","TPL","CTRA","APA","MTDR","CHRD","NOG","RRC",
    "BA","CAT","DE","GE","HON","RTX","LMT","NOC","GD","TXT",
    "EMR","ETN","ITW","PH","ROK","FAST","PCAR","CMI","WAB","XYL",
    "DOV","FTV","IR","AME","ROP","CARR","OTIS","JCI","TT","LII",
    "MMM","SHW","ECL","APD","LIN","ALB","FCX","NUE","STLD","CLF",
    "NEM","GOLD","AA","MOS","CF","FMC","DOW","DD","LYB","CE",
    "PPG","PKG","BLL","ATR","SEE","IP","WRK","SON","AVY","LXP",
    "FDX","UPS","UNP","CSX","NSC","CP","CNI","JBHT","CHRW","XPO",
    "ODFL","SAIA","KNX","WERN","ARCB","HUBG","R","LSTR","MATX","KEX",
    # ---- Utilities / Real Estate ----
    "NEE","DUK","SO","D","AEP","SRE","XEL","ED","WEC","EIX",
    "PEG","ETR","ES","DTE","AEE","CMS","CNP","NRG","PCG","EXC",
    "AWK","WTRG","ATO","NI","EVRG","PNW","LNT","IDA","NWE","POR",
    "AMT","PLD","CCI","EQIX","DLR","O","SPG","WELL","PSA","EXR",
    "AVB","EQR","UDR","ESS","MAA","CPT","SUI","ELS","AMH","INVH",
    "VTR","HCP","PEAK","MPW","DOC","OHI","SBRA","NHI","LTC","CTRE",
    "BXP","SLG","VNO","HIW","KRC","PDM","HPP","DEI","BRX","REG",
    # ---- Auto / EV ----
    "F","GM","TSLA","RIVN","LCID","NIO","XPEV","LI","FFIE","MULN",
    "STLA","TM","HMC","FFIE","NKLA","HYZN","BLNK","CHPT","EVGO","WBX",
    # ---- Aerospace / Defense ----
    "BA","LMT","NOC","GD","RTX","HII","TXT","TDG","HEI","KTOS",
    "AJRD","BWXT","LDOS","SAIC","PSN","BAH","CACI","MAXR","RKLB","ASTR",
    # ---- Major ADRs ----
    "TSM","BABA","PDD","JD","BIDU","NTES","NIO","XPEV","LI","BILI",
    "TM","HMC","NSANY","SONY","MUFG","SMFG","NMR","ITUB","BBD","VALE",
    "PBR","SAN","BBVA","ING","UBS","CS","DB","NVS","RHHBY","SNY",
    "GSK","AZN","TEVA","RY","TD","BNS","BMO","CM","ENB","TRP",
    # ---- Crypto / Speculative ----
    "MSTR","COIN","HOOD","MARA","RIOT","CLSK","HUT","BITF","BTBT","HIVE",
]

# US ETFs (~70)
US_ETFS = [
    # Broad market
    "SPY","VOO","IVV","VTI","ITOT","VXUS","VEA","VWO","VTV","VUG","VBR","VBK","VTEB","BND","BNDX",
    "QQQ","QQQM","DIA","IWM","IWB","IWV","MDY","IJH","IJR","SCHB","SCHX","SCHA","SCHV","SCHG","SCHD",
    # Sector
    "XLK","XLF","XLV","XLE","XLI","XLP","XLY","XLB","XLU","XLRE","XLC",
    "VGT","VFH","VHT","VDE","VIS","VDC","VCR","VAW","VPU","VNQ","VOX",
    # Bond
    "TLT","IEF","SHY","AGG","LQD","HYG","JNK","TIP","MUB","EMB","BIV","BLV","BSV","SCHO","SCHZ",
    # Commodity / Alt
    "GLD","SLV","IAU","USO","UNG","DBA","DBC","PALL","PPLT","CPER","CORN","WEAT","SOYB","COW","WOOD",
    # Thematic / Smart-beta
    "ARKK","ARKQ","ARKW","ARKG","ARKF","ARKX","SOXX","SMH","SPXL","TQQQ","SQQQ","SOXL","TMF","UPRO",
    "MOAT","DGRO","SDY","NOBL","DVY","SCHD","HDV","SPYD","JEPI","JEPQ","DIVO","QYLD","RYLD","XYLD","NUSI",
    # International
    "EFA","IEMG","EEM","VGK","FEZ","EWJ","EWZ","INDA","FXI","MCHI","KWEB","ASHR","EWY","EWT","EWG",
    "EWU","EWC","EWA","EWH","EWS","EWP","EWQ","ENZL","EIDO","EPHE","THD","TUR","ARGT","EZA","EWW",
]

# Korean stocks — KOSPI top + KOSDAQ top (~250)
KR_TICKERS = [
    # KOSPI Top 200
    "005930.KS","000660.KS","207940.KS","005380.KS","006400.KS","051910.KS","005490.KS","105560.KS","055550.KS","035420.KS",
    "035720.KS","005935.KS","068270.KS","028260.KS","003670.KS","000270.KS","034730.KS","096770.KS","015760.KS","011200.KS",
    "012330.KS","086790.KS","316140.KS","138930.KS","024110.KS","029780.KS","006800.KS","055550.KS","017670.KS","030200.KS",
    "032640.KS","078930.KS","010130.KS","009540.KS","267250.KS","267260.KS","377300.KS","251270.KS","259960.KS","112040.KS",
    "036570.KS","139480.KS","271560.KS","097950.KS","282330.KS","004020.KS","004990.KS","003490.KS","011170.KS","051900.KS",
    "066570.KS","003550.KS","034220.KS","011070.KS","247540.KS","086520.KS","001040.KS","000810.KS","028050.KS","010140.KS",
    "010120.KS","009830.KS","011780.KS","004370.KS","006360.KS","000720.KS","047040.KS","028050.KS","375500.KS","005380.KS",
    "001120.KS","138040.KS","003090.KS","008770.KS","034020.KS","033780.KS","006040.KS","023530.KS","139130.KS","001230.KS",
    "010620.KS","096760.KS","011790.KS","005830.KS","185750.KS","000080.KS","064350.KS","271940.KS","028670.KS","000150.KS",
    "036460.KS","000210.KS","023590.KS","007070.KS","002790.KS","051600.KS","007310.KS","010060.KS","005440.KS","078930.KS",
    "175330.KS","267290.KS","005850.KS","008060.KS","402340.KS","028670.KS","001440.KS","002270.KS","024720.KS","033240.KS",
    "069960.KS","071050.KS","071840.KS","072710.KS","078520.KS","081660.KS","088980.KS","093370.KS","095720.KS","097230.KS",
    "001740.KS","002990.KS","006490.KS","006650.KS","008930.KS","009830.KS","011150.KS","012450.KS","012630.KS","014820.KS",
    "017900.KS","018880.KS","020150.KS","020560.KS","021240.KS","023350.KS","025540.KS","026960.KS","029530.KS","033270.KS",
    "037270.KS","039490.KS","042660.KS","042700.KS","045560.KS","047810.KS","052690.KS","058430.KS","064960.KS","069260.KS",
    "069620.KS","079430.KS","079550.KS","081000.KS","086280.KS","088260.KS","089860.KS","092230.KS","093230.KS","095610.KS",
    "095700.KS","097520.KS","099350.KS","102260.KS","103140.KS","105840.KS","108670.KS","111770.KS","114090.KS","114800.KS",
    "117730.KS","120110.KS","123890.KS","128820.KS","138250.KS","138930.KS","145020.KS","161390.KS","161890.KS","163560.KS",
    "175330.KS","178920.KS","185750.KS","192080.KS","192400.KS","192820.KS","204320.KS","210980.KS","214320.KS","214390.KS",
    "215600.KS","216050.KS","229640.KS","240810.KS","241560.KS","248070.KS","250930.KS","263750.KS","266390.KS","272210.KS",
    "272450.KS","281820.KS","285130.KS","298040.KS","298050.KS","298540.KS","300720.KS","302440.KS","307950.KS","310210.KS",
    "316140.KS","319400.KS","322000.KS","326030.KS","329180.KS","336370.KS","348950.KS","352820.KS","357250.KS","361610.KS",
    "365340.KS","375500.KS","377190.KS","383220.KS","003620.KS","004170.KS","006890.KS","008730.KS","009240.KS","010050.KS",
    "010780.KS","011930.KS","012750.KS","013570.KS","014280.KS","014790.KS","015230.KS","016380.KS","017390.KS","017800.KS",
    # KOSDAQ Top
    "247540.KQ","086520.KQ","091990.KQ","196170.KQ","028300.KQ","263750.KQ","240810.KQ","145020.KQ","357780.KQ","058470.KQ",
    "041510.KQ","112040.KQ","067310.KQ","039030.KQ","140860.KQ","095340.KQ","357780.KQ","095700.KQ","068760.KQ","086900.KQ",
    "108860.KQ","178920.KQ","064550.KQ","048410.KQ","039200.KQ","214150.KQ","096530.KQ","298380.KQ","348370.KQ","053800.KQ",
    "036930.KQ","166090.KQ","357950.KQ","403870.KQ","294140.KQ","348210.KQ","403890.KQ","145020.KQ","182360.KQ","240810.KQ",
    "035600.KQ","217270.KQ","377300.KQ","112040.KQ","086450.KQ","095660.KQ","079960.KQ","064760.KQ","053610.KQ","043150.KQ",
]

# Korean ETFs
KR_ETFS = [
    "069500.KS","102110.KS","229200.KS","152100.KS","148020.KS","305720.KS","226980.KS","114800.KS","251340.KS","252670.KS",
    "360750.KS","379800.KS","381180.KS","371460.KS","381170.KS","429760.KS","429750.KS","465580.KS","367380.KS","381170.KS",
    "238720.KS","256940.KS","305540.KS","371160.KS","132030.KS","139660.KS","139310.KS","148070.KS","153130.KS","156080.KS",
    "157450.KS","161510.KS","174350.KS","182490.KS","210780.KS","217780.KS","229720.KS","251590.KS","266360.KS","272560.KS",
    "275980.KS","278420.KS","285690.KS","292340.KS","292730.KS","293180.KS","295040.KS","301400.KS","305080.KS","305540.KS",
    "311690.KS","314250.KS","314260.KS","325010.KS","332620.KS","333970.KS","337140.KS","337150.KS","341660.KS","357870.KS",
    "364980.KS","367380.KS","371160.KS","371460.KS","371870.KS","373630.KS","378710.KS","379800.KS","380340.KS","381170.KS",
    "381180.KS","385520.KS","387280.KS","394670.KS","395750.KS","396500.KS","402970.KS","403480.KS","412770.KS","416170.KS",
]


# GICS → SPHERE 섹터 매핑
GICS_TO_SPHERE = {
    "Technology": "IT",
    "Information Technology": "IT",
    "Communication Services": "IT",
    "Communication": "IT",
    "Healthcare": "BIO",
    "Health Care": "BIO",
    "Financial Services": "FIN",
    "Financial": "FIN",
    "Financials": "FIN",
    "Consumer Cyclical": "CONSUMER",
    "Consumer Discretionary": "CONSUMER",
    "Consumer Defensive": "CONSUMER",
    "Consumer Staples": "CONSUMER",
    "Energy": "ENERGY",
    "Real Estate": "REALESTATE",
    "Industrials": "INDUSTRIAL",
    "Industrial": "INDUSTRIAL",
    "Materials": "INDUSTRIAL",
    "Basic Materials": "INDUSTRIAL",
    "Utilities": "INDUSTRIAL",
}

# Auto sector heuristic — GICS는 Auto를 별도로 쪼개지 않으므로 종목명/티커로 보정
AUTO_HINT = re.compile(r"motor|auto|vehicle|car\b|tesla|ford|gm\b|stellantis|toyota|honda|nissan|hyundai|kia|rivian|lucid|nio|xpeng|volkswagen|porsche|ferrari|stmicro", re.I)


def to_sphere_sector(gics: str, symbol: str = "", name: str = "") -> str:
    if not gics:
        return "ETC"
    if AUTO_HINT.search(name) or AUTO_HINT.search(symbol):
        return "AUTO"
    return GICS_TO_SPHERE.get(gics, "ETC")


def fetch_meta(ticker: str):
    """단일 티커의 name/sector 메타데이터를 yfinance에서 가져옴"""
    try:
        info = yf.Ticker(ticker).info
        if not info:
            return None
        name = info.get("longName") or info.get("shortName") or info.get("displayName")
        if not name:
            return None
        symbol = info.get("symbol") or ticker
        sector_raw = info.get("sector") or ""
        quote_type = (info.get("quoteType") or "").upper()
        is_etf = quote_type in ("ETF", "MUTUALFUND")
        if is_etf:
            sector = "GLOBAL_ETF"
        else:
            sector = to_sphere_sector(sector_raw, symbol, name)
        # alias — 검색 편의용 소문자
        alias = name.lower()
        return {
            "ticker": ticker,
            "name": name,
            "name_en": name,
            "sector": sector,
            "alias": alias,
            "is_etf": is_etf,
            "market_cap": info.get("marketCap") or 0,
            "current_price": info.get("regularMarketPreviousClose") or info.get("currentPrice") or 0,
            "volatility_30d": 0.25,
            "beta": info.get("beta") or 1.0,
            "debt_ratio": 0.30,
            "liquidity_volume": info.get("averageVolume") or 0,
        }
    except Exception as exc:
        print(f"  ! {ticker}: {exc}")
        return None


def main():
    all_tickers = sorted(set(US_TICKERS + US_ETFS + KR_TICKERS + KR_ETFS))
    print(f"SPHERE — Generating ticker catalog for {len(all_tickers)} symbols...")

    results = []
    failed = []
    for idx, ticker in enumerate(all_tickers, 1):
        meta = fetch_meta(ticker)
        if meta:
            results.append(meta)
            if idx % 20 == 0 or idx == len(all_tickers):
                print(f"[{idx:>4}/{len(all_tickers)}] OK · last: {ticker} · {meta['name'][:30]}")
        else:
            failed.append(ticker)
        if idx % 25 == 0:
            time.sleep(0.5)  # rate limit

    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "count": len(results),
        "failed": failed,
        "tickers": results,
    }

    out_path = Path(__file__).parent.parent / "data" / "tickers.json"
    out_path.parent.mkdir(exist_ok=True)
    out_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False))

    print()
    print(f"✓ Wrote {len(results)} entries → {out_path}")
    if failed:
        print(f"✗ {len(failed)} failed: {', '.join(failed[:8])}{'...' if len(failed) > 8 else ''}")


if __name__ == "__main__":
    main()
