import { Chess } from 'chess.js';
import { getGameStatus, getTurnLabel } from '@/lib/chessHelpers';

export default function GameInfo({ game }: { game: Chess }) {
  const latestMove = game.history().at(-1) ?? 'Ingen træk endnu';

  return (
    <div className="panel">
      <h2>Status</h2>
      <div className="infoGrid">
        <div className="infoRow">
          <span>Parti</span>
          <strong>{getGameStatus(game)}</strong>
        </div>
        <div className="infoRow">
          <span>Tur</span>
          <strong>{getTurnLabel(game)}</strong>
        </div>
        <div className="infoRow">
          <span>Seneste træk</span>
          <strong>{latestMove}</strong>
        </div>
      </div>
    </div>
  );
}
