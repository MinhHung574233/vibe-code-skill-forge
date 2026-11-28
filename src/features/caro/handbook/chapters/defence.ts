import { diagram, exercise, h, list, p, tip } from '../build';
import type { Chapter } from '../types';

export const DEFENCE: Chapter = {
  id: 'defence',
  title: 'Defence',
  summary: 'Block fours, handle open threes, counter-attack, and do not block too early.',
  minutes: 4,
  blocks: [
    p(
      'Defence is half of Caro. A good defender does not just stop threats: they choose the block that helps them.',
    ),
    h('Block a four at once'),
    p(
      'If the opponent has a four, you must stop the finishing square this move, unless you can win first. There is no second chance. Look carefully: a split four hides its finishing square in the middle of the row.',
    ),
    diagram({
      id: 'defence-four',
      rows: ['X.......X', '.XOOOO..X', '.........'],
      marks: [{ at: [1, 6], kind: 'move', label: 'A' }],
      claims: [{ kind: 'completing', stone: 2, cells: [[1, 6]] }],
      caption:
        'The hollow stones have a closed four. A is the only square that finishes it, so A is where you block.',
    }),
    exercise({
      id: 'defence-block-four-1',
      rows: [
        '.........',
        '.......X.',
        '..O..X...',
        '...O.....',
        '.X.......',
        '.....O...',
        '...X..O..',
        '.........',
      ],
      prompt: 'The computer has four hollow stones on a diagonal, with a gap. Stop the five.',
      goal: 'block-four',
      answer: [4, 4],
      because:
        'The diagonal has four stones and one gap. The gap is the only square that makes five, so filling it is the only way to stop it.',
      wrong: [
        {
          at: [1, 1],
          kind: 'leaves-five',
          why: 'That blocks one end, but the computer still fills the gap and makes five.',
        },
        {
          at: [7, 7],
          kind: 'leaves-five',
          why: 'That blocks one end, but the computer still fills the gap and makes five.',
        },
      ],
      otherWrong: 'The computer will make five next move. Find the square that completes its five.',
    }),
    exercise({
      id: 'defence-win-first-1',
      rows: [
        '.........',
        '.........',
        '...OOO...',
        '.........',
        '.........',
        'OXXXX....',
        '.........',
      ],
      prompt: 'You have a four, and the computer has an open three. What do you play?',
      goal: 'five',
      answer: [5, 5],
      because:
        'You have a four, so you can make five right now. A win beats every defence. Always check for your own five before you block.',
      wrong: [
        {
          at: [2, 2],
          why: 'Blocking the three is a good habit, but here you can win at once. Always look for your own five first.',
        },
        {
          at: [2, 6],
          why: 'Blocking the three is a good habit, but here you can win at once. Always look for your own five first.',
        },
      ],
      otherWrong: 'Look at your own row of four stones. Is there a square that makes five?',
    }),
    h('Facing an open three'),
    p(
      'An open three must be answered now, or the opponent makes an open four. You can block either end. For a split three you can also fill the gap.',
    ),
    diagram({
      id: 'defence-open-three',
      pattern: true,
      rows: ['.........', '..OOO....', '.........'],
      marks: [
        { at: [1, 1], kind: 'move', label: 'A' },
        { at: [1, 5], kind: 'move', label: 'B' },
      ],
      claims: [
        {
          kind: 'open-four-cells',
          stone: 2,
          cells: [
            [1, 1],
            [1, 5],
          ],
        },
      ],
      caption:
        'Blocking at A or at B both stop the open four. Which one? The one that also hurts the opponent, or helps you.',
    }),
    p(
      'Look at the opponent’s other stones. If one end of the three is also on another of their lines, block that end. You stop two lines with one stone.',
    ),
    exercise({
      id: 'defence-key-end-1',
      rows: [
        '...X.....',
        '.........',
        '..X...O..',
        '......O..',
        '...OOO...',
        '.......X.',
        '..X....X.',
        '.........',
      ],
      prompt:
        'The computer has an open three in the row and two stones in the column. Where do you block?',
      goal: 'safe',
      answer: [4, 6],
      because:
        'Both ends of the three stop it, but the right end is also where the column would join in. By taking it you stop the three and break the second line at the same time.',
      wrong: [
        {
          at: [4, 2],
          kind: 'opponent-forces',
          why: 'That stops one end, but the computer plays the other end. It makes a four and a three together (a 4-3) and wins.',
        },
        {
          at: [4, 7],
          kind: 'opponent-forces',
          why: 'That is too far. The computer plays the key square and makes a four and a three together (a 4-3).',
        },
        {
          at: [1, 6],
          kind: 'opponent-forces',
          why: 'That stops the column, but the row is still an open three. The computer makes an open four.',
        },
      ],
      otherWrong:
        'The computer keeps a winning move after that. Find the end of the row that is also on its second line.',
    }),
    h('Counter-attack'),
    p(
      'Blocking is not the only answer. A four forces the opponent to reply, so if your fours lead to a win, play them. But check carefully. A counter-attack works only if you win before the opponent’s threat becomes a four of their own that you have to answer.',
    ),
    exercise({
      id: 'defence-counter-1',
      rows: [
        '.........',
        '......O..',
        '....X....',
        '....X....',
        'OXXX.....',
        '.........',
        '.OOO.....',
      ],
      prompt: 'The computer has an open three, but you have a faster win. Find the move.',
      goal: 'four-three',
      answer: [4, 4],
      because:
        'Your row becomes a four, so the computer must block it. That block does not stop your column, which is now an open three. You make an open four next, and you win before the computer’s three matters.',
      wrong: [
        {
          at: [6, 0],
          why: 'Blocking is slow here. You have a faster win: a four first, then an open four.',
        },
        {
          at: [6, 4],
          why: 'Blocking is slow here. You have a faster win: a four first, then an open four.',
        },
      ],
      otherWrong: 'Look for the square that makes a four in the row and a three in the column.',
    }),
    h('Do not block too early'),
    p(
      'You do not need to block a two, or a closed three. If you block every small shape, the opponent keeps the initiative and builds somewhere else. Block when a shape becomes a real threat: an open three or a four.',
    ),
    diagram({
      id: 'defence-closed-three',
      pattern: true,
      rows: ['.........', '.XOOO....', '.........'],
      claims: [{ kind: 'open-four-cells', stone: 2, cells: [] }],
      caption:
        'This closed three is not urgent. The hollow stones can make only a closed four, and you can block that when it comes.',
    }),
    list(
      'A four: block it now.',
      'An open three: block it now, with the best end.',
      'A closed three or a two: keep building your own attack.',
    ),
    tip(
      'Before you block, check whether you have a four or an open four of your own. Attack first, defend second.',
    ),
  ],
};
