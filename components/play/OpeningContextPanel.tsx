import AccordionPanel from '@/components/AccordionPanel';
import { formatOpeningLine, type Opening } from '@/data/openings/openings';
import type { OpeningTheoryState } from '@/lib/openings/openingTheoryHelpers';

type Props = {
  opening: Opening;
  theoryState: OpeningTheoryState;
  hasStarted: boolean;
};

function getSummaryValue(theoryState: OpeningTheoryState, hasStarted: boolean): string {
  if (!hasStarted) {
    return 'Klar til åbningstræning';
  }

  if (theoryState.hasLeftTheory) {
    return 'Ude af teori';
  }

  if (theoryState.isComplete) {
    return 'Starterlinje gennemført';
  }

  return `${theoryState.matchedMoves}/${theoryState.totalMoves} træk i teorien`;
}

function getStatusMessage(theoryState: OpeningTheoryState, hasStarted: boolean): string {
  if (!hasStarted) {
    return 'Når partiet starter, følger SkakCoach starterlinjen så længe du selv bliver i den kendte teori.';
  }

  if (theoryState.hasLeftTheory) {
    return 'Nu er du ude af den kendte teori. SkakCoach skifter til almindelig parti-coach.';
  }

  if (theoryState.isComplete) {
    return 'Du har gennemført hele starterlinjen. Herfra fortsætter partiet som almindelig træning.';
  }

  return theoryState.nextExpectedMoveSan
    ? `Du er stadig i teorien. Det næste kendte træk i linjen er ${theoryState.nextExpectedMoveSan}.`
    : 'Du er stadig i den kendte teori.';
}

export default function OpeningContextPanel({ opening, theoryState, hasStarted }: Props) {
  const progressPercentage =
    theoryState.totalMoves === 0 ? 0 : Math.round((theoryState.matchedMoves / theoryState.totalMoves) * 100);

  return (
    <AccordionPanel
      defaultOpen={true}
      summaryValue={getSummaryValue(theoryState, hasStarted)}
      title="Åbningskontekst"
    >
      <div className="coachSummary">
        <span>Åbning</span>
        <strong>{opening.name}</strong>
      </div>

      <p className="cardDescription">{opening.shortDescription}</p>

      <div className="progressBlock">
        <div className="progressMeta">
          <span>Teorifremdrift</span>
          <strong>
            {theoryState.matchedMoves}/{theoryState.totalMoves} træk
          </strong>
        </div>
        <div className="progressTrack" aria-hidden="true">
          <div className="progressFill" style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>

      <div className="coachBox coachBoxPositive">
        <h3>Kort plan</h3>
        <p>{opening.coreIdeas[0]}</p>
      </div>

      <div className={`openingTheoryNote${theoryState.hasLeftTheory ? ' openingTheoryNoteWarn' : ''}`}>
        <strong>Status</strong>
        <p>{getStatusMessage(theoryState, hasStarted)}</p>
      </div>

      <div className="openingMoveTrack">
        {opening.starterMoves.map((move, index) => {
          const isMatched = index < theoryState.matchedMoves;
          const isNext = hasStarted && theoryState.isInTheory && index === theoryState.matchedMoves;

          return (
            <span
              key={`${move}-${index}`}
              className={[
                'openingMoveChip',
                isMatched ? 'openingMoveChipDone' : '',
                isNext ? 'openingMoveChipNext' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {move}
            </span>
          );
        })}
      </div>

      <div className="openingLinePreview">{formatOpeningLine(opening.starterMoves)}</div>
    </AccordionPanel>
  );
}
