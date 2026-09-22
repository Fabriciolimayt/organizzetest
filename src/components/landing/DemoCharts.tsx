import { useId } from "react";

export function DemoLineChart({ values, label }: { values: readonly number[]; label: string }) {
  const id = useId();
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values.map((value, i) => `${32 + i / Math.max(values.length - 1, 1) * 528},${176 - (value - min) / range * 160}`).join(" ");
  return <svg viewBox="0 0 580 210" role="img" aria-labelledby={id} className="demo-line-chart">
    <title id={id}>{label}: {values.join(", ")}</title>
    {[0, 1, 2, 3].map(i => <g key={i}><line x1="32" x2="560" y1={16 + i * 54} y2={16 + i * 54} stroke="currentColor" opacity=".12" /><text x="0" y={20 + i * 54} fill="currentColor" fontSize="12">{Math.round(max - range * i / 3)}</text></g>)}
    <g data-chart-reveal>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </g>
    <text x="32" y="203" fill="currentColor" fontSize="12">Jan</text><text x="528" y="203" fill="currentColor" fontSize="12">Dez</text>
  </svg>;
}

export function DemoBars({ values, label, firstLabel = "Jan", lastLabel = "Dez" }: { values: readonly number[]; label: string; firstLabel?: string; lastLabel?: string }) {
  const max = Math.max(...values, 1);
  return <figure className="demo-bars" aria-label={`${label}: ${values.join(", ")}`}><div aria-hidden="true">{values.map((value, index) => <span key={`${index}-${value}`} style={{ height: `${Math.max(0, value / max * 100)}%` }} data-bar-reveal />)}</div><figcaption><span>{firstLabel}</span><span>{lastLabel}</span></figcaption></figure>;
}
