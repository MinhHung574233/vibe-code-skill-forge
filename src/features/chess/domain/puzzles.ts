/**
 * Bundled tactics puzzles. Every one is original (composed by hand or generated from random
 * material and then filtered) and machine-verified by puzzles.test.ts: the FEN is valid, the
 * solution is legal move by move, mate puzzles end in checkmate with the engine confirming a forced
 * mate of exactly that length and a unique first move, and material puzzles gain exactly the stated
 * number of pawns once the opponent has replied. `rating` is an authored difficulty estimate on the
 * app's own scale (it is not Lichess or FIDE data).
 */
export type PuzzleTheme =
  | 'mate-in-1'
  | 'mate-in-2'
  | 'mate-in-3'
  | 'back-rank'
  | 'smothered-mate'
  | 'arabian-mate'
  | 'ladder-mate'
  | 'battery'
  | 'fork'
  | 'pin'
  | 'skewer'
  | 'hanging-piece'
  | 'discovered-attack';

export const THEME_LABELS: Readonly<Record<PuzzleTheme, string>> = {
  'mate-in-1': 'Mate in 1',
  'mate-in-2': 'Mate in 2',
  'mate-in-3': 'Mate in 3',
  'back-rank': 'Back rank',
  'smothered-mate': 'Smothered mate',
  'arabian-mate': 'Arabian mate',
  'ladder-mate': 'Ladder mate',
  battery: 'Battery',
  fork: 'Fork',
  pin: 'Pin',
  skewer: 'Skewer',
  'hanging-piece': 'Hanging piece',
  'discovered-attack': 'Discovered attack',
};

export type PuzzleGoal =
  | { type: 'mate'; in: 1 | 2 | 3 }
  /** Net pawns won by the solver after the line and the opponent's best reply. */
  | { type: 'material'; gain: number };

export interface Puzzle {
  id: string;
  /** Position with the solver to move. */
  fen: string;
  /** UCI moves alternating solver, opponent, solver ...; always ends on a solver move. */
  solution: readonly string[];
  goal: PuzzleGoal;
  themes: readonly PuzzleTheme[];
  /** Authored difficulty, 600 (easiest) to 1800. */
  rating: number;
}

