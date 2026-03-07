'use client';

import { useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';
import CoachPanel from '@/components/CoachPanel';
import GameInfo from '@/components/GameInfo';
import MoveHistory from '@/components/MoveHistory';
import { explainMove, type MoveExplanation } from '@/lib/explainMove';
import { getGameStatus } from '@/lib/chessHelpers';
import { useEngine } from '@/lib/engine/useEngine';

const defaultExplanation: MoveExplanation = {
  advantage: 'Start med at tage centrum og udvikle springere/løbere.',
  disadvantage: 'Undgå tidlige bondetræk i kanten, hvis de ikke har et klart formål.',
  betterOption: 'Klassiske åbningstræk som e4, d4, Nf3 eller Nc3 er gode at overveje.',
};

export default function HomePage() {
  const [chess, setChess] = useState(() => new Chess());
  const [moves, setMoves] = useState<string[]>([]);
  const [coachText, setCoachText] = useState<MoveExplanation>(defaultExplanation);
  const [isBusy, setIsBusy] = useState(false);
  const { getBestMove, evaluatePosition } = useEngine();

  const status = useMemo(() => getGameStatus(chess), [chess]);
  const turn = chess.turn() === 'w' ? 'Hvid (dig)' : 'Sort (computer)';

  const makeComputerMove = async (game: Chess) => {
    const result = await getBestMove(game.fen(), 12);
    if (!result.bestMove || result.bestMove === '(none)') return;
    game.move({ from: result.bestMove.slice(0, 2), to: result.bestMove.slice(2, 4), promotion: 'q' });
  };

  const onPieceDrop = async (source: string, target: string) => {
    if (isBusy || chess.turn() !== 'w' || chess.isGameOver()) return false;

    const before = new Chess(chess.fen());
    const next = new Chess(chess.fen());
    const move = next.move({ from: source, to: target, promotion: 'q' });
    if (!move) return false;

    setIsBusy(true);

    try {
      const [evalBefore, evalAfter, bestForWhite] = await Promise.all([
        evaluatePosition(before.fen(), 10),
        evaluatePosition(next.fen(), 10),
        getBestMove(before.fen(), 12),
      ]);

      const bestSan = bestForWhite.bestMove
        ? before.move({
            from: bestForWhite.bestMove.slice(0, 2),
            to: bestForWhite.bestMove.slice(2, 4),
            promotion: 'q',
          })?.san
        : undefined;

      if (bestForWhite.bestMove) {
        before.undo();
      }

      const explanation = explainMove({
        before,
        after: next,
        moveSan: move.san,
        engineBestMoveSan: bestSan,
        evalBeforeCp: evalBefore.scoreCp,
        evalAfterCp: evalAfter.scoreCp,
      });

      if (!next.isGameOver()) {
        await makeComputerMove(next);
      }

      setChess(next);
      setCoachText(explanation);
      setMoves(next.history());
      return true;
    } catch {
      return false;
    } finally {
      setIsBusy(false);
    }
  };

  const onReset = () => {
    const fresh = new Chess();
    setChess(fresh);
    setMoves([]);
    setCoachText(defaultExplanation);
    setIsBusy(false);
  };

  return (
    <main className="page-wrap">
      <h1>SkakCoach</h1>
      <p className="intro">Spil hvid mod computeren og få letforståelig feedback efter hvert træk.</p>
      <div className="layout">
        <section>
          <ChessBoard position={chess.fen()} onPieceDrop={onPieceDrop} />
          {isBusy && <p className="thinking">Computeren tænker…</p>}
        </section>
        <aside className="side-col">
          <CoachPanel explanation={coachText} />
          <GameInfo status={status} turn={turn} onReset={onReset} />
          <MoveHistory moves={moves} />
        </aside>
      </div>
    </main>
  );
}
