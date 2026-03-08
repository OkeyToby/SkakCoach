import { Chess, type Color } from 'chess.js';
import { getGameStatus, getTurnLabel } from '@/lib/chessHelpers';

type SideChoice = 'white' | 'black' | 'random';

type Props = {
  game: Chess;
  hasStarted: boolean;
  isReady: boolean;
  isComputerThinking: boolean;
  playerColor: Color;
  sideChoice: SideChoice;
  onSideChange: (side: SideChoice) => void;
  onStartGame: () => void;
};

const sideOptions: Array<{ value: SideChoice; label: string }> = [
  { value: 'white', label: 'Hvid' },
  { value: 'black', label: 'Sort' },
  { value: 'random', label: 'Tilfældig' },
];

export default function GameInfo({
  game,
  hasStarted,
  isReady,
  isComputerThinking,
  playerColor,
  sideChoice,
  onSideChange,
  onStartGame,
}: Props) {
  const latestMove = game.history().at(-1) ?? 'Ingen træk endnu';
  const playerColorLabel = playerColor === 'w' ? 'Hvid' : 'Sort';
  const sideHint = hasStarted
    ? sideChoice === 'random'
      ? `Tilfældig side blev valgt. Du spiller ${playerColorLabel.toLowerCase()} i dette parti.`
      : `Du spiller ${playerColorLabel.toLowerCase()} i dette parti.`
    : sideChoice === 'random'
      ? 'Tilfældig side vælges, når du trykker Start parti.'
      : `Du starter som ${playerColorLabel.toLowerCase()}, når du trykker Start parti.`;
  const statusLabel = hasStarted ? getGameStatus(game) : 'Klar til start';
  const turnLabel = hasStarted ? getTurnLabel(game.turn(), playerColor) : 'Venter på start';

  return (
    <div className="panel">
      <h2>Status</h2>
      <div className="infoGrid">
        <div className="infoRow">
          <span>Parti</span>
          <strong>{statusLabel}</strong>
        </div>
        <div className="infoRow">
          <span>Tur</span>
          <strong>{turnLabel}</strong>
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

      <button className="resetBtn startBtn" disabled={!isReady || isComputerThinking} onClick={onStartGame} type="button">
        {hasStarted ? 'Nyt parti' : 'Start parti'}
      </button>
    </div>
  );
}
