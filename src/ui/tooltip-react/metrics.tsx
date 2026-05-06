/* =========================================================
   tooltip-react — 14개 메트릭별 React 컴포넌트
   - 모두 RUNTIME 상태를 read-only 로 참조 (포털 열릴 때마다 fresh 값)
   - 공통 레이아웃은 <MetricCard /> 가 흡수, 각 컴포넌트는 데이터-매핑만 담당
   ========================================================= */

import type { ReactElement } from 'react';
import { getName } from '../../i18n';
import { riskColor, SECTOR_DEF } from '../../core/pipeline';
import { RUNTIME } from '../../runtime';
import * as scene from '../../scene/sphere';
import { MetricCard, type CalcRow } from './MetricCard';
import { copy, type MetricKey } from './data';

/* ---------- helpers ---------- */
const krw = (v: number) => Math.round(v).toLocaleString();

/* ---------- balance ---------- */
function BalanceBody() {
  const T = copy().balance;
  const D = copy().diverse;
  const V = copy().deviation;
  const S = copy().sphericity;
  const B = RUNTIME.BALANCE;
  return (
    <MetricCard
      desc={T.desc}
      formula={T.formula}
      rows={[
        { label: D.title, value: <>{B.diverse} × 0.40 = <b>{(B.diverse * 0.40).toFixed(1)}</b></> },
        { label: V.title, value: <>{B.deviation} × 0.35 = <b>{(B.deviation * 0.35).toFixed(1)}</b></> },
        { label: S.title, value: <>{B.sphericity} × 0.25 = <b>{(B.sphericity * 0.25).toFixed(1)}</b></> },
        { label: T.sumLabel!, value: <><b>{B.balance}</b> / 100</>, isTotal: true },
      ]}
      meta={T.ref}
    />
  );
}

/* ---------- diverse ---------- */
function DiverseBody() {
  const T = copy().diverse;
  const nSec = Object.keys(RUNTIME.BALANCE.sectorWeights || {}).length;
  return (
    <MetricCard
      desc={T.desc}
      formula={T.formula}
      rows={[
        { label: T.labels![0], value: <b>{RUNTIME.BALANCE.hhi}</b> },
        { label: T.labels![1], value: <b>{nSec} {T.unit}</b> },
        { label: T.labels![2], value: <><b>{RUNTIME.BALANCE.diverse}</b> / 100</>, isTotal: true },
      ]}
      meta={T.ref}
    />
  );
}

/* ---------- deviation ---------- */
function DeviationBody() {
  const T = copy().deviation;
  return (
    <MetricCard
      desc={T.desc}
      formula={T.formula}
      rows={[{ label: T.label!, value: <><b>{RUNTIME.BALANCE.deviation}</b> / 100</>, isTotal: true }]}
      meta={T.ref}
    />
  );
}

/* ---------- sphericity ---------- */
function SphericityBody() {
  const T = copy().sphericity;
  return (
    <MetricCard
      desc={T.desc}
      formula={T.formula}
      rows={[{ label: T.label!, value: <><b>{RUNTIME.BALANCE.sphericity}</b> / 100</>, isTotal: true }]}
      meta={T.ref}
    />
  );
}

/* ---------- hhi ---------- */
function HHIBody() {
  const T = copy().hhi;
  return (
    <MetricCard
      desc={T.desc}
      formula={T.formula}
      thresholds={T.thresholds}
      rows={[{ label: T.label!, value: <b>{RUNTIME.BALANCE.hhi}</b>, isTotal: true }]}
      meta={T.ref}
    />
  );
}

/* ---------- riskScore (avg) ---------- */
function RiskScoreBody() {
  const T = copy().riskScore;
  return (
    <MetricCard
      desc={T.desc}
      formula={T.formula}
      thresholds={T.thresholds}
      rows={[{ label: T.label!, value: <><b>{RUNTIME.BALANCE.avgRisk}</b> / 100</>, isTotal: true }]}
      meta={T.ref}
    />
  );
}

