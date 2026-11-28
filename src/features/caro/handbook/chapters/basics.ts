import { diagram, h, list, p, tip } from '../build';
import type { Chapter } from '../types';

export const BASICS: Chapter = {
  id: 'basics',
  title: 'The goal and the basics',
  summary: 'Five in a row, who moves first, and the three board sizes.',
  minutes: 2,
  blocks: [
    p(
      'Caro (also called gomoku) is a game for two. You take turns putting one stone on an empty square. The first player to make a row of five of their own stones wins.',
    ),
    p(
      'The row can run across, up and down, or along a diagonal. The five stones must touch each other with no gap.',
    ),
    diagram({
      id: 'basics-lines',
      pattern: true,
      rows: [
        '.........',
        'XXXXX....',
        '.........',
        'X......X.',
        '.X.....X.',
        '..X....X.',
        '...X...X.',
        '....X..X.',
        '.........',
      ],
      marks: [
        ...[0, 1, 2, 3, 4].map((c) => ({ at: [1, c] as const, kind: 'win' as const })),
        ...[3, 4, 5, 6, 7].map((r) => ({ at: [r, 7] as const, kind: 'win' as const })),
        ...[0, 1, 2, 3, 4].map((i) => ({ at: [3 + i, i] as const, kind: 'win' as const })),
      ],
      caption:
        'Three winning fives: across, up and down, and along a diagonal. The green ring marks each line.',
    }),
    h('Who plays what'),
    p(
      'The first player moves first and plays the filled stones. The second player plays the hollow stones. Moving first is an advantage, because you are always one move ahead. As the second player, defend carefully and wait for a chance.',
    ),
    p('If the board fills up and nobody has five, the game is a draw.'),
    h('Board sizes'),
    list(
      '15 by 15 is the standard board. It has room for long plans.',
      '9 by 9 is a fast game. The edges come into play quickly, so every move counts.',
      '19 by 19 is the large board. There is plenty of room, so attacks take longer to build.',
    ),
    diagram({
      id: 'basics-board9',
      board: 9,
      edges: ['top', 'bottom', 'left', 'right'],
      rows: [
        '.........',
        '.........',
        '.........',
        '.........',
        '....X....',
        '.........',
        '.........',
        '.........',
        '.........',
      ],
      caption:
        'A whole 9 by 9 board. The thick line is the edge of the board. The first stone usually goes in the centre.',
    }),
    h('Every move has two jobs'),
    p(
      'On each turn you can build your own row, or stop your opponent. The best moves often do both at once. The next chapters teach you the shapes to look for.',
    ),
    tip(
      'Read the board before every move. First look at what your opponent threatens, then at what you can make.',
    ),
  ],
};
