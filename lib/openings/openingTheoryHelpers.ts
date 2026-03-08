import type { Opening } from '@/data/openings/openings';

export type OpeningTheoryState = {
  matchedMoves: number;
  totalMoves: number;
  isInTheory: boolean;
  hasLeftTheory: boolean;
  isComplete: boolean;
  nextExpectedMove: string | null;
};

export function getOpeningSideChoice(opening: Opening): 'white' | 'black' {
  return opening.side === 'hvid' ? 'white' : 'black';
}

export function getOpeningTheoryState(opening: Opening, history: string[]): OpeningTheoryState {
  let matchedMoves = 0;

  while (
    matchedMoves < history.length &&
    matchedMoves < opening.starterMoves.length &&
    history[matchedMoves] === opening.starterMoves[matchedMoves]
  ) {
    matchedMoves += 1;
  }

  const hasLeftTheory = history.length > matchedMoves;
  const isComplete = !hasLeftTheory && matchedMoves >= opening.starterMoves.length;
  const isInTheory = !hasLeftTheory && matchedMoves < opening.starterMoves.length;

  return {
    matchedMoves,
    totalMoves: opening.starterMoves.length,
    isInTheory,
    hasLeftTheory,
    isComplete,
    nextExpectedMove: isInTheory ? opening.starterMoves[matchedMoves] ?? null : null,
  };
}
