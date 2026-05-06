/* =========================================================
   tooltip-react — 데이터 사전 (메트릭별 KO/EN 라벨/공식/근거)
   - 순수 데이터. JSX/이벤트 의존 없음.
   - 기존 src/ui/tooltip.ts 의 INFO_TXT 를 React 컴포넌트가 소비하도록 분리.
   ========================================================= */

import { CURRENT_LANG } from '../../i18n';

export interface MetricThreshold {
  range: string;
  label: string;
  tone: 'safe' | 'moderate' | 'caution' | 'high' | 'extreme';
}

export interface MetricCopy {
  title: string;
  desc: string;       // HTML — 우리가 직접 작성한 정적 마크업 (XSS 위험 없음)
  formula?: string;   // HTML
  ref: string;        // HTML
  thresholds?: MetricThreshold[];
  /** balance · sumLabel, etc — render 시 라벨로 쓰임 */
  sumLabel?: string;
  label?: string;
  labels?: string[];
  unit?: string;
  noSelect?: string;
  cols?: string[];
  summary?: (top: string) => string;
}

const KO: Record<string, MetricCopy> = {
  balance: {
    title: '밸런스 지수 산출 공식',
    desc: '포트폴리오 전체의 균형 상태를 0~100점으로 표현. <strong>100점 = 완벽한 구형(최적 분산), 0점 = 극단적 쏠림</strong>입니다.',
    formula: '밸런스 = 섹터분산 × 0.40<br>　　　　 + 리스크편차 × 0.35<br>　　　　 + 구형도 × 0.25',
    ref: '기반: Markowitz Modern Portfolio Theory (1952) — 분산투자가 위험을 줄인다는 기본 원리',
    sumLabel: '합계 (현재)',
  },
  diverse: {
    title: '섹터 분산도',
    desc: 'HHI(Herfindahl-Hirschman Index) 기반 섹터 집중도 점수. <strong>100점 = 모든 섹터 균등 분포 / 0점 = 한 섹터 100% 집중</strong>.',
    formula: 'HHI = Σ(섹터 비중²)<br>분산도 = (1 − HHI) / (1 − 1/섹터수) × 100',
    ref: '기반: Herfindahl (1950) · Hirschman (1945) — 미국 법무부 반독점법(Antitrust) 시장집중도 평가 지표',
    labels: ['현재 HHI', '섹터 수', '분산도 점수'],
    unit: '개',
  },
  deviation: {
    title: '리스크 편차 점수',
    desc: '포트폴리오 내 종목들의 리스크 스코어 표준편차 기반. <strong>100점 = 모든 종목 비슷한 리스크 / 0점 = 극단적 편차</strong>. 편차가 클수록 일부 종목이 전체 리스크를 좌우합니다.',
    formula: '편차 점수 = (1 − σ/50) × 100<br>σ = 종목별 리스크 스코어의 표준편차',
    ref: '기반: 통계적 분산도(σ) — Modern Portfolio Theory의 핵심 위험 측정치',
    label: '편차 점수',
  },
  sphericity: {
    title: '구형도 (Sphericity)',
    desc: '모든 종목의 리스크 돌출(r값) 분포의 균일성. <strong>100점 = 모든 노드가 같은 거리로 돌출 / 0점 = 특정 종목만 심하게 돌출</strong>.',
    formula: '구형도 = (1 − σ_r / 0.5) × 100<br>r = 1.0 + (risk_score / 100) × 0.5',
    ref: 'SPHERE 자체 정의 지표 — 위험 분포의 시각적 균일성을 정량화',
    label: '구형도 점수',
  },
  hhi: {
    title: 'HHI 집중도',
    desc: 'Herfindahl-Hirschman Index. 섹터별 비중을 제곱해서 모두 합한 값. <strong>0에 가까울수록 분산, 1에 가까울수록 집중</strong>.',
    formula: 'HHI = Σ(섹터 비중²)',
    ref: '출처: U.S. DOJ Horizontal Merger Guidelines (2010) — HHI 임계값 0.15/0.25 인수합병 심사 기준',
    thresholds: [
      { range: '< 0.15', label: '분산 양호', tone: 'safe' },
      { range: '0.15 – 0.25', label: '보통', tone: 'moderate' },
      { range: '0.25 – 0.45', label: '집중 주의', tone: 'caution' },
      { range: '> 0.45', label: '심각한 편중', tone: 'high' },
    ],
    label: '현재 HHI',
  },
  riskScore: {
    title: '평균 리스크 스코어',
    desc: '포트폴리오 내 모든 종목의 평균 리스크 점수 (0~100). 각 종목의 리스크는 5개 요소의 가중합으로 산출됩니다.',
    formula: '리스크 = 변동성 × 0.35<br>　　　　+ 베타 × 0.25<br>　　　　+ 부채비율 × 0.20<br>　　　　+ 유동성 역수 × 0.10<br>　　　　+ 섹터 기본값 × 0.10',
    ref: '기반: Sharpe (1964) CAPM — 베타로 시스템적 위험 측정 / Engle (1982) ARCH — 변동성 모형 / Altman (1968) Z-score — 부채 비율 신용 위험',
    thresholds: [
      { range: '0–29', label: '🟢 SAFE', tone: 'safe' },
      { range: '30–54', label: '🔵 MODERATE', tone: 'moderate' },
      { range: '55–74', label: '🟡 CAUTION', tone: 'caution' },
      { range: '75–89', label: '🔴 HIGH', tone: 'high' },
      { range: '90–100', label: '🟣 EXTREME', tone: 'extreme' },
    ],
    label: '현재 평균',
  },
  assetRisk: {
    title: '개별 종목 리스크 산출',
    desc: '선택한 종목의 리스크 스코어가 어떻게 계산되었는지 5개 요소별 기여도를 분해해서 보여줍니다.',
    noSelect: '먼저 보유 종목을 선택해주세요. (좌측 목록 또는 구체의 노드 클릭)',
    cols: ['요소', '정규화값 × 가중치 = 기여도'],
    labels: ['변동성 30D', '베타', '부채비율', '유동성 역수', '섹터 기본값'],
    sumLabel: '합계 → 리스크 스코어',
    summary: (top: string) => `이 종목은 <b>${top}</b> 요소가 리스크에 가장 크게 기여하고 있습니다.`,
    ref: '각 요소 정규화 방법: 변동성(0.05~0.80 범위 클리핑), 베타(0~2.5 클리핑), 부채비율(그대로), 유동성(거래량 ÷ 전체 중간값의 역수), 섹터 기본값(BIO 0.85 / IT 0.75 / FIN 0.50 등)',
  },
  var: {
    title: 'VaR 95% (1일 손실 한도)',
    desc: '<strong>Value at Risk</strong>. 95% 확률로 하루 손실이 이 금액을 넘지 않을 것으로 추정되는 한도. 정규분포 가정 패러메트릭 VaR.',
    formula: 'VaR<sub>95%</sub> = z<sub>0.95</sub> × σ<sub>1일</sub> × V<br>z<sub>0.95</sub> = 1.6449<br>σ<sub>1일</sub> = σ<sub>연</sub> / √252',
    ref: '기반: J.P. Morgan RiskMetrics (1996). 정규성 가정의 한계 — 실제 꼬리는 더 두꺼움(Fat-tail), 극단 사건은 VaR 초과 가능',
  },
  cvar: {
    title: 'CVaR 95% (조건부 기대 손실)',
    desc: '<strong>Conditional VaR / Expected Shortfall</strong>. VaR를 초과하는 손실이 발생했다고 가정했을 때의 기대 손실. VaR보다 보수적·꼬리위험 반영.',
    formula: 'CVaR<sub>95%</sub> = E[L | L > VaR<sub>95%</sub>]<br>≈ 2.0627 × σ<sub>1일</sub> × V',
    ref: '기반: Rockafellar & Uryasev (2000). Basel III 자본요건의 표준 위험지표로 채택',
  },
  sharpe: {
    title: 'Sharpe Ratio (위험조정 수익률)',
    desc: '위험 1단위당 초과수익. <strong>1 이상 우수, 2 이상 매우 우수, 음수면 무위험금리 미달</strong>. 변동성 전체를 위험으로 간주.',
    formula: 'Sharpe = (μ<sub>p</sub> − r<sub>f</sub>) / σ<sub>p</sub><br>μ<sub>p</sub> = r<sub>f</sub> + β<sub>p</sub> × ERP (CAPM 추정)<br>r<sub>f</sub> = 3.5%, ERP = 6.0%',
    ref: '기반: Sharpe (1966). 1990년 노벨경제학상 수상자의 핵심 지표',
  },
  sortino: {
    title: 'Sortino Ratio (하방 위험 조정)',
    desc: 'Sharpe와 동일하지만 분모가 <strong>하방 변동성만</strong> 사용 — 상승 변동성에 페널티를 주지 않음. 비대칭 수익 분포에 적합.',
    formula: 'Sortino = (μ<sub>p</sub> − r<sub>f</sub>) / σ<sub>D</sub><br>σ<sub>D</sub> ≈ σ × 0.71 (Sortino/Sharpe 경험비)',
    ref: '기반: Sortino & Price (1994). 헤지펀드·연금펀드에서 Sharpe 대신 선호',
  },
  dr: {
    title: '분산효과 (Diversification Ratio)',
    desc: '분산투자가 위험을 얼마나 깎았는지의 지표. <strong>DR > 1.0이면 분산효과 발생</strong>, 1.3 이상이면 우수. 옆에 표시된 % = 단순 합산 위험 대비 감소율.',
    formula: 'DR = Σ(w<sub>i</sub> × σ<sub>i</sub>) / σ<sub>p</sub><br>σ<sub>p</sub> = √(ΣΣ w<sub>i</sub>w<sub>j</sub>σ<sub>i</sub>σ<sub>j</sub>ρ<sub>ij</sub>)<br>위험감소 = 1 − σ<sub>p</sub> / Σ(w<sub>i</sub>σ<sub>i</sub>)',
    ref: '기반: Choueifaty & Coignard (2008) "Most Diversified Portfolio". 상관계수 ρ는 동일섹터+동일지역 0.68, 동일섹터 0.50, 동일지역 0.32, 그 외 0.18로 휴리스틱 추정',
  },
  portVol: {
    title: '포트폴리오 변동성 (연환산)',
    desc: '전체 포트폴리오의 1년 표준편차. <strong>15% 미만 안정, 25% 이상 공격적</strong>. 종목별 변동성을 상관계수로 가중합해 계산.',
    formula: 'σ<sub>p</sub><sup>2</sup> = ΣΣ w<sub>i</sub>w<sub>j</sub>σ<sub>i</sub>σ<sub>j</sub>ρ<sub>ij</sub><br>(공분산 행렬 휴리스틱 — pairwiseCorr)',
    ref: '기반: Markowitz (1952) Modern Portfolio Theory의 핵심 — 위험은 단순 가중합이 아닌 공분산으로 결정됨',
  },
  dividend: {
    title: '예상 연배당 수익',
    desc: '각 종목의 배당수익률(yield)에 평가금액을 곱한 합계. <strong>실제 배당 = 회사 정책에 따라 변동</strong>. 과거 배당이 미래를 보장하지 않음.',
    formula: '연배당 = Σ(평가금액<sub>i</sub> × 배당수익률<sub>i</sub>)<br>포트폴리오 yield = 연배당 / 총 평가금액',
    ref: '데이터 출처: yfinance dividendYield (TTM 기준)',
  },
};

