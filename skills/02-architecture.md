# 02. 아키텍처 — TypeScript + Vite, 25개 모듈

## 핵심 철학

> **"강한 타입 + 작은 모듈, 그러나 프레임워크는 없음"**

SPHERE는 React/Vue/Next.js 같은 컴포넌트 프레임워크는 쓰지 않습니다. **TypeScript + Vite**로 빌드하지만, UI 렌더링은 vanilla DOM API + `innerHTML` 템플릿. 모듈 경계는 ESM `import/export`, 가변 런타임 상태는 `RUNTIME` 싱글턴 객체로 모입니다.

### 진화 노트

이 프로젝트는 처음에 단일 `js/app.js` (4802줄, 빌드 없음) 로 작성됐습니다. 2026-05 초 TS + Vite로 전환하며 25개 모듈로 분할 (`main.ts` 기준 −92%). 전환 동기:

- 4800줄 단일 파일은 검색·디버그·리팩토링 비용이 너무 큼
- Three.js 코드와 도메인 로직이 섞여 있어 한 곳을 만지면 다른 곳이 깨짐
- "빌드 없음"은 좋지만, **타입 없음**의 비용이 더 컸음

### 프레임워크 없음 — 여전히 유효

| 비교 | React/Vue | SPHERE |
|---|---|---|
| 의존성 트리 | 100+ | three + vite + ts (3개) |
| 빌드 산출물 | 수MB+ | dist 200KB + three 청크 683KB |
| 학습 곡선 | JSX, hooks, 상태 라이브러리 | DOM API + 템플릿 문자열 |
| 디버깅 | 컴포넌트 트리 + 가상 DOM | 일반 브라우저 devtools |

→ **여전히 1~2명의 작은 프로젝트**. UI 컴포넌트가 정해진 set이라 프레임워크의 추상화 비용이 회수되지 않습니다.

---

## 파일 구조

```
sphere/
├── index.html                       # Vite 진입점
├── css/styles.css                   # 전체 스타일
├── src/                             # TypeScript 소스
│   ├── main.ts                      # 부트스트랩 (~400줄)
│   ├── runtime.ts                   # RUNTIME 싱글턴 (가변 상태)
│   ├── types.ts                     # 도메인 타입
│   ├── i18n.ts                      # KO/EN 사전
│   ├── core/pipeline.ts             # 5-Layer 파이프라인
│   ├── data/{assetDb,catalog}.ts    # 마스터 DB + 비동기 로더
│   ├── state/portfolio.ts           # localStorage 상태
│   ├── advanced/metrics.ts          # VaR/Sharpe + 스트레스
│   ├── scene/sphere.ts              # Three.js 씬 전체
│   └── ui/                          # 16개 UI 컴포넌트
├── public/                          # Vite 정적 자산 (data/, lib/)
├── tools/                           # Python (yfinance) 데이터 스크립트
└── .github/workflows/               # 배포 + 매일 시세 갱신
```

### 모듈 책임 (요약)

| 레이어 | 모듈 | 책임 |
|---|---|---|
| **부트** | main.ts | 모듈 wiring, 부트 시퀀스, 코어 오케스트레이션 (rebuildAll, selectAsset) |
| **상태** | state/portfolio.ts | STATE 객체, migration, saveState, activePortfolio |
| **상태** | runtime.ts | RUNTIME 싱글턴 (ITEMS/BALANCE/INSIGHTS/ADVANCED, rebalanceMode, CURRENT_STRESS, networkMode) |
| **데이터** | data/assetDb.ts | 211 종목 정적 스냅샷 |
| **데이터** | data/catalog.ts | 비동기 로더 (700+ 카탈로그, 일별 시세) |
| **연산** | core/pipeline.ts | 5-Layer 파이프라인 + SECTOR_DEF |
| **연산** | advanced/metrics.ts | VaR/CVaR/Sharpe/Sortino + 스트레스 시나리오 + 매크로 합성 |
| **다국어** | i18n.ts | KO/EN 사전, 통화 단위, 섹터 라벨, setLang 콜백 |
| **3D** | scene/sphere.ts | THREE 씬·노드·인터랙션·애니메이션 (단일 파일 488줄) |
| **UI** | ui/{16개} | 패널·모달·검색·툴팁·리밸런서… 각자 install() 함수로 셋업 |

