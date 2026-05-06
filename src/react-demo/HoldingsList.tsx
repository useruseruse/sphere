import type { Item } from '../types';
import { riskColor } from '../core/pipeline';

interface Props {
  items: Item[];
}

export function HoldingsList({ items }: Props) {
  const sorted = [...items].sort((a, b) => b.weight - a.weight);
  return (
    <ul className="rd-holdings">
      {sorted.map((it) => (
        <li key={it.ticker} className="rd-holding">
          <span
            className="rd-risk-dot"
            style={{ background: riskColor(it.risk_score) }}
            aria-label={`risk ${it.risk_score}`}
          />
          <span className="rd-holding-name">
            <strong>{it.name}</strong>
            <span className="rd-holding-ticker">{it.ticker}</span>
          </span>
          <span className="rd-holding-sector">{it.sector}</span>
          <span className="rd-holding-weight">{(it.weight * 100).toFixed(1)}%</span>
          <span className="rd-holding-risk" style={{ color: riskColor(it.risk_score) }}>
            R {it.risk_score}
          </span>
        </li>
      ))}
    </ul>
  );
}
