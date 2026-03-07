import { Chess, type Color, type Move, type PieceSymbol, type Square } from 'chess.js';

const pieceValues: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
const centerSquares = ['d4', 'd5', 'e4', 'e5'] as const;

export function getGameStatus(chess: Chess): string {
  if (chess.isCheckmate()) return 'Skakmat';
  if (chess.isStalemate()) return 'Patt';
  if (chess.isDraw()) return 'Remis';
  if (chess.isCheck()) return 'Skak';
  return 'Partiet er i gang';
}

export function getTurnLabel(chess: Chess): string {
  return chess.turn() === 'w' ? 'Hvid' : 'Sort';
}

export function isCenterSquare(square?: string): boolean {
  if (!square) return false;
  return centerSquares.includes(square as (typeof centerSquares)[number]);
}

export function getMaterialBalance(chess: Chess): number {
  let white = 0;
  let black = 0;

  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece) continue;
      const value = pieceValues[piece.type];
      if (piece.color === 'w') white += value;
      else black += value;
    }
  }

  return white - black;
}

export function countDevelopedMinorPieces(chess: Chess, color: Color): number {
  const starts: Square[] =
    color === 'w' ? ['b1', 'g1', 'c1', 'f1'] : ['b8', 'g8', 'c8', 'f8'];

  let developed = 0;
  for (const square of starts) {
    const piece = chess.get(square);
    if (!piece || piece.color !== color) {
      developed += 1;
    }
  }

  return developed;
}

export function countCenterControl(chess: Chess, color: Color): number {
  const fen = chess.fen().split(' ');
  fen[1] = color;
  const clone = new Chess(fen.join(' '));
  const moves = clone.moves({ verbose: true });
  return moves.filter((move) => isCenterSquare(move.to)).length;
}

function findKingSquare(chess: Chess, color: Color): Square | null {
  const board = chess.board();

  for (let rankIndex = 0; rankIndex < board.length; rankIndex += 1) {
    const row = board[rankIndex];
    for (let fileIndex = 0; fileIndex < row.length; fileIndex += 1) {
      const piece = row[fileIndex];
      if (!piece || piece.type !== 'k' || piece.color !== color) continue;
      return `${files[fileIndex]}${8 - rankIndex}` as Square;
    }
  }

  return null;
}

export function hasCastled(chess: Chess, color: Color): boolean {
  const kingSquare = findKingSquare(chess, color);
  if (color === 'w') return kingSquare === 'g1' || kingSquare === 'c1';
  return kingSquare === 'g8' || kingSquare === 'c8';
}

function isSquareDefended(chess: Chess, square: Square, color: Color): boolean {
  const fen = chess.fen().split(' ');
  fen[1] = color;
  const clone = new Chess(fen.join(' '));
  const moves = clone.moves({ verbose: true });
  return moves.some((move) => move.to === square);
}

export function countHangingPieces(chess: Chess, color: Color): number {
  let hanging = 0;
  const board = chess.board();

  for (let rankIndex = 0; rankIndex < board.length; rankIndex += 1) {
    const row = board[rankIndex];
    for (let fileIndex = 0; fileIndex < row.length; fileIndex += 1) {
      const piece = row[fileIndex];
      if (!piece || piece.color !== color || piece.type === 'k') continue;

      const square = `${files[fileIndex]}${8 - rankIndex}` as Square;
      const attackedByEnemy = isSquareDefended(chess, square, color === 'w' ? 'b' : 'w');
      const defendedByUs = isSquareDefended(chess, square, color);

      if (attackedByEnemy && !defendedByUs) {
        hanging += 1;
      }
    }
  }

  return hanging;
}

export function didCastle(moveSan: string): boolean {
  return moveSan.includes('O-O');
}

export function applyUciMove(chess: Chess, uciMove: string): Move | null {
  if (!uciMove || uciMove === '(none)') return null;

  const from = uciMove.slice(0, 2) as Square;
  const to = uciMove.slice(2, 4) as Square;
  const promotion = uciMove.length > 4 ? (uciMove[4] as PieceSymbol) : undefined;

  try {
    return chess.move({ from, to, promotion });
  } catch {
    return null;
  }
}

export function uciToSan(chess: Chess, uciMove: string): string | undefined {
  const clone = new Chess(chess.fen());
  return applyUciMove(clone, uciMove)?.san;
}
