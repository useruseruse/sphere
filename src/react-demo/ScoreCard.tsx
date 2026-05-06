import type { BalanceMetrics } from '../types';

interface Props {
  balance: BalanceMetrics;
}

function grade(score: number): { label: string; color: string } {
  if (score >= 90) return { label: 'OPTIMAL', color: '#00E5A0' };
  if (score >= 70) return { label: 'GOOD', color: '#00D4FF' };
  if (score >= 50) return { label: 'WARN', color: '#FF8C42' };
  if (score >= 30) return { label: 'RISK', color: '#FF4560' };
  return { label: 'SEVERE', color: '#7B61FF' };
}

export function ScoreCard({ balance }: Props) {
  const g = grade(balance.balance);
  return (
    <section className="rd-card rd-score-card">
      <h2 className="rd-card-title">Balance Score</h2>

      <div className="rd-score-hero" style={{ ['--g-color' as any]: g.color }}>
        <div className="rd-score-num">{balance.balance}</div>
        <div className="rd-score-grade" style={{ color: g.color }}>
          {g.label}
        </div>
      </div>

      <dl className="rd-score-sub">
        <SubMetric label="섹터 분산" value={balance.diverse} suffix="" />
        <SubMetric label="리스크 편차" value={balance.deviation} suffix="" />
        <SubMetric label="구형도" value={balance.sphericity} suffix="" />
        <SubMetric label="HHI" value={balance.hhi} mono />
        <SubMetric label="평균 위험" value={balance.avgRisk} suffix="" />
      </dl>
    </section>
  );
}

function SubMetric({
  label,
  value,
  suffix,
  mono,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  mono?: boolean;
}) {
  return (
    <div className="rd-sub">
      <dt>{label}</dt>
      <dd className={mono ? 'rd-mono' : ''}>
        {value}
        {suffix}
      </dd>
    </div>
  );
}