const EN: Record<string, MetricCopy> = {
  balance: {
    title: 'Balance Index Formula',
    desc: 'Overall portfolio balance score (0–100). <strong>100 = perfect sphere (optimal diversification), 0 = extreme concentration</strong>.',
    formula: 'Balance = SectorDiversity × 0.40<br>　　　　 + RiskDeviation × 0.35<br>　　　　 + Sphericity × 0.25',
    ref: 'Based on: Markowitz Modern Portfolio Theory (1952) — diversification reduces risk',
    sumLabel: 'Current total',
  },
  diverse: {
    title: 'Sector Diversity',
    desc: 'Sector concentration score based on HHI (Herfindahl-Hirschman Index). <strong>100 = perfectly even sectors / 0 = single-sector concentration</strong>.',
    formula: 'HHI = Σ(sector weight²)<br>Diversity = (1 − HHI) / (1 − 1/n) × 100',
    ref: 'Based on: Herfindahl (1950) · Hirschman (1945) — adopted by US DOJ for antitrust market concentration analysis',
    labels: ['Current HHI', 'Sector count', 'Diversity score'],
    unit: 'sectors',
  },
  deviation: {
    title: 'Risk Deviation',
    desc: 'Standard deviation of risk scores across holdings. <strong>100 = all holdings similar risk / 0 = extreme deviation</strong>. High deviation means a few holdings dominate overall risk.',
    formula: 'Deviation = (1 − σ/50) × 100<br>σ = std. dev. of risk scores',
    ref: 'Based on: statistical variance (σ) — core risk metric in Modern Portfolio Theory',
    label: 'Deviation score',
  },
  sphericity: {
    title: 'Sphericity',
    desc: 'Uniformity of risk protrusion (r-values) across all nodes. <strong>100 = all nodes equidistant / 0 = some nodes protrude severely</strong>.',
    formula: 'Sphericity = (1 − σ_r / 0.5) × 100<br>r = 1.0 + (risk_score / 100) × 0.5',
    ref: 'SPHERE-defined metric — quantifies visual uniformity of risk distribution',
    label: 'Sphericity score',
  },
  hhi: {
    title: 'HHI Concentration',
    desc: 'Herfindahl-Hirschman Index. Sum of squared sector weights. <strong>Closer to 0 = diversified, closer to 1 = concentrated</strong>.',
    formula: 'HHI = Σ(sector weight²)',
    ref: 'Source: U.S. DOJ Horizontal Merger Guidelines (2010) — HHI thresholds 0.15/0.25 for merger review',
    thresholds: [
      { range: '< 0.15', label: 'Well diversified', tone: 'safe' },
      { range: '0.15 – 0.25', label: 'Moderate', tone: 'moderate' },
      { range: '0.25 – 0.45', label: 'Concentrated', tone: 'caution' },
      { range: '> 0.45', label: 'Severely concentrated', tone: 'high' },
    ],
    label: 'Current HHI',
  },
  riskScore: {
    title: 'Average Risk Score',
    desc: "Average risk score across all holdings (0–100). Each holding's risk is a weighted sum of 5 components.",
    formula: 'Risk = Volatility × 0.35<br>　　　+ Beta × 0.25<br>　　　+ DebtRatio × 0.20<br>　　　+ LiquidityInverse × 0.10<br>　　　+ SectorBase × 0.10',
    ref: 'Based on: Sharpe (1964) CAPM — beta for systematic risk / Engle (1982) ARCH — volatility modeling / Altman (1968) Z-score — debt ratio credit risk',
    thresholds: [
      { range: '0–29', label: '🟢 SAFE', tone: 'safe' },
      { range: '30–54', label: '🔵 MODERATE', tone: 'moderate' },
      { range: '55–74', label: '🟡 CAUTION', tone: 'caution' },
      { range: '75–89', label: '🔴 HIGH', tone: 'high' },
      { range: '90–100', label: '🟣 EXTREME', tone: 'extreme' },
    ],
    label: 'Current average',
  },
  assetRisk: {
    title: 'Individual Risk Breakdown',
    desc: "How the selected asset's risk score was calculated, broken down into 5 weighted components.",
    noSelect: 'Select a holding first (click a row on the left or a node on the sphere).',
    cols: ['Component', 'Normalized × Weight = Contribution'],
    labels: ['Volatility 30D', 'Beta', 'Debt Ratio', 'Liquidity Inverse', 'Sector Base'],
    sumLabel: 'Total → Risk Score',
    summary: (top: string) => `<b>${top}</b> contributes the most to this asset's risk.`,
    ref: 'Normalization: Volatility (clipped 0.05–0.80), Beta (clipped 0–2.5), Debt ratio (raw 0–1), Liquidity (inverse of volume / median), Sector base (BIO 0.85 / IT 0.75 / FIN 0.50, etc.)',
  },
  var: {
    title: 'VaR 95% (1-day loss limit)',
    desc: '<strong>Value at Risk</strong>. With 95% confidence, the daily loss should not exceed this amount. Parametric VaR assuming normal distribution.',
    formula: 'VaR<sub>95%</sub> = z<sub>0.95</sub> × σ<sub>1d</sub> × V<br>z<sub>0.95</sub> = 1.6449<br>σ<sub>1d</sub> = σ<sub>annual</sub> / √252',
    ref: 'Based on: J.P. Morgan RiskMetrics (1996). Caveat: normality understates fat tails — extreme events can exceed VaR',
  },
  cvar: {
    title: 'CVaR 95% (Expected Shortfall)',
    desc: '<strong>Conditional VaR / Expected Shortfall</strong>. Average loss given the loss exceeds VaR. More conservative; captures tail risk.',
    formula: 'CVaR<sub>95%</sub> = E[L | L > VaR<sub>95%</sub>]<br>≈ 2.0627 × σ<sub>1d</sub> × V',
    ref: 'Based on: Rockafellar & Uryasev (2000). Adopted as standard risk metric in Basel III capital requirements',
  },
  sharpe: {
    title: 'Sharpe Ratio (risk-adjusted return)',
    desc: 'Excess return per unit of risk. <strong>>1 is good, >2 excellent, <0 underperforms risk-free</strong>. Treats total volatility as risk.',
    formula: 'Sharpe = (μ<sub>p</sub> − r<sub>f</sub>) / σ<sub>p</sub><br>μ<sub>p</sub> = r<sub>f</sub> + β<sub>p</sub> × ERP (CAPM estimate)<br>r<sub>f</sub> = 3.5%, ERP = 6.0%',
    ref: 'Based on: Sharpe (1966). Core metric of Nobel laureate W.F. Sharpe',
  },
  sortino: {
    title: 'Sortino Ratio (downside-adjusted)',
    desc: 'Same as Sharpe, but uses <strong>downside volatility only</strong> — does not penalize upside swings. Better fits asymmetric returns.',
    formula: 'Sortino = (μ<sub>p</sub> − r<sub>f</sub>) / σ<sub>D</sub><br>σ<sub>D</sub> ≈ σ × 0.71 (empirical ratio)',
    ref: 'Based on: Sortino & Price (1994). Preferred over Sharpe in hedge funds and pension fund analysis',
  },
  dr: {
    title: 'Diversification Ratio',
    desc: 'How much diversification reduced portfolio risk. <strong>DR > 1.0 means benefit, ≥1.3 is excellent</strong>. The % shown is reduction vs. simple weighted-vol sum.',
    formula: 'DR = Σ(w<sub>i</sub> × σ<sub>i</sub>) / σ<sub>p</sub><br>σ<sub>p</sub> = √(ΣΣ w<sub>i</sub>w<sub>j</sub>σ<sub>i</sub>σ<sub>j</sub>ρ<sub>ij</sub>)<br>Reduction = 1 − σ<sub>p</sub> / Σ(w<sub>i</sub>σ<sub>i</sub>)',
    ref: 'Based on: Choueifaty & Coignard (2008) "Toward Maximum Diversification". Correlations ρ heuristic: same sector+region 0.68, same sector 0.50, same region 0.32, otherwise 0.18',
  },
  portVol: {
    title: 'Portfolio Volatility (annualized)',
    desc: '1-year std. dev. of portfolio returns. <strong><15% conservative, >25% aggressive</strong>. Computed via covariance matrix, not simple weighted sum.',
    formula: 'σ<sub>p</sub><sup>2</sup> = ΣΣ w<sub>i</sub>w<sub>j</sub>σ<sub>i</sub>σ<sub>j</sub>ρ<sub>ij</sub>',
    ref: 'Based on: Markowitz (1952) Modern Portfolio Theory — portfolio risk depends on covariances, not just individual variances',
  },
  dividend: {
    title: 'Estimated Annual Dividend',
    desc: 'Sum of (market value × yield) per holding. <strong>Actual dividends vary with company policy</strong>. Past does not guarantee future.',
    formula: 'Annual = Σ(value<sub>i</sub> × yield<sub>i</sub>)<br>Portfolio yield = Annual / Total value',
    ref: 'Source: yfinance dividendYield (TTM)',
  },
};

const DICT: Record<string, Record<string, MetricCopy>> = { ko: KO, en: EN };

/** 현재 언어 사전을 반환. CURRENT_LANG 가 변경되면 다음 호출에서 자동 반영. */
export function copy(): Record<string, MetricCopy> {
  return DICT[CURRENT_LANG] || KO;
}

/** 메트릭 키 enum */
export type MetricKey =
  | 'balance' | 'diverse' | 'deviation' | 'sphericity' | 'hhi'
  | 'riskScore' | 'assetRisk'
  | 'var' | 'cvar' | 'sharpe' | 'sortino' | 'dr' | 'portVol' | 'dividend';
