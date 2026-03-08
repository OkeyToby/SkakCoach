type Props = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: 'gold' | 'blue' | 'green';
};

export default function StatCard({ label, value, hint, accent = 'gold' }: Props) {
  return (
    <div className={`statCard statCard${accent[0].toUpperCase()}${accent.slice(1)}`}>
      <span className="statLabel">{label}</span>
      <strong className="statValue">{value}</strong>
      {hint ? <p className="statHint">{hint}</p> : null}
    </div>
  );
}
