'use client';

import { useEffect, useRef, useState } from 'react';
import {
  EMPTY_ENGINE_SNAPSHOT,
  type EngineSnapshot,
  parseEngineLine,
} from './stockfishWorker';

type PendingAnalysis = {
  snapshot: EngineSnapshot;
  resolve: (value: EngineSnapshot) => void;
  reject: (reason?: unknown) => void;
};

export function useEngine() {
  const workerRef = useRef<Worker | null>(null);
  const readyPromiseRef = useRef<Promise<void> | null>(null);
  const resolveReadyRef = useRef<(() => void) | null>(null);
  const pendingRef = useRef<PendingAnalysis | null>(null);
  const [bestMove, setBestMove] = useState('');
  const [evaluation, setEvaluation] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);

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

      if (parsed.kind === 'evaluation') {
        setEvaluation(parsed.evaluation);
        if (pendingRef.current) {
          pendingRef.current.snapshot.evaluation = parsed.evaluation;
        }
        return;
      }

      setBestMove(parsed.bestMove);
      if (pendingRef.current) {
        pendingRef.current.snapshot.bestMove = parsed.bestMove;
        pendingRef.current.resolve({ ...pendingRef.current.snapshot });
        pendingRef.current = null;
      }
    };

    worker.onerror = (error) => {
      if (pendingRef.current) {
        pendingRef.current.reject(error);
        pendingRef.current = null;
      }
    };

    worker.postMessage('uci');
    worker.postMessage('setoption name UCI_AnalyseMode value true');
    worker.postMessage('isready');

    return () => {
      if (pendingRef.current) {
        pendingRef.current.reject(new Error('Engine afsluttet.'));
        pendingRef.current = null;
      }
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  async function analyzeFen(fen: string, depth = 12): Promise<EngineSnapshot> {
    if (!workerRef.current || !readyPromiseRef.current) {
      throw new Error('Engine ikke klar.');
    }

    await readyPromiseRef.current;
    setBestMove('');
    setEvaluation(null);

    if (pendingRef.current) {
      pendingRef.current.reject(new Error('Engine er allerede i gang med en analyse.'));
      pendingRef.current = null;
    }

    return new Promise((resolve, reject) => {
      const worker = workerRef.current;
      if (!worker) {
        reject(new Error('Engine ikke klar.'));
        return;
      }

      pendingRef.current = {
        snapshot: { ...EMPTY_ENGINE_SNAPSHOT },
        resolve,
        reject,
      };

      worker.postMessage('ucinewgame');
      worker.postMessage(`position fen ${fen}`);
      worker.postMessage(`go depth ${depth}`);
    });
  }

  return {
    bestMove,
    evaluation,
    analyzeFen,
    isReady,
  };
}
