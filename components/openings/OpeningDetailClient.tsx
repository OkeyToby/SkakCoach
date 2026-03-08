'use client';

import { useEffect } from 'react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import ChessBoard from '@/components/ChessBoard';
import PageHeader from '@/components/layout/PageHeader';
import OpeningQuiz from '@/components/openings/OpeningQuiz';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { type Opening, formatOpeningLine } from '@/data/openings/openings';
import {
  getOpeningProgressEntry,
  isOpeningCompleted,
  markOpeningViewed,
} from '@/lib/openings/openingProgressHelpers';
import { updateOpeningsProgress } from '@/lib/openings/openingProgressStorage';
import { useOpeningsProgress } from '@/lib/openings/useOpeningsProgress';

type Props = {
  opening: Opening;
};

function formatDateLabel(dateKey: string | null): string {
  if (!dateKey) {
    return 'Ikke trænet endnu';
  }

  const [year, month, day] = dateKey.split('-');
  if (!year || !month || !day) {
    return dateKey;
  }

  return `${day}.${month}.${year}`;
}

function formatMoveChip(move: string, index: number): string {
  const moveNumber = Math.floor(index / 2) + 1;
  return index % 2 === 0 ? `${moveNumber}.${move}` : move;
}

export default function OpeningDetailClient({ opening }: Props) {
  const router = useRouter();
  const { progress, hasLoaded } = useOpeningsProgress();

  useEffect(() => {
    updateOpeningsProgress((current) => markOpeningViewed(current, opening.slug));
  }, [opening.slug]);

  const progressEntry = getOpeningProgressEntry(progress, opening.slug);
  const completed = isOpeningCompleted(progress, opening);
  const sideLabel = opening.side === 'hvid' ? 'Hvid' : 'Sort';
  const latestActivityDate =
    progressEntry.lastPlayedGameDate && progressEntry.lastPracticedDate
      ? progressEntry.lastPlayedGameDate > progressEntry.lastPracticedDate
        ? progressEntry.lastPlayedGameDate
        : progressEntry.lastPracticedDate
      : progressEntry.lastPlayedGameDate ?? progressEntry.lastPracticedDate;

  function handleStartOpeningPlay() {
    router.push(`/play?opening=${opening.slug}` as Route);
  }

  return (
    <main className="shellContainer pageMain">
      <PageHeader
        eyebrow={`Åbning for ${opening.side}`}
        title={opening.name}
        description={opening.description}
        actions={
          <>
            <Button onClick={handleStartOpeningPlay} type="button" variant="secondary">
              Spil åbningen
            </Button>
            <Button onClick={handleStartOpeningPlay} type="button" variant="ghost">
              Øv mod computeren
            </Button>
          </>
        }
      />

      <div className="openingTopGrid">
        <StatCard accent="gold" label="Side" value={sideLabel} hint="Åbningen trænes fra denne farves perspektiv." />
        <StatCard
          accent="blue"
          label="Quizprogress"
          value={`${progressEntry.solvedStepIds.length}/${opening.quiz.length}`}
          hint={completed ? 'Alle quiztrin er allerede løst.' : 'Fortsæt i næste uløste position.'}
        />
        <StatCard
          accent="green"
          label="Øvet i partier"
          value={progressEntry.playSessions}
          hint="Registreres, når du starter åbningen i /play."
        />
        <StatCard
          label="Seneste aktivitet"
          value={hasLoaded ? formatDateLabel(latestActivityDate) : 'Indlæser'}
          hint="Dækker både quiz og rigtig spiltræning."
        />
      </div>

      <div className="openingDetailGrid">
        <div className="surfaceCard puzzleBoardCard openingBoardPreview">
          <div className="puzzleBoardHeader">
            <div>
              <span className="cardEyebrow">Preview</span>
              <h2 className="cardTitle">Position efter starterlinjen</h2>
            </div>
            <span className="cardBadge">{completed ? 'Trænet før' : 'Ny åbning'}</span>
          </div>
          <p className="cardDescription">
            Brug denne stilling som reference, før du går i quizmode eller tager åbningen med ind i et rigtigt parti.
          </p>
          <ChessBoard
            boardOrientation={opening.side === 'sort' ? 'black' : 'white'}
            disabled={true}
            onMove={() => false}
            position={opening.previewFen}
          />
        </div>

        <Card
          badge={`${opening.starterMoves.length} halve træk`}
          className="openingLineCard"
          description="Det er denne korte starterlinje, quizzen bygger på. Målet er at forstå idéerne bag hvert træk."
          title="Startersekvens"
        >
          <p className="openingLinePreview openingLinePreviewStrong">{formatOpeningLine(opening.starterMoves)}</p>
          <div className="openingMoveTrack">
            {opening.starterMoves.map((move, index) => (
              <span key={`${move}-${index}`} className="openingMoveChip">
                {formatMoveChip(move, index)}
              </span>
            ))}
          </div>
          <div className="summaryEmptyActions">
            <Button onClick={handleStartOpeningPlay} type="button" variant="secondary">
              Spil åbningen
            </Button>
          </div>
        </Card>
      </div>

      <div className="openingDetailGrid">
        <Card badge="Planen" title="Kerneidéer">
          <ul className="placeholderList openingChecklist">
            {opening.coreIdeas.map((idea) => (
              <li key={idea}>{idea}</li>
            ))}
          </ul>
        </Card>

        <Card badge="Undgå dette" title="Typiske fejl">
          <ul className="placeholderList openingChecklist">
            {opening.commonMistakes.map((mistake) => (
              <li key={mistake}>{mistake}</li>
            ))}
          </ul>
        </Card>
      </div>

      <OpeningQuiz
        attempts={progressEntry.attempts}
        hasLoaded={hasLoaded}
        opening={opening}
        solvedStepIds={progressEntry.solvedStepIds}
      />
    </main>
  );
}