export const PUZZLES: readonly Puzzle[] = [
  {
    id: 'm1-back-rank-rook',
    fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
    solution: ['a1a8'],
    goal: { type: 'mate', in: 1 },
    themes: ['mate-in-1', 'back-rank'],
    rating: 600,
  },
  {
    id: 'm1-queen-king',
    fen: '7k/8/6K1/8/8/8/8/1Q6 w - - 0 1',
    solution: ['b1b8'],
    goal: { type: 'mate', in: 1 },
    themes: ['mate-in-1'],
    rating: 600,
  },
  {
    id: 'm1-rook-king',
    fen: '7k/R7/6K1/8/8/8/8/8 w - - 0 1',
    solution: ['a7a8'],
    goal: { type: 'mate', in: 1 },
    themes: ['mate-in-1'],
    rating: 600,
  },
  {
    id: 'm1-scholar',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/5N2/PP1P1PPP/6K1 w - - 0 1',
    solution: ['h5f7'],
    goal: { type: 'mate', in: 1 },
    themes: ['mate-in-1'],
    rating: 600,
  },
  {
    id: 'm1-queen-back-rank-black',
    fen: '6k1/5ppp/8/8/8/8/1q3PPP/6K1 b - - 0 1',
    solution: ['b2b1'],
    goal: { type: 'mate', in: 1 },
    themes: ['mate-in-1', 'back-rank'],
    rating: 650,
  },
  {
    id: 't-hanging-queen',
    fen: '6k1/pp4pp/4q3/8/2B5/8/PP3PPP/6K1 w - - 0 1',
    solution: ['c4e6'],
    goal: { type: 'material', gain: 9 },
    themes: ['hanging-piece'],
    rating: 650,
  },
  {
    id: 'm1-battery',
    fen: '6k1/6pp/8/8/6Q1/8/1B6/6K1 w - - 0 1',
    solution: ['g4g7'],
    goal: { type: 'mate', in: 1 },
    themes: ['mate-in-1', 'battery'],
    rating: 700,
  },
  {
    id: 'm1-promotion',
    fen: '6k1/1P3ppp/8/8/8/8/8/6K1 w - - 0 1',
    solution: ['b7b8q'],
    goal: { type: 'mate', in: 1 },
    themes: ['mate-in-1', 'back-rank'],
    rating: 700,
  },
  {
    id: 'm1-rook-takes-rook',
    fen: '3r2k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1',
    solution: ['d1d8'],
    goal: { type: 'mate', in: 1 },
    themes: ['mate-in-1', 'back-rank'],
    rating: 700,
  },
  {
    id: 'm1-smothered',
    fen: '6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1',
    solution: ['g5f7'],
    goal: { type: 'mate', in: 1 },
    themes: ['mate-in-1', 'smothered-mate'],
    rating: 700,
  },
  {
    id: 't-fork-pawn',
    fen: '6k1/5pp1/7p/3r1n2/8/4P3/5PPP/R5K1 w - - 0 1',
    solution: ['e3e4', 'd5e5', 'e4f5'],
    goal: { type: 'material', gain: 3 },
    themes: ['fork'],
    rating: 700,
  },
  {
    id: 'm1-arabian',
    fen: '7k/R7/5N2/8/8/8/8/6K1 w - - 0 1',
    solution: ['a7h7'],
    goal: { type: 'mate', in: 1 },
    themes: ['mate-in-1', 'arabian-mate'],
    rating: 750,
  },
  {
    id: 'm1-h7',
    fen: '5rk1/5ppp/8/7Q/8/8/5PPP/1B4K1 w - - 0 1',
    solution: ['h5h7'],
    goal: { type: 'mate', in: 1 },
    themes: ['mate-in-1', 'battery'],
    rating: 750,
  },
  {
    id: 't-fork-knight-queen',
    fen: '6k1/pppq1p1p/8/8/4N3/8/PPP2PPP/6K1 w - - 0 1',
    solution: ['e4f6', 'g8f8', 'f6d7'],
    goal: { type: 'material', gain: 9 },
    themes: ['fork'],
    rating: 800,
  },
  {
    id: 't-fork-knight-rook',
    fen: '3r3k/p5pp/8/4N3/8/8/5PPP/6K1 w - - 0 1',
    solution: ['e5f7', 'h8g8', 'f7d8'],
    goal: { type: 'material', gain: 5 },
    themes: ['fork'],
    rating: 800,
  },
  {
    id: 'm2-ladder',
    fen: '6k1/1p6/8/8/8/8/R7/1R4K1 w - - 0 1',
    solution: ['b1b7', 'g8h8', 'a2a8'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2', 'ladder-mate'],
    rating: 850,
  },
  {
    id: 't-fork-knight-c7',
    fen: 'r3k3/p4ppp/8/1N6/8/8/P4PPP/6K1 w - - 0 1',
    solution: ['b5c7', 'e8e7', 'c7a8'],
    goal: { type: 'material', gain: 5 },
    themes: ['fork'],
    rating: 850,
  },
  {
    id: 't-fork-knight-queen2',
    fen: '2q3k1/pp3ppp/8/3N4/8/8/PP3PPP/6K1 w - - 0 1',
    solution: ['d5e7', 'g8f8', 'e7c8'],
    goal: { type: 'material', gain: 9 },
    themes: ['fork'],
    rating: 850,
  },
  {
    id: 't-fork-pawn-check',
    fen: '8/p5pp/1r1k4/8/2P5/4B3/5PPP/6K1 w - - 0 1',
    solution: ['c4c5', 'd6c6', 'c5b6'],
    goal: { type: 'material', gain: 4 },
    themes: ['fork'],
    rating: 900,
  },
  {
    id: 't-skewer-rook-file',
    fen: 'r7/5ppp/8/k7/8/8/5PPP/1R4K1 w - - 0 1',
    solution: ['b1a1', 'a5b4', 'a1a8'],
    goal: { type: 'material', gain: 5 },
    themes: ['skewer'],
    rating: 950,
  },
  {
    id: 't-discovered-knight',
    fen: '4k3/pp3ppp/2q5/4N3/8/8/5PPP/4R1K1 w - - 0 1',
    solution: ['e5c6'],
    goal: { type: 'material', gain: 9 },
    themes: ['discovered-attack'],
    rating: 1000,
  },
  {
    id: 't-pin-pawn',
    fen: '4k3/ppp2ppp/4n3/8/3P4/8/PPP2PPP/4R1K1 w - - 0 1',
    solution: ['d4d5', 'e8d7', 'd5e6'],
    goal: { type: 'material', gain: 2 },
    themes: ['pin'],
    rating: 1000,
  },
  {
    id: 't-skewer-rook',
    fen: 'q7/6pp/k1p5/8/8/8/5PPP/1R4K1 w - - 0 1',
    solution: ['b1a1', 'a6b7', 'a1a8'],
    goal: { type: 'material', gain: 4 },
    themes: ['skewer'],
    rating: 1000,
  },
  {
    id: 't-skewer-bishop',
    fen: '7q/6k1/6pp/8/8/8/5PPP/2B3K1 w - - 0 1',
    solution: ['c1b2', 'g7h7', 'b2h8'],
    goal: { type: 'material', gain: 6 },
    themes: ['skewer'],
    rating: 1050,
  },
  {
    id: 'm2-composed-07',
    fen: '7k/8/1p4p1/R6N/3K4/8/8/4R3 w - - 0 1',
    solution: ['a5a7', 'b6b5', 'e1e8'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1100,
  },
  {
    id: 'm2-composed-10',
    fen: '2k5/8/6pp/8/1p2Q3/8/7B/4K3 w - - 0 1',
    solution: ['e4e7', 'b4b3', 'e7c7'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1100,
  },
  {
    id: 'm2-composed-16',
    fen: '2K4b/k7/8/8/1N6/p7/4R3/6R1 w - - 0 1',
    solution: ['e2e6', 'a3a2', 'e6a6'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1100,
  },
  {
    id: 'm2-composed-08',
    fen: '8/1R1QB3/1p6/8/3p4/5K2/7k/8 w - - 0 1',
    solution: ['d7g4', 'h2h1', 'g4g2'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1150,
  },
  {
    id: 'm2-composed-09',
    fen: '4B3/7K/1p6/7R/5pk1/8/8/4Q3 w - - 0 1',
    solution: ['e1f2', 'f4f3', 'f2h4'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1150,
  },
  {
    id: 'm2-composed-11',
    fen: '8/6K1/P7/1pN5/Q7/R7/4p3/7k w - - 0 1',
    solution: ['a4g4', 'h1h2', 'a3h3'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1200,
  },
  {
    id: 'm2-composed-15',
    fen: '8/8/1R3p2/1Q3p2/8/P4K2/P2k4/8 w - - 0 1',
    solution: ['b6c6', 'd2d1', 'b5e2'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1200,
  },
  {
    id: 'm2-composed-01',
    fen: 'K7/1Q3pp1/1p6/8/8/8/3PB1pP/7k w - - 0 1',
    solution: ['e2f1', 'h1g1', 'b7g2'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1250,
  },
  {
    id: 'm2-composed-03',
    fen: '6k1/2p1p3/3p3R/R2P1K1P/8/8/B7/8 w - - 0 1',
    solution: ['f5g6', 'c7c6', 'a5a8'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1250,
  },
  {
    id: 'm2-composed-14',
    fen: '3k4/4R3/2p1P1NP/p2N4/7K/8/8/8 w - - 0 1',
    solution: ['h6h7', 'a5a4', 'h7h8q'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1250,
  },
  {
    id: 'm2-composed-02',
    fen: '2Q5/5R2/1K6/7p/4N3/4p2P/1k6/4N3 w - - 0 1',
    solution: ['f7a7', 'b2b3', 'c8c3'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1300,
  },
  {
    id: 'm2-composed-06',
    fen: '2R5/8/k7/4B3/4p3/3Np3/4R1K1/N7 w - - 0 1',
    solution: ['c8b8', 'e4d3', 'e2a2'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1300,
  },
  {
    id: 'm2-composed-12',
    fen: '8/Q2P4/8/5K2/3P3p/4N3/6p1/1k1B4 w - - 0 1',
    solution: ['a7a3', 'g2g1q', 'd1c2'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1300,
  },
  {
    id: 'm2-composed-17',
    fen: '2Q5/8/K5p1/4NR2/2P1k3/1p2B3/8/8 w - - 0 1',
    solution: ['c8d7', 'b3b2', 'd7d3'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1300,
  },
  {
    id: 'm2-composed-04',
    fen: '7k/7p/6p1/7P/1P1KRp1p/R7/1n3P2/8 w - - 0 1',
    solution: ['a3a7', 'b2a4', 'e4e8'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1350,
  },
  {
    id: 'm2-composed-05',
    fen: 'B5R1/2K5/8/6R1/4p1N1/2P5/6pp/k7 w - - 0 1',
    solution: ['g8b8', 'a1a2', 'g5a5'],
    goal: { type: 'mate', in: 2 },
    themes: ['mate-in-2'],
    rating: 1350,
  },
  {
    id: 'm3-composed-13',
    fen: '8/pQ6/6K1/8/1P1k4/1P2p3/2B5/8 w - - 0 1',
    solution: ['b7c7', 'd4d5', 'c2f5', 'e3e2', 'c7c5'],
    goal: { type: 'mate', in: 3 },
    themes: ['mate-in-3'],
    rating: 1500,
  },
];

export const puzzleById = (id: string): Puzzle | undefined => PUZZLES.find((p) => p.id === id);
