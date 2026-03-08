import { Chess, type Color } from 'chess.js';
import AccordionPanel from '@/components/AccordionPanel';
import { getGameStatus, getTurnLabel } from '@/lib/chessHelpers';

type Props = {
  game: Chess;
  hasStarted: boolean;
  playerColor: Color;
  openingName?: string | null;
};

export default function GameInfo({
  game,
  hasStarted,
  playerColor,
  openingName,
}: Props) {
  const latestMove = game.history().at(-1) ?? 'Ingen træk endnu';
  const playerColorLabel = playerColor === 'w' ? 'Hvid' : 'Sort';
  const statusLabel = hasStarted ? getGameStatus(game) : 'Klar til start';
  const turnLabel = hasStarted ? getTurnLabel(game.turn(), playerColor) : 'Venter på start';

  return (
    <AccordionPanel
      defaultOpen={true}
      summaryValue={hasStarted ? turnLabel : 'Klar til start'}
      title="Partiinfo"
    >
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
        <div className="infoRow">
          <span>Din side</span>
          <strong>{playerColorLabel}</strong>
        </div>
        {openingName ? (
          <div className="infoRow">
            <span>Åbning</span>
            <strong>{openingName}</strong>
          </div>
        ) : null}
      </div>
    </AccordionPanel>
  );
}
