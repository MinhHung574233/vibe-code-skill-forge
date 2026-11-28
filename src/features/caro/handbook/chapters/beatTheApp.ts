import { diagram, h, list, p, tip } from '../build';
import type { Chapter } from '../types';

export const BEAT_THE_APP: Chapter = {
  id: 'beat-the-app',
  title: 'How to beat the app',
  summary: 'Honest tips about how the computer plays, and how to find its weak spots.',
  minutes: 3,
  blocks: [
    p(
      'No trick wins every game. But once you know how the computer thinks, you can play to its weak spots. These tips come from how the engine is built, not from guesses.',
    ),
    h('How the computer plays'),
    list(
      'At every move it first asks two questions. Can I make five? Must I block a four? Only then does it search.',
      'It looks several moves ahead. Easy looks about two moves ahead, Medium about six and Hard up to about twelve.',
      'Medium and Hard also look for a win made only of fours, a chain of fours that ends in a five or in a double threat.',
      'Hard thinks for up to about a second per move.',
    ),
    h('Its strong points'),
    list(
      'It never forgets a four. Even Easy blocks your four and completes its own five. Do not hope for a missed four.',
      'It is very good at forced sequences. A loose attack made of fours that do not lead to a win just burns your fours, and it will answer each one.',
      'It is strong at defending a single threat. One open three on its own will be blocked.',
    ),
    h('Its weak points'),
    list(
      'Easy sometimes plays a weaker move on purpose. On Easy you may also use undo, so you can try an idea and take it back.',
      'The engine searches forcing moves much deeper than quiet moves. A plan that needs several quiet moves to set up may be beyond what it sees.',
    ),
    h('A plan that works'),
    list(
      'Build with quiet stones. Put stones so that two of your lines cross at an empty square. Make your first double threat from stones that look harmless.',
      'Then make the double threat: a 4-3, a 3-3 or a 4-4. A single threat gets blocked. A double threat cannot.',
      'Hold the initiative. Make the computer answer you, and do not waste your fours.',
      'Check its replies. After each move, look at what its new stone does. It often blocks and builds at the same time.',
      'Check threats in the same order every move: its fours, its open threes, and only then your own plans.',
    ),
    diagram({
      id: 'beat-quiet-stones',
      rows: [
        'O.......O',
        '.........',
        '.........',
        '..XX.....',
        '....X....',
        '....X....',
        'O.......O',
      ],
      marks: [{ at: [3, 4], kind: 'move', label: 'A' }],
      claims: [{ kind: 'forced-win', stone: 1, at: [3, 4] }],
      caption:
        'Four quiet stones that look harmless: a pair in a row and a pair in a column. Playing A makes two open threes at once.',
    }),
    h('How to practise'),
    list(
      'Start on Easy and use undo to learn. When you win often, move up to Medium, then Hard.',
      'Play first against Hard: moving first is an advantage. Later try playing second.',
      'Take your time. The computer never gets tired, but you do. Read every move.',
    ),
    tip(
      'Lost a game? Look for the move where it first got a four-three or a three-three. Ask what you could have blocked a move earlier.',
    ),
  ],
};
