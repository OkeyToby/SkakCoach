'use client';

import { Chessboard } from 'react-chessboard';

type ChessBoardProps = {
  position: string;
  onPieceDrop: (source: string, target: string) => boolean | Promise<boolean>;
  boardWidth?: number;
};

export default function ChessBoard({ position, onPieceDrop, boardWidth }: ChessBoardProps) {
  return (
    <div className="board-card">
      <Chessboard
        id="skakcoach-board"
        position={position}
        onPieceDrop={onPieceDrop as (source: string, target: string) => boolean}
        boardOrientation="white"
        customDarkSquareStyle={{ backgroundColor: '#678fb1' }}
        customLightSquareStyle={{ backgroundColor: '#eaf1f6' }}
        arePiecesDraggable
        boardWidth={boardWidth}
      />
    </div>
  );
}
