import { Chess } from 'chess.js';
import ChessBoard from '@/components/ChessBoard';

type Props = {
  fen: string;
  disabled?: boolean;
  onMove: (from: string, to: string) => Promise<boolean> | boolean;
};

export default function PuzzleBoard({ fen, disabled = false, onMove }: Props) {
  const turnLabel = new Chess(fen).turn() === 'w' ? 'Hvid' : 'Sort';

  return (
    <div className="surfaceCard puzzleBoardCard">
      <div className="puzzleBoardHeader">
        <div>
          <span className="cardEyebrow">Aktuel stilling</span>
          <h3 className="cardTitle">Find bedste træk</h3>
        </div>
        <span className="cardBadge">{turnLabel} trækker</span>
      </div>
      <ChessBoard position={fen} onMove={onMove} disabled={disabled} />
    </div>
  );
}
