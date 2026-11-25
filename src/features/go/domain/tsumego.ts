import type { BoardEdges, Pt, TsumegoProblem } from './tsumegoTypes';

/**
 * Bundled life-and-death problems. All positions are original compositions (standard eye shapes
 * set in my own enclosures, plus positions found and checked by search), and every one is
 * machine-verified in tsumego.test.ts with the rules engine and the prover in tsumegoSolver.ts:
 *  - `solutions` is EXACTLY the set of first moves the prover shows to achieve the objective within
 *    `depth` plies, and every other legal first move is shown to fail (so no problem has an
 *    unlisted second answer and no "wrong" move is merely unproven);
 *  - every `refutations` entry is one of those failing moves.
 * "Kill" means the target group is captured; "live" means it becomes unconditionally alive
 * (Benson); see tsumegoSolver.ts for the exact definitions and limits.
 */

const p = (x: number, y: number): Pt => [x, y];
const none: BoardEdges = { top: false, right: false, bottom: false, left: false };
const top: BoardEdges = { top: true, right: false, bottom: false, left: false };
const corner: BoardEdges = { top: true, right: false, bottom: false, left: true };

// Eye-shape diagrams shared by a "kill" and a "live" problem. `#` is outside the diagram.
const STRAIGHT_THREE = ['#X...X#', '#XXXXX#', '#######'] as const;
const BENT_THREE = ['..X#', '.XX#', 'XXX#', '####'] as const;
const BULKY_FIVE_CORNER = ['...X#', '..XX#', 'XXXX#', '#####'] as const;
const T_FOUR = ['XXXXX#', 'X...X#', 'XX.XX#', '#XXX##', '######'] as const;
const T_FOUR_CORNER = ['...X#', 'X.XX#', 'XXX##', '#####'] as const;
const CROSS_FIVE = ['#XX.XX#', '#X...X#', '#XX.XX#', '##XXX##', '#######'] as const;
const PLUS_STONE = ['#XXX##', 'XX.XX#', 'X..OX#', 'XX.XX#', '#XXX##', '######'] as const;
const BULKY_TIP = ['XXXXX#', 'X..OX#', 'XX..X#', '#XXXX#', '######'] as const;
const BULKY_STONE = ['XXXXX#', 'X...X#', 'XXO.X#', '#XXXX#', '######'] as const;
const E_SHAPE = ['##XXX#', 'XXX.X#', 'X.O.X#', 'XX.XX#', '#XXX##', '######'] as const;
const A_SHAPE = ['XXXXXX#', 'X.O..X#', 'XX.XXX#', '#XXX###', '#######'] as const;
const SIX = ['#XXX###', 'XX.XXX#', 'X.O..X#', 'XX.XXX#', '#XXX###', '#######'] as const;
const G_SHAPE = ['XXXXX#', 'X.O.X#', 'XX.XX#', '#X.X##', '#XXX##', '######'] as const;
const H_SHAPE = ['XXXXX#', 'X...X#', 'XXOXX#', '#X.X##', '#XXX##', '######'] as const;

const RACE_FAILS = 'This loses the race: White captures first.';
const KILL_FAILS = 'Black answers correctly and makes two eyes, so the group lives.';
const LIVE_FAILS = 'Black can no longer make two eyes: White kills the group.';

