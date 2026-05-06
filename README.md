# SPHERE — 포트폴리오 리스크 시각화 도구

> 투자 포트폴리오의 리스크 구조를 3D 구체로 모델링하는 단일 페이지 웹 애플리케이션.
> 금융공학 도메인을 학습해 5-Layer 분석 파이프라인으로 구현하고, 리포팅 UI·자동 데이터 파이프라인까지 단독 설계·구축했습니다.

**🌐 라이브 데모** → **[useruseruse.github.io/sphere](https://useruseruse.github.io/sphere/)**

![SPHERE 메인 화면](./docs/hero.png)

---

## 한 줄 요약

**"투자의 위험은 평면이 아니라 입체적이다"** — 섹터 분산·종목별 변동성·상관관계·매크로 노출이 동시에 작용하는 포트폴리오 위험을, 막대그래프 대신 **3D 구체** 한 시야에 담는다.

| 축 | 의미 | 직관 |
|---|---|---|
| **위도** (Lat) | 섹터 분류 | 위쪽 = 성장주(IT·BIO) / 아래 = 가치주(소비재·금융) |
| **경도** (Lng) | 같은 섹터 내 비중 분포 | 비중이 한쪽으로 치우치면 일그러짐 |
| **돌출** (Radius) | 종목 위험 점수 | 위험할수록 표면에서 더 튀어나옴 |

→ **완벽한 구체에 가까울수록 균형 잡힌 포트폴리오.** 모양만 봐도 직관적으로 진단할 수 있도록 설계.

---

## 프로젝트 하이라이트

### 📊 데이터 시각화 / 리포팅 UI

- **3D 인터랙티브 시각화** — Three.js 기반, 섹터·비중·리스크를 구좌표 `(lat, lng, r)`로 매핑. 카메라 컨트롤·툴팁·하이라이트·셀렉션 인터랙션 직접 구현 ([`src/scene/sphere.ts`](./src/scene/sphere.ts), 515줄).
- **관리용 백오피스성 화면** — 검색·필터·요약 카드·상세 패널·드릴다운·다중 포트폴리오 관리(최대 20개). 사내 시스템에서 흔히 쓰이는 리포팅·관리 UI 패턴을 충실히 구현 ([`src/ui/`](./src/ui/) 18개 컴포넌트).
- **모든 지표에 인포 툴팁** — 산출 공식·임계값·학술 근거(Markowitz, Sharpe, HHI)를 그 자리에서 확인.

### 🧮 리스크 도메인 모델링

- **5-Layer 분석 파이프라인** ([`src/core/pipeline.ts`](./src/core/pipeline.ts))

  ```
  L1 표준화  →  L2 리스크 산출  →  L3 좌표 매핑  →  L4 밸런스  →  L5 인사이트
  ```

- **금융공학 지표 직접 구현** — VaR/CVaR (역사적 시뮬레이션), Sharpe/Sortino, HHI 섹터 집중도, Markowitz 공분산 모델, CAPM 기대수익률, 6종 스트레스 시나리오.
- **약점 진단 엔진 (W1~W7)** — 집중도·변동성·섹터 편향 등 7가지 패턴을 룰 기반으로 진단 → 종목 추가/축소 액션 자동 제안.
- **상관관계 네트워크** — 섹터·베타·변동성 기반 종목 간 동조성 그래프.
- 📘 모든 수식·상수·임계값·학술 근거 → **[FINANCIAL_ENGINEERING.md](./FINANCIAL_ENGINEERING.md)** (14장)

### ⚙️ 자동화 데이터 파이프라인

- **GitHub Actions cron** — 매일 시세 갱신 ([`update-prices.yml`](./.github/workflows/update-prices.yml)), 주 1회 종목 카탈로그 재생성 ([`regenerate-tickers.yml`](./.github/workflows/regenerate-tickers.yml)).
- **Python + yfinance** 수집 → JSON 산출 → 정적 호스팅. **서버 없이 일별 갱신되는 데이터를 가진 SPA**를 운영.
- 사내 시스템 관점에선 *"배치 잡 + 정적 리포트"* 패턴과 동치.

### 👥 다양한 사용자 페르소나 대응

- **2-Mode 설계** — 입문자용 **Simple** 모드(친근한 카피·풀이 카드) / 분석가용 **Standard** 모드. 같은 데이터, 다른 관점.
- **KO/EN i18n** — 통화·섹터 라벨·인사이트 메시지 양국어 ([`src/i18n.ts`](./src/i18n.ts)).
- **모바일 최적화** — 드래그 리사이즈 패널, 터치 제스처, 반응형 레이아웃.
- **클라우드 동기화** (선택) — Supabase Auth + 포트폴리오 동기화 ([`src/cloud/`](./src/cloud/)).

---

## 기술적 의사결정

### 1. 왜 3D 구체인가
막대그래프·파이차트는 한 번에 한 차원만 보여준다. 포트폴리오 위험은 *섹터 분산 × 개별 변동성 × 상관관계 × 매크로 노출*이 동시에 작용하므로, 다차원을 한 시야에 담을 수 있는 **연속 2D 표면 = 구체**가 가장 자연스러운 표현이라 판단.

### 2. 왜 빌드 없는 정적 사이트에서 Vite로 전환했나
초기엔 `index.html` 하나로 어디든 배포 가능한 형태(빌드 단계 없음). 종목 카탈로그가 700+로 늘고 도메인 모듈이 25개를 넘어서면서 *import map + CDN* 방식은 타입 안전성·트리쉐이킹·캐싱 측면에서 한계 → **TypeScript strict + Vite 번들링**으로 단계적 전환. *도메인 복잡도 증가에 따라 인프라를 점진적으로 강화한 사례.*

### 3. 왜 별도 백엔드를 두지 않았나
- **사용자 데이터** (포트폴리오) — localStorage + 선택적 Supabase 동기화 → 충분
- **시세 데이터** — GitHub Actions가 매일 정적 JSON 갱신 → 충분

→ **운영 비용 0원, 인프라 의존 최소.** 사내 시스템 관점에서도 "배치 갱신 + 캐시된 리포트"는 흔한 패턴이며, 본 프로젝트는 그 패턴의 가장 가벼운 형태.

---

## 폴더 구조

```
sphere/
├── index.html / simple.html        # 표준 / 입문자 모드 진입점
├── css/styles.css                  # CSS 변수 기반 테마 (4,300줄)
├── src/
│   ├── core/pipeline.ts            # 5-Layer 분석 파이프라인 (핵심)
│   ├── advanced/metrics.ts         # VaR/CVaR/Sharpe + 스트레스/매크로
│   ├── scene/sphere.ts             # Three.js 3D 씬
│   ├── data/                       # 종목 카탈로그 + 시세 로더
│   ├── state/                      # localStorage 영속화 + 마이그레이션
│   ├── ui/                         # 표준 모드 UI (18개)
│   ├── ui-simple/                  # 입문자 모드 UI (6개)
│   ├── cloud/                      # Supabase 동기화
│   └── i18n.ts                     # KO/EN 사전
├── public/data/
│   ├── tickers.json                # 700+ 종목 카탈로그
│   └── prices.json                 # 매일 자동 갱신 시세
├── tools/                          # Python 데이터 갱신 스크립트
└── .github/workflows/              # CI/CD (배포·시세·카탈로그 cron)
```

---

## 기술 스택

| 영역 | 도구 |
|---|---|
| **Frontend** | TypeScript 5.6 (strict), Vite 5, Three.js 0.169 |
| **State / Storage** | localStorage + 스키마 마이그레이션, Supabase (선택적) |
| **데이터 파이프라인** | Python 3.11, yfinance, GitHub Actions (cron) |
| **배포** | GitHub Pages (push → 자동 배포 ~1분) |

---

## 개발 / 배포

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm run typecheck  # tsc --noEmit
npm run build      # 타입체크 + Vite 번들 → dist/
```

`main` 브랜치 push 시 [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)이 자동으로 GitHub Pages 배포.

Supabase 클라우드 동기화 세팅 → [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

---

## Disclaimer

본 서비스는 **교육·시연 목적**의 포트폴리오 시각화 도구이며, 투자 자문이 아닙니다.
시세는 전일 종가 기준 일별 갱신 (실시간 아님).
모든 투자 결정과 그에 따른 손익은 사용자 본인의 책임입니다.

## License

MIT — see [LICENSE](./LICENSE). Three.js (MIT), yfinance (Apache 2.0) 포함.
