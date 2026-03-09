'use client';

import type { Color } from 'chess.js';
import Button from '@/components/ui/Button';

type SideChoice = 'white' | 'black' | 'random';

type Props = {
  coachStatus: string;
  hasStarted: boolean;
  isReady: boolean;
  isComputerThinking: boolean;
  lockedSideReason?: string | null;
  openingStatus?: string | null;
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

function getPlayerColorLabel(playerColor: Color): string {
  return playerColor === 'w' ? 'hvid' : 'sort';
}

function getSideStatusLabel(
  hasStarted: boolean,
  playerColorLabel: string,
  sideChoice: SideChoice,
): string {
  if (hasStarted) {
    return `Du spiller ${playerColorLabel}`;
  }

  if (sideChoice === 'random') {
    return 'Siden vælges ved start';
  }

  return `Du starter som ${playerColorLabel}`;
}

export default function PlayControlBar({
  coachStatus,
  hasStarted,
  isReady,
  isComputerThinking,
  lockedSideReason,
  openingStatus,
  playerColor,
  sideChoice,
  onSideChange,
  onStartGame,
}: Props) {
  const playerColorLabel = getPlayerColorLabel(playerColor);
  const startLabel = hasStarted ? 'Nyt parti' : 'Start parti';
  const sideStatusLabel = getSideStatusLabel(hasStarted, playerColorLabel, sideChoice);

  return (
    <div className="panel playControlBar">
      <div className="playControlBarTop">
        <div className="playControlBarIntro">
          <span className="sectionEyebrow">Klar ved brættet</span>
          <h2>{hasStarted ? `Du spiller ${playerColorLabel}` : 'Start direkte ved brættet'}</h2>
          <p>
            {lockedSideReason
              ? 'Åbningen låser din side. Start partiet herfra og bliv ved brættet.'
              : 'Vælg side og start partiet uden at lede i sidepanelet.'}
          </p>
        </div>

        <Button
          className="playControlBarButton"
          disabled={!isReady || isComputerThinking}
          onClick={onStartGame}
          size="stor"
          type="button"
        >
          {startLabel}
        </Button>
      </div>

      <div className="playControlMeta">
        <span className={`playStatusPill${isReady ? '' : ' playStatusPillMuted'}`}>
          {isReady ? 'Stockfish klar' : 'Stockfish starter'}
        </span>
        <span className="playStatusPill">{coachStatus}</span>
        <span className="playStatusPill">{sideStatusLabel}</span>
        {openingStatus ? <span className="playStatusPill playStatusPillTheory">{openingStatus}</span> : null}
      </div>

      {lockedSideReason ? (
        <div className="openingLockNote playControlLockNote">
          <strong>Siden er låst af åbningen</strong>
          <p>{lockedSideReason}</p>
        </div>
      ) : (
        <div className="playControlSideChooser" role="group" aria-label="Vælg side">
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
      )}
    </div>
  );
}
