import { diagram, exercise, h, list, p, tip } from '../build';
import type { Chapter } from '../types';

export const COMBINATIONS: Chapter = {
  id: 'combinations',
  title: 'Winning combinations',
  summary: 'Open four, 4-3, 3-3 and 4-4: threats that cannot all be blocked.',
  minutes: 5,
  blocks: [
    p(
      'One threat can always be blocked. To win, you need a threat the opponent cannot stop. There are four ways to get one.',
    ),
    h('Open four'),
    p(
      'An open four has two finishing squares. The opponent can block only one, and you finish the other. You get an open four from an open three that the opponent ignored, or from a split three.',
    ),
    diagram({
      id: 'combo-open-four',
      rows: ['.O.......', '.XXXX....', '.....O.O.'],
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
        'Two finishing squares, A and B. Whichever one the opponent blocks, you play the other.',
    }),
    exercise({
      id: 'combo-open-four-1',
      rows: [
        '.........',
        '.........',
        '..O......',
        '...O.....',
        '..X.XX...',
        '.....O...',
        '.........',
      ],
      prompt: 'Make an open four: a four with two squares that finish the five.',
      goal: 'unstoppable-four',
      answer: [4, 3],
      because:
        'Filling the gap joins your stones into four in a row, and both ends are empty. The computer can block only one end, and you finish the other.',
      wrong: [
        {
          at: [4, 6],
          kind: 'closed-four',
          why: 'That also makes four stones, but with a gap: only one square, the gap, finishes the five. The computer fills it and your four is dead.',
        },
        {
          at: [4, 1],
          kind: 'closed-four',
          why: 'That also makes four stones, but with a gap: only one square, the gap, finishes the five. The computer fills it and your four is dead.',
        },
      ],
      otherWrong:
        'That does not make an open four. Look at your row: two stones, a gap, then two more.',
    }),
    h('Four-three (4-3)'),
    p(
      'One stone makes a four and an open three at the same time. The opponent must block the four. Then you turn the three into an open four.',
    ),
    diagram({
      id: 'combo-four-three',
      rows: [
        '..O......',
        '.......O.',
        '.........',
        'OXXX.....',
        '....X....',
        '....X..O.',
        '.O.......',
      ],
      marks: [{ at: [3, 4], kind: 'move', label: 'A' }],
      claims: [{ kind: 'forced-win', stone: 1, at: [3, 4] }],
      caption:
        'A makes a four in the row (the left end is blocked, so only one square finishes it) and an open three in the column. The opponent must block the four, and then the column becomes an open four.',
    }),
    exercise({
      id: 'combo-four-three-1',
      rows: [
        '....O....',
        '.O..X....',
        '....X.O..',
        '....X....',
        '.XX......',
        '.........',
        '..O...O..',
      ],
      prompt: 'Find the move that makes a four and an open three at the same time (a 4-3).',
      goal: 'four-three',
      answer: [4, 4],
      because:
        'The column becomes four, with one open end, so the computer must block below it. Your row now has a split three with open ends. Next you fill its gap for an open four, and nothing can stop it.',
      wrong: [
        {
          at: [5, 4],
          kind: 'closed-four',
          why: 'That also makes a four, but the computer blocks the gap, which is exactly the square your row needed. You are left with nothing.',
        },
        {
          at: [4, 3],
          why: 'That makes a three in the row but no four. The computer has time to block it.',
        },
      ],
      otherWrong: 'Look for the square where your column and your row meet.',
    }),
    h('Three-three (3-3)'),
    p(
      'One stone makes two open threes at once. The opponent can block only one. You turn the other into an open four.',
    ),
    p(
      'In this app a 3-3 or a 4-4 is always allowed. Some tournament rules ban them for the first player, but not here.',
    ),
    diagram({
      id: 'combo-three-three',
      rows: [
        '.........',
        '.........',
        '..X...X..',
        '...X.X...',
        '.........',
        '.........',
        '.........',
      ],
      marks: [{ at: [4, 4], kind: 'move', label: 'A' }],
      claims: [{ kind: 'forced-win', stone: 1, at: [4, 4] }],
      pattern: true,
      caption:
        'Two diagonals cross at A. Playing A makes two open threes at once, a V shape. The opponent blocks one, and you make an open four with the other.',
    }),
    exercise({
      id: 'combo-three-three-1',
      rows: [
        '.........',
        '......O..',
        '..X......',
        '.O.X.....',
        '.....XX..',
        '.........',
        '...O...O.',
      ],
      prompt: 'Find the move that makes two open threes at once (a 3-3).',
      goal: 'three-three',
      answer: [4, 4],
      because:
        'This stone adds a third stone to the diagonal and a third stone to the row. Both threes are open. The computer can block only one, and you turn the other into an open four.',
      wrong: [
        {
          at: [1, 1],
          why: 'That makes only one three, on the diagonal. The computer blocks it and you have nothing left.',
        },
        {
          at: [4, 7],
          why: 'That makes only one three, in the row. A single threat is easy to block.',
        },
      ],
      otherWrong: 'Look for the square that sits on two of your lines at once.',
    }),
    h('Four-four (4-4)'),
    p(
      'One stone makes two fours at once. Each four has its own finishing square, and the opponent can block only one.',
    ),
    diagram({
      id: 'combo-four-four',
      rows: [
        'O.......O',
        '.....O...',
        '.........',
        '.........',
        '.....XXXO',
        '....X....',
        '....X....',
        '....X....',
        'O...O....',
      ],
      marks: [{ at: [4, 4], kind: 'move', label: 'A' }],
      claims: [{ kind: 'forced-win', stone: 1, at: [4, 4] }],
      caption:
        'A makes a four in the row and a four in the column. The row needs the square to its left, the column the square above it. The opponent cannot block both.',
    }),
    exercise({
      id: 'combo-four-four-1',
      rows: [
        '....O....',
        '....X....',
        'O...X....',
        '....X..O.',
        '.........',
        'OXXX.....',
        '.......O.',
        '.....O...',
      ],
      prompt: 'Find the move that makes two fours at once (a 4-4).',
      goal: 'unstoppable-four',
      answer: [5, 4],
      because:
        'The row becomes four and needs the square to its right. The column becomes four with a gap and needs the square above. Two different finishing squares: the computer can block only one.',
      wrong: [
        {
          at: [4, 4],
          kind: 'closed-four',
          why: 'That makes a four in the column only. The computer blocks the square below it, which is also the square your row needed.',
        },
        {
          at: [5, 5],
          kind: 'closed-four',
          why: 'That makes a four in the row only, with a gap. The computer fills the gap, which also kills your column.',
        },
      ],
      otherWrong: 'Find the square where your row and your column both become four.',
    }),
    h('Tempo: keep the initiative'),
    p(
      'The player who makes threats while the opponent only answers has the initiative. In Japanese this is called sente. Every four forces a reply, and so does every open three. After the reply it is your move again, so you keep the initiative.',
    ),
    list(
      'Attack: make threats that the opponent must answer.',
      'Do not waste your fours. A four that is blocked is gone. Spend it when it finishes the game or builds a second line.',
      'Defend: answer a threat with a move that also builds your own line, if you can.',
    ),
    tip(
      'Before you make a threat, ask yourself: after the reply, do I have another threat? If yes, keep going. If not, you may be handing the move to your opponent.',
    ),
  ],
};
