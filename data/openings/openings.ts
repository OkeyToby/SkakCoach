import { Chess } from 'chess.js';

export type OpeningSide = 'hvid' | 'sort';

type OpeningQuizSeed = {
  id: string;
  prompt: string;
  beforeMoves: string[];
  answer: string;
  explanation: string;
};

type OpeningSeed = {
  slug: string;
  name: string;
  side: OpeningSide;
  shortDescription: string;
  description: string;
  coreIdeas: string[];
  commonMistakes: string[];
  starterMoves: string[];
  quiz: OpeningQuizSeed[];
};

export type OpeningQuizStep = {
  id: string;
  prompt: string;
  beforeMoves: string[];
  fen: string;
  answerSan: string;
  answerUci: string;
  explanation: string;
};

export type Opening = {
  slug: string;
  name: string;
  side: OpeningSide;
  shortDescription: string;
  description: string;
  coreIdeas: string[];
  commonMistakes: string[];
  starterMoves: string[];
  previewFen: string;
  quiz: OpeningQuizStep[];
};

function moveToUci(move: { from: string; to: string; promotion?: string }): string {
  return `${move.from}${move.to}${move.promotion ?? ''}`;
}

function buildQuizStep(seed: OpeningQuizSeed): OpeningQuizStep {
  const chess = new Chess();

  for (const move of seed.beforeMoves) {
    chess.move(move);
  }

  const fen = chess.fen();
  const answerMove = chess.move(seed.answer);

  if (!answerMove) {
    throw new Error(`Kunne ikke bygge quiztrin ${seed.id}`);
  }

  return {
    id: seed.id,
    prompt: seed.prompt,
    beforeMoves: seed.beforeMoves,
    fen,
    answerSan: answerMove.san,
    answerUci: moveToUci(answerMove),
    explanation: seed.explanation,
  };
}

function buildPreviewFen(starterMoves: string[]): string {
  const chess = new Chess();

  for (const move of starterMoves) {
    chess.move(move);
  }

  return chess.fen();
}

function buildOpening(seed: OpeningSeed): Opening {
  return {
    ...seed,
    previewFen: buildPreviewFen(seed.starterMoves),
    quiz: seed.quiz.map(buildQuizStep),
  };
}

export function formatOpeningLine(moves: string[]): string {
  const chunks: string[] = [];

  for (let index = 0; index < moves.length; index += 2) {
    const moveNumber = Math.floor(index / 2) + 1;
    const whiteMove = moves[index];
    const blackMove = moves[index + 1];
    chunks.push(`${moveNumber}.${whiteMove}${blackMove ? ` ${blackMove}` : ''}`);
  }

  return chunks.join(' ');
}

