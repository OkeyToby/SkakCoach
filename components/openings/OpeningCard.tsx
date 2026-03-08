import type { Route } from 'next';
import Card from '@/components/ui/Card';
import { formatOpeningLine, type Opening } from '@/data/openings/openings';

type Props = {
  opening: Opening;
  quizSolved: number;
  isCompleted: boolean;
  playSessions: number;
  lastActivityDate: string | null;
};

function formatLastActivity(dateKey: string | null): string {
  if (!dateKey) {
    return 'Ikke trænet endnu';
  }

  const [year, month, day] = dateKey.split('-');
  if (!year || !month || !day) {
    return dateKey;
  }

  return `${day}.${month}.${year}`;
}

export default function OpeningCard({
  opening,
  quizSolved,
  isCompleted,
  playSessions,
  lastActivityDate,
}: Props) {
  const href = `/openings/${opening.slug}` as Route;

  return (
    <Card
      badge={isCompleted ? 'Quiz færdig' : `${quizSolved}/${opening.quiz.length} quiztrin`}
      className="openingCard"
      description={opening.shortDescription}
      eyebrow={`Spil som ${opening.side}`}
      href={href}
      title={opening.name}
    >
      <p className="openingLinePreview">{formatOpeningLine(opening.starterMoves)}</p>

      <div className="openingCardFacts">
        <div className="openingCardFact">
          <span>Idéer</span>
          <strong>{opening.coreIdeas.length}</strong>
        </div>
        <div className="openingCardFact">
          <span>Fejl at undgå</span>
          <strong>{opening.commonMistakes.length}</strong>
        </div>
        <div className="openingCardFact">
          <span>Øvet i partier</span>
          <strong>{playSessions}</strong>
        </div>
      </div>

      <div className="featureCardFooter">
        <span>Senest aktiv: {formatLastActivity(lastActivityDate)}</span>
        <strong>{isCompleted ? 'Genopfrisk' : 'Åbn åbning'}</strong>
      </div>
    </Card>
  );
}
