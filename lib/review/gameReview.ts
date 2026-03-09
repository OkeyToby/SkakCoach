import { Chess, type Color, type Move } from 'chess.js';
import type { Opening } from '@/data/openings/openings';
import { didCastle } from '@/lib/chessHelpers';
import { getOpeningTheoryBreakdown } from '@/lib/openings/openingTheoryHelpers';
import { XP_PER_GAME, XP_PER_WIN_BONUS } from '@/lib/profile/profileHelpers';

export type PlayerMoveReviewRecord = {
  ply: number;
  san: string;
  classification: string;
  evalBeforeCp: number | null;
  evalAfterCp: number | null;
  engineBestMoveSan?: string;
  opponentBestReplySan?: string;
};

export type AfterGameReview = {
  openingName: string | null;
  playerWon: boolean;
  resultDetail: string;
  resultLabel: string;
  resultTone: 'win' | 'loss' | 'draw';
  takeaways: string[];
  theoryExitLabel: string | null;
  theoryLabel: string | null;
  theorySummary: string | null;
  turningPointDescription: string;
  turningPointTitle: string;
  xpGained: number;
};

type BuildAfterGameReviewInput = {
  game: Chess;
  historyVerbose: Move[];
  opening?: Opening;
  playerColor: Color;
  playerMoveReviews: PlayerMoveReviewRecord[];
};

type ResultSummary = {
  playerWon: boolean;
  resultDetail: string;
  resultLabel: string;
  resultTone: AfterGameReview['resultTone'];
};

type TheorySummary = {
  theoryExitLabel: string | null;
  theoryLabel: string;
  theorySummary: string;
};

function getPerspectiveScore(score: number | null | undefined, playerColor: Color): number | null {
  if (typeof score !== 'number') {
    return null;
  }

  return playerColor === 'w' ? score : -score;
}

function getEvalDropCp(record: PlayerMoveReviewRecord, playerColor: Color): number | null {
  const before = getPerspectiveScore(record.evalBeforeCp, playerColor);
  const after = getPerspectiveScore(record.evalAfterCp, playerColor);

  if (before === null || after === null) {
    return null;
  }

  return Math.max(0, before - after);
}

function getClassificationRank(classification: string): number {
  if (classification === 'Stor fejl') return 3;
  if (classification === 'Fejl') return 2;
  if (classification === 'Upræcist') return 1;
  return 0;
}

function formatMoveLabel(ply: number, san: string): string {
  const moveNumber = Math.ceil(ply / 2);
  return ply % 2 === 1 ? `${moveNumber}. ${san}` : `${moveNumber}... ${san}`;
}

function getResultSummary(game: Chess, playerColor: Color): ResultSummary {
  if (game.isCheckmate()) {
    const playerWon = game.turn() !== playerColor;

    return playerWon
      ? {
          playerWon: true,
          resultDetail: 'Du vandt partiet ved skakmat.',
          resultLabel: 'Sejr',
          resultTone: 'win',
        }
      : {
          playerWon: false,
          resultDetail: 'Du tabte partiet ved skakmat.',
          resultLabel: 'Nederlag',
          resultTone: 'loss',
        };
  }

  if (game.isStalemate()) {
    return {
      playerWon: false,
      resultDetail: 'Partiet endte i patt.',
      resultLabel: 'Remis',
      resultTone: 'draw',
    };
  }

  if (game.isDraw()) {
    return {
      playerWon: false,
      resultDetail: 'Partiet endte remis.',
      resultLabel: 'Remis',
      resultTone: 'draw',
    };
  }

  return {
    playerWon: false,
    resultDetail: 'Partiet er slut.',
    resultLabel: 'Afsluttet',
    resultTone: 'draw',
  };
}

function buildTheorySummary(opening: Opening, historyVerbose: Move[]): TheorySummary {
  const theory = getOpeningTheoryBreakdown(opening, historyVerbose);
  const theoryExitLabel =
    theory.firstLeftTheoryPly && theory.firstLeftTheoryMoveSan
      ? formatMoveLabel(theory.firstLeftTheoryPly, theory.firstLeftTheoryMoveSan)
      : null;

  if (theory.isComplete) {
    return {
      theoryExitLabel: null,
      theoryLabel: 'Hele starterlinjen',
      theorySummary: `Du kom gennem hele starterlinjen i ${opening.name} og gik derefter over i frit spil.`,
    };
  }

  if (theory.hasLeftTheory) {
    return {
      theoryExitLabel,
      theoryLabel: `${theory.matchedMoves}/${theory.totalMoves} kendte halvtræk`,
      theorySummary: theoryExitLabel
        ? `Du fulgte teorien i ${theory.matchedMoves} af ${theory.totalMoves} kendte halvtræk. Afvigelsen kom ved ${theoryExitLabel}.`
        : `Du forlod teorien efter ${theory.matchedMoves} kendte halvtræk.`,
    };
  }

  return {
    theoryExitLabel: null,
    theoryLabel: `${theory.matchedMoves}/${theory.totalMoves} kendte halvtræk`,
    theorySummary: `Partiet sluttede, mens du stadig fulgte teorien: ${theory.matchedMoves} af ${theory.totalMoves} kendte halvtræk sad.`,
  };
}

