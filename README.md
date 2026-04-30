# SPHERE — 포트폴리오 리스크 구체 분석기

투자 포트폴리오의 리스크 구조를 3D 구체로 시각화하는 분석 도구.
DACON 월간 해커톤 — 투자 데이터를 시각화하라 출품작.

## Features

- 3D 구체에 포트폴리오 매핑 (위도=섹터, 경도=비중, 돌출=리스크)
- Skills.md 5개 레이어 분석 파이프라인 (표준화 → 리스크 → 좌표 → 밸런스 → 인사이트)
- AI 추천 엔진 — 약점 진단(W1~W5) 후 종목 추가/축소 액션 자동 제안
- 상관관계 네트워크 — 섹터·베타·변동성 기반 종목 간 동조성 시각화
- 종목/ETF 검색 (KR/US 100여 종목, 한글·영문 별칭 지원)
- 포트폴리오 다중 관리 (최대 20개, localStorage 자동 저장)
- 한국어/English 양국어 지원
- 인포 툴팁 — 모든 지표의 산출 공식·임계값·학술 근거(Markowitz, Sharpe, HHI)
- **일별 자동 시세 갱신** (yfinance + GitHub Actions)

## Folder Structure

```
sphere/
├── index.html              # HTML 본문
├── css/
│   └── styles.css          # 전체 스타일
├── js/
│   └── app.js              # 전체 로직
├── lib/
│   └── three.min.js        # Three.js r128 (MIT)
├── data/
│   └── prices.json         # 일별 시세 (자동 갱신)
├── tools/
│   └── update_prices.py    # yfinance 갱신 스크립트
├── .github/
│   └── workflows/
│       └── update-prices.yml  # 매일 자동 실행
├── README.md
└── LICENSE
```

## Local Development

ES 모듈은 사용하지 않지만, `data/prices.json` fetch 때문에 정적 서버가 필요합니다.

```bash
cd sphere
python3 -m http.server 8000
# 또는
npx serve .
```

브라우저에서 `http://localhost:8000` 접속.

## Deployment

### Netlify (추천 — 1분, GitHub 없이도 가능)

1. https://app.netlify.com/drop 접속
2. `sphere` 폴더를 드래그앤드롭
3. URL 발급 (예: `https://sphere-portfolio.netlify.app`)

### GitHub Pages (일별 자동 갱신 사용 시 권장)

```bash
cd sphere
git init && git add . && git commit -m "Initial SPHERE deployment"
git remote add origin <your-github-repo-url>
git push -u origin main
```

GitHub repo Settings → Pages → Source: `main` branch, Folder: `/`.

GitHub Actions 자동 갱신을 활성화하려면:
- Settings → Actions → General → Workflow permissions: **Read and write permissions** 체크
- 첫 실행은 Actions 탭에서 "Update SPHERE Prices" 워크플로우 수동 트리거(`workflow_dispatch`)

## Daily Price Updates

`tools/update_prices.py`가 yfinance로 100여 종목의 가격·변동성·베타·거래량을 수집해 `data/prices.json`에 저장합니다.

### 로컬 실행

```bash
pip install yfinance pandas numpy
cd sphere
python tools/update_prices.py
```

### 자동 실행 (GitHub Actions)

`.github/workflows/update-prices.yml`이 **매일 23:00 UTC (08:00 KST)** 자동 실행됩니다.
KOSPI 정규장 마감 후 + 미국 시장 정규장 종료 직후 시점이라 양쪽 종가가 모두 확보됩니다.

수동 트리거: GitHub repo → Actions 탭 → "Update SPHERE Prices" → Run workflow.

### 데이터 형식

```json
{
  "updated_at": "2026-04-30T23:00:00+00:00",
  "count": 96,
  "failed": [],
  "prices": {
    "005930.KS": {
      "price": 71200,
      "volatility_30d": 0.24,
      "beta": 1.05,
      "volume": 18500000
    },
    "AAPL": { ... }
  }
}
```

페이지 로드 시 `app.js`가 이 파일을 fetch해서 `ASSET_DB`의 기본값을 덮어씁니다. 실패 시 정적 폴백.

## Tech Stack

- Pure HTML / CSS / JavaScript (ES2020+)
- Three.js r128 (WebGL 3D 렌더링)
- localStorage (사용자 포트폴리오 영속화)
- Python 3.11 + yfinance (시세 갱신)
- GitHub Actions (자동 cron)
- 외부 의존성 빌드 단계 없음

## Disclaimer

본 서비스는 교육·시연 목적의 포트폴리오 시각화 도구이며, 투자 자문이 아닙니다.
종목 시세는 매일 전일 종가 기준으로 자동 갱신됩니다 (실시간 아님).
모든 투자 결정과 그에 따른 손익은 사용자 본인의 책임입니다.

## License

MIT License — see LICENSE file. Three.js (MIT) is bundled in `lib/`.
