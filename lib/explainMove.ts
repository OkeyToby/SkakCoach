import { Chess, type Move } from 'chess.js';
import {
  countCenterControl,
  countDevelopedMinorPieces,
  countHangingPieces,
  didCastle,
  getMaterialBalance,
  hasCastled,
  isCenterSquare,
} from './chessHelpers';

export type MoveExplanation = {
  classification: string;
  advantage: string;
  drawback: string;
  betterMove: string;
};

export type ExplainInput = {
  move: Move;
  before: Chess;
  after: Chess;
  history: string[];
  engineBestMoveSan?: string;
  evalBeforeCp?: number | null;
  evalAfterCp?: number | null;
};

function describeEngineIdea(before: Chess, engineBestMoveSan: string): string {
  const clone = new Chess(before.fen());

  let bestMove: Move | null = null;
  try {
    bestMove = clone.move(engineBestMoveSan);
  } catch {
    bestMove = null;
  }

  if (!bestMove) {
    return `${engineBestMoveSan} var stærkere, fordi det holder stillingen mere aktiv.`;
  }

  if (didCastle(bestMove.san)) {
    return `${engineBestMoveSan} var stærkere, fordi du får kongen i sikkerhed.`;
  }

  if (
    (bestMove.piece === 'n' || bestMove.piece === 'b') &&
    countDevelopedMinorPieces(clone, 'w') > countDevelopedMinorPieces(before, 'w')
  ) {
    return `${engineBestMoveSan} var stærkere, fordi du udvikler en officer og gør klar til rokade.`;
  }

  if (isCenterSquare(bestMove.to) || countCenterControl(clone, 'w') > countCenterControl(before, 'w')) {
    return `${engineBestMoveSan} var stærkere, fordi du kæmper mere direkte om centrum.`;
  }

  if (bestMove.san.includes('+')) {
    return `${engineBestMoveSan} var stærkere, fordi du sætter modstanderen under mere pres med det samme.`;
  }

  return `${engineBestMoveSan} var stærkere, fordi det giver dig en mere aktiv plan.`;
}

function classifyMove(evalDrop: number): string {
  if (evalDrop > 220) return 'Stor fejl';
  if (evalDrop > 110) return 'Fejl';
  if (evalDrop > 60) return 'Upræcist';
  return 'Godt træk';
}

export function explainMove(input: ExplainInput): MoveExplanation {
  const { move, before, after, history, engineBestMoveSan, evalBeforeCp, evalAfterCp } = input;
  const moveNumber = history.length + 1;

  const centerBefore = countCenterControl(before, 'w');
  const centerAfter = countCenterControl(after, 'w');

  const devBefore = countDevelopedMinorPieces(before, 'w');
  const devAfter = countDevelopedMinorPieces(after, 'w');

  const hangingBefore = countHangingPieces(before, 'w');
  const hangingAfter = countHangingPieces(after, 'w');

  const materialBefore = getMaterialBalance(before);
  const materialAfter = getMaterialBalance(after);

  const evalDrop =
    typeof evalBeforeCp === 'number' && typeof evalAfterCp === 'number'
      ? evalBeforeCp - evalAfterCp
      : 0;
  const classification = classifyMove(evalDrop);

  let advantage = 'Dit træk holder stillingen i gang, men uden en stor ændring endnu.';
  if (materialAfter > materialBefore) {
    advantage = 'Stærkt: du vinder materiale og gør stillingen lettere at spille.';
  } else if (didCastle(move.san)) {
    advantage = 'Godt valg: du rokkerer og gør kongen mere sikker.';
  } else if (hangingAfter < hangingBefore) {
    advantage = 'Fint: du får styr på en udsat brik og gør stillingen sundere.';
  } else if (move.san.includes('+')) {
    advantage = 'Aktivt træk: du giver skak og tvinger modstanderen til at reagere.';
  } else if ((move.piece === 'n' || move.piece === 'b') && devAfter > devBefore) {
    advantage = 'God idé: du udvikler en officer og får mere aktivitet.';
  } else if (centerAfter > centerBefore || isCenterSquare(move.to)) {
    advantage = 'Fint træk: du kæmper om centrum, og det er ofte nøglen til en god stilling.';
  } else if (move.piece === 'p' && (move.to === 'e4' || move.to === 'd4')) {
    advantage = 'God plan: bonden tager plads i centrum og giver dine brikker bedre felter.';
  } else if (evalDrop < -60) {
    advantage = 'Engine kan godt lide idéen: du holder tryk og gør stillingen mere behagelig.';
  }

  let drawback = 'Det er svært at se en stor konkret ulempe ved trækket.';
  if (hangingAfter > hangingBefore) {
    drawback = 'Pas på: du efterlader en brik uden nok støtte.';
  } else if (evalDrop > 220) {
    drawback = 'Du overser en taktisk mulighed hos modstanderen, og stillingen glider hurtigt.';
  } else if (evalDrop > 110) {
    drawback = 'Det træk giver modstanderen bedre spil og du mister noget kontrol.';
  } else if (evalDrop > 60) {
    drawback = 'Trækket er spilbart, men modstanderen får lidt nemmere spil.';
  } else if (moveNumber <= 10 && move.piece === 'q') {
    drawback = 'Tidlig dronningeudvikling kan koste tempo, fordi modstanderen kan angribe den og udvikle sig samtidig.';
  } else if (move.piece === 'p' && (move.to === 'f3' || move.to === 'f4' || move.to === 'f6' || move.to === 'f5')) {
    drawback = 'Det træk kan svække felterne foran kongen og gøre kongestillingen mere sårbar.';
  } else if (!didCastle(move.san) && !hasCastled(after, 'w') && moveNumber >= 8 && devAfter === devBefore) {
    drawback = 'Din konge står stadig i centrum, og du fik ikke samtidig udviklet nok.';
  } else if (devAfter === devBefore && centerAfter <= centerBefore && !move.san.includes('+')) {
    drawback = 'Trækket er lidt passivt og hjælper ikke meget med udvikling eller centrum.';
  }

  let betterMove = 'Overvej et træk der udvikler en officer, kæmper om centrum eller hjælper dig med at rokere.';
  if (engineBestMoveSan) {
    betterMove = describeEngineIdea(before, engineBestMoveSan);
  } else if (hangingAfter > hangingBefore) {
    betterMove = 'En bedre mulighed var at dække din udsatte brik først og holde stillingen samlet.';
  } else if (!hasCastled(after, 'w') && moveNumber >= 8) {
    betterMove = 'Tænk på kongesikkerhed nu: en udvikling mod hurtig rokade ville ofte være sundere.';
  } else if (devAfter === devBefore) {
    betterMove = 'Se efter et træk der udvikler springer eller løber og sætter flere brikker i spil.';
  } else if (centerAfter <= centerBefore) {
    betterMove = 'Prøv at følge op med mere plads i centrum, så dine brikker får flere aktive felter.';
  }

  return {
    classification,
    advantage,
    drawback,
    betterMove,
  };
}
