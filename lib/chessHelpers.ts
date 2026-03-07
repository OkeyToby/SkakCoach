import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js';

const pieceValues: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

export function getGameStatus(chess: Chess): string {
  if (chess.isCheckmate()) return 'Skakmat';
  if (chess.isStalemate()) return 'Patt';
  if (chess.isDraw()) return 'Remis';
  if (chess.isCheck()) return 'Skak';
  return 'Spillet er i gang';
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
  for (const sq of starts) {
    const p = chess.get(sq);
    if (!p || p.color !== color) developed += 1;
  }
  return developed;
}

export function countCenterControl(chess: Chess, color: Color): number {
  const centers = ['d4', 'e4', 'd5', 'e5'];
  const moves = chess.moves({ verbose: true });
  return moves.filter((move) => move.color === color && centers.includes(move.to)).length;
}

function isSquareDefended(chess: Chess, square: Square, color: Color): boolean {
  const fenParts = chess.fen().split(' ');
  fenParts[1] = color;
  const clone = new Chess(fenParts.join(' '));
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
