import { Chess, type Color, type Move } from 'chess.js';
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

export type PreMoveCoach = {
  suggestedMoves: string[];
  summary: string;
  plan: string;
  caution: string;
};

export type ExplainInput = {
  move: Move;
  before: Chess;
  after: Chess;
  history: string[];
  historyVerbose?: Move[];
  playerColor: Color;
  engineBestMoveSan?: string;
  opponentBestReplySan?: string;
  evalBeforeCp?: number | null;
  evalAfterCp?: number | null;
};

export type PreMoveInput = {
  position: Chess;
  playerColor: Color;
  suggestedMoves: string[];
};

function getPerspectiveScore(score: number | null | undefined, playerColor: Color): number | undefined {
  if (typeof score !== 'number') return undefined;
  return playerColor === 'w' ? score : -score;
}

function normalizeSan(san: string): string {
  return san.replace(/[+#?!]/g, '');
}

function getOpeningPlan(history: string[], playerColor: Color): string | null {
  const moves = history.map(normalizeSan);
  const first = moves[0];
  const second = moves[1];

  if (first === 'e4' && second === 'e5' && moves.includes('Bc4')) {
    return 'Det ligner Italiensk åbning. Typisk følger Sf3, hurtig rokade og pres i centrum med c3 eller d4.';
  }

  if (first === 'e4' && second === 'e5' && moves.includes('Bb5')) {
    return 'Det ligner Spansk åbning. Fortsæt med udvikling, rokade og pres mod centrum.';
  }

  if (first === 'e4' && second === 'c5') {
    return playerColor === 'w'
      ? 'Du møder Siciliansk. Typisk er Sf3 og d4 den aktive plan.'
      : 'Du vælger Siciliansk. Typisk følger ...d6, ...Sf6 og kamp om d4.';
  }

  if (first === 'e4' && second === 'c6') {
    return 'Det ligner Caro-Kann. Hold centrum sundt og udvikl officererne roligt.';
  }

  if (first === 'd4' && second === 'd5' && moves.includes('c4')) {
    return 'Det ligner Dronningegambit. Planen er ofte udvikling med Sf3, Sc3 og langsomt pres i centrum.';
  }

  return null;
}

function isRepeatedPieceMove(move: Move, historyVerbose: Move[], playerColor: Color): boolean {
  if (historyVerbose.length === 0) return false;

  return historyVerbose.some(
    (entry) => entry.color === playerColor && entry.piece === move.piece && entry.to === move.from,
  );
}

function describeOpponentTactic(opponentBestReplySan?: string): string | null {
  if (!opponentBestReplySan) return null;
  if (opponentBestReplySan.includes('+')) {
    return `Du overser en taktisk mulighed for modstanderen, fx ${opponentBestReplySan}, som giver skak og presser din stilling.`;
  }

  if (opponentBestReplySan.includes('x')) {
    return `Du overser et konkret modsvar, fx ${opponentBestReplySan}, der ser ud til at vinde materiale.`;
  }

  return `Modstanderen får et stærkt modsvar, fx ${opponentBestReplySan}, som forbedrer deres spil mærkbart.`;
}

function describeEngineIdea(before: Chess, engineBestMoveSan: string, playerColor: Color): string {
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
    countDevelopedMinorPieces(clone, playerColor) > countDevelopedMinorPieces(before, playerColor)
  ) {
    return `${engineBestMoveSan} var stærkere, fordi du udvikler en officer og gør klar til rokade.`;
  }

  if (
    isCenterSquare(bestMove.to) ||
    countCenterControl(clone, playerColor) > countCenterControl(before, playerColor)
  ) {
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
  const {
    move,
    before,
    after,
    history,
    historyVerbose = [],
    playerColor,
    engineBestMoveSan,
    opponentBestReplySan,
    evalBeforeCp,
    evalAfterCp,
  } = input;
  const moveNumber = history.length + 1;
  const fullHistory = [...history, move.san];
  const openingPlan = getOpeningPlan(fullHistory, playerColor);
  const repeatedPieceMove = moveNumber <= 12 && isRepeatedPieceMove(move, historyVerbose, playerColor);

  const centerBefore = countCenterControl(before, playerColor);
  const centerAfter = countCenterControl(after, playerColor);

  const devBefore = countDevelopedMinorPieces(before, playerColor);
  const devAfter = countDevelopedMinorPieces(after, playerColor);

  const hangingBefore = countHangingPieces(before, playerColor);
  const hangingAfter = countHangingPieces(after, playerColor);

  const materialBefore =
    playerColor === 'w' ? getMaterialBalance(before) : -getMaterialBalance(before);
  const materialAfter =
    playerColor === 'w' ? getMaterialBalance(after) : -getMaterialBalance(after);

  const evalBefore = getPerspectiveScore(evalBeforeCp, playerColor);
  const evalAfter = getPerspectiveScore(evalAfterCp, playerColor);
  const evalDrop =
    typeof evalBefore === 'number' && typeof evalAfter === 'number'
      ? evalBefore - evalAfter
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
  } else if (move.piece === 'p' && (move.to === 'e4' || move.to === 'd4' || move.to === 'e5' || move.to === 'd5')) {
    advantage = 'God plan: bonden tager plads i centrum og giver dine brikker bedre felter.';
  } else if (openingPlan && moveNumber <= 6) {
    advantage = `Du følger en sund åbningsidé. ${openingPlan}`;
  } else if (evalDrop < -60) {
    advantage = 'Engine kan godt lide idéen: du holder tryk og gør stillingen mere behagelig.';
  }

  let drawback = 'Det er svært at se en stor konkret ulempe ved trækket.';
  if (hangingAfter > hangingBefore) {
    drawback = 'Pas på: du efterlader en brik uden nok støtte.';
  } else if (evalDrop > 220) {
    drawback =
      describeOpponentTactic(opponentBestReplySan) ??
      'Du overser en taktisk mulighed hos modstanderen, og stillingen glider hurtigt.';
  } else if (evalDrop > 160) {
    drawback =
      describeOpponentTactic(opponentBestReplySan) ??
      'Det her giver modstanderen en meget konkret mulighed for at overtage initiativet.';
  } else if (evalDrop > 110) {
    drawback = 'Det træk giver modstanderen bedre spil og du mister noget kontrol.';
  } else if (evalDrop > 60) {
    drawback = 'Trækket er spilbart, men modstanderen får lidt nemmere spil.';
  } else if (evalDrop > 20) {
    drawback = 'Der var en lidt mere præcis måde at holde presset på i stillingen.';
  } else if (repeatedPieceMove) {
    drawback = 'Du bruger et ekstra tempo på den samme brik i stedet for at få flere brikker med i spil.';
  } else if (moveNumber <= 10 && move.piece === 'q') {
    drawback = 'Tidlig dronningeudvikling kan koste tempo, fordi modstanderen kan angribe den og udvikle sig samtidig.';
  } else if (move.piece === 'p' && ['f3', 'f4', 'f5', 'f6'].includes(move.to)) {
    drawback = 'Det træk kan svække felterne foran kongen og gøre kongestillingen mere sårbar.';
  } else if (!didCastle(move.san) && !hasCastled(after, playerColor) && moveNumber >= 8 && devAfter === devBefore) {
    drawback = 'Din konge står stadig i centrum, og du fik ikke samtidig udviklet nok.';
  } else if (devAfter === devBefore && centerAfter <= centerBefore && !move.san.includes('+')) {
    drawback = 'Trækket er lidt passivt og hjælper ikke meget med udvikling eller centrum.';
  }

  let betterMove = 'Overvej et træk der udvikler en officer, kæmper om centrum eller hjælper dig med at rokere.';
  if (engineBestMoveSan) {
    betterMove = describeEngineIdea(before, engineBestMoveSan, playerColor);
    if (openingPlan && moveNumber <= 8) {
      betterMove = `${betterMove} ${openingPlan}`;
    }
  } else if (repeatedPieceMove) {
    betterMove = 'Det var ofte bedre at udvikle en ny brik i stedet for at flytte den samme igen.';
  } else if (hangingAfter > hangingBefore) {
    betterMove = 'En bedre mulighed var at dække din udsatte brik først og holde stillingen samlet.';
  } else if (openingPlan && moveNumber <= 8) {
    betterMove = openingPlan;
  } else if (!hasCastled(after, playerColor) && moveNumber >= 8) {
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

export function buildPreMoveCoach(input: PreMoveInput): PreMoveCoach {
  const { position, playerColor, suggestedMoves } = input;
  const openingPlan = getOpeningPlan(position.history(), playerColor);

  const developedPieces = countDevelopedMinorPieces(position, playerColor);
  const centerControl = countCenterControl(position, playerColor);
  const hangingPieces = countHangingPieces(position, playerColor);
  const kingSafe = hasCastled(position, playerColor);

  let summary = 'Jeg analyserer stadig stillingen.';
  if (suggestedMoves.length > 0) {
    summary = `Bedste træk lige nu: ${suggestedMoves.join(', ')}.`;
  }

  let plan = 'Udvikl dine officerer og hold øje med centrum.';
  if (hangingPieces > 0) {
    plan = 'Få først styr på den udsatte brik, så du ikke giver modstanderen en gratis mulighed.';
  } else if (!kingSafe && developedPieces >= 2) {
    plan = 'Du er klar til at tænke på rokade og kongesikkerhed.';
  } else if (centerControl < 2) {
    plan = 'Prøv at tage mere plads i centrum med bønder eller aktive officerer.';
  } else if (developedPieces < 2) {
    plan = 'Fortsat udvikling er vigtigere end passive ventetræk her.';
  } else {
    plan = 'Se efter aktive træk mod centrum eller modstanderens konge.';
  }

  if (openingPlan && position.history().length <= 8) {
    plan = openingPlan;
  }

  let caution = 'Undgå passive træk, der ikke forbedrer dine brikker.';
  if (hangingPieces > 0) {
    caution = 'Pas på: mindst en af dine brikker mangler støtte.';
  } else if (!kingSafe && developedPieces >= 2) {
    caution = 'Hvis kongen bliver stående i centrum for længe, kan stillingen hurtigt blive ubehagelig.';
  } else if (centerControl === 0) {
    caution = 'Hvis du helt slipper centrum, får modstanderen for let spil.';
  }

  return {
    suggestedMoves,
    summary,
    plan,
    caution,
  };
}
