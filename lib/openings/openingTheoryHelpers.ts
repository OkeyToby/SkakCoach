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

export function getOpeningSideChoice(opening: Opening): 'white' | 'black' {
  return opening.side === 'hvid' ? 'white' : 'black';
}

function moveToUci(move: Pick<Move, 'from' | 'to' | 'promotion'>): string {
  return `${move.from}${move.to}${move.promotion ?? ''}`;
}

export function getOpeningTheoryState(opening: Opening, history: Move[]): OpeningTheoryState {
  let matchedMoves = 0;
  const historyUci = history.map((move) => moveToUci(move));

  while (
    matchedMoves < historyUci.length &&
    matchedMoves < opening.starterMovesUci.length &&
    historyUci[matchedMoves] === opening.starterMovesUci[matchedMoves]
  ) {
    matchedMoves += 1;
  }

  const hasLeftTheory = historyUci.length > matchedMoves;
  const isComplete = !hasLeftTheory && matchedMoves >= opening.starterMovesUci.length;
  const isInTheory = !hasLeftTheory && matchedMoves < opening.starterMovesUci.length;

  return {
    matchedMoves,
    totalMoves: opening.starterMovesUci.length,
    isInTheory,
    hasLeftTheory,
    isComplete,
    nextExpectedMoveSan: isInTheory ? opening.starterMoves[matchedMoves] ?? null : null,
    nextExpectedMoveUci: isInTheory ? opening.starterMovesUci[matchedMoves] ?? null : null,
  };
}
