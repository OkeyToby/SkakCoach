'use client';

import { useEffect, useState } from 'react';
import { Chess } from 'chess.js';
import PageHeader from '@/components/layout/PageHeader';
import PuzzleBoard from '@/components/tactics/PuzzleBoard';
import PuzzleFeedback from '@/components/tactics/PuzzleFeedback';
import TacticFilterBar, { type TacticFilter } from '@/components/tactics/TacticFilterBar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import StatCard from '@/components/ui/StatCard';
import { tacticPuzzles, type Puzzle } from '@/data/tactics/puzzles';
import { XP_PER_PUZZLE, recordSolvedPuzzle } from '@/lib/profile/profileHelpers';
import { updateProfile } from '@/lib/profile/profileStorage';
import { useProfile } from '@/lib/profile/useProfile';
import { uciToSan } from '@/lib/chessHelpers';

type FeedbackState = {
  variant: 'korrekt' | 'forkert' | 'neutral';
  title: string;
  description: string;
};

const defaultFeedback: FeedbackState = {
  variant: 'neutral',
  title: 'Klar til opgave',
  description: 'Find det stærkeste træk i stillingen. Start altid med at lede efter skakker, slag og direkte trusler.',
};

const categoryLabels: Record<Exclude<TacticFilter, 'alle'>, string> = {
  mat: 'Mat',
  gafler: 'Gafler',
  bindinger: 'Bindinger',
  materiale: 'Materiale',
};

function pickPuzzle(pool: Puzzle[], previousId?: string): Puzzle {
  if (pool.length === 0) {
    return tacticPuzzles[0];
  }

  const candidates = pool.filter((puzzle) => puzzle.id !== previousId);
  const source = candidates.length > 0 ? candidates : pool;
  return source[Math.floor(Math.random() * source.length)];
}

function moveMatchesSolution(moveUci: string, expectedUci: string): boolean {
  return moveUci === expectedUci || `${moveUci}q` === expectedUci;
}

