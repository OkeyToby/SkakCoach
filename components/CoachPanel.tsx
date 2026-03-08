import { type MoveExplanation, type PreMoveCoach } from '@/lib/explainMove';

type Props = {
  explanation: MoveExplanation;
  preMoveCoach: PreMoveCoach;
  isPreparing: boolean;
  voiceSupported: boolean;
  onReadAloud: () => void;
};

function getClassificationClass(classification: string): string {
  if (classification === 'Stor fejl') return 'coachBadge coachBadgeBad';
  if (classification === 'Fejl') return 'coachBadge coachBadgeWarn';
  if (classification === 'Upræcist' || classification === 'Afventer træk') {
    return 'coachBadge coachBadgeNote';
  }
  return 'coachBadge coachBadgeGood';
}

export default function CoachPanel({
  explanation,
  preMoveCoach,
  isPreparing,
  voiceSupported,
  onReadAloud,
}: Props) {
  return (
    <div className="panel">
      <div className="panelHeader">
        <h2>SkakCoach</h2>
        <button
          className="voiceBtn"
          disabled={!voiceSupported}
          onClick={onReadAloud}
          type="button"
        >
          Læs op
        </button>
      </div>

      <div className="coachPreview">
        <div className="coachPreviewHeader">
          <h3>Bedste træk før du rykker</h3>
          {isPreparing && <span className="coachStatus">Analyserer…</span>}
        </div>
        <p>{preMoveCoach.summary}</p>
        {preMoveCoach.suggestedMoves.length > 0 && (
          <ul className="suggestedMoves">
            {preMoveCoach.suggestedMoves.map((move) => (
              <li key={move} className="suggestedMove">
                {move}
              </li>
            ))}
          </ul>
        )}
        <p>{preMoveCoach.plan}</p>
        {preMoveCoach.caution && <p>{preMoveCoach.caution}</p>}
      </div>

      <div className="coachSummary">
        <span>Vurdering</span>
        <strong className={getClassificationClass(explanation.classification)}>
          {explanation.classification}
        </strong>
      </div>

      <div className="coachBox coachBoxPositive">
        <h3>Fordel ved dit træk</h3>
        <p>{explanation.advantage}</p>
      </div>

      <div className="coachBox coachBoxWarning">
        <h3>Ulempe ved dit træk</h3>
        <p>{explanation.drawback}</p>
      </div>

      <div className="coachBox coachBoxIdea">
        <h3>Bedre mulighed</h3>
        <p>{explanation.betterMove}</p>
      </div>
    </div>
  );
}
