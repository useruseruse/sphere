# SPHERE — 포트폴리오 리스크 구체 분석기

투자 포트폴리오의 리스크 구조를 3D 구체로 시각화하는 분석 도구.

## Features

- 3D 구체에 포트폴리오 매핑 (위도=섹터, 경도=비중, 돌출=리스크)
- 5-Layer 분석 파이프라인 (표준화 → 리스크 → 좌표 → 밸런스 → 인사이트)
- AI 추천 엔진 — 약점 진단(W1~W7) 후 종목 추가/축소 액션 자동 제안
- 상관관계 네트워크 — 섹터·베타·변동성 기반 종목 간 동조성 시각화
- 종목/ETF 검색 (S&P500·NASDAQ·KOSPI·KOSDAQ 700+ 종목 카탈로그, 한글·영문 별칭, 130+ 해시태그)
- 포트폴리오 다중 관리 (최대 20개, localStorage 자동 저장)
- 한국어/English 양국어 지원
- 인포 툴팁 — 모든 지표의 산출 공식·임계값·학술 근거(Markowitz, Sharpe, HHI)
- 일별 자동 시세 갱신 (yfinance + GitHub Actions)
- 첫 방문자용 온보딩 투어

## Folder Structure

```
sphere/
├── index.html                       # 진입점 (Vite가 변환·번들)
├── css/
│   └── styles.css                   # 전체 스타일 (CSS 변수 기반 테마)
├── src/                             # TypeScript 소스 (25개 모듈)
│   ├── main.ts                      # 부트스트랩 + 코어 오케스트레이션 (~400줄)
│   ├── runtime.ts                   # 가변 런타임 상태 (RUNTIME 싱글턴)
│   ├── types.ts                     # 도메인 타입 (Asset/Holding/Item/...)
│   ├── i18n.ts                      # KO/EN 사전 + 통화/섹터 라벨
│   ├── core/
│   │   └── pipeline.ts              # 5-Layer 파이프라인 (standardize → ... → insights)
│   ├── data/
│   │   ├── assetDb.ts               # 211개 핵심 종목/ETF 정적 스냅샷
│   │   └── catalog.ts               # data/*.json 비동기 로더
│   ├── state/
│   │   └── portfolio.ts             # STATE/saveState/migrate (localStorage)
│   ├── advanced/
│   │   └── metrics.ts               # VaR/CVaR/Sharpe/Sortino + 스트레스/매크로
│   ├── scene/
│   │   └── sphere.ts                # Three.js 씬 전체 (488줄)
│   └── ui/                          # UI 컴포넌트 16개
│       ├── modal.ts, toast.ts, mobile.ts, tour.ts, layout.ts
│       ├── portfolio-select.ts, holdings.ts, balance.ts, format.ts
│       ├── advanced.ts, stress.ts, insights.ts, detail.ts
│       ├── correlation.ts, search.ts, tooltip.ts, rebalance.ts
├── public/                          # Vite 정적 자산 (빌드 시 dist/ 루트로 복사)
│   └── data/
│       ├── tickers.json             # 종목 카탈로그 700+
│       └── prices.json              # 일별 시세 (자동 갱신)
├── tools/                           # Python 데이터 갱신 스크립트
│   ├── generate_tickers.py          # tickers.json 재생성 (yfinance, 주1회)
│   └── update_prices.py             # prices.json 갱신 (yfinance, 매일)
├── .github/workflows/
│   ├── deploy.yml                   # main push → npm ci → vite build → gh-pages
│   ├── update-prices.yml            # 매일 시세 갱신
│   └── regenerate-tickers.yml       # 매주 카탈로그 재생성
├── package.json                     # vite + typescript + three
├── tsconfig.json                    # strict, ES2022, Bundler resolution
├── vite.config.ts                   # base: '/sphere/' (gh-pages)
├── README.md
└── LICENSE
```

## 데이터 형식

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

페이지 로드 시 `src/data/catalog.ts`가 `public/data/prices.json`을 fetch해서 `ASSET_DB`의 기본값을 덮어씁니다. 실패 시 정적 폴백.

## 개발

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run typecheck  # tsc --noEmit
npm run build      # tsc --noEmit && vite build → dist/
npm run preview    # 빌드 결과 미리보기
```

## 배포 (GitHub Pages)

`main` 브랜치 push 시 `.github/workflows/deploy.yml`이 자동 실행:

1. `npm ci`
2. `npm run typecheck`
3. `DEPLOY_TARGET=gh-pages npm run build` (base path `/sphere/` 적용)
4. `dist/` 업로드 → GitHub Pages

배포 시간: ~1분.

## Tech Stack

- TypeScript 5.6+ (strict, noImplicitAny=false 단계적 강화 중)
- Vite 5 (개발 서버 + 번들링)
- Three.js 0.169+ (npm — `import * as THREE`)
- localStorage (사용자 포트폴리오 영속화)
- Python 3.11 + yfinance (시세 갱신, 사용자 환경엔 미설치)

## Disclaimer

본 서비스는 교육·시연 목적의 포트폴리오 시각화 도구이며, 투자 자문이 아닙니다.
종목 시세는 매일 전일 종가 기준으로 자동 갱신됩니다 (실시간 아님).
모든 투자 결정과 그에 따른 손익은 사용자 본인의 책임입니다.

## License

MIT License — see LICENSE file. Three.js (MIT) used via npm.
