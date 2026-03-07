type Props = {
  advantage: string;
  drawback: string;
  betterMove: string;
};

export default function CoachPanel({ advantage, drawback, betterMove }: Props) {
  return (
    <div className="panel">
      <h2>SkakCoach</h2>

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
