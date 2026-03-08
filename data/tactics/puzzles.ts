export type PuzzleCategory = 'mat' | 'gafler' | 'bindinger' | 'materiale';

export type Puzzle = {
  id: string;
  fen: string;
  solution: string[];
  category: PuzzleCategory;
  difficulty: number;
  title: string;
  explanation: string;
};

export const tacticPuzzles: Puzzle[] = [
  {
    id: 'mat-1',
    fen: '7k/6pp/6Q1/8/8/8/6P1/6KR w - - 0 1',
    solution: ['g6h7'],
    category: 'mat',
    difficulty: 1,
    title: 'Afslut på h7',
    explanation: 'Dronningen går til h7 med støtte fra tårnet på h1. Kongen har ingen flugtfelter tilbage.',
  },
  {
    id: 'mat-2',
    fen: '6k1/5ppp/8/8/8/8/5PPP/3Q1RK1 w - - 0 1',
    solution: ['d1d8'],
    category: 'mat',
    difficulty: 2,
    title: 'Baglinjen knækker',
    explanation: 'Qd8 er ren baglinjemat. Tårnet på f1 tager flugtfelterne, og sort er låst fast.',
  },
  {
    id: 'mat-3',
    fen: '6k1/5ppp/8/8/8/5Q2/6PP/5RK1 w - - 0 1',
    solution: ['f3a8'],
    category: 'mat',
    difficulty: 2,
    title: 'Lang diagonal til mat',
    explanation: 'Qa8 udnytter diagonalen og kongens svage baglinje. Sort har ingen forsvar tilbage.',
  },
  {
    id: 'gafler-1',
    fen: 'r3k3/8/8/8/8/8/8/3QK3 w - - 0 1',
    solution: ['d1a4'],
    category: 'gafler',
    difficulty: 1,
    title: 'Dronningegaffel på lang afstand',
    explanation: 'Qa4+ giver skak og angriber samtidig tårnet på a8. Det er en klassisk dronningegaffel.',
  },
  {
    id: 'gafler-2',
    fen: '4k3/8/8/8/1q6/8/8/4K2R b - - 0 1',
    solution: ['b4e4'],
    category: 'gafler',
    difficulty: 2,
    title: 'Sort finder gaffelen',
    explanation: 'Qe4+ angriber både kongen og tårnet. Når skakken er løst, falder materialet bagefter.',
  },
  {
    id: 'gafler-3',
    fen: 'r3k3/8/8/1N6/8/8/8/4K3 w - - 0 1',
    solution: ['b5c7'],
    category: 'gafler',
    difficulty: 2,
    title: 'Springer på c7',
    explanation: 'Nc7+ er den typiske springergaffel: kongen kommer i skak, og tårnet på a8 hænger bagefter.',
  },
  {
    id: 'bindinger-1',
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 2 2',
    solution: ['f1b5'],
    category: 'bindinger',
    difficulty: 1,
    title: 'Pin springeren til kongen',
    explanation: 'Bb5 binder springeren på c6 til kongen på e8. Det gør sorts udvikling mere besværlig.',
  },
  {
    id: 'bindinger-2',
    fen: 'rnbqkbnr/pppp2pp/5p2/4p3/8/2N5/PPPP1PPP/R1BQKBNR b KQkq - 0 3',
    solution: ['f8b4'],
    category: 'bindinger',
    difficulty: 2,
    title: 'Sort binder springeren',
    explanation: 'Bb4 binder springeren på c3 til kongen på e1. Det giver sort kontrol over centrum og tempo.',
  },
  {
    id: 'materiale-1',
    fen: '4k3/4q3/8/8/8/8/8/4R1K1 w - - 0 1',
    solution: ['e1e7'],
    category: 'materiale',
    difficulty: 1,
    title: 'Tag dronningen med tårnet',
    explanation: 'Rxe7+ vinder straks dronningen og gør samtidig stillingen meget lettere at spille.',
  },
  {
    id: 'materiale-2',
    fen: '4k3/8/8/8/8/8/3q4/3RK3 w - - 0 1',
    solution: ['d1d2'],
    category: 'materiale',
    difficulty: 1,
    title: 'Gratis dronning på d2',
    explanation: 'Rxd2 samler en ubeskyttet dronning op. Her handler det om at se den simple gevinst.',
  },
  {
    id: 'materiale-3',
    fen: 'q3k3/8/8/8/8/8/6B1/6K1 w - - 0 1',
    solution: ['g2a8'],
    category: 'materiale',
    difficulty: 2,
    title: 'Løberen tager hjørnet',
    explanation: 'Bxa8 vinder dronningen på lang diagonal. Det er et godt eksempel på skjult rækkevidde.',
  },
  {
    id: 'materiale-4',
    fen: '4k3/8/8/8/8/8/2Q5/4n1K1 b - - 0 1',
    solution: ['e1c2'],
    category: 'materiale',
    difficulty: 2,
    title: 'Springeren hugger til',
    explanation: 'Nxc2 vinder dronningen. Springere er ekstra farlige, når de hopper ind på uventede felter.',
  },
];