/* ---------- assetRisk (선택 종목 분해) ---------- */
function AssetRiskBody() {
  const T = copy().assetRisk;
  const sel = scene.getSelectedTicker();
  const it = sel ? RUNTIME.ITEMS.find((i) => i.ticker === sel) : null;
  if (!it) {
    return <div className="info-body" style={{ color: 'var(--text-2)' }}>{T.noSelect}</div>;
  }

  // 정규화 (computeRiskScores 와 동일 로직)
  const vols = RUNTIME.ITEMS.map((i) => i.liquidity_volume).filter((v) => v != null).sort((a, b) => a - b);
  const liqMedian = vols.length ? vols[Math.floor(vols.length / 2)] : 1;

  const volN = Math.max(0, Math.min(1, (it.volatility_30d - 0.05) / (0.80 - 0.05)));
  const betaN = Math.max(0, Math.min(1, it.beta / 2.5));
  const debtN = Math.max(0, Math.min(1, it.debt_ratio));
  const liqN =
    it.liquidity_volume != null && liqMedian > 0
      ? Math.max(0, Math.min(1, 1 / (it.liquidity_volume / liqMedian)))
      : null;
  const secR = SECTOR_DEF[it.sector].base_risk;

  const W = { vol: 0.35, beta: 0.25, debt: 0.20, liq: 0.10, sec: 0.10 };
  const hasLiq = liqN !== null;
  const totalW = hasLiq ? 1.0 : W.vol + W.beta + W.debt + W.sec;

  const components = [
    { lbl: T.labels![0], raw: `${(it.volatility_30d * 100).toFixed(1)}%`, n: volN, w: W.vol },
    { lbl: T.labels![1], raw: it.beta.toFixed(2), n: betaN, w: W.beta },
    { lbl: T.labels![2], raw: `${(it.debt_ratio * 100).toFixed(0)}%`, n: debtN, w: W.debt },
    { lbl: T.labels![3], raw: hasLiq ? it.liquidity_volume.toLocaleString() : '—', n: liqN, w: W.liq },
    { lbl: T.labels![4], raw: `${it.sector} (${(secR * 100).toFixed(0)})`, n: secR, w: W.sec },
  ];

  const rows: CalcRow[] = components.map((c) => {
    if (c.n === null) {
      return {
        label: c.lbl,
        value: <>{c.raw} · —</>,
        muted: true,
      };
    }
    const contrib = ((c.n * c.w) / totalW) * 100;
    return {
      label: (
        <>
          {c.lbl} <span style={{ color: 'var(--text-2)', fontSize: 11 }}>({c.raw})</span>
        </>
      ),
      value: (
        <>
          {c.n.toFixed(2)} × {c.w} = <b>{contrib.toFixed(1)}</b>
        </>
      ),
    };
  });

  rows.push({
    label: T.sumLabel!,
    value: (
      <>
        <b style={{ color: riskColor(it.risk_score), fontSize: 14 }}>{it.risk_score}</b> / 100
      </>
    ),
    isTotal: true,
  });

  // 가장 큰 기여 요소
  const valid = components.filter((c) => c.n !== null);
  const top = valid.reduce((a, b) => ((b.n! * b.w) > (a.n! * a.w) ? b : a));

  return (
    <MetricCard
      header={
        <div className="info-body" style={{ marginBottom: 6 }}>
          <strong style={{ color: riskColor(it.risk_score) }}>{getName(it)}</strong> · {it.ticker}
        </div>
      }
      desc={T.desc}
      rows={rows}
      footer={
        <div
          className="info-body"
          style={{ marginTop: 8 }}
          dangerouslySetInnerHTML={{ __html: T.summary!(top.lbl) }}
        />
      }
      meta={T.ref}
    />
  );
}

/* ---------- VaR ---------- */
function VaRBody() {
  const T = copy().var;
  const A: any = RUNTIME.ADVANCED || {};
  return (
    <MetricCard
      desc={T.desc}
      formula={T.formula}
      rows={[
        { label: '총 평가금액 V', value: <b>{krw(A.totalValue || 0)}</b> },
        { label: <>일변동성 σ<sub>1d</sub></>, value: <b>{((A.portVolDaily || 0) * 100).toFixed(2)}%</b> },
        {
          label: 'VaR 95% (1일)',
          value: <b style={{ color: 'var(--high)' }}>−{krw(A.var95 || 0)}</b>,
          isTotal: true,
        },
      ]}
      meta={T.ref}
    />
  );
}

/* ---------- CVaR ---------- */
function CVaRBody() {
  const T = copy().cvar;
  const A: any = RUNTIME.ADVANCED || {};
  return (
    <MetricCard
      desc={T.desc}
      formula={T.formula}
      rows={[
        { label: 'VaR 95%', value: <b>−{krw(A.var95 || 0)}</b> },
        {
          label: 'CVaR 95%',
          value: <b style={{ color: 'var(--high)' }}>−{krw(A.cvar95 || 0)}</b>,
          isTotal: true,
        },
      ]}
      meta={T.ref}
    />
  );
}

