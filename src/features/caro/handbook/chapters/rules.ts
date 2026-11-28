import { diagram, h, list, p, tip } from '../build';
import type { Chapter } from '../types';

export const RULES: Chapter = {
  id: 'rules',
  title: 'Rule variants',
  summary: 'Freestyle, blocked ends (chặn hai đầu) and obstacle squares.',
  minutes: 4,
  blocks: [
    p(
      'Caro is played with slightly different rules in different places. The app knows two ways to decide a win, and it can add obstacle squares to the board.',
    ),
    h('Freestyle'),
    p(
      'Five or more stones in a row win. Nothing else matters. It does not matter what stands at the ends of the row.',
    ),
    diagram({
      id: 'rules-freestyle',
      rule: 'freestyle',
      rows: ['O........', '.OXXXX.O.', '........O'],
      marks: [{ at: [1, 6], kind: 'move', label: 'A' }],
      claims: [{ kind: 'wins', stone: 1, at: [1, 6] }],
      caption:
        'Freestyle: the first player plays A and makes five. Both ends are blocked by hollow stones, but it still wins.',
    }),
    h('Blocked ends (chặn hai đầu)'),
    p(
      'Many Vietnamese players know this rule as chặn hai đầu. Now you must look at the two squares at the ends of your row. A row of five or more wins unless both ends are blocked.',
    ),
    p(
      'An end is blocked when an opponent stone or an obstacle square stands there. One blocked end is fine: you still win. Two blocked ends: the five does not count, and the game simply goes on.',
    ),
    diagram({
      id: 'rules-blocked-one',
      rule: 'blocked',
      rows: ['O.......O', '.OXXXX...', '.O.......'],
      marks: [
        { at: [1, 6], kind: 'move', label: 'A' },
        { at: [1, 1], kind: 'end' },
        { at: [1, 7], kind: 'key' },
      ],
      claims: [{ kind: 'wins', stone: 1, at: [1, 6] }],
      caption:
        'Blocked ends: one end is blocked (the cross), the other is free (the dot). A makes five and wins.',
    }),
    diagram({
      id: 'rules-blocked-both',
      rule: 'blocked',
      rows: ['O........', '.OXXXX.O.', '........O'],
      marks: [
        { at: [1, 6], kind: 'move', label: 'A' },
        { at: [1, 1], kind: 'end' },
        { at: [1, 7], kind: 'end' },
      ],
      claims: [{ kind: 'dead-five', stone: 1, at: [1, 6] }],
      caption:
        'The same row, but now both ends are blocked (two crosses). A makes five, but it does not win.',
    }),
    p(
      'The edge of the board is not a blocker. A five that touches the edge always wins, because at most one of its ends can be blocked.',
    ),
    diagram({
      id: 'rules-blocked-edge',
      rule: 'blocked',
      edges: ['left'],
      rows: ['.......O.', 'XXXX.O...', '....O...O'],
      marks: [
        { at: [1, 4], kind: 'move', label: 'A' },
        { at: [1, 5], kind: 'end' },
      ],
      claims: [{ kind: 'wins', stone: 1, at: [1, 4] }],
      caption:
        'The left end of this five is the edge of the board (the thick line). The edge is not a blocker, so only one end is blocked and A wins.',
    }),
    h('Obstacle squares'),
    p(
      'Some games have obstacle squares. They are drawn with a hatch pattern. Nobody can play on them. A line of stones cannot pass through one. Under the blocked rule an obstacle also counts as a blocker at the end of a row.',
    ),
    diagram({
      id: 'rules-obstacle-kills',
      pattern: true,
      rows: ['.........', '.XX#XX...', '.........'],
      claims: [{ kind: 'completing', stone: 1, cells: [] }],
      caption:
        'An obstacle cuts a line in two. These four stones look close to a five, but they can never make one.',
    }),
    diagram({
      id: 'rules-obstacle-wall',
      rule: 'blocked',
      rows: ['O.......O', '.OXXXX.#.', '........O'],
      marks: [
        { at: [1, 6], kind: 'move', label: 'A' },
        { at: [1, 1], kind: 'end' },
        { at: [1, 7], kind: 'end' },
      ],
      claims: [{ kind: 'dead-five', stone: 1, at: [1, 6] }],
      caption:
        'An obstacle works as a wall. Here it blocks one end and an opponent stone blocks the other, so five at A does not win.',
    }),
    list(
      'Freestyle: five or more wins, always.',
      'Blocked ends: five or more wins unless both ends are blocked.',
      'Obstacles: nobody plays there, lines cannot cross them, and they block the end of a row.',
    ),
    tip(
      'Before you play, check which rule the game uses. The same five can win in one rule and not in the other.',
    ),
  ],
};
