import { diagram, h, list, p, tip } from '../build';
import type { Chapter } from '../types';

export const SHAPES: Chapter = {
  id: 'shapes',
  title: 'Shapes and their names',
  summary: 'Two, three, four and five: the names, and which ones force a reply.',
  minutes: 3,
  blocks: [
    p(
      'Strong players think in shapes. Learn the names and you will read the board much faster. In the pictures below, the dots and letters show the squares that matter.',
    ),
    h('Two'),
    diagram({
      id: 'shapes-two',
      pattern: true,
      rows: ['.........', '...XX....', '.........'],
      caption:
        'A two: two stones side by side with room around them. It is not a threat yet, but it is how every attack starts.',
    }),
    h('Three'),
    p('Three stones in a line are where it gets serious. There are three kinds.'),
    diagram({
      id: 'shapes-open-three',
      pattern: true,
      rows: ['.........', '..XXX....', '.........'],
      marks: [
        { at: [1, 1], kind: 'move', label: 'A' },
        { at: [1, 5], kind: 'move', label: 'B' },
      ],
      claims: [
        {
          kind: 'open-four-cells',
          stone: 1,
          cells: [
            [1, 1],
            [1, 5],
          ],
        },
      ],
      caption:
        'An open three: both ends are free. Playing A or B makes an open four. If the opponent ignores it, you win.',
    }),
    diagram({
      id: 'shapes-closed-three',
      pattern: true,
      rows: ['.........', '.OXXX....', '.........'],
      claims: [{ kind: 'open-four-cells', stone: 1, cells: [] }],
      caption:
        'A closed three: one end is blocked. It can only become a closed four, so it forces nothing yet.',
    }),
    diagram({
      id: 'shapes-split-three',
      pattern: true,
      rows: ['.........', '..XX.X...', '.........'],
      marks: [{ at: [1, 4], kind: 'move', label: 'A' }],
      claims: [{ kind: 'open-four-cells', stone: 1, cells: [[1, 4]] }],
      caption:
        'A split three: a gap in the middle. Filling the gap at A makes an open four, so it is as strong as an open three.',
    }),
    h('Four'),
    diagram({
      id: 'shapes-open-four',
      pattern: true,
      rows: ['.........', '.XXXX....', '.........'],
      marks: [
        { at: [1, 0], kind: 'move', label: 'A' },
        { at: [1, 5], kind: 'move', label: 'B' },
      ],
      claims: [
        {
          kind: 'completing',
          stone: 1,
          cells: [
            [1, 0],
            [1, 5],
          ],
        },
      ],
      caption:
        'An open four: A and B both finish the five. The opponent can block only one of them, so you win.',
    }),
    diagram({
      id: 'shapes-closed-four',
      pattern: true,
      rows: ['.........', '.OXXXX...', '.........'],
      marks: [{ at: [1, 6], kind: 'move', label: 'A' }],
      claims: [{ kind: 'completing', stone: 1, cells: [[1, 6]] }],
      caption:
        'A closed four (also called a dead four): only A finishes the five. The opponent must block A at once.',
    }),
    diagram({
      id: 'shapes-split-four',
      pattern: true,
      rows: ['.........', '..XX.XX..', '.........'],
      marks: [{ at: [1, 4], kind: 'move', label: 'A' }],
      claims: [{ kind: 'completing', stone: 1, cells: [[1, 4]] }],
      caption:
        'A split four: four stones with one gap. The gap A is the only winning square, and the opponent must fill it.',
    }),
    h('Five'),
    diagram({
      id: 'shapes-five',
      pattern: true,
      rows: ['.........', '.XXXXX...', '.........'],
      marks: [1, 2, 3, 4, 5].map((c) => ({ at: [1, c] as const, kind: 'win' as const })),
      caption: 'Five in a row. The game is over.',
    }),
    h('Which shapes force a reply?'),
    list(
      'A four always forces a reply. The opponent must block it, unless they can win first.',
      'An open three forces a reply too. The opponent may block either end, or the gap of a split three.',
      'A closed three or a two forces nothing. You can ignore them for now.',
      'A five ends the game.',
    ),
    tip(
      'An open three needs room on both sides. A three beside the board edge or an obstacle may be only a closed three, because it cannot become an open four.',
    ),
  ],
};
