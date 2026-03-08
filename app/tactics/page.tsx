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
import { recordSolvedPuzzle } from '@/lib/profile/profileHelpers';
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
  description: 'Find det stærkeste træk i stillingen. Når du løser opgaven, får du XP med det samme.',
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

  const filteredPuzzles =
    activeFilter === 'alle'
      ? tacticPuzzles
      : tacticPuzzles.filter((puzzle) => puzzle.category === activeFilter);

  useEffect(() => {
    if (filteredPuzzles.some((puzzle) => puzzle.id === currentPuzzle.id)) {
      return;
    }

    const nextPuzzle = pickPuzzle(filteredPuzzles, currentPuzzle.id);
    setCurrentPuzzle(nextPuzzle);
    setBoardFen(nextPuzzle.fen);
    setFeedback(defaultFeedback);
    setIsSolved(false);
  }, [currentPuzzle.id, filteredPuzzles]);

  const solutionSan = uciToSan(new Chess(currentPuzzle.fen), currentPuzzle.solution[0]) ?? currentPuzzle.solution[0];

  function loadNextPuzzle() {
    const nextPuzzle = pickPuzzle(filteredPuzzles, currentPuzzle.id);
    setCurrentPuzzle(nextPuzzle);
    setBoardFen(nextPuzzle.fen);
    setFeedback(defaultFeedback);
    setIsSolved(false);
  }

  function handleFilterChange(filter: TacticFilter) {
    setActiveFilter(filter);
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
      setFeedback({
        variant: 'korrekt',
        title: 'Korrekt!',
        description: currentPuzzle.explanation,
      });
      updateProfile((profileState) => recordSolvedPuzzle(profileState));
      return true;
    }

    setBoardFen(currentPuzzle.fen);
    setFeedback({
      variant: 'forkert',
      title: 'Forkert',
      description: `Det stærkeste træk var ${solutionSan}. ${currentPuzzle.explanation}`,
    });
    return false;
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
        <StatCard accent="blue" label="Aktiv kategori" value={activeFilter === 'alle' ? 'Alle' : activeFilter} hint="Skift fokus med filtrene." />
        <StatCard accent="green" label="XP fra opgaver" value={profile.puzzlesSolved * 20} hint="20 XP for hver korrekt løsning." />
      </div>

      <TacticFilterBar activeFilter={activeFilter} onFilterChange={handleFilterChange} />

      <div className="tacticsLayout">
        <PuzzleBoard fen={boardFen} onMove={handlePuzzleMove} disabled={isSolved} />

        <div className="tacticsSide">
          <Card
            badge={`Sværhedsgrad ${currentPuzzle.difficulty}`}
            description={currentPuzzle.explanation}
            eyebrow={`Kategori: ${currentPuzzle.category}`}
            title={currentPuzzle.title}
          >
            <div className="puzzleMetaRow">
              <span>Stillings-ID</span>
              <strong>{currentPuzzle.id}</strong>
            </div>
          </Card>

          <PuzzleFeedback
            description={feedback.description}
            title={feedback.title}
            variant={feedback.variant}
          />

          <Card title="Sådan får du mest ud af træningen">
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