export const TSUMEGO_PROBLEMS: readonly TsumegoProblem[] = [
  {
    id: 'straight-three-kill',
    title: 'Straight three: kill',
    category: 'vital-point',
    difficulty: 1,
    rows: STRAIGHT_THREE,
    boardSize: 19,
    edges: top,
    toPlay: 'white',
    objective: 'kill',
    target: p(1, 0),
    solutions: [p(3, 0)],
    refutations: [
      {
        move: p(2, 0),
        why: 'A stone at the end is captured when Black plays the middle point, which leaves two separate eyes.',
      },
    ],
    depth: 20,
    explanation:
      'The middle of a straight three is the vital point. With White there, Black has only one eye left; an end point lets Black capture the stone and make two eyes.',
  },
  {
    id: 'straight-three-live',
    title: 'Straight three: live',
    category: 'two-eyes',
    difficulty: 1,
    rows: STRAIGHT_THREE,
    boardSize: 19,
    edges: top,
    toPlay: 'black',
    objective: 'live',
    target: p(1, 0),
    solutions: [p(3, 0)],
    refutations: [
      {
        move: p(2, 0),
        why: 'That leaves a two-point eye, and White kills it by playing inside it.',
      },
    ],
    depth: 20,
    explanation:
      'Playing the middle point splits the three-point space into two separate one-point eyes, so the group is alive.',
  },
  {
    id: 'bent-three-kill',
    title: 'Bent three in the corner: kill',
    category: 'corner',
    difficulty: 1,
    rows: BENT_THREE,
    boardSize: 19,
    edges: corner,
    toPlay: 'white',
    objective: 'kill',
    target: p(2, 0),
    solutions: [p(0, 0)],
    refutations: [
      { move: p(1, 0), why: KILL_FAILS },
      { move: p(0, 1), why: KILL_FAILS },
    ],
    depth: 20,
    explanation:
      'The corner point is the middle of the bent three and its vital point. Anywhere else, Black takes the stone and has two eyes.',
  },
  {
    id: 'bent-three-live',
    title: 'Bent three in the corner: live',
    category: 'corner',
    difficulty: 1,
    rows: BENT_THREE,
    boardSize: 19,
    edges: corner,
    toPlay: 'black',
    objective: 'live',
    target: p(2, 0),
    solutions: [p(0, 0)],
    refutations: [
      { move: p(1, 0), why: LIVE_FAILS },
      { move: p(0, 1), why: LIVE_FAILS },
    ],
    depth: 20,
    explanation:
      'The corner point cuts the bent three into two one-point eyes. An end point leaves a two-point eye that White kills.',
  },
  {
    id: 'bulky-five-corner-kill',
    title: 'Bulky five in the corner: kill',
    category: 'corner',
    difficulty: 2,
    rows: BULKY_FIVE_CORNER,
    boardSize: 19,
    edges: corner,
    toPlay: 'white',
    objective: 'kill',
    target: p(3, 0),
    solutions: [p(1, 0)],
    refutations: [
      { move: p(0, 0), why: KILL_FAILS },
      { move: p(1, 1), why: KILL_FAILS },
    ],
    depth: 20,
    explanation:
      'In a bulky five the vital point is the one that touches three of the other eye points. Take it and the space can no longer make two eyes.',
  },
  {
    id: 'bulky-five-corner-live',
    title: 'Bulky five in the corner: live',
    category: 'corner',
    difficulty: 2,
    rows: BULKY_FIVE_CORNER,
    boardSize: 19,
    edges: corner,
    toPlay: 'black',
    objective: 'live',
    target: p(3, 0),
    solutions: [p(1, 0)],
    refutations: [
      { move: p(0, 0), why: LIVE_FAILS },
      { move: p(1, 1), why: LIVE_FAILS },
    ],
    depth: 20,
    explanation:
      'Black takes the vital point of the bulky five himself: the space is split into two eyes that White cannot both stop.',
  },
  {
    id: 't-four-kill',
    title: 'T-shaped four: kill',
    category: 'vital-point',
    difficulty: 2,
    rows: T_FOUR,
    boardSize: 19,
    edges: none,
    toPlay: 'white',
    objective: 'kill',
    target: p(0, 0),
    solutions: [p(2, 1)],
    refutations: [
      { move: p(1, 1), why: KILL_FAILS },
      { move: p(2, 2), why: KILL_FAILS },
    ],
    depth: 20,
    explanation:
      'The centre of the T touches all three other points. White there leaves no way to split the space into two eyes.',
  },
  {
    id: 't-four-live',
    title: 'T-shaped four: live',
    category: 'two-eyes',
    difficulty: 2,
    rows: T_FOUR,
    boardSize: 19,
    edges: none,
    toPlay: 'black',
    objective: 'live',
    target: p(0, 0),
    solutions: [p(2, 1)],
    refutations: [
      { move: p(1, 1), why: LIVE_FAILS },
      { move: p(2, 2), why: LIVE_FAILS },
    ],
    depth: 20,
    explanation:
      'Black plays the centre of the T, which makes the three remaining points into separate eyes.',
  },
  {
    id: 't-four-corner-kill',
    title: 'T-shaped four in the corner: kill',
    category: 'corner',
    difficulty: 2,
    rows: T_FOUR_CORNER,
    boardSize: 19,
    edges: corner,
    toPlay: 'white',
    objective: 'kill',
    target: p(3, 0),
    solutions: [p(1, 0)],
    refutations: [
      { move: p(0, 0), why: KILL_FAILS },
      { move: p(1, 1), why: KILL_FAILS },
    ],
    depth: 20,
    explanation:
      'The same vital point as in the open, only now the corner stone of the eye space is on the real corner of the board.',
  },
  {
    id: 't-four-corner-live',
    title: 'T-shaped four in the corner: live',
    category: 'corner',
    difficulty: 2,
    rows: T_FOUR_CORNER,
    boardSize: 19,
    edges: corner,
    toPlay: 'black',
    objective: 'live',
    target: p(3, 0),
    solutions: [p(1, 0)],
    refutations: [
      { move: p(0, 0), why: LIVE_FAILS },
      { move: p(1, 1), why: LIVE_FAILS },
    ],
    depth: 20,
    explanation: 'Black takes the centre of the T and the group has two eyes.',
  },
  {
    id: 'cross-five-kill',
    title: 'Plus-shaped five: kill',
    category: 'vital-point',
    difficulty: 3,
    rows: CROSS_FIVE,
    boardSize: 19,
    edges: none,
    toPlay: 'white',
    objective: 'kill',
    target: p(1, 0),
    solutions: [p(3, 1)],
    refutations: [
      { move: p(3, 0), why: KILL_FAILS },
      { move: p(2, 1), why: KILL_FAILS },
    ],
    depth: 24,
    explanation:
      'Only the centre of the plus works. A stone on any arm is captured and Black then has four separate eyes.',
  },
  {
    id: 'cross-five-live',
    title: 'Plus-shaped five: live',
    category: 'two-eyes',
    difficulty: 3,
    rows: CROSS_FIVE,
    boardSize: 19,
    edges: none,
    toPlay: 'black',
    objective: 'live',
    target: p(1, 0),
    solutions: [p(3, 1)],
    refutations: [
      { move: p(3, 0), why: LIVE_FAILS },
      { move: p(4, 1), why: LIVE_FAILS },
    ],
    depth: 24,
    explanation:
      'The centre point turns the plus into four separate one-point eyes. Any other move leaves White the centre.',
  },
  {
    id: 'plus-stone-kill',
    title: 'Plus with a White stone: kill',
    category: 'vital-point',
    difficulty: 3,
    rows: PLUS_STONE,
    boardSize: 19,
    edges: none,
    toPlay: 'white',
    objective: 'kill',
    target: p(1, 0),
    solutions: [p(2, 2)],
    refutations: [
      { move: p(2, 1), why: KILL_FAILS },
      { move: p(1, 2), why: KILL_FAILS },
    ],
    depth: 24,
    explanation:
      'White already has a stone inside. One more at the centre of the space joins it and Black cannot make two eyes any more.',
  },
  {
    id: 'plus-stone-live',
    title: 'Plus with a White stone: live',
    category: 'two-eyes',
    difficulty: 3,
    rows: PLUS_STONE,
    boardSize: 19,
    edges: none,
    toPlay: 'black',
    objective: 'live',
    target: p(1, 0),
    solutions: [p(2, 2)],
    refutations: [
      { move: p(2, 1), why: LIVE_FAILS },
      { move: p(2, 3), why: LIVE_FAILS },
    ],
    depth: 24,
    explanation:
      'Black plays the centre of the plus. That captures the White stone and leaves four separate eyes.',
  },
  {
    id: 'bulky-tip-kill',
    title: 'Bulky five, stone at the tip: kill',
    category: 'vital-point',
    difficulty: 3,
    rows: BULKY_TIP,
    boardSize: 19,
    edges: none,
    toPlay: 'white',
    objective: 'kill',
    target: p(0, 0),
    solutions: [p(2, 1)],
    refutations: [
      { move: p(1, 1), why: KILL_FAILS },
      { move: p(2, 2), why: KILL_FAILS },
    ],
    depth: 24,
    explanation:
      'The stone at the tip is only a decoy. The point that touches three others is still the one that kills.',
  },
  {
    id: 'bulky-stone-live',
    title: 'Bulky five with a stone inside: live',
    category: 'two-eyes',
    difficulty: 3,
    rows: BULKY_STONE,
    boardSize: 19,
    edges: none,
    toPlay: 'black',
    objective: 'live',
    target: p(0, 0),
    solutions: [p(2, 1)],
    refutations: [
      { move: p(1, 1), why: LIVE_FAILS },
      { move: p(3, 2), why: LIVE_FAILS },
    ],
    depth: 24,
    explanation:
      'Only the point directly above the White stone makes two eyes. The other points leave White the key point.',
  },
  {
    id: 'a-shape-live',
    title: 'Bar with a stone: live',
    category: 'two-eyes',
    difficulty: 3,
    rows: A_SHAPE,
    boardSize: 19,
    edges: none,
    toPlay: 'black',
    objective: 'live',
    target: p(0, 0),
    solutions: [p(3, 1)],
    refutations: [
      { move: p(1, 1), why: LIVE_FAILS },
      { move: p(2, 2), why: LIVE_FAILS },
    ],
    depth: 24,
    explanation:
      'Of the four empty points only one gives Black two eyes; the others leave White the point that decides.',
  },
  {
    id: 'e-shape-kill',
    title: 'Bent five with a stone: kill',
    category: 'vital-point',
    difficulty: 4,
    rows: E_SHAPE,
    boardSize: 19,
    edges: none,
    toPlay: 'white',
    objective: 'kill',
    target: p(2, 0),
    solutions: [p(3, 2)],
    refutations: [
      { move: p(3, 1), why: KILL_FAILS },
      { move: p(2, 3), why: KILL_FAILS },
    ],
    depth: 24,
    explanation:
      'White plays to the right of its own stone, at the point that touches both the stone and the empty point above it.',
  },
  {
    id: 'g-shape-kill',
    title: 'Plus with a stone on top: kill',
    category: 'vital-point',
    difficulty: 4,
    rows: G_SHAPE,
    boardSize: 19,
    edges: none,
    toPlay: 'white',
    objective: 'kill',
    target: p(0, 0),
    solutions: [p(2, 2)],
    refutations: [
      { move: p(1, 1), why: KILL_FAILS },
      { move: p(3, 1), why: KILL_FAILS },
    ],
    depth: 24,
    explanation:
      'White plays directly below its own stone. That joins it to the empty point underneath and leaves Black no way to split the space.',
  },
  {
    id: 'g-shape-live',
    title: 'Plus with a stone on top: live',
    category: 'two-eyes',
    difficulty: 4,
    rows: G_SHAPE,
    boardSize: 19,
    edges: none,
    toPlay: 'black',
    objective: 'live',
    target: p(0, 0),
    solutions: [p(2, 2)],
    refutations: [
      { move: p(1, 1), why: LIVE_FAILS },
      { move: p(3, 1), why: LIVE_FAILS },
    ],
    depth: 24,
    explanation:
      'Black takes the point directly below the White stone, which stops White joining it to the rest of the space.',
  },
  {
    id: 'h-shape-kill',
    title: 'Plus with a stone below: kill',
    category: 'vital-point',
    difficulty: 4,
    rows: H_SHAPE,
    boardSize: 19,
    edges: none,
    toPlay: 'white',
    objective: 'kill',
    target: p(0, 0),
    solutions: [p(2, 1)],
    refutations: [
      { move: p(1, 1), why: KILL_FAILS },
      { move: p(3, 1), why: KILL_FAILS },
    ],
    depth: 24,
    explanation:
      'White plays directly above its own stone, in the middle of the top row of the space.',
  },
  {
    id: 'six-kill',
    title: 'Six-point space with a stone: kill',
    category: 'vital-point',
    difficulty: 5,
    rows: SIX,
    boardSize: 19,
    edges: none,
    toPlay: 'white',
    objective: 'kill',
    target: p(1, 0),
    solutions: [p(3, 2)],
    refutations: [
      { move: p(2, 1), why: KILL_FAILS },
      { move: p(2, 3), why: KILL_FAILS },
    ],
    depth: 36,
    explanation:
      'A big space, but still one deciding point: directly to the right of the White stone.',
  },
  {
    id: 'six-live',
    title: 'Six-point space with a stone: live',
    category: 'two-eyes',
    difficulty: 5,
    rows: SIX,
    boardSize: 19,
    edges: none,
    toPlay: 'black',
    objective: 'live',
    target: p(1, 0),
    solutions: [p(3, 2)],
    refutations: [
      { move: p(2, 1), why: LIVE_FAILS },
      { move: p(1, 2), why: LIVE_FAILS },
    ],
    depth: 20,
    explanation:
      'Despite the size, only one point makes two eyes: directly to the right of the White stone.',
  },
  {
    id: 'false-eye-live',
    title: 'The false eye',
    category: 'false-eye',
    difficulty: 2,
    rows: ['#X.X.XX#', '.OXXXXX#', '########'],
    boardSize: 19,
    edges: top,
    toPlay: 'black',
    objective: 'live',
    target: p(3, 0),
    solutions: [p(0, 1)],
    refutations: [
      {
        move: p(4, 0),
        why: 'Filling a real eye leaves Black one eye at most, and the other is a false eye that White breaks.',
      },
      {
        move: p(2, 0),
        why: 'Connecting at the false eye wastes it: the cutting stone is still there and the group is left with one eye.',
      },
    ],
    depth: 16,
    explanation:
      'The left "eye" is false: the single Black stone at the edge is cut off by the White stone below it. Black must capture that White stone first, which also makes a real second eye.',
  },
  {
    id: 'race-1',
    title: 'Capturing race 1',
    category: 'race',
    difficulty: 2,
    rows: ['.XXOO.', '.XXOO.', '######'],
    boardSize: 19,
    edges: none,
    toPlay: 'black',
    objective: 'capture',
    target: p(3, 0),
    protect: p(1, 0),
    solutions: [p(5, 0), p(5, 1)],
    refutations: [
      { move: p(0, 0), why: RACE_FAILS },
      { move: p(0, 1), why: RACE_FAILS },
    ],
    depth: 14,
    explanation:
      'Neither group may run out of liberties first, so the order of moves decides. Only a point on the open side (either of the two points beside White) wins the capturing race for Black; every other first move loses it (each one was checked).',
  },
  {
    id: 'race-2',
    title: 'Capturing race 2',
    category: 'race',
    difficulty: 3,
    rows: ['XXX#.OOO', 'XXX..#OO', '#.X#.OOO'],
    boardSize: 19,
    edges: none,
    toPlay: 'black',
    objective: 'capture',
    target: p(5, 0),
    protect: p(0, 0),
    solutions: [p(4, 1)],
    refutations: [
      { move: p(3, 1), why: RACE_FAILS },
      { move: p(4, 2), why: RACE_FAILS },
    ],
    depth: 14,
    explanation:
      'Neither group may run out of liberties first, so the order of moves decides. Only the point in column 5, row 2 wins the capturing race for Black; every other first move loses it (each one was checked).',
  },
  {
    id: 'race-3',
    title: 'Capturing race 3',
    category: 'race',
    difficulty: 3,
    rows: ['XX.#..OO', 'X#X..OOO', 'XXX#.#OO'],
    boardSize: 19,
    edges: none,
    toPlay: 'black',
    objective: 'capture',
    target: p(6, 0),
    protect: p(0, 0),
    solutions: [p(4, 1)],
    refutations: [
      { move: p(4, 0), why: RACE_FAILS },
      { move: p(5, 0), why: RACE_FAILS },
    ],
    depth: 14,
    explanation:
      'Neither group may run out of liberties first, so the order of moves decides. Only the point in column 5, row 2 wins the capturing race for Black; every other first move loses it (each one was checked).',
  },
  {
    id: 'race-4',
    title: 'Capturing race 4',
    category: 'race',
    difficulty: 3,
    rows: ['X.#..OOO', 'XXX..OOO', '#X#..OOO'],
    boardSize: 19,
    edges: none,
    toPlay: 'black',
    objective: 'capture',
    target: p(5, 0),
    protect: p(0, 0),
    solutions: [p(3, 1)],
    refutations: [
      { move: p(3, 0), why: RACE_FAILS },
      { move: p(4, 1), why: RACE_FAILS },
    ],
    depth: 14,
    explanation:
      'Neither group may run out of liberties first, so the order of moves decides. Only the point in column 4, row 2 wins the capturing race for Black; every other first move loses it (each one was checked).',
  },
  {
    id: 'race-5',
    title: 'Capturing race 5',
    category: 'race',
    difficulty: 4,
    rows: ['XXX..OOO', 'XXX...O#', 'XX.#.#..'],
    boardSize: 19,
    edges: none,
    toPlay: 'black',
    objective: 'capture',
    target: p(5, 0),
    protect: p(0, 0),
    solutions: [p(4, 1)],
    refutations: [
      { move: p(3, 0), why: RACE_FAILS },
      { move: p(5, 1), why: RACE_FAILS },
    ],
    depth: 14,
    explanation:
      'Neither group may run out of liberties first, so the order of moves decides. Only the point in column 5, row 2 wins the capturing race for Black; every other first move loses it (each one was checked).',
  },
  {
    id: 'race-6',
    title: 'Capturing race 6',
    category: 'race',
    difficulty: 4,
    rows: ['XX#..OOO', 'XXX.#.OO', '.X.#...#'],
    boardSize: 19,
    edges: none,
    toPlay: 'black',
    objective: 'capture',
    target: p(5, 0),
    protect: p(0, 0),
    solutions: [p(5, 2)],
    refutations: [
      { move: p(3, 0), why: RACE_FAILS },
      { move: p(4, 2), why: RACE_FAILS },
    ],
    depth: 14,
    explanation:
      'Neither group may run out of liberties first, so the order of moves decides. Only the point in column 6, row 3 wins the capturing race for Black; every other first move loses it (each one was checked).',
  },
  {
    id: 'edge-stone-live',
    title: 'Four points and a stone: live',
    category: 'two-eyes',
    difficulty: 3,
    rows: ['X.O..XX', 'XXXXXXX', '#######'],
    boardSize: 19,
    edges: top,
    toPlay: 'black',
    objective: 'live',
    target: p(0, 0),
    solutions: [p(3, 0)],
    refutations: [
      { move: p(1, 0), why: LIVE_FAILS },
      { move: p(4, 0), why: LIVE_FAILS },
    ],
    depth: 16,
    explanation:
      'Of the three empty points only the one right next to the White stone gives Black two eyes.',
  },
  {
    id: 'edge-stone-kill',
    title: 'Four points and a stone: kill',
    category: 'vital-point',
    difficulty: 3,
    rows: ['XX..O.X', 'XXXXXXX', '#######'],
    boardSize: 19,
    edges: top,
    toPlay: 'white',
    objective: 'kill',
    target: p(0, 0),
    solutions: [p(3, 0)],
    refutations: [
      { move: p(2, 0), why: KILL_FAILS },
      { move: p(5, 0), why: KILL_FAILS },
    ],
    depth: 16,
    explanation:
      'White has one stone inside. The point next to it on the inside is the one that stops Black making two eyes.',
  },
  {
    id: 'edge-corner-live',
    title: 'Take the corner stone',
    category: 'two-eyes',
    difficulty: 4,
    rows: ['.O.X.XX', 'OXXXXXX', '#######'],
    boardSize: 19,
    edges: top,
    toPlay: 'black',
    objective: 'live',
    target: p(3, 0),
    solutions: [p(0, 0)],
    refutations: [
      { move: p(2, 0), why: LIVE_FAILS },
      { move: p(4, 0), why: LIVE_FAILS },
    ],
    depth: 16,
    explanation:
      'Only the corner point lives. The other points, including filling an eye, leave Black one eye short.',
  },
];

/** Problems grouped by difficulty (1 to 5), only levels that have problems. */
export const PROBLEMS_BY_DIFFICULTY: readonly {
  difficulty: 1 | 2 | 3 | 4 | 5;
  problems: readonly TsumegoProblem[];
}[] = ([1, 2, 3, 4, 5] as const)
  .map((difficulty) => ({
    difficulty,
    problems: TSUMEGO_PROBLEMS.filter((t) => t.difficulty === difficulty),
  }))
  .filter((group) => group.problems.length > 0);
