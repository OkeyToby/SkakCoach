'use client';

import { useEffect, useRef } from 'react';

export type EngineResult = {
  bestMove?: string;
  scoreCp?: number;
  scoreMate?: number;
  pv?: string;
};

type PendingRequest = {
  resolve: (value: EngineResult) => void;
  reject: (reason?: unknown) => void;
};

export function useEngine() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef<Map<string, PendingRequest>>(new Map());

  useEffect(() => {
    const worker = new Worker(new URL('./stockfishWorker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<EngineResult & { requestId: string }>) => {
      const { requestId, ...result } = event.data;
      const pending = pendingRef.current.get(requestId);
      if (!pending) return;
      pendingRef.current.delete(requestId);
      pending.resolve(result);
    };

    worker.onerror = (error) => {
      pendingRef.current.forEach((pending) => pending.reject(error));
      pendingRef.current.clear();
    };

    return () => {
      worker.terminate();
    };
  }, []);

  function sendRequest(type: 'bestmove' | 'evaluate', fen: string, depth = 12): Promise<EngineResult> {
    return new Promise((resolve, reject) => {
      const worker = workerRef.current;
      if (!worker) {
        reject(new Error('Engine ikke klar.'));
        return;
      }
      const requestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      pendingRef.current.set(requestId, { resolve, reject });
      worker.postMessage({ type, requestId, fen, depth });
    });
  }

  async function getBestMove(fen: string, depth = 12) {
    return sendRequest('bestmove', fen, depth);
  }

  async function evaluatePosition(fen: string, depth = 10) {
    return sendRequest('evaluate', fen, depth);
  }

  return {
    getBestMove,
    evaluatePosition,
  };
}
