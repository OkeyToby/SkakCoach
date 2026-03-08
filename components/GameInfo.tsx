import { Chess, type Color } from 'chess.js';
import { getGameStatus, getTurnLabel } from '@/lib/chessHelpers';

type SideChoice = 'white' | 'black' | 'random';

type Props = {
  game: Chess;
  playerColor: Color;
  sideChoice: SideChoice;
  onSideChange: (side: SideChoice) => void;
};

const sideOptions: Array<{ value: SideChoice; label: string }> = [
  { value: 'white', label: 'Hvid' },
  { value: 'black', label: 'Sort' },
  { value: 'random', label: 'Tilfældig' },
];

export default function GameInfo({ game, playerColor, sideChoice, onSideChange }: Props) {
  const latestMove = game.history().at(-1) ?? 'Ingen træk endnu';
  const playerColorLabel = playerColor === 'w' ? 'Hvid' : 'Sort';
  const sideHint =
    sideChoice === 'random'
      ? `Tilfældig side er valgt. Du spiller ${playerColorLabel.toLowerCase()} i dette parti.`
      : `Du spiller ${playerColorLabel.toLowerCase()} i dette parti.`;

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
          <strong>{getTurnLabel(game.turn(), playerColor)}</strong>
        </div>
        <div className="infoRow">
          <span>Seneste træk</span>
          <strong>{latestMove}</strong>
        </div>
      </div>

      <p className="sideHint">{sideHint}</p>
      <div className="sideChooser" role="group" aria-label="Vælg side">
        {sideOptions.map((option) => (
          <button
            key={option.value}
            className={`sideOption${sideChoice === option.value ? ' sideOptionActive' : ''}`}
            onClick={() => onSideChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
