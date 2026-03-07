type Props = {
  classification: string;
  advantage: string;
  drawback: string;
  betterMove: string;
};

function getClassificationClass(classification: string): string {
  if (classification === 'Stor fejl') return 'coachBadge coachBadgeBad';
  if (classification === 'Fejl') return 'coachBadge coachBadgeWarn';
  if (classification === 'Upræcist' || classification === 'Afventer træk') {
    return 'coachBadge coachBadgeNote';
  }
  return 'coachBadge coachBadgeGood';
}

export default function CoachPanel({ classification, advantage, drawback, betterMove }: Props) {
  return (
    <div className="panel">
      <h2>SkakCoach</h2>
      <div className="coachSummary">
        <span>Vurdering</span>
        <strong className={getClassificationClass(classification)}>{classification}</strong>
      </div>

      <div className="coachBox coachBoxPositive">
        <h3>Fordel ved dit træk</h3>
        <p>{advantage}</p>
      </div>

      <div className="coachBox coachBoxWarning">
        <h3>Ulempe ved dit træk</h3>
        <p>{drawback}</p>
      </div>

      <div className="coachBox coachBoxIdea">
        <h3>Bedre mulighed</h3>
        <p>{betterMove}</p>
      </div>
    </div>
  );
}
