import { diagram, h, list, p, tip } from '../build';
import type { Chapter } from '../types';

export const OPENINGS: Chapter = {
  id: 'openings',
  title: 'Opening principles',
  summary: 'The first moves: centre, connection, shape and the initiative.',
  minutes: 3,
  blocks: [
    p(
      'The first few moves decide who gets the initiative. You do not need to memorise openings. A few simple habits will take you far.',
    ),
    list(
      'Play near the centre. A stone in the centre touches many lines. A stone near the edge has little room.',
      "Stay connected. Play close to your own stones and to your opponent's stones. A stone far away does nothing.",
      'Build shape, not solid rows. Two stones with one gap, or on a diagonal, are flexible and hard to block. A solid row of three is easy to block.',
      'Make every stone work in more than one direction. A stone that is part of two lines is worth twice as much.',
      'Take the initiative early. Make small threats that the opponent must answer, so that you decide where the game is played.',
    ),
    h('The first stones'),
    p('The first player usually starts in the centre of the board.'),
    diagram({
      id: 'openings-centre',
      rows: ['.......', '.......', '.......', '...X...', '.......', '.......', '.......'],
      caption: 'The first stone goes in the centre. From here it can reach every direction.',
    }),
    p(
      "The second player's first stone touches the centre stone. If it touches from the side (up, down, left or right), the opening is called direct. If it touches at a corner, along a diagonal, it is called indirect.",
    ),
    diagram({
      id: 'openings-direct',
      rows: ['.......', '.......', '.......', '...XO..', '.......', '.......', '.......'],
      caption: 'A direct opening: the hollow stone touches the filled stone from the side.',
    }),
    diagram({
      id: 'openings-indirect',
      rows: ['.......', '.......', '.......', '...X...', '....O..', '.......', '.......'],
      caption: 'An indirect opening: the hollow stone touches the filled stone at a corner.',
    }),
    p(
      'Strong players give names to every third move of both kinds. You do not need them. Remember the ideas: stay close, stay near the centre, and look for lines that cross.',
    ),
    h('Shape'),
    diagram({
      id: 'openings-shape',
      rows: ['.......', '.....O.', '.......', '...X.X.', '.......', '.....X.', '.O.....'],
      marks: [
        { at: [3, 4], kind: 'key' },
        { at: [4, 5], kind: 'key' },
        { at: [4, 4], kind: 'key' },
      ],
      caption:
        'Three stones, each pair on a line with one gap (the dots). Every gap is a future three, and the stones work together in three directions.',
    }),
    tip(
      'As the second player, stay close and wait. The first player will often make a loose move, and then you can take the initiative.',
    ),
  ],
};