const openingSeeds: OpeningSeed[] = [
  {
    slug: 'italiensk-parti',
    name: 'Italiensk parti',
    side: 'hvid',
    shortDescription: 'En klassisk begyndelse med hurtig udvikling og pres mod centrum.',
    description:
      'Italiensk parti giver hvid en enkel og sund struktur: udvikl officererne hurtigt, rokér i god tid og byg op mod c3 og d4.',
    coreIdeas: [
      'Udvikl løberen aktivt til c4 og pres det svage felt f7.',
      'Forbered centrumsgennembruddet med c3 og d4 i roligt tempo.',
      'Rokér tidligt, så du kan spille mere aktivt uden at kongen står i vejen.',
    ],
    commonMistakes: [
      'At jage hurtige tricks mod f7 uden tilstrækkelig udvikling.',
      'At udsætte rokaden og blive fanget i midten efter ...Nf6 og ...d5.',
      'At flytte den samme officer flere gange uden at bygge centrum op.',
    ],
    starterMoves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'],
    quiz: [
      {
        id: 'italian-1',
        prompt: 'Du vil ind i italiensk parti og udvikle løberen aktivt. Hvad spiller hvid nu?',
        beforeMoves: ['e4', 'e5', 'Nf3', 'Nc6'],
        answer: 'Bc4',
        explanation: 'Bc4 er kendetegnet for italiensk parti. Løberen peger mod f7 og støtter et senere centrumsgennembrud.',
      },
      {
        id: 'italian-2',
        prompt: 'Stillingen er rolig, og hvid vil bygge centrum før et gennembrud. Hvad er næste naturlige træk?',
        beforeMoves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'],
        answer: 'c3',
        explanation: 'c3 forbereder d4 og giver hvid en enkel plan. Det er typisk italiensk at bygge først og slå senere.',
      },
    ],
  },
  {
    slug: 'siciliansk-forsvar',
    name: 'Siciliansk forsvar',
    side: 'sort',
    shortDescription: 'Et skarpt og asymmetrisk svar på 1.e4, hvor sort kæmper om initiativet.',
    description:
      'Siciliansk forsvar er for spilleren, der vil have ubalance i stillingen tidligt. Sort accepterer et asymmetrisk centrum for at få aktivt modspil.',
    coreIdeas: [
      'Sæt straks pres på d4 og få en asymmetrisk bondestruktur.',
      'Udvikl springeren til f6 og hold øje med aktivitet på dronningefløjen.',
      'Vælg en klar plan: enten rolig udvikling eller mere direkte modspil mod centrum.',
    ],
    commonMistakes: [
      'At spille for passivt og ende med at forsvare sig uden modspil.',
      'At blande for mange Sicilianske idéer sammen uden en konkret plan.',
      'At forsømme udviklingen, mens hvid frit får c4, Nc3 og f3-hjælpestillinger.',
    ],
    starterMoves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6'],
    quiz: [
      {
        id: 'sicilian-1',
        prompt: 'Du vil møde 1.e4 med Siciliansk. Hvad er sorts første træk?',
        beforeMoves: ['e4'],
        answer: 'c5',
        explanation: 'c5 gør stillingen asymmetrisk med det samme og lægger pres på d4. Det er hele idéen bag Siciliansk.',
      },
      {
        id: 'sicilian-2',
        prompt: 'Hvid har netop slået tilbage på d4. Hvilket udviklingstræk passer bedst ind i Siciliansk her?',
        beforeMoves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4'],
        answer: 'Nf6',
        explanation: 'Nf6 angriber e4 og udvikler en officer med tempo. Sort skal ikke stå stille, men aktivt udfordre centrum.',
      },
    ],
  },
  {
    slug: 'fransk-forsvar',
    name: 'Fransk forsvar',
    side: 'sort',
    shortDescription: 'Et solidt svar til 1.e4 med fokus på at udfordre det hvide centrum.',
    description:
      'Fransk forsvar giver sort en robust struktur med e6 og d5. Planen er ikke at kopiere hvid, men at angribe centrum på de rigtige tidspunkter.',
    coreIdeas: [
      'Byg bondestrukturen med e6 og d5 og læg pres på feltet d4.',
      'Hold spændingen i centrum, indtil du ved, hvordan du vil placere officererne.',
      'Brug de mørke felter aktivt, især hvis hvid overstrækker sig.',
    ],
    commonMistakes: [
      'At låse løberen på c8 helt inde uden senere plan for udvikling.',
      'At bytte for tidligt i centrum og give hvid et let spil.',
      'At glemme, at fransk kræver tålmodighed og præcise officerfelter.',
    ],
    starterMoves: ['e4', 'e6', 'd4', 'd5', 'Nc3', 'Nf6'],
    quiz: [
      {
        id: 'french-1',
        prompt: 'Du vil spille Fransk mod 1.e4. Hvad er sorts første træk?',
        beforeMoves: ['e4'],
        answer: 'e6',
        explanation: 'e6 er hele indgangen til Fransk. Sort forbereder d5 og bygger en mere solid end direkte struktur.',
      },
      {
        id: 'french-2',
        prompt: 'Hvid har udviklet springeren til c3. Hvilket naturligt udviklingstræk spiller sort nu?',
        beforeMoves: ['e4', 'e6', 'd4', 'd5', 'Nc3'],
        answer: 'Nf6',
        explanation: 'Nf6 udvikler med pres mod e4. Fransk handler om at lægge tryk på centrum uden at miste sin struktur.',
      },
    ],
  },
  {
    slug: 'dronningegambit',
    name: 'Dronningegambit',
    side: 'hvid',
    shortDescription: 'Et klassisk bondetilbud, der giver plads og pres mod sorts centrum.',
    description:
      'Dronningegambit er en enkel og stærk måde at starte med 1.d4 på. Hvid udfordrer straks bonden på d5 og sigter efter stabilt centrum og aktiv udvikling.',
    coreIdeas: [
      'Læg pres på d5 og få sort til at træffe et tidligt strukturelt valg.',
      'Udvikl officererne harmonisk og behold fleksibilitet i centrum.',
      'Brug løberen og springerne til at støtte et senere e4-gennembrud.',
    ],
    commonMistakes: [
      'At forsøge at vinde bonden tilbage for enhver pris uden udvikling.',
      'At spille for tidligt e4 uden at officererne støtter centrum.',
      'At overse sorts modspil mod c4-bonden og diagonalen mod b4.',
    ],
    starterMoves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6', 'Bg5'],
    quiz: [
      {
        id: 'qg-1',
        prompt: 'Du vil udfordre sorts d-bonde med det samme. Hvad spiller hvid nu?',
        beforeMoves: ['d4', 'd5'],
        answer: 'c4',
        explanation: 'c4 er selve idéen i Dronningegambit. Hvid angriber d5 og forsøger at få mere kontrol over centrum.',
      },
      {
        id: 'qg-2',
        prompt: 'Sort har udviklet sig roligt med ...e6 og ...Nf6. Hvilket udviklingstræk passer godt for hvid her?',
        beforeMoves: ['d4', 'd5', 'c4', 'e6', 'Nc3', 'Nf6'],
        answer: 'Bg5',
        explanation: 'Bg5 lægger pres på springeren på f6 og passer perfekt ind i Dronningegambits klassiske udvikling.',
      },
    ],
  },
  {
    slug: 'london-systemet',
    name: 'London-systemet',
    side: 'hvid',
    shortDescription: 'Et praktisk system med faste idéer, hvor hvid hurtigt får en sund opstilling.',
    description:
      'London-systemet er populært, fordi planerne er lette at forstå. Hvid sætter løberen uden for bondekæden, udvikler roligt og spiller ofte efter e3, c3 og Bd3.',
    coreIdeas: [
      'Sæt løberen til f4 tidligt, før e3 lukker diagonalen.',
      'Byg en kompakt struktur og vælg dine gennembrud, når du er færdigudviklet.',
      'Rokér tidligt og spil med små, sikre forbedringer.',
    ],
    commonMistakes: [
      'At spille London som ren autopilot uden at reagere på sorts konkrete plan.',
      'At glemme centrum og ende for passivt med kun brikflytninger.',
      'At rokere for sent og blive ramt af aktive fremstød i centrum.',
    ],
    starterMoves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4', 'e6', 'e3'],
    quiz: [
      {
        id: 'london-1',
        prompt: 'Hvid har allerede spillet Nf3. Hvilket udviklingstræk viser, at du går efter London-systemet?',
        beforeMoves: ['d4', 'd5', 'Nf3', 'Nf6'],
        answer: 'Bf4',
        explanation: 'Bf4 er nøglen i London. Løberen kommer uden for bondekæden, mens stillingen stadig er fleksibel.',
      },
      {
        id: 'london-2',
        prompt: 'Sort har spillet ...e6. Hvilket roligt støttetræk bygger London-strukturen færdig?',
        beforeMoves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4', 'e6'],
        answer: 'e3',
        explanation: 'e3 støtter centrum, åbner for løberen på f1 og gør opstillingen klar til Bd3 og rolig udvikling.',
      },
    ],
  },
  {
    slug: 'caro-kann',
    name: 'Caro-Kann',
    side: 'sort',
    shortDescription: 'Et stabilt og sundt forsvar mod 1.e4 med klar bondestruktur og enkel udvikling.',
    description:
      'Caro-Kann er et godt valg for sort, hvis du vil have et solidt svar på 1.e4 uden at blive passiv. Sort får ofte en sund struktur og tydelige udviklingsfelter.',
    coreIdeas: [
      'Forbered d5 med c6 og udfordr centrum på en sund måde.',
      'Få løberen ud til f5 eller g4, før e6 låser den inde.',
      'Hold stillingen enkel og spil på struktur frem for tidlige tricks.',
    ],
    commonMistakes: [
      'At bytte i centrum og derefter stå uden aktiv plan.',
      'At udvikle for langsomt og give hvid frit initiativ.',
      'At glemme at få løberen ud, før bonden går til e6.',
    ],
    starterMoves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4', 'Bf5'],
    quiz: [
      {
        id: 'caro-1',
        prompt: 'Du vil forberede ...d5 mod 1.e4. Hvad spiller sort først?',
        beforeMoves: ['e4'],
        answer: 'c6',
        explanation: 'c6 forbereder ...d5 på en sund måde. Det er fundamentet i Caro-Kann.',
      },
      {
        id: 'caro-2',
        prompt: 'Efter afbytninger i centrum vil sort udvikle sig aktivt. Hvilket løbertræk passer bedst ind?',
        beforeMoves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4'],
        answer: 'Bf5',
        explanation: 'Bf5 får løberen ud, før e6 kommer. Det er en klassisk Caro-Kann-idé og en vigtig detalje i åbningen.',
      },
    ],
  },
];

export const openingLibrary: Opening[] = openingSeeds.map(buildOpening);

export const openingSlugs = openingLibrary.map((opening) => opening.slug);

export function getOpeningBySlug(slug: string): Opening | undefined {
  return openingLibrary.find((opening) => opening.slug === slug);
}