### 모듈 간 통신 패턴

1. **단방향 데이터 흐름**: 사용자 액션 → STATE/RUNTIME mutation → `rebuildAll()` → pipeline → render
2. **콜백 등록**: UI 모듈이 외부 의존(rebuildAll, selectAsset)을 `installXxx({ onYyy: fn })` 으로 받음
3. **RUNTIME 싱글턴**: cross-module 가변 상태는 `RUNTIME.X` 객체 필드 (live binding 한계 우회)
4. **이벤트 위임**: 동적 DOM은 `document.body.addEventListener('click', ...)` 으로 통합

---

## 데이터 흐름

```
┌─────────────────────────────────────────────────┐
│ ASSET_DB (정적 211 종목)                          │
│   + applyTickerCatalog()                         │
│   ↓ public/data/tickers.json (700+ 메타데이터)   │
│   + applyDailyPrices()                           │
│   ↓ public/data/prices.json (당일 시세, σ, β)    │
│ ASSET_BY_TICKER (병합된 마스터)                   │
└─────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────┐
│ STATE (localStorage 'sphere_portfolios_v1')      │
│   { portfolios: [...], activeId: 'pf_xxx' }      │
│ activePortfolio() = STATE.portfolios.find(...)   │
└─────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────┐
│ runPipeline()                                    │
│   1. portfolioToRaw → 종목별 weight, market_value│
│   2. standardize    → 누락값 채움                 │
│   3. computeRiskScores → 5요소 가중합 0~100      │
│   4. mapSphereCoords   → (lat, lng, r)           │
│   5. computeBalance    → balance, diverse, ...    │
│   6. computeAdvancedMetrics → VaR, Sharpe, DR    │
│   7. generateInsights  → W1~W7 약점 진단         │
│   → RUNTIME.{ITEMS, BALANCE, INSIGHTS, ADVANCED} │
└─────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────┐
│ scene.rebuildNodes(RUNTIME.ITEMS) → 3D 갱신     │
│ renderAllUI() → 패널 DOM 갱신                    │
└─────────────────────────────────────────────────┘
```

### RUNTIME 싱글턴 패턴

ESM live binding은 `let foo` export 가능하지만 **재할당은 정의 모듈에서만** 가능합니다. 그래서 `runPipeline()` 같은 mutation을 main.ts 외부 모듈에 둘 수 없었습니다. 해결: 가변 필드를 단일 객체로 묶고 객체 reference를 export.

```ts
// runtime.ts
export const RUNTIME = {
  ITEMS: [], BALANCE: {}, INSIGHTS: [], ADVANCED: {},
  rebalanceMode: false, TARGET_ITEMS: [], ...
  CURRENT_STRESS: null, networkMode: false, networkThreshold: 0.5,
};

// pipeline 결과를 어디서든 mutation 가능:
RUNTIME.ITEMS = mapSphereCoords(computeRiskScores(standardize(raw)));
```

**주의**: 안티패턴이지만 실용적. 더 깨끗하게 가려면 Redux/Zustand급 store 도입 — 현재 규모엔 과합니다.

---

## 상태 관리 (localStorage)

### Storage Keys

| 키 | 내용 |
|---|---|
| `sphere_portfolios_v1` | 포트폴리오 배열 + activeId |
| `sphere_panel_widths_v1` | 좌·우 패널 드래그 너비 |
| `sphere_theme_v1` | 'light' / 'dark' |
| `sphere_tour_done` | 첫 방문 투어 완료 여부 |
| `sphere_legal_dismissed` | 하단 면책 배너 닫음 |