function describeTurningPoint(
  record: PlayerMoveReviewRecord,
  playerColor: Color,
): { title: string; description: string } {
  const moveLabel = formatMoveLabel(record.ply, record.san);
  const evalDrop = getEvalDropCp(record, playerColor);
  const classificationRank = getClassificationRank(record.classification);

  let description = '';

  if (classificationRank >= 3 || (typeof evalDrop === 'number' && evalDrop >= 220)) {
    description = 'Her tabte du mest terræn, og modstanderen fik tydeligt overtaget.';
  } else if (classificationRank >= 2 || (typeof evalDrop === 'number' && evalDrop >= 110)) {
    description = 'Her gled stillingen mærkbart væk fra dig, og modstanderen fik lettere spil.';
  } else {
    description = 'Her begyndte partiet at skifte retning, og dine næste beslutninger blev sværere.';
  }

  if (record.opponentBestReplySan) {
    description = `${description} Modstanderen kunne straks svare med ${record.opponentBestReplySan}.`;
  }

  if (record.engineBestMoveSan && record.engineBestMoveSan !== record.san) {
    description = `${description} Et roligere valg var ${record.engineBestMoveSan}.`;
  }

  return {
    title: moveLabel,
    description,
  };
}

function buildFallbackTurningPoint(
  opening: Opening | undefined,
  result: ResultSummary,
  theorySummary: TheorySummary | null,
): { title: string; description: string } {
  if (theorySummary?.theoryExitLabel) {
    return {
      title: theorySummary.theoryExitLabel,
      description:
        'Her sluttede den kendte teori. Fra det punkt handlede partiet mere om plan, struktur og regning end om husket åbning.',
    };
  }

  if (opening && theorySummary?.theoryLabel === 'Hele starterlinjen') {
    return {
      title: opening.name,
      description:
        'Du kom rent gennem starterlinjen. Det vigtigste læringspunkt ligger derfor i overgangen til det frie midtspil.',
    };
  }

  if (result.playerWon) {
    return {
      title: 'Du holdt kursen',
      description:
        'Der var ikke ét enkelt fejltrin, som definerede partiet. Du vandt i stedet ved at holde kursen og give modstanderen de svære valg.',
    };
  }

  if (result.resultTone === 'draw') {
    return {
      title: 'Balancen holdt',
      description:
        'Ingen enkelt fejl afgjorde partiet. Stillingen gled i stedet over i en balance, hvor begge sider holdt stand.',
    };
  }

  return {
    title: 'Presset byggede sig op',
    description:
      'Der var ikke ét enkelt katastrofetræk, men flere små beslutninger gjorde stillingen gradvist sværere at holde.',
  };
}

