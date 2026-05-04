# 04. 데이터 파이프라인 — yfinance와 GitHub Actions 자동화

## 핵심 아이디어

> "**서버 없이** 매일 시세를 가져와서 사이트에 반영하기"

전통적이라면 백엔드 서버를 띄우고 cronjob으로 시세를 fetch해서 DB에 넣고, 사용자가 사이트 들어올 때 API로 응답하는 구조겠죠. SPHERE는 백엔드가 없습니다. 대신:

1. **GitHub Actions가 매일 시세 fetch** → JSON 파일로 commit
2. **사이트 로드 시 그 JSON을 그냥 fetch** → 표시

JSON 파일이 곧 DB이고, GitHub Pages가 곧 API입니다. 무료, 무한 확장, 다운타임 거의 0.

---

## 목차

1. [전체 흐름도](#1-전체-흐름도)
2. [yfinance 라이브러리 이해](#2-yfinance-라이브러리)
3. [tickers.json — 종목 카탈로그](#3-tickersjson--종목-카탈로그)
4. [prices.json — 일별 시세 데이터](#4-pricesjson--일별-시세)
5. [Python 스크립트 — update_prices.py](#5-python-스크립트--update_pricespy)
6. [Python 스크립트 — generate_tickers.py](#6-python-스크립트--generate_tickerspy)
7. [GitHub Actions 워크플로](#7-github-actions-워크플로)
8. [JS 측 로딩 — applyDailyPrices()](#8-js-측-로딩)
9. [데이터 정합성·실패 처리](#9-데이터-정합성)

---

## 1. 전체 흐름도

```
매주 일요일 02:00 UTC
        ↓
[regenerate-tickers.yml]
        ↓
[generate_tickers.py]
        ↓ yfinance .info (느림 — 종목당 ~1초)
        ↓
[data/tickers.json] ← 종목 메타데이터 (이름, 섹터)
        ↓
        ↓
매일 23:00 UTC (한국 다음날 08:00)
        ↓
[update-prices.yml]
        ↓
[update_prices.py]
        ↓ yfinance .history (빠름 — bulk download 가능)
        ↓
[data/prices.json] ← 시세, σ, β, 거래량, 배당률
        ↓
        ↓
사용자가 사이트 접속
        ↓
[applyTickerCatalog()] ← tickers.json fetch (클라이언트)
[applyDailyPrices()]   ← prices.json fetch
        ↓
ASSET_DB 확장·갱신 → 5-Layer Pipeline 재실행 → UI 갱신
```

---

## 2. yfinance 라이브러리

[yfinance](https://pypi.org/project/yfinance/) 는 Yahoo Finance의 비공식 Python 라이브러리. 무료, 인증 불필요. 단점은 비공식이라 가끔 Yahoo가 API 바꾸면 깨짐.

### 설치

```bash
pip install yfinance pandas numpy
```

### 핵심 사용법

```python
import yfinance as yf

# 1. 단일 종목 가격 시계열
ticker = yf.Ticker("005930.KS")          # 삼성전자
hist = ticker.history(period="6mo", auto_adjust=True)
# DataFrame: index=Date, columns=[Open, High, Low, Close, Volume]

# 2. 메타정보 (느림 — 별도 API 호출)
info = ticker.info
# dict: longName, shortName, sector, marketCap, dividendYield, ...

# 3. 빠른 정보 (실시간 가격만)
fast = ticker.fast_info

# 4. 다수 종목 bulk download
data = yf.download("005930.KS AAPL TSLA", period="1y", group_by="ticker")
```

### 한국 종목 표기

- KOSPI: `005930.KS` (.KS 접미사)
- KOSDAQ: `247540.KQ` (.KQ 접미사)
- 미국: `AAPL` (그대로)
- 홍콩: `0700.HK`
- 중국 본토: `600519.SS`

### Rate limit

Yahoo는 명시적 rate limit 없지만 너무 빠르게 호출하면 일시 차단. 보수적으로 종목 10개당 0.5초 대기.

---

## 3. tickers.json — 종목 카탈로그

### 구조

```json
{
  "generated_at": "2026-04-30T04:36:51+00:00",
  "count": 702,
  "failed": [],
  "tickers": [
    {
      "ticker": "AAPL",
      "name": "Apple",
      "name_en": "Apple",
      "sector": "IT",
      "alias": "apple iphone mac",
      "is_etf": false,
      "current_price": 0,
      "market_cap": 0,
      "volatility_30d": 0.25,
      "beta": 1.0,
      "debt_ratio": 0.30,
      "liquidity_volume": 0
    }
    // ... 700+ entries
  ]
}
```

### 의미

- **`ticker`**: Yahoo 표기 (KR은 .KS/.KQ, US는 그대로)
- **`name`**: 표시명 (한글 우선)
- **`name_en`**: 영문명
- **`sector`**: SPHERE 10개 섹터 중 하나 — IT/BIO/AUTO/FIN/ENERGY/CONSUMER/REALESTATE/INDUSTRIAL/GLOBAL_ETF/ETC
- **`alias`**: 검색용 별칭 (소문자, 공백 구분 키워드)
- **`is_etf`**: ETF 여부 (검색 필터·상관계수 휴리스틱에 사용)
- **`current_price`** 등 숫자 필드: prices.json에서 매일 덮어씀

### 왜 분리하나

- **tickers.json**: 메타데이터. 종목 추가/삭제 시에만 변함 (주 1회)
- **prices.json**: 시세·변동성·베타. 매일 변함

이렇게 분리하면:
- 매일 갱신되는 prices.json 파일 크기 작음 (~85KB)
- 종목 카탈로그(~240KB)는 변경이 드물어 git history에 부담 적음

### GICS → SPHERE 섹터 매핑

yfinance는 GICS 표준 섹터를 줍니다. 이를 SPHERE 10개로 매핑:

```python
GICS_TO_SPHERE = {
    "Technology": "IT",
    "Information Technology": "IT",
    "Communication Services": "IT",
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
    "Materials": "INDUSTRIAL",
    "Basic Materials": "INDUSTRIAL",
    "Utilities": "INDUSTRIAL",
}

# 자동차 보정 — GICS는 Auto를 별도로 나누지 않음
AUTO_HINT = re.compile(
    r"motor|auto|tesla|ford|gm\b|stellantis|toyota|hyundai|kia|...",
    re.I
)

def to_sphere_sector(gics, name=""):
    if AUTO_HINT.search(name):
        return "AUTO"
    return GICS_TO_SPHERE.get(gics, "ETC")
```

---

## 4. prices.json — 일별 시세

### 구조

```json
{
  "updated_at": "2026-04-30T23:00:15+00:00",
  "count": 698,
  "failed": ["XYZW"],
  "prices": {
    "005930.KS": {
      "price": 71200,
      "volatility_30d": 0.24,
      "beta": 1.05,
      "volume": 18500000,
      "dividend_yield": 0.0223
    },
    "AAPL": {
      "price": 195.32,
      "volatility_30d": 0.21,
      "beta": 1.18,
      "volume": 52000000,
      "dividend_yield": 0.0048
    }
  }
}
```

### 필드 설명

- **`price`**: 전일 종가 (USD/KRW 단위는 ticker에 따라)
- **`volatility_30d`**: 30일 일별 수익률 표준편차 × √252 (연환산)
- **`beta`**: S&P 500 대비 6개월 회귀 베타
- **`volume`**: 30일 평균 거래량 (주 단위)
- **`dividend_yield`**: TTM 배당수익률 (소수, 0.05 = 5%)

---

## 5. Python 스크립트 — update_prices.py

### 핵심 함수

```python
import yfinance as yf
import pandas as pd

def fetch_market_returns():
    """벤치마크 (S&P 500) 일일 수익률 — 베타 계산용"""
    market = yf.Ticker("^GSPC")
    hist = market.history(period="6mo", auto_adjust=True)
    return hist["Close"].pct_change().dropna()


def compute_metrics(ticker: str, market_returns):
    """단일 종목의 가격·변동성·베타·평균거래량·배당률"""
    try:
        tk = yf.Ticker(ticker)
        hist = tk.history(period="6mo", auto_adjust=True)
        if hist.empty or len(hist) < 30:
            return None

        latest_price = float(hist["Close"].iloc[-1])

        # 30일 연환산 변동성
        returns = hist["Close"].pct_change().dropna()
        recent = returns.iloc[-30:]
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

        # 배당수익률
        dividend_yield = 0.0
        try:
            info = tk.fast_info
            dy = getattr(info, "dividend_yield", None) or tk.info.get("dividendYield") or 0
            dividend_yield = float(dy or 0)
            if dividend_yield > 1:
                dividend_yield /= 100   # 일부 버전 % 단위
        except Exception:
            pass

        return {
            "price": round(latest_price, 2),
            "volatility_30d": round(volatility_30d, 4),
            "beta": round(beta, 3),
            "volume": avg_volume,
            "dividend_yield": round(dividend_yield, 4)
        }
    except Exception as exc:
        print(f"  ! {ticker}: {exc}")
        return None
```

### tickers.json 우선 로드, 폴백 하드코딩

```python
def load_catalog_tickers() -> list:
    catalog = Path(__file__).parent.parent / "data" / "tickers.json"
    if not catalog.exists():
        return []
    try:
        data = json.loads(catalog.read_text())
        return sorted({t["ticker"] for t in data.get("tickers", [])
                       if t.get("ticker")})
    except Exception:
        return []

FALLBACK_TICKERS = ["005930.KS", "AAPL", ...]   # ASSET_DB 핵심 종목
TICKERS = load_catalog_tickers() or FALLBACK_TICKERS
```

### 베타 회귀의 통계적 의미

베타는 단순 상관계수가 아닌 **회귀 계수**입니다:

$$\beta = \frac{\text{Cov}(r_i, r_m)}{\text{Var}(r_m)}$$

- 분자: 종목과 시장의 공분산 (얼마나 같이 움직이는지)
- 분모: 시장 자체의 변동성

이는 시장 1% 변동 시 종목이 평균 몇 % 변하는지의 기울기. CAPM의 핵심 입력값.

---

## 6. Python 스크립트 — generate_tickers.py

### 메타데이터 fetch

```python
def fetch_meta(ticker: str):
    try:
        info = yf.Ticker(ticker).info
        if not info: return None
        name = info.get("longName") or info.get("shortName")
        if not name: return None
        sector_raw = info.get("sector") or ""
        quote_type = (info.get("quoteType") or "").upper()
        is_etf = quote_type in ("ETF", "MUTUALFUND")
        sector = "GLOBAL_ETF" if is_etf else to_sphere_sector(sector_raw, ticker, name)

        return {
            "ticker": ticker,
            "name": name,
            "name_en": name,
            "sector": sector,
            "alias": name.lower(),
            "is_etf": is_etf,
            "market_cap": info.get("marketCap") or 0,
            "current_price": info.get("regularMarketPreviousClose") or 0,
            "volatility_30d": 0.25,    # default
            "beta": info.get("beta") or 1.0,
            "debt_ratio": 0.30,
            "liquidity_volume": info.get("averageVolume") or 0,
        }
    except Exception as exc:
        print(f"  ! {ticker}: {exc}")
        return None
```

### 대상 티커 — 주요 지수

스크립트 상단에 하드코딩:

```python
US_TICKERS = [
    "AAPL","MSFT","GOOGL", ...    # S&P 500 + NASDAQ 100 약 520개
]
US_ETFS = [
    "SPY","VOO","QQQ", ...        # 약 70개
]
KR_TICKERS = [
    "005930.KS", "000660.KS", ... # KOSPI Top 200 + KOSDAQ Top 50
]
KR_ETFS = [
    "069500.KS", "102110.KS", ... # 약 30개
]
```

이 리스트는 **수동 큐레이션**입니다. 자동 생성하려면 위키피디아 S&P 500 페이지를 스크래핑하는 방법도 있지만 의존성 늘어나서 유지보수 부담 ↑.

### Rate limit 대응

```python
for idx, ticker in enumerate(all_tickers, 1):
    meta = fetch_meta(ticker)
    if meta: results.append(meta)
    if idx % 25 == 0:
        time.sleep(0.5)   # 25개마다 0.5초 쉬기
```

700개 처리 시 약 700초 (~12분). 매주 한 번이라 OK.

---

## 7. GitHub Actions 워크플로

### update-prices.yml (매일)

```yaml
name: Update SPHERE Prices
on:
  schedule:
    - cron: '0 23 * * *'    # 매일 23:00 UTC = 한국 다음날 08:00
  workflow_dispatch:        # 수동 실행 허용

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: requirements.txt
      - run: pip install -r requirements.txt
      - run: python tools/update_prices.py
      - name: Commit and push if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add data/prices.json data/tickers.json
          if git diff --staged --quiet; then
            echo "No data changes."
          else
            git commit -m "chore: update daily prices [$(date -u +'%Y-%m-%d')]"
            git push
          fi
```

### regenerate-tickers.yml (매주 일요일)

```yaml
name: Regenerate Ticker Catalog
on:
  workflow_dispatch:
  schedule:
    - cron: '0 2 * * 0'    # 일요일 02:00 UTC

jobs:
  regenerate:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
          cache-dependency-path: requirements.txt
      - run: pip install -r requirements.txt
      - run: python tools/generate_tickers.py
      - name: Commit and push if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add data/tickers.json
          if ! git diff --staged --quiet; then
            git commit -m "chore: regenerate ticker catalog"
            git push
          fi
```

### deploy.yml (Pages 배포)

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: pages
  cancel-in-progress: true

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 핵심 트리거 패턴

- **`schedule: cron`**: 정기 실행. UTC 기준
- **`workflow_dispatch`**: GitHub Actions UI에서 수동 실행 가능
- **`push`**: 특정 브랜치 push 시 자동 실행

### 권한 — `permissions: contents: write`

GH Actions가 commit·push 하려면 이 권한 필수. Pages 배포는 `pages: write`도 필요.

---

## 8. JS 측 로딩

### applyTickerCatalog()

```javascript
async function applyTickerCatalog(){
  try {
    const res = await fetch('./data/tickers.json?t=' + Date.now(), { cache:'no-cache' });
    if (!res.ok) return null;
    const data = await res.json();
    const DB = window.ASSET_DB, BY = window.ASSET_BY_TICKER;
    if (!DB || !BY) return null;

    let added = 0;
    data.tickers.forEach(item => {
      if (!item.ticker || BY[item.ticker]) return;   // 핵심 ASSET_DB 우선
      const entry = {
        ticker: item.ticker,
        name: item.name || item.ticker,
        name_en: item.name_en || item.name,
        sector: item.sector || 'ETC',
        current_price: item.current_price || 0,
        volatility_30d: item.volatility_30d ?? 0.25,
        beta: item.beta ?? 1.0,
        debt_ratio: item.debt_ratio ?? 0.30,
        liquidity_volume: item.liquidity_volume || 0,
        is_etf: !!item.is_etf,
        alias: (item.alias || item.name).toLowerCase(),
        _fromCatalog: true
      };
      DB.push(entry);
      BY[entry.ticker] = entry;
      added++;
    });
    return { added, total: DB.length };
  } catch (e){
    console.warn('[SPHERE] Ticker catalog load failed:', e);
    return null;
  }
}
```

핵심 ASSET_DB(211개 큐레이션)와 카탈로그(700+)를 **머지하지 않고 추가만**. 같은 ticker가 ASSET_DB에 있으면 catalog 버전은 무시 (큐레이션이 우선).

### applyDailyPrices()

```javascript
async function applyDailyPrices(){
  try {
    const res = await fetch('./data/prices.json?t=' + Date.now(), { cache:'no-cache' });
    if (!res.ok) return null;
    const data = await res.json();
    const BY = window.ASSET_BY_TICKER;
    if (!BY) return null;

    let updated = 0;
    Object.entries(data.prices).forEach(([ticker, info]) => {
      const a = BY[ticker];
      if (a && info.price){
        a.current_price = info.price;
        if (info.volatility_30d != null) a.volatility_30d = info.volatility_30d;
        if (info.beta != null) a.beta = info.beta;
        if (info.volume != null) a.liquidity_volume = info.volume;
        if (info.dividend_yield != null) a.dividend_yield = info.dividend_yield;
        updated++;
      }
    });
    return { updated, updatedAt: data.updated_at };
  } catch (e){
    return null;
  }
}
```

### 호출 순서

```javascript
// app.js 끝부분
applyTickerCatalog().then(catMeta => {
  if (catMeta?.added > 0){
    console.log(`Loaded ${catMeta.added} catalog tickers`);
  }
  return applyDailyPrices();
}).then(meta => {
  if (meta?.updated > 0){
    rebuildAll();   // 시세 반영 후 전체 재계산
  }
});
```

페이지 로드 → tickers.json 로드 → prices.json 로드 → 둘 다 완료되면 UI 재렌더.

### Cache busting

`?t=Date.now()` 쿼리 추가로 매번 fresh 데이터 fetch (브라우저·CDN 캐시 우회).

---

## 9. 데이터 정합성

### 누락 처리

```javascript
// applyDailyPrices에서 ticker가 ASSET_BY_TICKER에 없으면 무시
if (!a) return;
```

prices.json에 있는데 ASSET_DB·tickers.json에 없는 ticker → 그냥 건너뜀. 사용자에게 영향 없음.

### 정적 폴백

```javascript
// ASSET_DB는 하드코딩된 211개 종목의 정적 스냅샷
const ASSET_DB = [
  { ticker:'005930.KS', name:'삼성전자', current_price:71200, volatility_30d:0.24, ... }
];
```

prices.json fetch 실패해도 ASSET_DB의 정적 값으로 동작. 사이트 다운 X.

### 갱신 시각 표시

헤더의 STATUS:
```javascript
applyDailyPrices().then(meta => {
  if (meta){
    const d = new Date(meta.updatedAt);
    const str = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    statusBadge.textContent = `● ${str}`;
  }
});
```

사용자가 "오늘 데이터" 인지 "어제 데이터" 인지 즉시 알 수 있음.

### 면책 배너

> "본 서비스는 교육·시연 목적의 시각화 도구이며, 투자 자문이 아닙니다. 종목 시세는 매일 전일 종가 기준으로 자동 갱신됩니다 (실시간 아님)."

법적·신뢰성 고지 + 데이터 한계 명시.

---

## 트러블슈팅

### Workflow 실패 — "No file in /home/runner/... matched to requirements.txt"

`actions/setup-python` 의 `cache: 'pip'` 옵션은 `requirements.txt` 가 있어야 동작. 빈 파일이라도 commit 필요.

### yfinance가 빈 결과 반환

- Yahoo가 일시 차단 (rate limit) — 시간 두고 재시도
- ticker 표기 오류 (예: `005930.KOSPI` 대신 `005930.KS`)
- 상장폐지 — `failed` 리스트에 기록 후 다음 갱신 때 다시 확인

### KR 종목 시세는 가져오는데 이름이 이상

yfinance의 한국 종목 `info` 가 영문으로 반환. SPHERE는 ASSET_DB에서 한글 이름 미리 매핑. Catalog에는 영문 그대로.

### GitHub Actions 시간이 한국 시간과 다름

cron은 **무조건 UTC**. 한국 09:00에 돌리려면 cron을 `0 0 * * *` (UTC 00:00 = 한국 09:00).

---

## 다음 읽을 문서

- UI/UX 디테일 → `05-ui-design-system.md`
- 처음부터 만들기 → `06-rebuild-from-scratch.md`
