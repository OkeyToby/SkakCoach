export type EngineSnapshot = {
  bestMove: string;
  evaluation: number | null;
};

export type ParsedEngineLine =
  | {
      kind: 'ready';
    }
  | {
      kind: 'evaluation';
      evaluation: number;
    }
  | {
      kind: 'bestmove';
      bestMove: string;
    };

export const EMPTY_ENGINE_SNAPSHOT: EngineSnapshot = {
  bestMove: '',
  evaluation: null,
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

  const mateMatch = line.match(/score mate (-?\d+)/);
  if (mateMatch) {
    return {
      kind: 'evaluation',
      evaluation: mateToEvaluation(Number(mateMatch[1])),
    };
  }

  const cpMatch = line.match(/score cp (-?\d+)/);
  if (cpMatch) {
    return {
      kind: 'evaluation',
      evaluation: Number(cpMatch[1]),
    };
  }

  if (line.startsWith('bestmove')) {
    return {
      kind: 'bestmove',
      bestMove: line.split(/\s+/)[1] ?? '',
    };
  }

  return null;
}
