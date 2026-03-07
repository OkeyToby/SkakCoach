'use client';

import { useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';
import CoachPanel from '@/components/CoachPanel';
import GameInfo from '@/components/GameInfo';
import MoveHistory from '@/components/MoveHistory';
import { explainMove, type MoveExplanation } from '@/lib/explainMove';
import { applyUciMove, uciToSan } from '@/lib/chessHelpers';
import { useEngine } from '@/lib/engine/useEngine';

const defaultExplanation: MoveExplanation = {
  classification: 'Afventer træk',
  advantage: 'Spil dit første træk og prøv at sætte en officer i gang.',
  drawback: 'Ingen vurdering endnu.',
  betterMove: 'Kæmp gerne om centrum tidligt og tænk på rokade.',
};

function playFallbackReply(game: Chess) {
  const replies = game.moves({ verbose: true });
  if (replies.length === 0) return;

  const reply = replies[Math.floor(Math.random() * replies.length)];
  game.move({
    from: reply.from,
    to: reply.to,
    promotion: reply.promotion ?? 'q',
  });
}

export default function Page() {
  const [game, setGame] = useState(() => new Chess());
  const [coachText, setCoachText] = useState<MoveExplanation>(defaultExplanation);
  const [isComputerThinking, setIsComputerThinking] = useState(false);
  const { analyzeFen, isReady } = useEngine();

  async function onPlayerMove(from: string, to: string) {
    if (!isReady || isComputerThinking || game.turn() !== 'w' || game.isGameOver()) return false;

    const before = new Chess(game.fen());
    const afterPlayerMove = new Chess(game.fen());
    let move = null;

    try {
      move = afterPlayerMove.move({ from, to, promotion: 'q' });
    } catch {
      move = null;
    }

    if (!move) return false;

    setGame(new Chess(afterPlayerMove.fen()));
    setIsComputerThinking(true);

    try {
      const beforeAnalysis = await analyzeFen(before.fen(), 12);
      const afterAnalysis = await analyzeFen(afterPlayerMove.fen(), 12);

      setCoachText(
        explainMove({
          move,
          before,
          after: afterPlayerMove,
          history: before.history(),
          engineBestMoveSan: uciToSan(before, beforeAnalysis.bestMove),
          evalBeforeCp: beforeAnalysis.evaluation,
          evalAfterCp: afterAnalysis.evaluation,
        }),
      );

      if (!afterPlayerMove.isGameOver() && afterAnalysis.bestMove) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        applyUciMove(afterPlayerMove, afterAnalysis.bestMove);
        setGame(new Chess(afterPlayerMove.fen()));
      }
      return true;
    } catch {
      if (!afterPlayerMove.isGameOver()) {
        playFallbackReply(afterPlayerMove);
      }

      setCoachText(
        explainMove({
          move,
          before,
          after: afterPlayerMove,
          history: before.history(),
        }),
      );
      setGame(new Chess(afterPlayerMove.fen()));
      return false;
    } finally {
      setIsComputerThinking(false);
    }
  }

  function resetGame() {
    setGame(new Chess());
    setCoachText(defaultExplanation);
    setIsComputerThinking(false);
  }

  return (
    <main className="page">
      <section className="boardColumn">
        <div className="hero">
          <p className="eyebrow">Skaktræning på dansk</p>
          <h1>SkakCoach</h1>
          <p className="intro">
            Spil med de hvide brikker mod computeren og få korte forklaringer efter hvert træk.
          </p>
        </div>

        <div className="boardPanel">
          <ChessBoard
            position={game.fen()}
            onMove={onPlayerMove}
            disabled={!isReady || isComputerThinking || game.turn() !== 'w' || game.isGameOver()}
          />

          <div className="boardMeta">
            <button className="resetBtn" onClick={resetGame} type="button">
              Nyt parti
            </button>
            {!isReady && <p className="statusNote">Stockfish starter…</p>}
            {isComputerThinking && <p className="thinking">Computeren tænker…</p>}
          </div>
        </div>
      </section>

      <aside className="sideColumn">
        <GameInfo game={game} />
        <CoachPanel {...coachText} />
        <MoveHistory moves={game.history()} />
      </aside>
    </main>
  );
}
