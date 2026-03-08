export type EngineTopMove = {
  multiPv: number;
  evaluation: number | null;
  move: string;
  pv: string;
};

export type EngineSnapshot = {
  bestMove: string;
  evaluation: number | null;
  topMoves: EngineTopMove[];
};

export type ParsedEngineLine =
  | {
      kind: 'ready';
    }
  | {
      kind: 'info';
      multiPv: number;
      evaluation: number | null;
      move?: string;
      pv?: string;
    }
  | {
      kind: 'bestmove';
      bestMove: string;
    };

export const EMPTY_ENGINE_SNAPSHOT: EngineSnapshot = {
  bestMove: '',
  evaluation: null,
  topMoves: [],
};

function mateToEvaluation(mate: number): number {
  const magnitude = Math.max(1000, 100000 - Math.abs(mate) * 1000);
  return mate > 0 ? magnitude : -magnitude;
}

export function parseEngineLine(rawLine: string): ParsedEngineLine | null {
  const line = rawLine.trim();
  if (!line) return null;

  if (line === 'readyok') {
    return { kind: 'ready' };
  }

  if (line.startsWith('info')) {
    const multiPvMatch = line.match(/ multipv (\d+)/);
    const cpMatch = line.match(/score cp (-?\d+)/);
    const mateMatch = line.match(/score mate (-?\d+)/);
    const pvMatch = line.match(/ pv (.+)$/);
    const multiPv = multiPvMatch ? Number(multiPvMatch[1]) : 1;

    if (cpMatch || mateMatch || pvMatch) {
      const evaluation = mateMatch
        ? mateToEvaluation(Number(mateMatch[1]))
        : cpMatch
          ? Number(cpMatch[1])
          : null;
      const pv = pvMatch?.[1];
      const move = pv?.split(/\s+/)[0];

      return {
        kind: 'info',
        multiPv,
        evaluation,
        move,
        pv,
      };
    }
  }

  if (line.startsWith('bestmove')) {
    return {
      kind: 'bestmove',
      bestMove: line.split(/\s+/)[1] ?? '',
    };
  }

  return null;
}
