import { diagram, exercise, h, list, p, tip } from '../build';
import type { Chapter } from '../types';

export const OBSTACLES: Chapter = {
  id: 'obstacles',
  title: 'Obstacles and the blocked rule',
  summary: 'Check both ends, use walls, and avoid dead lines.',
  minutes: 4,
  blocks: [
    p(
      'In the blocked-ends rule, stones of the opponent act as walls, and so do obstacle squares. A row that wins in one place can be worthless in another. This chapter is about reading the walls.',
    ),
    h('Check both ends before you celebrate'),
    p(
      'Every time you make five, look at the two squares at its ends. If both are walls, the five does not win and the game goes on. The same is true for your opponent.',
    ),
    exercise({
      id: 'obstacles-both-ends-1',
      rule: 'blocked',
      rows: [
        '.........',
        'O........',
        '.OXXXX.#.',
        '.....X...',
        '.....X.O.',
        '.O...X...',
        '.....O.O.',
        '..O......',
      ],
      prompt: 'Blocked-ends rule. Find the five that really wins.',
      goal: 'five',
      answer: [1, 5],
      because:
        'The five in the column has a free square above it. Only one end is blocked, so the five wins.',
      wrong: [
        {
          at: [2, 6],
          kind: 'dead-five',
          why: 'That makes five in the row, but both ends are blocked: an opponent stone on the left and an obstacle on the right. It does not win.',
        },
      ],
      otherWrong: 'That does not make five. Count the stones in the column.',
    }),
    h('Some fours are harmless'),
    p(
      'A four is only a threat if its finishing square makes a five that wins. If both ends of that five would be walls, the four threatens nothing. You do not have to block it.',
    ),
    diagram({
      id: 'obstacles-dead-four',
      rule: 'blocked',
      rows: ['X.......X', '.#OOOO.X.', '.......X.'],
      marks: [{ at: [1, 6], kind: 'key' }],
      claims: [{ kind: 'dead-five', stone: 2, at: [1, 6] }],
      caption:
        'The hollow stones have four in a row, but the left end is an obstacle and the right end is a filled stone. If they play the dot, the five is blocked at both ends and does not win.',
    }),
    exercise({
      id: 'obstacles-dead-four-1',
      rule: 'blocked',
      rows: [
        '.........',
        '.........',
        '.........',
        '.#OOOO.X.',
        '.........',
        '.X.XX....',
        '.........',
      ],
      prompt:
        'Blocked-ends rule. The computer has four in a row. Do you need to block it? Make an open four.',
      goal: 'unstoppable-four',
      answer: [5, 2],
      because:
        'The four of the computer has an obstacle on one end and your stone on the other. Even if it fills the gap, that five is blocked at both ends and does not win. So you ignore it and make an open four.',
      wrong: [
        {
          at: [3, 6],
          kind: 'wasted-block',
          why: 'That blocks a five that could never win. You wasted your move.',
        },
        {
          at: [5, 5],
          kind: 'closed-four',
          why: 'That only makes a closed four. The computer fills the gap and your four is dead.',
        },
      ],
      otherWrong: 'Do not block. Look for the move that gives you two ways to finish a five.',
    }),
    h('Use obstacles as walls'),
    list(
      'Build towards open space. A row that points at an obstacle loses one end.',
      'Push your opponent towards obstacles. Their row that runs into an obstacle needs its other end free. Block it there and the row is dead.',
      'Count the free squares in a line. You need at least five in a row, and at least one free end when you finish.',
    ),
    diagram({
      id: 'obstacles-wall',
      rule: 'blocked',
      pattern: true,
      rows: ['.........', '#XXX.....', '.........'],
      claims: [{ kind: 'open-four-cells', stone: 1, cells: [] }],
      caption:
        'An obstacle at the end of a three. It is only a closed three: it can become a closed four, but it never becomes an open four.',
    }),
    h('Avoid lines whose both ends are dead'),
    p(
      'Before you spend stones on a row, check that you can still finish it. If the room between two walls is smaller than five squares, the row can never win.',
    ),
    diagram({
      id: 'obstacles-lane',
      rule: 'blocked',
      pattern: true,
      rows: ['.........', '#.XX.#...', '.........'],
      claims: [
        { kind: 'completing', stone: 1, cells: [] },
        { kind: 'open-four-cells', stone: 1, cells: [] },
      ],
      caption:
        'Only four free squares between two obstacles. No five fits here, however many stones you add. Do not waste moves on this line.',
    }),
    exercise({
      id: 'obstacles-real-four-1',
      rule: 'blocked',
      rows: [
        '.........',
        '#.XXX.O..',
        '.........',
        '....X....',
        '....X..O.',
        '.O.......',
        '.O.......',
        '.......O.',
      ],
      prompt: 'Blocked-ends rule. Make an open four that really wins.',
      goal: 'unstoppable-four',
      answer: [2, 4],
      because:
        'The column becomes four in a row, and both ends are free. Whichever end the computer blocks, you finish the other.',
      wrong: [
        {
          at: [1, 5],
          kind: 'dead-four',
          why: 'That makes four in the row, but the five would be blocked at both ends, by an obstacle and by a hollow stone. It threatens nothing.',
        },
        {
          at: [1, 1],
          kind: 'dead-four',
          why: 'That makes four in the row, but the five would be blocked at both ends, by an obstacle and by a hollow stone. It threatens nothing.',
        },
      ],
      otherWrong: 'Look for a line where the five can still be finished with a free end.',
    }),
    tip(
      'Walls change what counts as a threat. Before you attack or defend, ask: if this five is made, would it win?',
    ),
  ],
};