function buildTakeaways(
  game: Chess,
  historyVerbose: Move[],
  opening: Opening | undefined,
  playerColor: Color,
  playerMoveReviews: PlayerMoveReviewRecord[],
  result: ResultSummary,
  theorySummary: TheorySummary | null,
  keyRecord: PlayerMoveReviewRecord | null,
): string[] {
  const takeaways: string[] = [];
  const addTakeaway = (value: string) => {
    if (!takeaways.includes(value) && takeaways.length < 3) {
      takeaways.push(value);
    }
  };

  if (opening && theorySummary) {
    if (theorySummary.theoryExitLabel) {
      addTakeaway(
        `Afvigelsen kom ved ${theorySummary.theoryExitLabel}. Hav en enkel plan klar dérfra: udvikling, centrum og kongesikkerhed.`,
      );
    } else if (theorySummary.theoryLabel === 'Hele starterlinjen') {
      addTakeaway(
        `Du kom gennem hele starterlinjen i ${opening.name}. Næste skridt er at kende den første plan lige efter teorien.`,
      );
    } else {
      addTakeaway(
        'Partiet sluttede, mens du stadig fulgte teorien. Det viser, at de første træk er ved at sidde fast.',
      );
    }
  } else if (result.playerWon) {
    addTakeaway('Du kom fint ud af åbningen. Det gav dig arbejdsro til resten af partiet.');
  } else if (game.isDraw()) {
    addTakeaway('Åbningen gav ingen afgørende fordel, men du holdt stillingen solid nok til at sikre remis.');
  } else {
    addTakeaway(
      'Brug de første træk på udvikling, centrum og kongesikkerhed, før du jagter mere konkrete idéer.',
    );
  }

  const inaccurateMoves = playerMoveReviews.filter(
    (record) => getClassificationRank(record.classification) > 0,
  ).length;
  if (keyRecord && getClassificationRank(keyRecord.classification) >= 2) {
    addTakeaway(
      `Det vigtigste læringspunkt er at dobbelttjekke modtræk og taktiske svar før ${formatMoveLabel(keyRecord.ply, keyRecord.san)}.`,
    );
  } else if (inaccurateMoves >= 2) {
    addTakeaway('Der var flere upræcise træk. Sænk tempoet lidt i de stillinger, hvor planen begynder at skifte retning.');
  } else if (result.resultTone === 'draw') {
    addTakeaway('Du holdt de største fejl væk. Kig især efter ét sted, hvor du kunne have skabt lidt mere aktivitet.');
  } else {
    addTakeaway('Du holdt fejlprocenten nede i store dele af partiet. Det er et stærkt udgangspunkt for næste træningsrunde.');
  }

  const playerCastled = historyVerbose.some(
    (move) => move.color === playerColor && didCastle(move.san),
  );
  if (!playerCastled && playerMoveReviews.length >= 4) {
    addTakeaway('Tænk på rokade lidt tidligere i lignende partier. Kongesikkerhed gør resten af planen lettere.');
  } else if (playerCastled) {
    addTakeaway('Din rokade gav ro i stillingen. Behold den vane i lignende partier.');
  } else if (result.playerWon) {
    addTakeaway('Du holdt partiet praktisk og lod modstanderen tage de mere krævende beslutninger.');
  } else if (game.isDraw()) {
    addTakeaway('Når et parti flader ud mod remis, så kig efter det simpleste forbedringstræk i stedet for at presse for hårdt.');
  } else {
    addTakeaway(
      'Når stillingen bliver uklar, så gå tilbage til de enkle spørgsmål: hvad truer modstanderen, og hvilken brik skal forbedres nu?',
    );
  }

  while (takeaways.length < 3) {
    addTakeaway('Brug reviewet som fokus til det næste parti, ikke som en fuld dom over hele spillet.');
  }

  return takeaways;
}

export function buildAfterGameReview(input: BuildAfterGameReviewInput): AfterGameReview {
  const { game, historyVerbose, opening, playerColor, playerMoveReviews } = input;
  const result = getResultSummary(game, playerColor);
  const theorySummary = opening ? buildTheorySummary(opening, historyVerbose) : null;
  const rankedRecords = [...playerMoveReviews].sort((left, right) => {
    const rankDiff = getClassificationRank(right.classification) - getClassificationRank(left.classification);
    if (rankDiff !== 0) {
      return rankDiff;
    }

    const dropDiff =
      (getEvalDropCp(right, playerColor) ?? -1) - (getEvalDropCp(left, playerColor) ?? -1);
    if (dropDiff !== 0) {
      return dropDiff;
    }

    return left.ply - right.ply;
  });

  const keyRecord =
    rankedRecords.find((record) => {
      const classificationRank = getClassificationRank(record.classification);
      const evalDrop = getEvalDropCp(record, playerColor) ?? 0;
      return classificationRank > 0 || evalDrop >= 70;
    }) ?? null;

  const turningPoint = keyRecord
    ? describeTurningPoint(keyRecord, playerColor)
    : buildFallbackTurningPoint(opening, result, theorySummary);

  return {
    openingName: opening?.name ?? null,
    playerWon: result.playerWon,
    resultDetail: result.resultDetail,
    resultLabel: result.resultLabel,
    resultTone: result.resultTone,
    takeaways: buildTakeaways(
      game,
      historyVerbose,
      opening,
      playerColor,
      playerMoveReviews,
      result,
      theorySummary,
      keyRecord,
    ),
    theoryExitLabel: theorySummary?.theoryExitLabel ?? null,
    theoryLabel: theorySummary?.theoryLabel ?? null,
    theorySummary: theorySummary?.theorySummary ?? null,
    turningPointDescription: turningPoint.description,
    turningPointTitle: turningPoint.title,
    xpGained: XP_PER_GAME + (result.playerWon ? XP_PER_WIN_BONUS : 0),
  };
}
