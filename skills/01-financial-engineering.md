# 01. 금융공학 — 직관에서 수식까지

이 문서는 SPHERE에 적용된 모든 금융·통계 개념을 다룹니다. 비전공자가 읽을 수 있도록 **먼저 비유로 설명한 다음 수식**을 보여주는 구조로 썼습니다. 공식 학술 출처도 함께 표기합니다.

---

## 목차

1. [위험이란 무엇인가 — "변동성"의 정체](#1-위험이란-무엇인가)
2. [개별 종목 위험 점수 — 5가지 요소를 더하다](#2-개별-종목-위험-점수)
3. [포트폴리오 변동성 — 1+1이 2가 아닌 이유](#3-포트폴리오-변동성)
4. [VaR & CVaR — "내일 얼마나 잃을 수 있나"](#4-var--cvar)
5. [Sharpe & Sortino — "위험 대비 효율"](#5-sharpe--sortino)
6. [분산효과 (DR) — 분산투자의 정량 평가](#6-분산효과-dr)
7. [CAPM — 기대수익률은 어디서 나오나](#7-capm)
8. [HHI — 시장 집중도 측정](#8-hhi)
9. [밸런스 지수 — SPHERE의 종합 점수](#9-밸런스-지수)
10. [스트레스 테스트 — "위기가 다시 오면"](#10-스트레스-테스트)
11. [매크로 인자 — 거시 환경의 섹터별 영향](#11-매크로-인자)
12. [배당 수익률](#12-배당-수익률)
13. [AI 추천 엔진 — 약점 진단 W1~W7](#13-ai-추천-엔진)
14. [상수·가정·한계](#14-상수가정한계)
15. [참고문헌](#15-참고문헌)

---

## 1. 위험이란 무엇인가

### 비유

은행 적금은 1년에 정확히 3% 이자를 줍니다. **확실한 수익**이지요. 반면 삼성전자 주식은 1년 후에 +50%일 수도 있고, -30%일 수도 있습니다. 이 "**미래에 얼마가 될지 모름**"이 위험의 본질입니다.

투자자는 보통 "수익이 적어지는 위험"만 위험이라 생각하지만, 학문적으로는 **수익률이 평균에서 얼마나 벌어지는가** 자체를 위험이라 부릅니다. 위로든 아래로든 벌어지면 둘 다 위험. 이 변동의 폭을 **변동성(Volatility, σ)** 이라 합니다.

### 수식

일별 수익률 $r_i$ 의 표준편차:

$$\sigma_{daily} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (r_i - \bar{r})^2}$$

연환산 변동성:

$$\sigma_{annual} = \sigma_{daily} \times \sqrt{252}$$

(252는 미국·한국 1년 거래일수. 주말·공휴일 제외)

### 예시 감각

| 변동성 | 의미 | 예시 |
|---|---|---|
| 5% 미만 | 잔잔 | 단기 국채, MMF |
| 10~15% | 보수적 | 채권 ETF, 배당주 |
| 15~25% | 평균 | S&P 500 |
| 25~40% | 공격적 | 개별 IT주, 신흥국 |
| 40% 이상 | 매우 격렬 | 바이오 신약주, 코인 |

### 한계

표준편차는 정규분포를 가정하지만 실제 주식 수익률은 **두꺼운 꼬리(fat-tail)** — 극단 사건이 정규분포가 예측하는 것보다 자주 발생합니다. 2008·2020 같은 크래시는 σ 기준으로 10시그마 이상의 사건인데, 정규분포라면 우주 나이에 1번 일어날 확률입니다. 즉 σ는 평소 변동만 잘 잡아내고 위기는 과소평가합니다.

> **참고**: Mandelbrot (1963) "The Variation of Certain Speculative Prices" — 주식 수익률이 정규분포가 아닌 Cauchy/Levy 분포에 가깝다는 통계 증거.

---

## 2. 개별 종목 위험 점수

### 직관

한 종목이 얼마나 위험한가는 한 가지로 결정되지 않습니다. **5가지를 함께** 봐야 해요:

1. **얼마나 출렁이는가** (변동성)
2. **시장이 흔들리면 더 크게 흔들리는가** (베타)
3. **빚이 많은가** (부채비율)
4. **거래가 활발한가** (유동성)
5. **이 산업이 본질적으로 위험한가** (섹터 기본값)

각각 0~1로 정규화한 후 가중합해서 0~100 점수로 만듭니다.

### 수식

$$\text{RiskScore} = \left[w_\sigma N(\sigma_{30}) + w_\beta N(\beta) + w_D N(D) + w_L N(L) + w_S R_{\text{sec}}\right] \times 100$$

| 컴포넌트 | 가중치 $w$ | 정규화 함수 $N(x)$ | 학술 근거 |
|---|---|---|---|
| 변동성 30일 | 0.35 | clip$((\sigma-0.05)/0.75, 0, 1)$ | Engle (1982) ARCH |
| 베타 | 0.25 | clip$(\beta/2.5, 0, 1)$ | Sharpe (1964) CAPM |
| 부채비율 | 0.20 | clip$(D, 0, 1)$ | Altman (1968) Z-score |
| 유동성 | 0.10 | clip$(1/(\text{vol}/\text{median}), 0, 1)$ | Amihud (2002) ILLIQ |
| 섹터 기본값 | 0.10 | 사전 정의 0.40~0.85 | 산업 분류 보정 |

### 베타란?

시장 전체가 1% 움직일 때 **이 종목이 몇 % 움직이는가**를 측정한 값입니다. 회귀분석으로 계산:

$$\beta_i = \frac{\text{Cov}(r_i, r_m)}{\text{Var}(r_m)}$$

- $\beta = 1$: 시장과 같이 움직임 (예: 인덱스 ETF)
- $\beta = 1.5$: 시장 +1%일 때 +1.5%, -1%일 때 -1.5% (예: 성장주)
- $\beta = 0.5$: 시장의 절반만 움직임 (예: 유틸리티)
- $\beta < 0$: 시장과 반대 (예: 인버스 ETF, 금)

### 섹터별 기본 위험

| 섹터 | base_risk | 평균 σ | 평균 β | 이유 |
|---|---|---|---|---|
| BIO | 0.85 | 0.42 | 1.15 | 신약 임상 결과에 따라 단일 이벤트로 ±50% 흔함 |
| IT | 0.75 | 0.30 | 1.20 | 성장 기대치가 가격에 선반영, 실적 미스 시 큰 조정 |
| AUTO | 0.60 | 0.28 | 1.10 | 경기민감, 원자재가·환율 노출 |
| ENERGY | 0.65 | 0.32 | 1.00 | 유가에 직접 노출 |
| INDUSTRIAL | 0.55 | 0.24 | 1.00 | 설비투자 사이클 |
| REALESTATE | 0.50 | 0.22 | 0.80 | 금리에 민감하나 임대료가 안정성 제공 |
| FIN | 0.50 | 0.20 | 0.85 | 은행 대출 마진은 비교적 안정 |
| CONSUMER | 0.45 | 0.18 | 0.75 | 필수소비재는 경기와 무관 |
| GLOBAL_ETF | 0.40 | 0.16 | 1.00 | 자체 분산 효과 |
| ETC | 0.60 | 0.25 | 1.00 | 알 수 없을 때 평균값 |

### 색상·라벨 매핑 (UI)

| 점수 | 라벨 | HEX | 의미 |
|---|---|---|---|
| 0–29 | SAFE 🟢 | #00E5A0 | 채권 같은 안정 |
| 30–54 | MODERATE 🔵 | #00D4FF | 평균적 |
| 55–74 | CAUTION 🟡 | #FF8C42 | 주의 필요 |
| 75–89 | HIGH 🔴 | #FF4560 | 높은 위험 |
| 90–100 | EXTREME 🟣 | #7B61FF | 극단적 |

### 코드 (JavaScript)

```javascript
function computeRiskScores(items){
  const vols = items.map(i=>i.liquidity_volume).filter(v=>v!=null).sort((a,b)=>a-b);
  const liqMedian = vols.length ? vols[Math.floor(vols.length/2)] : 1;

  items.forEach(i=>{
    const volN = Math.max(0, Math.min(1, (i.volatility_30d - 0.05)/(0.80 - 0.05)));
    const betaN = Math.max(0, Math.min(1, i.beta / 2.5));
    const debtN = Math.max(0, Math.min(1, i.debt_ratio));
    let liqN = 0;
    if (i.liquidity_volume!=null && liqMedian>0){
      liqN = Math.max(0, Math.min(1, 1 / (i.liquidity_volume / liqMedian)));
    }
    const secR = SECTOR_DEF[i.sector].base_risk;
    const W = { vol:0.35, beta:0.25, debt:0.20, liq:0.10, sec:0.10 };
    const score = volN*W.vol + betaN*W.beta + debtN*W.debt + liqN*W.liq + secR*W.sec;
    i.risk_score = Math.round(Math.max(0, Math.min(1, score)) * 100);
  });
  return items;
}
```

---

## 3. 포트폴리오 변동성

### 직관

A주식 변동성이 20%, B주식 변동성이 30%일 때, 둘을 50:50으로 들고 있으면 합은 25% (단순 평균)일까요? **아닙니다.** 두 주식이 함께 움직이면(상관계수 ↑) 25%에 가까워지고, 반대로 움직이면(상관계수 ↓) 그보다 훨씬 작아집니다.

이게 **분산투자**의 마법입니다. 주식 두 종목을 들어도 위험이 두 배가 되지 않아요.

### 수식 — Markowitz Modern Portfolio Theory

$$\sigma_p^2 = \sum_{i=1}^{n} \sum_{j=1}^{n} w_i w_j \sigma_i \sigma_j \rho_{ij}$$

$$\sigma_p = \sqrt{\sigma_p^2}$$

- $w_i$: 종목 $i$ 의 비중
- $\sigma_i$: 종목 $i$ 의 변동성
- $\rho_{ij}$: 종목 $i$ 와 $j$ 의 상관계수 (-1 ~ +1)

### 상관계수 — SPHERE의 휴리스틱

진짜 페어와이즈 상관계수를 구하려면 모든 종목 쌍의 일별 수익률 시계열이 필요한데, 이걸 매번 계산하기는 비효율적입니다. SPHERE는 다음 휴리스틱으로 근사합니다:

| 케이스 | $\rho$ | 근거 |
|---|---|---|
| 동일 종목 | 1.00 | 자기상관 |
| 양쪽 모두 ETF | 0.85 | 둘 다 시장 전체 추종 |
| 한쪽만 ETF | 0.55 | 부분 시장 노출 |
| 동일 섹터 + 동일 지역 | 0.68 | 같은 산업·매크로 |
| 동일 섹터 (지역 다름) | 0.50 | 산업은 같지만 환·정책 다름 |
| 동일 지역 (섹터 다름) | 0.32 | 매크로 공유 |
| 그 외 | 0.18 | 기본 시장 베타 노출 |

이 값들은 CRSP/MSCI 글로벌 자산군 상관 매트릭스 (2000~2020)의 평균치를 단순화한 것입니다.

### 임계값 — 연환산 σ_p

| $\sigma_p$ | 의미 | 사용자 표시 |
|---|---|---|
| < 15% | 안정형 | "잔잔" |
| 15~25% | 표준형 | "보통" |
| 25~35% | 공격형 | "들썩" |
| > 35% | 고위험 | "격렬" |

### 일변동성 환산

뉴스에서 "오늘 하루에 ±X% 움직임"을 말할 때는 1일 σ를 씁니다:

$$\sigma_{1d} = \frac{\sigma_{annual}}{\sqrt{252}}$$

연 20%면 1일 1.26%. 이 값이 VaR 계산의 출발점입니다.

---

## 4. VaR & CVaR

### 4-1. Value at Risk (VaR)

**한 줄 정의**: "내일 95% 확률로 손실이 이 금액을 넘지 않을 것이다."

#### 직관

100일 중 95일은 손실이 이 금액보다 작거나 오히려 이익입니다. 나머지 5일(20일에 한 번꼴)은 그 이상 손실 가능. 통계학 용어로 표현하면 "1일 손실 분포의 5% 분위수"입니다.

#### 수식 (패러메트릭, 정규성 가정)

$$\text{VaR}_{95\%} = z_{0.95} \times \sigma_{1d} \times V$$

- $z_{0.95} = 1.6449$ (표준정규 95% 분위수)
- $z_{0.99} = 2.3263$ (99% 분위수)
- $V$: 총 평가금액

예: 포트폴리오 1억원, $\sigma_{1d} = 1.5\%$:

$$\text{VaR} = 1.6449 \times 0.015 \times 100,000,000 = 2,467,350 \text{원}$$

→ "95% 확률로 내일 손실은 ±246만원 이내"

#### Fat-tail 한계

정규성 가정은 평상시에는 잘 맞지만 위기 때 과소평가합니다. 2008년 9월 Lehman 직후 며칠은 -7%, -10% 같은 사건이 연달아 났는데 정규분포라면 50년에 한 번 일어날 확률입니다.

> **출처**: J.P. Morgan & Reuters (1996) *RiskMetrics Technical Document*. VaR 표준화의 원전.

### 4-2. Conditional VaR (CVaR / Expected Shortfall)

**한 줄 정의**: "VaR을 넘어가는 손실이 발생했을 때, 그 손실의 평균 크기."

#### 직관

VaR은 "5% 확률로 이보다 더 잃을 수 있다"고만 말합니다. 그게 -3%인지 -30%인지는 안 알려줘요. CVaR은 그 5% 영역의 평균 손실을 계산합니다. **꼬리 위험을 직접 측정**하는 거죠.

#### 수식 (정규분포 closed-form)

$$\text{CVaR}_{95\%} = \frac{\phi(z_{0.95})}{1-\alpha} \times \sigma_{1d} \times V \approx 2.0627 \times \sigma_{1d} \times V$$

- $\phi(z)$: 표준정규 PDF (z=1.6449에서 약 0.1031)
- $1 - \alpha = 0.05$
- 계수 ≈ 2.0627

CVaR은 항상 VaR보다 큽니다 (꼬리가 더 깊으므로).

#### 왜 중요한가

Basel III (국제 은행 자본 규제)는 2013년부터 **VaR이 아닌 CVaR**을 표준 위험 지표로 채택했습니다. 2008 금융위기에서 VaR이 꼬리 위험을 너무 과소평가한 게 드러났기 때문입니다.

> **출처**: Rockafellar & Uryasev (2000) "Optimization of Conditional Value-at-Risk" *Journal of Risk*. CVaR 최적화의 원전.

---

## 5. Sharpe & Sortino

### 5-1. Sharpe Ratio

**한 줄 정의**: "위험 1단위당 얻는 초과수익."

#### 직관

수익률 10%인 두 펀드가 있어요. A는 변동성 8%, B는 변동성 25%. 어느 게 좋은 펀드일까요? **수익이 같으면 위험이 적은 게 좋습니다.** 즉 변동성 대비 수익을 비교해야 공정해요.

은행 적금이 3%를 보장한다면, 펀드는 그 위에 얼마나 더 벌어주는지가 중요합니다. 이 "초과수익"을 위험으로 나눈 게 Sharpe.

#### 수식

$$\text{Sharpe} = \frac{\mu_p - r_f}{\sigma_p}$$

- $\mu_p$: 포트폴리오 연 기대수익률
- $r_f$: 무위험수익률 (SPHERE는 3.5% 사용)
- $\sigma_p$: 포트폴리오 연 변동성

#### 해석

| Sharpe | 평가 | 사용자 표시 |
|---|---|---|
| > 2.0 | 매우 우수 | ⭐ 우수 |
| 1.0 ~ 2.0 | 우수 | ⭐ 양호 |
| 0.5 ~ 1.0 | 보통 | △ 부족 |
| 0 ~ 0.5 | 무위험 대비 미세 우위 | ✕ 비효율 |
| < 0 | 적금만도 못함 | ✕ 비효율 |

> **출처**: Sharpe (1966) "Mutual Fund Performance" *Journal of Business*. 1990년 노벨경제학상 수상자의 핵심 지표.

### 5-2. Sortino Ratio

**한 줄 정의**: "하락 위험만 따진 효율."

#### 직관 — 왜 변형이 필요한가

Sharpe는 위로 튀는 것도, 아래로 떨어지는 것도 똑같이 "위험"으로 칩니다. 하지만 투자자는 **수익이 갑자기 늘어나는 건 환영**하잖아요? 손실만 위험이지 이익은 위험이 아니에요.

Sortino는 분모를 **하방 변동성**(평균 이하로만 빠진 부분의 표준편차)으로 바꿉니다.

#### 수식

$$\text{Sortino} = \frac{\mu_p - r_f}{\sigma_D}$$

#### 하방 변동성 추정 — SPHERE의 단순화

진짜 $\sigma_D$ 는 일별 수익률 시계열이 필요한데, SPHERE는 보유하지 않습니다. 대신 경험적 비율을 씁니다:

$$\sigma_D \approx \sigma \times 0.71$$

이는 S&P 500 1965~2023 데이터의 $\sigma_D / \sigma$ 평균치(약 0.71)입니다. 정규분포라면 정확히 $1/\sqrt{2} \approx 0.707$ 인데 fat-tail 때문에 약간 더 큰 편입니다.

> **출처**: Sortino & Price (1994) "Performance Measurement in a Downside Risk Framework" *Journal of Investing*. 헤지펀드·연금펀드에서 Sharpe 대신 선호.

---

## 6. 분산효과 (DR)

### 직관

"계란을 한 바구니에 담지 마라"의 정량적 버전. **각각 따로 들 때의 위험 합** 대비 **실제 합쳐서 들 때의 위험**의 비율을 측정합니다.

비율이 1보다 크면 분산투자가 효과를 발휘한 것입니다.

### 수식 — Diversification Ratio

$$\text{DR} = \frac{\sum_i w_i \sigma_i}{\sigma_p}$$

분자는 "**모든 종목이 ρ=1로 같이 움직인다 가정**"한 단순 가중합 변동성. 분모는 실제 공분산을 반영한 포트폴리오 변동성.

### 해석

| DR | 의미 |
|---|---|
| 1.0 | 분산효과 없음 (모두 같이 움직임) |
| 1.0 ~ 1.3 | 약한 분산 |
| 1.3 ~ 1.5 | 우수한 분산 |
| > 1.5 | 매우 우수 |

### 위험감소율 — UI 표시용

$$\text{RiskReduction} = 1 - \frac{\sigma_p}{\sum_i w_i \sigma_i} = \frac{DR - 1}{DR}$$

DR=1.30이면 23.1% 위험감소.

> **출처**: Choueifaty & Coignard (2008) "Toward Maximum Diversification" *Journal of Portfolio Management*. TOBAM Asset Management의 MDP(Most Diversified Portfolio) 전략 핵심.

---

## 7. CAPM

### 직관

"이 주식의 적정 기대수익은 얼마인가?"를 답하는 모형입니다.

핵심 아이디어: **무위험금리를 깔고**, 거기에 **시장 위험을 감수한 보너스**를 더한다. 보너스 크기는 그 종목이 시장과 얼마나 동조(베타)하는지에 비례.

### 수식 (Capital Asset Pricing Model)

$$E(R_i) = r_f + \beta_i \times (E(R_m) - r_f)$$

$$E(R_i) = r_f + \beta_i \times \text{ERP}$$

### SPHERE 적용값

| 변수 | 값 | 출처 |
|---|---|---|
| $r_f$ | 3.5% | 한국·미국 10Y 국채금리 가중평균 (2024) |
| ERP | 6.0% | Damodaran (NYU Stern) 2024 중간값 |
| $\beta_p$ | $\sum w_i \beta_i$ | 종목 베타의 가중평균 |

예: 포트폴리오 베타 1.2 → $E(R_p) = 3.5\% + 1.2 \times 6\% = 10.7\%$

### 한계

- **단일요인 모형**: 시장 베타 한 개로 모든 위험을 설명. 실제는 size·value·profitability 등 여러 요인 작용 (Fama-French 3/5 요인 모형이 발전형)
- **베타는 과거값**: 미래에 같은 베타가 유지된다는 보장 없음
- **ERP 추정 다양**: 학자별로 4~8% 사이로 갈림

> **출처**: Sharpe (1964), Lintner (1965), Mossin (1966). 자본자산가격결정모형의 시초. Damodaran 매년 업데이트하는 ERP 추정치는 [pages.stern.nyu.edu/~adamodar/](https://pages.stern.nyu.edu/~adamodar/) 에서 무료 공개.

---

## 8. HHI

### 직관

**미국 법무부가 인수합병 심사할 때 쓰는 시장 집중도 지표**입니다. 시장점유율 제곱의 합으로 계산. SPHERE에서는 "섹터 점유율 제곱의 합"으로 활용해 포트폴리오의 산업 편중도를 측정합니다.

### 수식

$$\text{HHI} = \sum_{i=1}^{n} w_i^2$$

극단 케이스:
- 단일 섹터 100% → HHI = 1
- 5개 섹터 균등 → HHI = 5 × (0.2)² = 0.20
- 10개 섹터 균등 → HHI = 0.10

### 임계값 (DOJ 기준)

| HHI | 의미 | DOJ 평가 |
|---|---|---|
| < 0.15 | 분산 양호 | M&A 무문제 |
| 0.15 ~ 0.25 | 보통 | 추가 검토 |
| 0.25 ~ 0.45 | 집중 주의 | 거부 가능 |
| > 0.45 | 심각한 편중 | 사실상 거부 |

> **출처**: U.S. Department of Justice (2010) *Horizontal Merger Guidelines*. HHI 임계값 0.15/0.25 적용 기준.

---

## 9. 밸런스 지수

### 직관

SPHERE의 **종합 점수** — 포트폴리오 전체의 균형 상태를 0~100으로 한 줄에 요약합니다. 100점은 완벽한 구체(최적 분산), 0점은 극단적 쏠림.

3가지 부분 점수의 가중합:
1. **섹터 분산도** (HHI 기반) — 산업이 골고루
2. **리스크 편차** — 종목 위험이 비슷한 수준
3. **구형도** — 시각적 균일성

### 수식

$$\text{Balance} = 0.40 \cdot \text{Diverse} + 0.35 \cdot \text{Deviation} + 0.25 \cdot \text{Sphericity}$$

#### 9-1. DiverseScore

$$\text{Diverse} = \frac{1 - \text{HHI}}{1 - 1/n} \times 100$$

- $n$: 섹터 개수
- HHI=1 (단일 섹터) → 0점
- HHI=1/n (모두 균등) → 100점

#### 9-2. DeviationScore

$$\sigma_R = \text{std}(\text{RiskScore}_i)$$

$$\text{Deviation} = \left(1 - \frac{\sigma_R}{50}\right) \times 100$$

리스크 점수의 표준편차가 50이면 0점. 모든 종목 점수가 비슷할수록 높은 점수.

#### 9-3. Sphericity (구형도)

$$r_i = 1.0 + \frac{\text{RiskScore}_i}{100} \times 0.5$$

$$\sigma_r = \text{std}(r_i)$$

$$\text{Sphericity} = \left(1 - \frac{\sigma_r}{0.5}\right) \times 100$$

모든 노드가 같은 거리로 돌출되면 100. 일부만 심하게 튀어나오면 낮음. 시각적 일그러짐의 정량화.

### 등급

| Balance | 등급 | 색상 |
|---|---|---|
| 90~100 | OPTIMAL | safe (초록) |
| 70~89 | GOOD | moderate (시안) |
| 50~69 | WARN | caution (주황) |
| 30~49 | RISK | high (빨강) |
| 0~29 | SEVERE | extreme (보라) |

---

## 10. 스트레스 테스트

### 직관

"**과거의 위기가 다시 온다면 내 포트폴리오는?**" 답하는 시뮬레이션입니다. 4개 역사적 시나리오를 미리 정의해두고 클릭 한 번에 손익을 추정합니다.

### 모형

각 시나리오는 **섹터별 충격 배수**의 사전입니다. 종목별 손실은:

$$\text{Loss}_i = V_i \times \text{shock}[\text{sector}_i] \times f(\beta_i)$$

여기서 $f(\beta_i)$ 는 베타 보정 함수:

$$f(\beta_i) = \text{clamp}(\beta_i, 0.55, 1.55)$$

베타 1.5인 고베타 종목은 섹터 평균의 1.5배 충격을, 0.6인 저베타·방어주는 0.6배만 받습니다.

### 4개 시나리오 — 실제 데이터 기반

#### A. 2008 글로벌 금융위기

- **기간**: 2008-09-15 (Lehman 파산) ~ 2009-03-09 (S&P 저점), 약 6개월
- **벤치마크**: S&P 500 −56%
- **출처**: Yahoo Finance, SPDR Sector ETFs

| 섹터 | 충격 |
|---|---|
| FIN | −82% (Bank of America 단독 −89%) |
| REALESTATE | −71% |
| AUTO | −55% (GM 파산 보호) |
| INDUSTRIAL | −57% |
| IT | −52% |
| ENERGY | −46% |
| GLOBAL_ETF | −50% |
| BIO | −34% |
| CONSUMER | −35% |

#### B. 2020 COVID 셧다운

- **기간**: 2020-02-19 ~ 2020-03-23, 35일 (역사상 가장 빠른 베어마켓)
- **벤치마크**: S&P 500 −34%
- **출처**: Yahoo Finance, SPDR Sector ETFs

| 섹터 | 충격 |
|---|---|
| ENERGY | −56% (유가 마이너스 진입) |
| AUTO | −45% |
| FIN | −41% |
| REALESTATE | −42% |
| IT | −22% (재택근무 수혜) |
| BIO | −19% (백신 기대) |

#### C. 2022 인플레이션·금리쇼크

- **기간**: 2022-01-03 ~ 2022-10-12, 약 9개월 (Fed 425bp 인상)
- **벤치마크**: S&P 500 −25%, NASDAQ −36%
- **출처**: Yahoo Finance, FRED

| 섹터 | 충격 |
|---|---|
| IT | −32% (성장주·할인율 ↑) |
| AUTO | −39% |
| REALESTATE | −33% (REIT 금리 노출) |
| **ENERGY** | **+52%** (우크라이나 전쟁) |
| FIN | −19% (NIM은 개선) |

#### D. 2000 닷컴 버블 붕괴

- **기간**: 2000-03-10 ~ 2002-10-09, 약 31개월
- **벤치마크**: NASDAQ −78%, S&P 500 −49%
- **출처**: Yahoo Finance

| 섹터 | 충격 |
|---|---|
| IT | −78% (NASDAQ과 동일) |
| BIO | −50% (게놈 버블) |
| GLOBAL_ETF | −49% |
| **ENERGY** | **+5%** (방어 자산) |
| **CONSUMER** | **+5%** (필수소비재 선방) |

### 시각화

활성화 시 Three.js 구체 노드 색상이 손실 강도에 따라 재칠해집니다:

| 충격 | 색상 | HEX |
|---|---|---|
| > +5% | 초록 | #00E5A0 |
| -5% ~ -15% | 노랑 | #FFD66B |
| -15% ~ -30% | 주황 | #FF8C42 |
| -30% ~ -50% | 빨강 | #FF4560 |
| < -50% | 보라 | #7B61FF |

### 한계

- 시나리오별 충격은 **글로벌 평균**이라 한국 시장 특이성 미반영 (예: 2008년 한국 코스피는 -41%로 미국보다 낮았음)
- 베타 보정은 단순 클램프 — 실제는 시점별 베타 변동
- 새로운 위기 패턴 (예: 미중 기술전쟁)은 4개 시나리오에 없음

---

## 11. 매크로 인자

### 직관

스트레스 테스트가 "특정 시점 재현"이라면, 매크로 인자는 "**거시 환경을 직접 조립**"하는 도구입니다. 예: "금리 인상 + 유가 급등 + 위험 회피"를 동시에 가정하면 어떻게 되는가?

10개 인자를 6개 축으로 그룹화 (같은 축 내 옵션은 mutually exclusive):

| 축 | 옵션 |
|---|---|
| 금리 정책 | 인상 (+200bp) / 인하 (−200bp) |
| 물가 | 인플레이션 ↑ |
| 유가 | 급등 (+50%) / 급락 (−50%) |
| 환율 (USD) | 강세 (+10%) / 약세 (−10%) |
| 시장 분위기 | 위험 회피 / 위험 선호 |
| 경기 사이클 | 침체 |

### 합산 모형

선택된 인자들의 섹터 영향이 **합산**됩니다 (단순 선형):

$$\text{shock}[s] = \sum_{f \in \text{selected}} \text{impact}_f[s]$$

값은 ±90%로 클립되어 비현실적 결과 방지.

### 인자별 섹터 영향 행렬 (예시)

#### 금리 인상 (+200bp)

| 섹터 | 영향 |
|---|---|
| REALESTATE | −18% (REIT 금리 노출) |
| IT | −12% (성장주 할인율 ↑) |
| FIN | +5% (NIM 개선) |
| ENERGY | −2% |

#### 유가 급등 (+50%)

| 섹터 | 영향 |
|---|---|
| ENERGY | +35% |
| AUTO | −10% (소비자 비용 ↑) |
| CONSUMER | −10% |
| IT | −4% |

#### 위험 회피 (Risk-Off)

| 섹터 | 영향 |
|---|---|
| AUTO | −18% (고베타) |
| IT | −15% |
| FIN | −12% |
| CONSUMER | −6% (방어주) |

전체 행렬은 코드의 `MACRO_FACTORS` 객체 참고.

---

## 12. 배당 수익률

### 정의

연간 배당이 주가 대비 차지하는 비율 (TTM, Trailing Twelve Months).

### 포트폴리오 연배당 추정

$$\text{AnnualDividend} = \sum_i V_i \times y_i$$

$$\text{PortfolioYield} = \frac{\text{AnnualDividend}}{\sum V_i} = \sum w_i \cdot y_i$$

### 데이터 소스

`yfinance.Ticker(t).info["dividendYield"]` 또는 `trailingAnnualDividendYield`. `update_prices.py` 가 매일 갱신.

### 한계 (사용자에게 항상 공지)

- **TTM 기준** — 미래 배당 보장 안 됨
- 회사가 배당 cut/suspend 시 실제 수익은 다름
- ETF의 yield는 운용보수 차감 전 gross yield
- 분기별·반기별 입금 타이밍은 반영 안 됨

---

## 13. AI 추천 엔진

### 약점 진단 W1~W7

| 코드 | 약점 | 임계값 | 추천 액션 |
|---|---|---|---|
| W1 | 섹터 편중 | 한 섹터 > 35% | 다른 섹터 종목 추가 |
| W2 | 종목 집중 | 한 종목 > 25% | 해당 종목 축소 |
| W3 | 평균 리스크 과다 | avgRisk > 70 | 안전형 ETF·채권 추가 |
| W4 | 다양성 부족 | 보유 종목 < 5 | 종목 수 확장 |
| W5 | 리스크 편차 과다 | $\sigma_R > 28$ | 양극화 종목 정리 |
| W6 | 지역 편중 | KR 또는 US > 80% | 반대 지역 추가 |
| W7 | 헤지 부재 | 채권 ETF·금 0% | TLT, GLD 등 추가 |

### Round-Robin Interleave

추천이 한 약점 타입에 몰리지 않도록:

1. 각 약점 타입별로 후보 카드 생성
2. 약점 타입당 최대 4개 cap
3. 약점 타입 순환하며 한 카드씩 픽 (인터리브)
4. 상위 5개 화면 표시 (`VISIBLE_RECS_COUNT = 5`)

### 영향도 측정

각 추천 적용 후의 가상 포트폴리오에 대해 `computeBalanceFor()` 재호출. balance 점수 변화량으로 효과 표시: "균형 +5.2 → 89.7"

---

## 14. 상수·가정·한계

### 핵심 상수 일람

| 변수 | 값 | 출처 |
|---|---|---|
| `RISK_FREE_ANNUAL` | 3.5% | 한국+미국 10Y 국채 가중평균 (2024) |
| `MARKET_PREMIUM` (ERP) | 6.0% | Damodaran 2024 |
| `TRADING_DAYS` | 252 | 미국·한국 1년 거래일 |
| `Z95` | 1.6449 | 표준정규 95% 분위 |
| `Z99` | 2.3263 | 표준정규 99% 분위 |
| `ES95_ADJ` | 2.0627 | 정규 CVaR 배수 |
| 하방변동성 비율 | 0.71 | S&P 500 1965~2023 경험치 |

### 핵심 가정

1. **수익률 정규성** — VaR/CVaR/Sharpe 계산의 가정. 실제는 fat-tail이라 위기 때 과소평가
2. **상관계수 휴리스틱** — 7개 케이스 단순화. 실제 페어와이즈는 시점·국면에 따라 변동
3. **CAPM 단일요인** — Fama-French 5요인이 더 정확하나 데이터 부담 큼
4. **사전 정의 섹터 충격** — 역사적 평균. 미래 위기는 다른 패턴 가능
5. **TTM 배당** — 미래 배당 보장 아님

### 데이터 한계

- `volatility_30d`: 30일 단기. 90일·180일이 더 안정적
- `beta`: 6개월 회귀. 시간에 따라 변동
- 거래량: 30일 평균. 시점·이벤트로 급변
- 부채비율: 분기 공시 시점이 회사마다 다름

---

## 15. 참고문헌

### 학술 — 핵심

- **Markowitz, H.** (1952). "Portfolio Selection." *Journal of Finance* 7(1), 77–91. — Modern Portfolio Theory의 효시
- **Sharpe, W.F.** (1964). "Capital asset prices..." *Journal of Finance*. — CAPM 원전
- **Sharpe, W.F.** (1966). "Mutual Fund Performance." *Journal of Business*. — Sharpe Ratio
- **Sortino, F.A. & Price, L.N.** (1994). "Performance Measurement in a Downside Risk Framework." *Journal of Investing*. — Sortino Ratio
- **Choueifaty, Y. & Coignard, Y.** (2008). "Toward Maximum Diversification." *Journal of Portfolio Management*. — DR
- **Rockafellar, R.T. & Uryasev, S.** (2000). "Optimization of Conditional Value-at-Risk." *Journal of Risk*. — CVaR
- **Engle, R.F.** (1982). "Autoregressive Conditional Heteroscedasticity." *Econometrica*. — ARCH 변동성 모형
- **Altman, E.I.** (1968). "Financial Ratios..." *Journal of Finance*. — Z-score 부채 위험
- **Amihud, Y.** (2002). "Illiquidity and stock returns." *Journal of Financial Markets*. — 유동성 프리미엄
- **Fama, E.F. & French, K.R.** (1992, 2015). 3·5 요인 모형. — CAPM 확장 (SPHERE 미적용, 향후 발전)
- **Mandelbrot, B.** (1963). "The Variation of Certain Speculative Prices." — Fat-tail 통계 증거

### 실무·표준

- **J.P. Morgan & Reuters** (1996). *RiskMetrics Technical Document*. — VaR 표준화
- **U.S. DOJ** (2010). *Horizontal Merger Guidelines*. — HHI 임계값
- **Basel Committee** (2013–). *Basel III: Finalising post-crisis reforms*. — CVaR을 표준 자본 요건으로
- **Damodaran, A.** (NYU Stern). *Equity Risk Premium* (annual). — ERP 추정
- **CFA Institute** (2020). *Portfolio Risk and Return: Part II*. — Sharpe·Sortino 실무

### 데이터 소스

- **yfinance** — Yahoo Finance 비공식 Python 라이브러리
- **CRSP** — 시카고대학 증권가격연구소 (학술 표준)
- **MSCI** — 글로벌 자산군 상관 매트릭스
- **FRED** — St. Louis Fed 매크로 지표

### 무료 학습 자료

- Damodaran NYU Stern 사이트: <https://pages.stern.nyu.edu/~adamodar/>
- Coursera "Investment Management with Python": Princeton/EDHEC
- *Active Portfolio Management* (Grinold & Kahn) — 헤지펀드 표준 교재

---

## 면책

본 도구는 **교육·시연 목적**입니다. 투자 자문이 아니며, 모든 지표는 정규성·CAPM 등 단순화된 가정에 기반합니다. 실제 투자 결정에는 추가 분석·실시간 데이터·전문가 자문이 필수입니다.
