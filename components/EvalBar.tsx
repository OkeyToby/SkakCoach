import AccordionPanel from './AccordionPanel';

type Props = {
  evaluation: number | null;
  visible: boolean;
};

function clampEvaluation(value: number): number {
  return Math.max(-500, Math.min(500, value));
}

function formatEvaluationLabel(evaluation: number | null): string {
  if (evaluation === null) return '0.0';
  const pawns = Math.abs(evaluation) / 100;
  const side = evaluation >= 0 ? 'Hvid' : 'Sort';
  return `${side} +${pawns.toFixed(1)}`;
}

export default function EvalBar({ evaluation, visible }: Props) {
  if (!visible) return null;

  const clamped = clampEvaluation(evaluation ?? 0);
  const whiteShare = ((clamped + 500) / 1000) * 100;
  const label = formatEvaluationLabel(evaluation);

  return (
    <AccordionPanel defaultOpen={false} summaryValue={label} title="Evalueringsbar">
      <div className="evalBar" aria-label={`Evaluering: ${formatEvaluationLabel(evaluation)}`}>
        <div className="evalBarWhite" style={{ height: `${whiteShare}%` }} />
      </div>
      <p className="evalHint">Toppen favoriserer sort. Bunden favoriserer hvid.</p>
    </AccordionPanel>
  );
}