/* ---------- Sharpe ---------- */
function SharpeBody() {
  const T = copy().sharpe;
  const A: any = RUNTIME.ADVANCED || {};
  return (
    <MetricCard
      desc={T.desc}
      formula={T.formula}
      rows={[
        { label: '포트폴리오 β', value: <b>{(A.portBeta || 0).toFixed(2)}</b> },
        { label: <>기대수익률 μ<sub>p</sub></>, value: <b>{((A.portReturn || 0) * 100).toFixed(2)}%</b> },
        { label: <>변동성 σ<sub>p</sub></>, value: <b>{((A.portVol || 0) * 100).toFixed(2)}%</b> },
        { label: 'Sharpe', value: <b>{(A.sharpe || 0).toFixed(3)}</b>, isTotal: true },
      ]}
      meta={T.ref}
    />
  );
}

/* ---------- Sortino ---------- */
function SortinoBody() {
  const T = copy().sortino;
  const A: any = RUNTIME.ADVANCED || {};
  const downside = (A.portVol || 0) * 0.71;
  return (
    <MetricCard
      desc={T.desc}
      formula={T.formula}
      rows={[
        { label: <>기대수익률 μ<sub>p</sub></>, value: <b>{((A.portReturn || 0) * 100).toFixed(2)}%</b> },
        { label: <>하방변동성 σ<sub>D</sub></>, value: <b>{(downside * 100).toFixed(2)}%</b> },
        { label: 'Sortino', value: <b>{(A.sortino || 0).toFixed(3)}</b>, isTotal: true },
      ]}
      meta={T.ref}
    />
  );
}

/* ---------- DR ---------- */
function DRBody() {
  const T = copy().dr;
  const A: any = RUNTIME.ADVANCED || {};
  const wsum = RUNTIME.ITEMS.reduce((s, i) => s + i.weight * i.volatility_30d, 0);
  return (
    <MetricCard
      desc={T.desc}
      formula={T.formula}
      rows={[
        { label: <>Σ(w<sub>i</sub>σ<sub>i</sub>) — 단순합</>, value: <b>{(wsum * 100).toFixed(2)}%</b> },
        { label: <>σ<sub>p</sub> — 공분산</>, value: <b>{((A.portVol || 0) * 100).toFixed(2)}%</b> },
        { label: 'DR', value: <b>{(A.dr || 1).toFixed(3)}</b> },
        {
          label: '위험 감소',
          value: <b style={{ color: 'var(--safe)' }}>{((A.riskReduction || 0) * 100).toFixed(1)}%</b>,
          isTotal: true,
        },
      ]}
      meta={T.ref}
    />
  );
}

/* ---------- portVol ---------- */
function PortVolBody() {
  const T = copy().portVol;
  const A: any = RUNTIME.ADVANCED || {};
  return (
    <MetricCard
      desc={T.desc}
      formula={T.formula}
      rows={[
        { label: <>연환산 σ<sub>p</sub></>, value: <b>{((A.portVol || 0) * 100).toFixed(2)}%</b> },
        { label: <>일환산 σ<sub>1d</sub></>, value: <b>{((A.portVolDaily || 0) * 100).toFixed(2)}%</b> },
        { label: '포트폴리오 β', value: <b>{(A.portBeta || 0).toFixed(2)}</b>, isTotal: true },
      ]}
      meta={T.ref}
    />
  );
}

/* ---------- dividend ---------- */
function DividendBody() {
  const T = copy().dividend;
  const A: any = RUNTIME.ADVANCED || {};
  return (
    <MetricCard
      desc={T.desc}
      formula={T.formula}
      rows={[
        { label: '총 평가금액', value: <b>{krw(A.totalValue || 0)}</b> },
        { label: '포트폴리오 yield', value: <b>{((A.dividendYieldPort || 0) * 100).toFixed(2)}%</b> },
        {
          label: '예상 연배당',
          value: <b style={{ color: 'var(--safe)' }}>+{krw(A.annualDividend || 0)}</b>,
          isTotal: true,
        },
      ]}
      meta={T.ref}
    />
  );
}

/* ---------- dispatcher ---------- */

const COMPONENTS: Record<MetricKey, () => ReactElement> = {
  balance: BalanceBody,
  diverse: DiverseBody,
  deviation: DeviationBody,
  sphericity: SphericityBody,
  hhi: HHIBody,
  riskScore: RiskScoreBody,
  assetRisk: AssetRiskBody,
  var: VaRBody,
  cvar: CVaRBody,
  sharpe: SharpeBody,
  sortino: SortinoBody,
  dr: DRBody,
  portVol: PortVolBody,
  dividend: DividendBody,
};

export function isKnownMetric(k: string): k is MetricKey {
  return k in COMPONENTS;
}

export function MetricBody({ k }: { k: MetricKey }) {
  const C = COMPONENTS[k];
  return <C />;
}

export function metricTitle(k: MetricKey): string {
  return copy()[k]?.title || '';
}
