/// <reference lib="webworker" />

type EngineRequest = {
  type: 'bestmove' | 'evaluate';
  requestId: string;
  fen: string;
  depth?: number;
};

type WorkerResponse = {
  requestId: string;
  bestMove?: string;
  scoreCp?: number;
  scoreMate?: number;
  pv?: string;
};

const ctx = self as DedicatedWorkerGlobalScope;
ctx.importScripts('https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish.js');

const StockfishConstructor = (ctx as unknown as { STOCKFISH: () => Worker }).STOCKFISH;
const engine = StockfishConstructor();

let activeRequest: EngineRequest | null = null;
let lastScoreCp: number | undefined;
let lastScoreMate: number | undefined;
let lastPv: string | undefined;

engine.onmessage = (raw: MessageEvent | string) => {
  const message = typeof raw === 'string' ? raw : raw.data;
  if (!activeRequest) return;

  if (message.startsWith('info') && message.includes(' score ')) {
    const cpMatch = message.match(/score cp (-?\d+)/);
    const mateMatch = message.match(/score mate (-?\d+)/);
    const pvMatch = message.match(/ pv (.+)$/);

    if (cpMatch) lastScoreCp = Number(cpMatch[1]);
    if (mateMatch) lastScoreMate = Number(mateMatch[1]);
    if (pvMatch) lastPv = pvMatch[1];
  }

  if (message.startsWith('bestmove')) {
    const bestMove = message.split(' ')[1];
    const payload: WorkerResponse = {
      requestId: activeRequest.requestId,
      bestMove,
      scoreCp: lastScoreCp,
      scoreMate: lastScoreMate,
      pv: lastPv,
    };
    ctx.postMessage(payload);
    activeRequest = null;
  }
};

function runRequest(request: EngineRequest) {
  activeRequest = request;
  lastScoreCp = undefined;
  lastScoreMate = undefined;
  lastPv = undefined;

  engine.postMessage('ucinewgame');
  engine.postMessage(`position fen ${request.fen}`);
  engine.postMessage(`go depth ${request.depth ?? 12}`);
}

ctx.onmessage = (event: MessageEvent<EngineRequest>) => {
  runRequest(event.data);
};

export {};
