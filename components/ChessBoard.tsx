'use client';

import { useEffect, useRef, useState } from 'react';
import { Chessboard } from 'react-chessboard';

type Props = {
  position: string;
  onMove: (from: string, to: string) => Promise<boolean> | boolean;
  disabled?: boolean;
};

export default function ChessBoard({ position, onMove, disabled = false }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [boardWidth, setBoardWidth] = useState(560);

  useEffect(() => {
    const node = wrapRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.max(300, Math.min(720, Math.floor(entry.contentRect.width)));
      setBoardWidth(width);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="boardWrap" ref={wrapRef}>
      <Chessboard
        id="SkakCoachBoard"
        position={position}
        boardOrientation="white"
        boardWidth={boardWidth}
        arePiecesDraggable={!disabled}
        customDarkSquareStyle={{ backgroundColor: '#8ea1b5' }}
        customLightSquareStyle={{ backgroundColor: '#f3efe6' }}
        onPieceDrop={(sourceSquare, targetSquare) => {
          if (!targetSquare || disabled) return false;
          void onMove(sourceSquare, targetSquare);
          return true;
        }}
      />
    </div>
  );
}
