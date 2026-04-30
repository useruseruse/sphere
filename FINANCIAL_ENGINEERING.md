# SPHERE — 금융공학 명세서

본 문서는 SPHERE 포트폴리오 시각화 도구에 적용된 모든 금융공학·통계학 개념을 정리한 기술 명세입니다. 모든 수식, 상수, 임계값, 학술 근거를 코드와 1:1로 대응시킵니다.

---

## 목차

1. [5-Layer 분석 파이프라인](#1-5-layer-분석-파이프라인)
2. [개별 종목 리스크 스코어](#2-개별-종목-리스크-스코어)
3. [밸런스 지수 (구체 균형도)](#3-밸런스-지수-구체-균형도)
4. [HHI · 섹터 집중도](#4-hhi--섹터-집중도)
5. [포트폴리오 변동성 — 공분산 모델](#5-포트폴리오-변동성--공분산-모델)
6. [VaR & CVaR (꼬리 위험)](#6-var--cvar-꼬리-위험)
7. [Sharpe & Sortino Ratio](#7-sharpe--sortino-ratio)
8. [분산효과 (Diversification Ratio)](#8-분산효과-diversification-ratio)
9. [기대수익률 — CAPM](#9-기대수익률--capm)
10. [스트레스 테스트 시나리오](#10-스트레스-테스트-시나리오)
11. [배당 수익률](#11-배당-수익률)
12. [AI 추천 엔진 — 약점 진단 W1~W7](#12-ai-추천-엔진--약점-진단-w1w7)
13. [상수 · 가정 · 한계](#13-상수--가정--한계)
14. [참고문헌](#14-참고문헌)

---

## 1. 5-Layer 분석 파이프라인

SPHERE는 종목 데이터를 5단계로 가공해서 시각화합니다.

```
Layer 1: 표준화         → standardize()
Layer 2: 리스크 산출    → computeRiskScores()
Layer 3: 좌표 매핑      → mapSphereCoords()
Layer 4: 밸런스         → computeBalance() + computeAdvancedMetrics()
Layer 5: 인사이트·시각화 → generateInsights() + renderAllUI()
```

| Layer | 입력 | 출력 | 핵심 연산 |
|---|---|---|---|
| 1 | 종목 보유 수량 + 시세 | 정규화된 비중 + 누락값 채움 | weight = value / Σvalue |
| 2 | 종목별 σ, β, 부채비율, 거래량 | 0~100 리스크 스코어 | 5요소 가중합 |
| 3 | 섹터, 비중, 리스크 | (lat, lng, r) 구좌표 | 섹터=위도, 비중=경도, 리스크=돌출 |
| 4 | 모든 종목 | balance, VaR, Sharpe 등 | 통계 + Markowitz |
| 5 | 모든 결과 | UI · 3D mesh | Three.js + DOM |

---

## 2. 개별 종목 리스크 스코어

### 정의

각 종목의 위험을 0~100 정수로 환산. 5개 컴포넌트를 가중합한 후 `clip(0,1) × 100`.

### 수식

```
RiskScore = ( w₁·N(σ₃₀) + w₂·N(β) + w₃·N(D) + w₄·N(L) + w₅·R_sec ) × 100
```

| 컴포넌트 | 가중치 wᵢ | 정규화 함수 N | 근거 |
|---|---|---|---|
| 변동성 σ₃₀ (30일 일변동성, 연환산) | 0.35 | clip((σ−0.05)/0.75, 0, 1) | Engle (1982) ARCH 모형 |
| 베타 β | 0.25 | clip(β / 2.5, 0, 1) | Sharpe (1964) CAPM |
| 부채비율 D | 0.20 | clip(D, 0, 1) | Altman (1968) Z-score |
| 유동성 L (거래량 역수) | 0.10 | clip(1/(vol/median), 0, 1) | Amihud (2002) ILLIQ |
| 섹터 기본값 R_sec | 0.10 | 섹터별 0.40~0.85 사전값 | 산업 분류 보정 |

### 섹터별 기본 위험 (R_sec)

| 섹터 | base_risk | 평균 σ | 평균 β |
|---|---|---|---|
| BIO | 0.85 | 0.42 | 1.15 |
| IT | 0.75 | 0.30 | 1.20 |
| AUTO | 0.60 | 0.28 | 1.10 |
| INDUSTRIAL | 0.55 | 0.24 | 1.00 |
| ENERGY | 0.65 | 0.32 | 1.00 |
| FIN | 0.50 | 0.20 | 0.85 |
| CONSUMER | 0.45 | 0.18 | 0.75 |
| REALESTATE | 0.50 | 0.22 | 0.80 |
| GLOBAL_ETF | 0.40 | 0.16 | 1.00 |
| ETC | 0.60 | 0.25 | 1.00 |

### 유동성 부재 시 가중치 재분배

거래량 데이터가 없으면 (예: 신규 IPO, 비상장) wᵢ를 (1.0 / 잔여합)으로 정규화해서 사용 — 점수가 인위적으로 떨어지지 않도록.

### 색상·라벨 매핑

| 점수 | 라벨 | HEX |
|---|---|---|
| 0–29 | SAFE 🟢 | #00E5A0 |
| 30–54 | MODERATE 🔵 | #00D4FF |
| 55–74 | CAUTION 🟡 | #FF8C42 |
| 75–89 | HIGH 🔴 | #FF4560 |
| 90–100 | EXTREME 🟣 | #7B61FF |

---

## 3. 밸런스 지수 (구체 균형도)

### 정의

포트폴리오 전체의 균형 상태를 0~100점으로 한 줄에 요약. **100점 = 완벽한 구형 (최적 분산), 0점 = 극단적 쏠림**.

### 수식

```
Balance = 0.40 · DiverseScore
        + 0.35 · DeviationScore
        + 0.25 · Sphericity
```

#### 3-1. DiverseScore (섹터 분산도)

```
HHI = Σᵢ wᵢ²              ─ 섹터 i의 비중 wᵢ에 대해
DiverseScore = (1 − HHI) / (1 − 1/n) × 100
```

- n = 섹터 개수
- HHI=1 (단일섹터) → 0점, HHI=1/n (균등) → 100점

#### 3-2. DeviationScore (리스크 편차 점수)

```
σ_R = std(RiskScoreᵢ)            ─ 종목별 리스크 점수의 표준편차
DeviationScore = (1 − σ_R / 50) × 100
```

50을 분모로 — 표준편차 50이면 점수 0 (모든 종목이 0과 100에 양극화)

#### 3-3. Sphericity (구형도)

```
r_i = 1.0 + RiskScore_i/100 × 0.5     ─ 노드 돌출 거리
σ_r = std(rᵢ)
Sphericity = (1 − σ_r / 0.5) × 100
```

모든 노드가 같은 r에 있으면 100, 일부 노드만 심하게 돌출하면 0.

### 등급 매핑

| Balance | 등급 | 색상 |
|---|---|---|
| 90–100 | OPTIMAL | safe |
| 70–89 | GOOD | moderate |
| 50–69 | WARN | caution |
| 30–49 | RISK | high |
| 0–29 | SEVERE | extreme |

---

## 4. HHI · 섹터 집중도

### 정의

Herfindahl-Hirschman Index. 섹터별 비중 제곱의 합. 시장 집중도의 표준 측정치.

```
HHI = Σ wᵢ²
```

| 수치 | 의미 | DOJ 기준 |
|---|---|---|
| < 0.15 | 분산 양호 | 인수합병 무문제 |
| 0.15 – 0.25 | 보통 | 합병 후 추가 검토 |
| 0.25 – 0.45 | 집중 주의 | 합병 거부 가능 |
| > 0.45 | 심각한 편중 | 사실상 거부 |

**근거**: U.S. Department of Justice — Horizontal Merger Guidelines (2010)

---

## 5. 포트폴리오 변동성 — 공분산 모델

### 정의

포트폴리오의 1년 표준편차. **단순 가중합이 아닌 공분산 행렬로 계산** — 이것이 "분산투자" 효과의 수학적 근원.

### 수식

```
σ_p² = Σᵢ Σⱼ wᵢ wⱼ σᵢ σⱼ ρᵢⱼ
σ_p  = √σ_p²
```

- wᵢ: 종목 i 비중
- σᵢ: 종목 i 연환산 변동성
- ρᵢⱼ: 종목 i,j 상관계수

### 상관계수 휴리스틱

실제 페어와이즈 ρ를 계산하려면 모든 종목의 일별 수익률 시계열이 필요하지만, SPHERE는 다음 휴리스틱을 사용:

| 케이스 | ρ |
|---|---|
| 동일 종목 (i=j) | 1.00 |
| 양쪽 모두 ETF | 0.85 |
| 한쪽만 ETF | 0.55 |
| 동일 섹터 + 동일 지역 (KR/US) | 0.68 |
| 동일 섹터 | 0.50 |
| 동일 지역 | 0.32 |
| 그 외 | 0.18 |

이 값은 **CRSP/MSCI 글로벌 자산군 상관 매트릭스 (2000–2020)** 의 평균치를 단순화한 것입니다.

### 임계값 (연환산 σ)

| σ_p | 의미 |
|---|---|
| < 15% | 안정형 (채권 비중↑) |
| 15–25% | 표준형 (균형) |
| 25–35% | 공격형 (성장주↑) |
| > 35% | 고위험 (집중 또는 레버리지) |

### 일변동성 환산

```
σ_1d = σ_annual / √252
```

252는 미국·한국 거래일수. (월=21, 주=5)

---

## 6. VaR & CVaR (꼬리 위험)

### 6-1. Value at Risk (VaR)

> 95% 확률로 1일 손실이 이 금액을 넘지 않을 것이다.

#### 패러메트릭 VaR (정규성 가정)

```
VaR_95% = z₀.₉₅ × σ_1d × V
        = 1.6449 × (σ_p / √252) × V
```

- z₀.₉₅ = 1.6449 (표준정규 95% 분위수)
- z₀.₉₉ = 2.3263 (99% 분위수, 표시는 안 하지만 코드에 상수)
- V = 총 평가금액

#### 정규성 가정의 한계 — Fat Tail

실제 주식 수익률은 **lepto-kurtic (첨도 > 3)** — 극단 손실 확률이 정규분포가 예측하는 것보다 훨씬 높습니다. VaR는 평상시 95%에는 잘 맞지만 위기 때 과소평가합니다.

**근거**: J.P. Morgan RiskMetrics Technical Document (1996)

### 6-2. Conditional VaR (CVaR / Expected Shortfall)

> VaR을 초과하는 손실이 발생했다고 가정했을 때의 기대 손실.

```
CVaR_95% = E[L | L > VaR_95%]
```

정규분포 기준 polish-form:

```
CVaR_95% = φ(z) / (1−α) × σ × V
        = 2.0627 × σ_1d × V    (α=0.95일 때)
```

- φ(z) = 정규 PDF at z=1.6449 ≈ 0.1031
- 1 − α = 0.05
- 비율 ≈ 2.0627

CVaR는 VaR보다 항상 크고, **꼬리 위험을 직접 측정**하므로 Basel III 자본요건 표준으로 채택됨.

**근거**: Rockafellar & Uryasev (2000) "Optimization of Conditional Value-at-Risk"

---

## 7. Sharpe & Sortino Ratio

### 7-1. Sharpe Ratio

> 단위 위험당 초과수익. 포트폴리오 비교의 업계 표준.

```
Sharpe = (μ_p − r_f) / σ_p
```

- μ_p = 포트폴리오 연 기대수익률 (CAPM 추정 — §9 참조)
- r_f = 무위험수익률 = **3.5%** (한국+미국 가중 근사, 2024 기준)
- σ_p = 포트폴리오 연 변동성 (§5)

| Sharpe | 평가 |
|---|---|
| > 2.0 | 매우 우수 |
| 1.0 – 2.0 | 우수 |
| 0.5 – 1.0 | 보통 |
| 0 – 0.5 | 무위험 대비 미세 우위 |
| < 0 | 채권보다 못함 |

**근거**: Sharpe (1966) — 1990년 노벨경제학상 수상자

### 7-2. Sortino Ratio

Sharpe와 동일하지만 분모를 **하방 변동성(σ_D)** 만 사용. 상승 변동성에 페널티를 주지 않습니다.

```
Sortino = (μ_p − r_f) / σ_D
```

#### 하방 변동성 추정

진짜 σ_D는 일별 수익률 중 0보다 낮은 것만으로 계산해야 하지만, SPHERE는 일별 수익률을 보유하지 않습니다. 경험적 비율:

```
σ_D ≈ σ × 0.71
```

이는 S&P500 1965–2023 데이터의 σ_D / σ 평균치(약 0.71)입니다.

| Sortino | 평가 |
|---|---|
| > 2.0 | 매우 우수 |
| > 1.0 | 우수 |
| > 0 | 양호 |

**근거**: Sortino & Price (1994) "Performance Measurement in a Downside Risk Framework"

---

## 8. 분산효과 (Diversification Ratio)

### 정의

분산투자가 포트폴리오 위험을 얼마나 줄였는지의 정량 지표.

```
DR = Σᵢ (wᵢ × σᵢ) / σ_p
```

- 분자: 단순 가중평균 변동성 (상관 0 가정)
- 분모: 실제 포트폴리오 변동성 (공분산 반영)

### 해석

| DR | 의미 |
|---|---|
| 1.0 | 분산효과 없음 (모두 ρ=1) |
| 1.0 – 1.3 | 약한 분산 |
| > 1.3 | 우수한 분산 |
| > 1.5 | 매우 우수 |

### 위험감소 (UI 표시)

```
RiskReduction = 1 − σ_p / Σ(wᵢσᵢ)
              = (DR − 1) / DR
```

% 단위로 표시. 예: DR=1.30이면 23.1% 위험감소.

**근거**: Choueifaty & Coignard (2008) — "Toward Maximum Diversification". TOBAM Asset Management의 MDP(Most Diversified Portfolio) 전략의 핵심.

---

## 9. 기대수익률 — CAPM

### 정의

자본자산가격결정모형 (Capital Asset Pricing Model) — 자산의 기대수익률은 **무위험금리 + 베타 × 시장프리미엄**.

```
E(R_i) = r_f + β_i × (E(R_m) − r_f)
       = r_f + β_i × ERP
```

### SPHERE 적용

```
μ_p = r_f + β_p × ERP

r_f  = 3.5%        (무위험금리)
ERP  = 6.0%        (시장위험프리미엄, Damodaran 2024 중간값)
β_p  = Σ wᵢ × βᵢ   (포트폴리오 가중평균 베타)
```

### 시장위험프리미엄 (ERP) 출처

Aswath Damodaran (NYU Stern)의 "Equity Risk Premium" 연간 업데이트. 1928–2023 평균 4.6%, 최근 10년 6%대. SPHERE는 보수적으로 6.0% 채택.

### 한계

- CAPM은 **단일요인 모형** — Fama-French 3/5요인이 더 정확하나 데이터 부담 큼.
- 베타는 과거 데이터로 추정 → 미래 수익을 보장하지 않음.
- ERP 추정은 학자마다 4~8% 사이로 갈림.

**근거**: Sharpe (1964) · Lintner (1965) · Mossin (1966)

---

## 10. 스트레스 테스트 시나리오

### 모형

각 시나리오는 **섹터별 충격 배수 (sector shock multiplier)** 의 사전(dictionary) 으로 정의. 포트폴리오 손실 추정:

```
PortfolioLoss = Σᵢ (Valueᵢ × shock[sector_i])
```

각 종목의 평가금액에 해당 섹터의 충격율을 곱한 후 합산.

### 시나리오 데이터

#### 2008 글로벌 금융위기 (Lehman 파산 후 6개월)

| 섹터 | 충격 |
|---|---|
| FIN | −55% |
| REALESTATE | −62% |
| AUTO | −55% |
| INDUSTRIAL | −48% |
| ENERGY | −45% |
| IT | −42% |
| GLOBAL_ETF | −40% |
| CONSUMER | −32% |
| BIO | −28% |
| ETC | −35% |

#### 2020 COVID 셧다운 (Mar 2020 한 달간)

| 섹터 | 충격 |
|---|---|
| ENERGY | −58% |
| AUTO | −42% |
| FIN | −36% |
| REALESTATE | −34% |
| INDUSTRIAL | −32% |
| GLOBAL_ETF | −32% |
| CONSUMER | −30% |
| IT | −18% |
| BIO | −8% |
| ETC | −25% |

#### 2022 인플레이션·금리쇼크 (Fed 급격 금리인상)

| 섹터 | 충격 |
|---|---|
| AUTO | −40% |
| IT | −34% |
| REALESTATE | −26% |
| CONSUMER | −24% |
| BIO | −22% |
| GLOBAL_ETF | −20% |
| FIN | −18% |
| INDUSTRIAL | −16% |
| ETC | −18% |
| **ENERGY** | **+32%** (수혜) |

#### 2000 닷컴 버블 붕괴 (Mar 2000 – Oct 2002)

| 섹터 | 충격 |
|---|---|
| IT | −78% |
| BIO | −55% |
| GLOBAL_ETF | −45% |
| AUTO | −35% |
| INDUSTRIAL | −30% |
| FIN | −25% |
| ETC | −25% |
| CONSUMER | −18% |
| REALESTATE | −10% |
| **ENERGY** | **+5%** |

### 시각화

시나리오 활성 시 Three.js 구체의 노드 색상이 손실 강도에 따라 재칠해집니다:

| Shock | 색상 | HEX |
|---|---|---|
| > +5% | 초록 (이익) | #00E5A0 |
| −5% ~ −15% | 노랑 (약손실) | #FFD66B |
| −15% ~ −30% | 주황 (중손실) | #FF8C42 |
| −30% ~ −50% | 빨강 (큰 손실) | #FF4560 |
| < −50% | 보라 (극단) | #7B61FF |

### 한계

- 시나리오별 실제 섹터 수익률은 **회사·국가별로 큰 편차**가 있음. SPHERE는 글로벌 평균치로 단순화.
- 특정 종목 (예: 항공주, 은행주) 은 섹터 평균과 다른 충격을 받았을 수 있음.

**근거**: 각 시나리오는 Bloomberg, FRED, Yahoo Finance의 ETF 수익률 데이터에서 인용한 실제 역사적 손실의 단순 평균.

---

## 11. 배당 수익률

### 정의

각 종목이 연간 지급하는 배당이 주가 대비 차지하는 비율 (Trailing 12 Months).

### 포트폴리오 연배당 추정

```
AnnualDividend = Σᵢ (Valueᵢ × DividendYieldᵢ)

PortfolioYield = AnnualDividend / TotalValue
                ≈ Σ (wᵢ × yieldᵢ)
```

### 데이터 소스

`yfinance`의 `dividendYield` 또는 `trailingAnnualDividendYield` 필드. `update_prices.py`가 매일 갱신.

### 한계 (사용자에게 항상 공지해야 함)

- **TTM 기준** — 미래 배당을 보장하지 않음.
- 회사 정책 변경, 감액(cut), 정지(suspend) 시 실제 수익은 다름.
- 한국 기업의 분기·반기 배당, 미국의 분기 배당 등 **타이밍은 반영 안됨**.
- ETF의 yield는 운용보수 차감 전 grossyield임.

---

## 12. AI 추천 엔진 — 약점 진단 W1~W7

### 진단 타입

| 코드 | 약점 | 임계값 | 추천 액션 |
|---|---|---|---|
| W1 | 섹터 편중 | 한 섹터 > 35% | 다른 섹터 종목 추가 |
| W2 | 종목 집중 | 한 종목 > 25% | 해당 종목 축소 |
| W3 | 평균 리스크 과다 | avgRisk > 70 | 안전형 ETF/채권 추가 |
| W4 | 다양성 부족 | n_holdings < 5 | 종목 수 확장 |
| W5 | 리스크 편차 과다 | σ_R > 28 | 양극화 종목 정리 |
| W6 | 지역 편중 | KR or US > 80% | 반대 지역 추가 |
| W7 | 헤지 부재 | 채권 ETF/금 0% | TLT, GLD 등 추가 |

### Round-Robin Interleave

추천이 한 약점 타입에만 몰리지 않도록 **그룹별 캡 4 + 인터리브** 알고리즘:

1. 각 약점 타입별로 후보 추천 카드를 생성
2. 약점 타입당 최대 4개로 제한
3. 약점 타입을 순환하며 한 카드씩 픽 → 결과 리스트
4. 상위 5개를 화면에 표시 (`VISIBLE_RECS_COUNT = 5`)

### 추천 영향도 측정

각 추천 적용 후의 가상 포트폴리오에 대해 `computeBalanceFor()` 호출, balance 점수 변화량으로 효과를 표시:
"균형 +5.2 → 89.7"

---

## 13. 상수 · 가정 · 한계

### 핵심 상수

| 변수 | 값 | 출처 |
|---|---|---|
| RISK_FREE_ANNUAL | 3.5% | 한국+미국 10Y 국채금리 가중평균 (2024) |
| MARKET_PREMIUM (ERP) | 6.0% | Damodaran 2024 |
| TRADING_DAYS | 252 | 미국·한국 거래일수 |
| Z95 | 1.6449 | 표준정규 95% 분위수 |
| Z99 | 2.3263 | 표준정규 99% 분위수 |
| ES95_ADJ | 2.0627 | 정규 CVaR 배수 (φ(z₀.₉₅) / 0.05) |
| 하방변동성 비율 | 0.71 | S&P500 σ_D / σ 경험치 |

### 핵심 가정

1. **수익률 정규성** — VaR/CVaR/Sharpe가 가정. 실제 수익률은 fat-tail.
2. **상관계수 휴리스틱** — 7개 케이스로 단순화. 실제 페어와이즈 ρ는 변동·시점 의존.
3. **CAPM 기대수익** — 단일요인 모형. Fama-French가 더 정확.
4. **사전 정의된 섹터 충격** — 역사적 평균. 미래 위기는 다른 패턴 가능.
5. **TTM 배당** — 미래 배당 보장 아님.

### 데이터 한계

- `volatility_30d` — 30일 일별 변동성 → 짧음. 90일/180일이 안정적.
- `beta` — 6개월 기준 회귀. 베타는 시간에 따라 변동.
- 거래량 — 30일 평균. 유동성은 시점·이벤트에 따라 급변.
- 부채비율 — 분기 공시 시점이 다 다름.

---

## 14. 참고문헌

### 학술

- **Markowitz, H.** (1952). "Portfolio Selection." *Journal of Finance*. — Modern Portfolio Theory의 효시. SPHERE의 모든 분산투자 로직의 기반.
- **Sharpe, W.F.** (1964). "Capital asset prices: A theory of market equilibrium under conditions of risk." *Journal of Finance*. — CAPM 원전.
- **Sharpe, W.F.** (1966). "Mutual Fund Performance." *Journal of Business*. — Sharpe Ratio 원전.
- **Sortino, F.A. & Price, L.N.** (1994). "Performance Measurement in a Downside Risk Framework." *Journal of Investing*. — Sortino Ratio 원전.
- **Choueifaty, Y. & Coignard, Y.** (2008). "Toward Maximum Diversification." *Journal of Portfolio Management*. — Diversification Ratio 원전.
- **Rockafellar, R.T. & Uryasev, S.** (2000). "Optimization of Conditional Value-at-Risk." *Journal of Risk*. — CVaR 최적화.
- **Engle, R.F.** (1982). "Autoregressive Conditional Heteroscedasticity..." *Econometrica*. — ARCH 모형, 변동성 시계열.
- **Altman, E.I.** (1968). "Financial Ratios, Discriminant Analysis and the Prediction of Corporate Bankruptcy." *Journal of Finance*. — Z-score, 부채비율과 위험.
- **Amihud, Y.** (2002). "Illiquidity and stock returns." *Journal of Financial Markets*. — 유동성 위험 프리미엄.
- **Fama, E.F. & French, K.R.** (1992, 2015). 3-factor / 5-factor 모형. — CAPM의 확장 (SPHERE 미적용, 향후 발전 방향).

### 실무·표준

- **J.P. Morgan & Reuters** (1996). *RiskMetrics Technical Document*. — VaR 표준화 문헌.
- **U.S. Department of Justice** (2010). *Horizontal Merger Guidelines*. — HHI 임계값 0.15/0.25 출처.
- **Basel Committee** (2013–2019). *Basel III: Finalising post-crisis reforms*. — CVaR을 표준 자본요건 지표로 채택.
- **Damodaran, A.** (NYU Stern). *Equity Risk Premium: Determinants, Estimation and Implications* (annual update). — ERP 추정.
- **CFA Institute** (2020). *Portfolio Risk and Return: Part II*. — Sharpe/Sortino 실무 가이드.

### 데이터 소스

- **yfinance** (Yahoo Finance) — 가격·시가·거래량·배당수익률.
- **CRSP** (시카고대학 증권가격연구소) — 학술용 가격 시계열의 표준.
- **MSCI** — 글로벌 자산군 상관 매트릭스.
- **FRED** (St. Louis Fed) — 무위험금리·인플레·매크로 지표.

---

## 변경 이력

| 날짜 | 버전 | 변경 |
|---|---|---|
| 2026-04-29 | v1.0.0 | 5-Layer 파이프라인 + 리스크 스코어 + 밸런스 + AI 추천 |
| 2026-04-30 | v1.1.0 | 700+ 종목 카탈로그 (S&P500/KOSPI/KOSDAQ/ETF) |
| 2026-04-30 | v1.2.0 | VaR/CVaR/Sharpe/Sortino + 분산효과(DR) + 스트레스 테스트 4종 + 배당 트래커 |

---

## 면책

본 문서와 SPHERE 도구는 **교육·시연 목적**입니다. 투자 자문이 아니며, 산출된 모든 지표는 정규성·CAPM 등 단순화된 가정에 기반합니다. 실제 투자 결정에는 추가적인 분석·실시간 데이터·전문가 자문이 필수입니다.

— SPHERE Project, 2026
