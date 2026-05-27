type Props = {
  label: string;
  value: string;
  hint?: string;
};

export function MetricTile({ label, value, hint }: Props) {
  return (
    <div className="rounded-lg bg-karmen-pale-blue/40 border border-karmen-border-blue/40 p-3">
      <div className="text-[10px] text-karmen-mute uppercase tracking-widest font-semibold">{label}</div>
      <div className="text-lg font-semibold text-karmen-ink mt-1 leading-tight tabular-nums">{value}</div>
      {hint && <div className="text-xs text-karmen-mute mt-0.5 tabular-nums">{hint}</div>}
    </div>
  );
}