export default function TacticsPage() {
  const { profile } = useProfile();
  const [activeFilter, setActiveFilter] = useState<TacticFilter>('alle');
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle>(() => tacticPuzzles[0]);
  const [boardFen, setBoardFen] = useState(tacticPuzzles[0].fen);
  const [feedback, setFeedback] = useState<FeedbackState>(defaultFeedback);
  const [isSolved, setIsSolved] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [sessionSolved, setSessionSolved] = useState(0);

  const filteredPuzzles =
    activeFilter === 'alle'
      ? tacticPuzzles
      : tacticPuzzles.filter((puzzle) => puzzle.category === activeFilter);

  const activeFilterLabel = activeFilter === 'alle' ? 'Alle' : categoryLabels[activeFilter];
  const currentCategoryLabel = categoryLabels[currentPuzzle.category];
  const feedbackDetail =
    feedback.variant === 'korrekt'
      ? `Belønning: ${XP_PER_PUZZLE} XP. Løst i denne session: ${sessionSolved}.`
      : feedback.variant === 'forkert'
        ? `Forsøg i denne opgave: ${attempts}. Du kan prøve igen med det samme eller gå videre til næste opgave.`
        : `Belønning: ${XP_PER_PUZZLE} XP. Vælg et forcing træk først, før du ser på mere stille ideer.`;

  function loadPuzzle(puzzle: Puzzle) {
    setCurrentPuzzle(puzzle);
    setBoardFen(puzzle.fen);
    setFeedback(defaultFeedback);
    setIsSolved(false);
    setAttempts(0);
  }

  useEffect(() => {
    if (filteredPuzzles.some((puzzle) => puzzle.id === currentPuzzle.id)) {
      return;
    }

    loadPuzzle(pickPuzzle(filteredPuzzles, currentPuzzle.id));
  }, [currentPuzzle.id, filteredPuzzles]);

  const solutionSan = uciToSan(new Chess(currentPuzzle.fen), currentPuzzle.solution[0]) ?? currentPuzzle.solution[0];

  function loadNextPuzzle() {
    loadPuzzle(pickPuzzle(filteredPuzzles, currentPuzzle.id));
  }

  function handleFilterChange(filter: TacticFilter) {
    setActiveFilter(filter);
  }

  function resetFeedback() {
    setFeedback(defaultFeedback);
  }

  function handlePuzzleMove(from: string, to: string) {
    if (isSolved) return false;

    const chess = new Chess(currentPuzzle.fen);
    let appliedMove = null;

    try {
      appliedMove = chess.move({ from, to, promotion: 'q' });
    } catch {
      appliedMove = null;
    }

    if (!appliedMove) {
      return false;
    }

    const moveUci = `${from}${to}`;
    if (moveMatchesSolution(moveUci, currentPuzzle.solution[0])) {
      setBoardFen(chess.fen());
      setIsSolved(true);
      setAttempts((current) => current + 1);
      setSessionSolved((current) => current + 1);
      setFeedback({
        variant: 'korrekt',
        title: 'Korrekt!',
        description: currentPuzzle.explanation,
      });
      updateProfile((profileState) => recordSolvedPuzzle(profileState));
      return true;
    }

    setBoardFen(currentPuzzle.fen);
    setAttempts((current) => current + 1);
    setFeedback({
      variant: 'forkert',
      title: 'Forkert',
      description: `Det stærkeste træk var ${solutionSan}. Idéen er: ${currentPuzzle.explanation}`,
    });
    return false;
  }

  if (filteredPuzzles.length === 0) {
    return (
      <main className="shellContainer pageMain">
        <PageHeader
          eyebrow="Taktiktræning"
          title="Løs taktiske opgaver"
          description="Denne kategori har ingen opgaver endnu. Skift filter eller fortsæt med en anden træningsform."
          actions={
            <>
              <Button href="/play" variant="secondary">
                Spil et parti
              </Button>
              <Button onClick={() => setActiveFilter('alle')} variant="ghost" type="button">
                Vis alle opgaver
              </Button>
            </>
          }
        />
        <Card badge="Ingen opgaver her endnu" title="Vælg en anden kategori">
          <p className="cardDescription">
            Vi har allerede opgaver i andre kategorier, så du kan fortsætte træningen uden afbrydelse.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="shellContainer pageMain">
      <PageHeader
        eyebrow="Taktiktræning"
        title="Løs taktiske opgaver"
        description="Træn mønstergenkendelse med korte, fokuserede stillinger. Hver korrekt løsning giver XP til din profil."
        actions={
          <>
            <Button href="/play" variant="secondary">
              Spil et parti
            </Button>
            <Button onClick={loadNextPuzzle} variant="ghost" type="button">
              Næste opgave
            </Button>
          </>
        }
      />

      <div className="tacticsTopGrid">
        <StatCard accent="gold" label="Løst i alt" value={profile.puzzlesSolved} hint="Samlede korrekte opgaver." />
        <StatCard accent="blue" label="I denne session" value={sessionSolved} hint="Nye løsninger siden du åbnede siden." />
        <StatCard label="Aktiv kategori" value={activeFilterLabel} hint={`${filteredPuzzles.length} opgaver i dette fokus.`} />
        <StatCard accent="green" label="XP fra opgaver" value={profile.puzzlesSolved * XP_PER_PUZZLE} hint={`${XP_PER_PUZZLE} XP for hver korrekt løsning.`} />
      </div>

      <TacticFilterBar activeFilter={activeFilter} onFilterChange={handleFilterChange} />

      <div className="tacticsLayout">
        <PuzzleBoard fen={boardFen} onMove={handlePuzzleMove} disabled={isSolved} />

        <div className="tacticsSide">
          <Card
            badge={`Sværhedsgrad ${currentPuzzle.difficulty}`}
            description={currentPuzzle.explanation}
            eyebrow={`Kategori: ${currentCategoryLabel}`}
            title={currentPuzzle.title}
          >
            <div className="puzzleMetaRow">
              <span>Stillings-ID</span>
              <strong>{currentPuzzle.id}</strong>
            </div>
            <div className="puzzleMetaRow">
              <span>Forsøg</span>
              <strong>{attempts === 0 ? 'Ikke startet' : attempts}</strong>
            </div>
          </Card>

          <PuzzleFeedback
            description={feedback.description}
            detail={feedbackDetail}
            title={feedback.title}
            variant={feedback.variant}
          >
            {feedback.variant === 'forkert' ? (
              <Button onClick={resetFeedback} type="button" variant="secondary">
                Prøv igen
              </Button>
            ) : null}
            <Button onClick={loadNextPuzzle} type="button" variant={isSolved ? 'primary' : 'ghost'}>
              Næste opgave
            </Button>
          </PuzzleFeedback>

          <Card badge="Træningsrytme" title="Sådan får du mest ud af træningen">
            <ul className="placeholderList">
              <li>Se først efter skakker, slag og trusler.</li>
              <li>Navngiv motivet for dig selv, før du klikker videre.</li>
              <li>Skift mellem kategorierne, så du træner bredt.</li>
            </ul>
          </Card>
        </div>
      </div>
    </main>
  );
}
