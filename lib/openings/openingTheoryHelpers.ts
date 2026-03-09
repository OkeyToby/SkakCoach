import type { Move } from 'chess.js';
import type { Opening } from '@/data/openings/openings';

export type OpeningTheoryState = {
  matchedMoves: number;
  totalMoves: number;
  isInTheory: boolean;
  hasLeftTheory: boolean;
  isComplete: boolean;
  nextExpectedMoveSan: string | null;
  nextExpectedMoveUci: string | null;
};

export type OpeningTheoryBreakdown = OpeningTheoryState & {
  firstLeftTheoryPly: number | null;
  firstLeftTheoryMoveSan: string | null;
};

export function getOpeningSideChoice(opening: Opening): 'white' | 'black' {
  return opening.side === 'hvid' ? 'white' : 'black';
}

function moveToUci(move: Pick<Move, 'from' | 'to' | 'promotion'>): string {
  return `${move.from}${move.to}${move.promotion ?? ''}`;
}

export function getOpeningTheoryBreakdown(
  opening: Opening,
  history: Move[],
): OpeningTheoryBreakdown {
  let matchedMoves = 0;
  const historyUci = history.map((move) => moveToUci(move));

  while (
    matchedMoves < historyUci.length &&
    matchedMoves < opening.starterMovesUci.length &&
    historyUci[matchedMoves] === opening.starterMovesUci[matchedMoves]
  ) {
    matchedMoves += 1;
  }

  const isComplete = matchedMoves >= opening.starterMovesUci.length;
  const hasLeftTheory = !isComplete && historyUci.length > matchedMoves;
  const isInTheory = !isComplete && !hasLeftTheory && matchedMoves < opening.starterMovesUci.length;
  const firstLeftTheoryMove = hasLeftTheory ? history[matchedMoves] ?? null : null;

  return {
    matchedMoves,
    totalMoves: opening.starterMovesUci.length,
    isInTheory,
    hasLeftTheory,
    isComplete,
    nextExpectedMoveSan: isInTheory ? opening.starterMoves[matchedMoves] ?? null : null,
    nextExpectedMoveUci: isInTheory ? opening.starterMovesUci[matchedMoves] ?? null : null,
    firstLeftTheoryPly: hasLeftTheory ? matchedMoves + 1 : null,
    firstLeftTheoryMoveSan: firstLeftTheoryMove?.san ?? null,
  };
}

export function getOpeningTheoryState(opening: Opening, history: Move[]): OpeningTheoryState {
  const {
    matchedMoves,
    totalMoves,
    isInTheory,
    hasLeftTheory,
    isComplete,
    nextExpectedMoveSan,
    nextExpectedMoveUci,
  } = getOpeningTheoryBreakdown(opening, history);

  return {
    matchedMoves,
    totalMoves,
    isInTheory,
    hasLeftTheory,
    isComplete,
    nextExpectedMoveSan,
    nextExpectedMoveUci,
  };
}
