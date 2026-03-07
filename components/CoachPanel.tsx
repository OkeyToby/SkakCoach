import { MoveExplanation } from '@/lib/explainMove';

type CoachPanelProps = {
  explanation: MoveExplanation;
};

export default function CoachPanel({ explanation }: CoachPanelProps) {
  return (
    <section className="panel">
      <h2>Coach-panel</h2>
      <div className="coach-grid">
        <article className="coach-box">
          <h3>Fordel ved dit træk</h3>
          <p>{explanation.advantage}</p>
        </article>
        <article className="coach-box">
          <h3>Ulempe ved dit træk</h3>
          <p>{explanation.disadvantage}</p>
        </article>
        <article className="coach-box">
          <h3>Bedre mulighed</h3>
          <p>{explanation.betterOption}</p>
        </article>
      </div>
    </section>
  );
}
