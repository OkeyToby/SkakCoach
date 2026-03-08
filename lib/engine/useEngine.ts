'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  EMPTY_ENGINE_SNAPSHOT,
  type EngineSnapshot,
  type EngineTopMove,
  parseEngineLine,
} from './stockfishWorker';

type PendingAnalysis = {
  snapshot: EngineSnapshot;
  topMoves: Map<number, EngineTopMove>;
  fen: string;
  depth: number;
  multiPv: number;
  resolve: (value: EngineSnapshot) => void;
  reject: (reason?: unknown) => void;
};

export function useEngine() {
  const workerRef = useRef<Worker | null>(null);
  const readyPromiseRef = useRef<Promise<void> | null>(null);
  const resolveReadyRef = useRef<(() => void) | null>(null);
  const activeRef = useRef<PendingAnalysis | null>(null);
  const queueRef = useRef<PendingAnalysis[]>([]);
  const [isReady, setIsReady] = useState(false);

  const runNextAnalysis = useCallback(async () => {
    if (activeRef.current || queueRef.current.length === 0) return;
    if (!workerRef.current || !readyPromiseRef.current) return;

    await readyPromiseRef.current;
    if (!workerRef.current || activeRef.current || queueRef.current.length === 0) return;

    const nextAnalysis = queueRef.current.shift() ?? null;
    if (!nextAnalysis) return;

    activeRef.current = nextAnalysis;
    workerRef.current.postMessage('ucinewgame');
    workerRef.current.postMessage(`setoption name MultiPV value ${Math.max(1, nextAnalysis.multiPv)}`);
    workerRef.current.postMessage(`position fen ${nextAnalysis.fen}`);
    workerRef.current.postMessage(`go depth ${nextAnalysis.depth}`);
  }, []);

  useEffect(() => {
    readyPromiseRef.current = new Promise((resolve) => {
      resolveReadyRef.current = resolve;
    });

    const worker = new Worker('/stockfish/stockfish.js');
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<string>) => {
      const parsed = parseEngineLine(String(event.data));
      if (!parsed) return;

      if (parsed.kind === 'ready') {
        setIsReady(true);
        resolveReadyRef.current?.();
        resolveReadyRef.current = null;
        return;
      }

      const active = activeRef.current;
      if (!active) return;

      if (parsed.kind === 'info') {
        if (parsed.multiPv === 1 && typeof parsed.evaluation === 'number') {
          active.snapshot.evaluation = parsed.evaluation;
        }

        const existing = active.topMoves.get(parsed.multiPv) ?? {
          multiPv: parsed.multiPv,
          evaluation: null,
          move: '',
          pv: '',
        };

        if (typeof parsed.evaluation === 'number') {
          existing.evaluation = parsed.evaluation;
        }

        if (parsed.pv) {
          existing.pv = parsed.pv;
          existing.move = parsed.move ?? existing.move;
        }

        active.topMoves.set(parsed.multiPv, existing);
        return;
      }

      active.snapshot.bestMove = parsed.bestMove;
      active.snapshot.topMoves = [...active.topMoves.values()]
        .sort((left, right) => left.multiPv - right.multiPv)
        .filter((line) => Boolean(line.move));

      active.resolve({ ...active.snapshot });
      activeRef.current = null;
      void runNextAnalysis();
    };

    worker.onerror = (error) => {
      activeRef.current?.reject(error);
      activeRef.current = null;

      for (const pending of queueRef.current) {
        pending.reject(error);
      }

      queueRef.current = [];
    };

    worker.postMessage('uci');
    worker.postMessage('setoption name UCI_AnalyseMode value true');
    worker.postMessage('isready');

    return () => {
      setIsReady(false);

      activeRef.current?.reject(new Error('Engine afsluttet.'));
      activeRef.current = null;

      for (const pending of queueRef.current) {
        pending.reject(new Error('Engine afsluttet.'));
      }

      queueRef.current = [];
      worker.terminate();
      workerRef.current = null;
    };
  }, [runNextAnalysis]);

  const analyzeFen = useCallback(
    async (fen: string, depth = 12, multiPv = 1): Promise<EngineSnapshot> => {
      if (!workerRef.current || !readyPromiseRef.current) {
        throw new Error('Engine ikke klar.');
      }

      await readyPromiseRef.current;

      return new Promise((resolve, reject) => {
        queueRef.current.push({
          snapshot: { ...EMPTY_ENGINE_SNAPSHOT },
          topMoves: new Map(),
          fen,
          depth,
          multiPv,
          resolve,
          reject,
        });

        void runNextAnalysis();
      });
    },
    [runNextAnalysis],
  );

  return {
    analyzeFen,
    isReady,
  };
}