### 포트폴리오 스키마

```ts
// src/types.ts
export interface Portfolio {
  id: string;
  name: string;
  holdings: Holding[];
  createdAt: number;
  updatedAt: number;
}
export interface Holding {
  ticker: string;
  quantity: number;
  avg_price: number;
  market_value?: number;  // computeWeights 후
  weight?: number;        // computeWeights 후
}
```

핵심: holdings는 **수량 기반** (절대값). 비중은 portfolioToRaw()에서 평가금액 합으로 자동 계산.

### 마이그레이션

`migrateHoldings()` 함수가 구버전 데이터를 자동 변환합니다.

---

## 의존성 (npm)

### `dependencies`

- **`three` ^0.169** — npm 버전. 과거엔 `lib/three.min.js` 로컬 번들이었으나 npm으로 전환. Vite가 별도 청크(`three-XXX.js`)로 분리 빌드.

### `devDependencies`

- **`vite` ^5.4** — 개발 서버 (HMR) + 프로덕션 빌드
- **`typescript` ^5.6** — 타입 체크 (strict, noEmit)
- **`@types/three`** — Three.js 타입 정의

### 그 외 — 의존성 없음

- 아이콘: 유니코드 이모지·문자 (`◉ ⌕ ≡ ▣ ★ ⌬`) 그대로 사용
- 폰트: 시스템 폰트 (`Inter`, `SF Pro Display`, `Pretendard` fallback)
- 차트: Three.js 외 별도 차트 라이브러리 없음 (sector bar는 직접 div 그림)
- 상태 관리: Redux/Zustand 등 없음 — RUNTIME 객체 직접 mutation

---

## 빌드/배포

### 로컬 개발

```bash
npm install        # 최초 1회
npm run dev        # http://127.0.0.1:5173 — HMR 활성
npm run typecheck  # tsc --noEmit
```

### 프로덕션 빌드

```bash
npm run build      # tsc --noEmit && vite build → dist/
npm run preview    # 빌드 결과 로컬 미리보기
```

산출물:
- `dist/index.html` ~26KB
- `dist/assets/index-XXX.js` ~180KB (~63KB gzip)
- `dist/assets/three-XXX.js` ~683KB (~176KB gzip, 별도 청크)
- `dist/assets/index-XXX.css` ~64KB
- `dist/data/`, `dist/lib/` (public/ 복사본)

### GitHub Pages 배포

`main` push → `.github/workflows/deploy.yml`:

1. `actions/setup-node@v4`
2. `npm ci`
3. `npm run typecheck`
4. `DEPLOY_TARGET=gh-pages npm run build` (base `/sphere/`)
5. `actions/upload-pages-artifact@v3` with `path: dist`
6. `actions/deploy-pages@v4`

배포 시간: ~1분.

### 다른 정적 호스팅

- **Cloudflare Pages**: build command `npm run build`, output `dist`
- **Netlify**: 동일
- **Vercel**: framework preset = "Vite"
- **자체 서버**: `npm run build` 결과 dist/ 를 nginx 정적 호스팅

---

## 데이터 자동화 (CI/CD)

### 매일 23:00 UTC (한국 다음날 08:00)

`.github/workflows/update-prices.yml`:
1. Python 환경 셋업
2. `tools/update_prices.py` 실행 — yfinance에서 700+ 종목 시세·σ·β·배당 fetch
3. `public/data/prices.json` 갱신 (기존 `data/` 에서 이전됨)
4. 변경 있으면 commit & push

### 매주 일요일 02:00 UTC

`.github/workflows/regenerate-tickers.yml`:
1. `tools/generate_tickers.py` 실행
2. `public/data/tickers.json` 재생성

자세한 데이터 파이프라인은 `04-data-pipeline.md` 참조.

---

## 보안·프라이버시

### 데이터 서버 전송 0

