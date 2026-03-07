import { Chess } from 'chess.js';
import {
  countCenterControl,
  countDevelopedMinorPieces,
  countHangingPieces,
  didCastle,
  getMaterialBalance,
} from './chessHelpers';

export type MoveExplanation = {
  advantage: string;
  disadvantage: string;
  betterOption: string;
};

export type ExplainInput = {
  before: Chess;
  after: Chess;
  moveSan: string;
  engineBestMoveSan?: string;
  evalBeforeCp?: number;
  evalAfterCp?: number;
};

export function explainMove(input: ExplainInput): MoveExplanation {
  const { before, after, moveSan, engineBestMoveSan, evalBeforeCp, evalAfterCp } = input;

  const centerBefore = countCenterControl(before, 'w');
  const centerAfter = countCenterControl(after, 'w');

  const devBefore = countDevelopedMinorPieces(before, 'w');
  const devAfter = countDevelopedMinorPieces(after, 'w');

  const hangBefore = countHangingPieces(before, 'w');
  const hangAfter = countHangingPieces(after, 'w');

  const materialBefore = getMaterialBalance(before);
  const materialAfter = getMaterialBalance(after);

  const evalDrop =
    typeof evalBeforeCp === 'number' && typeof evalAfterCp === 'number'
      ? evalBeforeCp - evalAfterCp
      : 0;

  let advantage = 'Du holder stillingen stabil og giver ikke lette chancer væk.';
  if (devAfter > devBefore) {
    advantage = 'Godt valg: Du udvikler en officer og får bedre aktivitet.';
  } else if (centerAfter > centerBefore) {
    advantage = 'Stærkt: Du øger kontrollen over centrum.';
  } else if (didCastle(moveSan)) {
    advantage = 'Flot: Du rokkerer tidligt og forbedrer kongesikkerheden.';
  } else if (materialAfter > materialBefore) {
    advantage = 'Du vinder materiale, hvilket ofte giver en mere behagelig stilling.';
  } else if (moveSan.includes('+')) {
    advantage = 'Du sætter pres med skak og tvinger modstanderen til at reagere.';
  }

  let disadvantage = 'Trækket har ingen tydelig stor svaghed i den nuværende stilling.';
  if (hangAfter > hangBefore) {
    disadvantage = 'Ulempe: Du efterlader en brik hængende uden tilstrækkeligt forsvar.';
  } else if (evalDrop > 120) {
    disadvantage = 'Det træk giver modstanderen bedre spil og du mister noget kontrol.';
  } else if (evalDrop > 70) {
    disadvantage = 'Du overser en taktisk mulighed hos modstanderen, så initiativet glider lidt.';
  } else if (devAfter === devBefore && (moveSan.startsWith('a') || moveSan.startsWith('h'))) {
    disadvantage = 'Trækket er lidt passivt og hjælper ikke meget med udvikling eller centrum.';
  }

  let betterOption = engineBestMoveSan
    ? `En bedre mulighed var ${engineBestMoveSan}, som giver mere aktivt spil.`
    : 'Kig efter et mere aktivt træk i centrum eller et træk der udvikler dine officerer.';

  if (evalDrop > 150) {
    betterOption = engineBestMoveSan
      ? `Prøv i stedet ${engineBestMoveSan}. Det begrænser modstanderens chancer og holder dig mere sikker.`
      : 'Prøv et træk der dækker dine udsatte brikker og holder kongen mere sikker.';
  }

  return { advantage, disadvantage, betterOption };
}