- 사용자 포트폴리오는 **localStorage에만** 저장. 서버에 전송 안 함
- 백엔드 자체가 없음 (정적 사이트)
- 시세는 **읽기 전용 GET** — 사용자 데이터 없이 yfinance 공개 API에서만

### 로그·트래킹 0

- Google Analytics, Mixpanel 등 일체 없음
- 페이지 로드 시 외부 통신은 `data/prices.json` (자기 서버) + `data/tickers.json` 만

---

## 코드 컨벤션

### TypeScript

- **strict mode** + `noImplicitAny: false` (단계적 강화 중)
- **타입 import 분리**: `import type { Asset } from '../types.js'`
- **선언**: `const` 우선, 변경 필요 시만 `let`. `var` 사용 안 함
- **함수**: 함수 선언 (`function name()`) 위주, 콜백·이벤트 핸들러는 화살표
- **명명**: camelCase. 상수는 `UPPER_SNAKE_CASE`
- **주석**: 한국어 OK. WHY를 적고 WHAT은 코드로
- **에러 처리**: try-catch는 외부 I/O (fetch, localStorage)만. 내부 로직은 입력 검증
- **이벤트 위임**: 동적으로 추가되는 요소는 `document.body.addEventListener` 위임

### `innerHTML` 정책

UI 모듈 다수가 템플릿 문자열 + `innerHTML`로 렌더링합니다 (34곳). 신뢰 모델:

- **innerHTML 인터폴레이션 가능 (정적·신뢰 출처)**:
  - `t('key', ...args)` 등 i18n 사전 결과 — 우리가 작성
  - `getName(asset)`, `asset.ticker`, `it.sector` 등 ASSET_DB / catalog.json 출처
  - 숫자 (`.toFixed()`, `.toLocaleString()`) — 타입상 안전
  - 정적 클래스명·CSS 변수
- **반드시 escape (사용자 입력)**:
  - 포트폴리오 이름 (`pf.name`) — `escapeHtml()` 사용 중 (`src/ui/portfolio-select.ts`)
  - 검색 입력값 — 매칭 비교에만 사용, innerHTML 인터폴레이션 금지
- **현재 위험 0**: 자유 텍스트 종목명 등록 같은 기능이 추가되면 `getName()` 인터폴레이션 사이트 전체 재점검 필요

향후 새 UI 추가 시 입력 출처를 위 표에 분류 → escape 여부 결정.

### `@ts-nocheck` 정책

레거시 코드에서 옮긴 일부 모듈은 아직 `@ts-nocheck`로 타입 체크를 우회 중. **B-5 phase에서 점진적으로 제거**:

- 완료: toast, format, mobile, layout, modal, insights, detail, balance, advanced, stress, correlation, search, tooltip, holdings, portfolio-select, tour 일부 + state/portfolio + core/pipeline + i18n + data/{assetDb,catalog} + types
- 미완: main.ts, scene/sphere.ts, advanced/metrics.ts, ui/rebalance.ts (큰 모듈 위주)

### CSS

- **변수 우선**: 색상은 `var(--color-name)`, hex 직접 쓰지 않음
- **BEM 변형**: `.panel-title`, `.panel-actions` 같은 단순 prefix
- **모바일 미디어 쿼리**: `@media (max-width: 768px)` 한 곳에 모음
- **`!important`**: 미디어 쿼리 오버라이드와 섹션 시스템에만 사용

### HTML

- **시맨틱 우선**: `<aside>`, `<main>`, `<nav>`, `<button>`
- **접근성**: `aria-label`, `role`, `aria-haspopup` 챙김
- **데이터 속성**: `data-*` 로 JS 식별. 클래스로 식별 안 함

---

## 다음 읽을 문서

- 시각화 부분 → `03-3d-visualization.md`
- 데이터 자동화 → `04-data-pipeline.md`
- UI/UX 디테일 → `05-ui-design-system.md`
- 처음부터 만들기 → `06-rebuild-from-scratch.md`
