import type { CaroRule } from '../domain/rules';

/** `[row, column]` inside a diagram window, both counted from 0 at the top-left. */
export type Spot = readonly [number, number];

export type Edge = 'top' | 'bottom' | 'left' | 'right';

/**
 * What a marked cell means. Each kind has its own SHAPE as well as its own colour:
 * move = dashed square, win = ring, end = cross, key = dot, bad = dashed square with a cross.
 */
export type MarkKind = 'move' | 'win' | 'end' | 'key' | 'bad';

export interface Mark {
  readonly at: Spot;
  readonly kind: MarkKind;
  /** Short text drawn inside a `move` mark ("A", "1"), also read out by screen readers. */
  readonly label?: string;
}

/**
 * Something a diagram says in its caption that the tests prove with the real rules. `stone` is
 * 1 (filled, moves first) or 2 (ring). Cells are window spots.
 */
export type Claim =
  /** `stone` playing at `at` completes a run that WINS under the diagram's rule. */
  | { readonly kind: 'wins'; readonly stone: 1 | 2; readonly at: Spot }
  /** `stone` playing at `at` makes five or more, but the rule rejects it (both ends walled). */
  | { readonly kind: 'dead-five'; readonly stone: 1 | 2; readonly at: Spot }
  /** The cells where `stone` would win next move are exactly these (a four has one or more). */
  | { readonly kind: 'completing'; readonly stone: 1 | 2; readonly cells: readonly Spot[] }
  /** The cells where `stone` makes an OPEN four (two ways to finish) are exactly these. */
  | { readonly kind: 'open-four-cells'; readonly stone: 1 | 2; readonly cells: readonly Spot[] }
  /** Playing `at` leaves no defence: the tests find a forced win (open four, 4-3 or 3-3). */
  | { readonly kind: 'forced-win'; readonly stone: 1 | 2; readonly at: Spot };

export interface Diagram {
  readonly id: string;
  /** The window, one string per row: X first-player stone, O second-player stone, # blocked, . empty. */
  readonly rows: readonly string[];
  /** Sides of the window that are the real edge of the board (the others just stop the picture). */
  readonly edges?: readonly Edge[];
  /** Board the window belongs to; 15 when omitted. A window with real edges on opposite sides IS the board. */
  readonly board?: 9 | 15 | 19;
  readonly rule?: CaroRule;
  readonly marks?: readonly Mark[];
  /** A teaching shape rather than a position from a game: stone counts need not be balanced. */
  readonly pattern?: boolean;
  /** What to notice. Translated. */
  readonly caption: string;
  readonly claims?: readonly Claim[];
}

/** The property a tapped cell must have to be the answer. Each is proven in the content tests. */
export type Goal =
  /** Makes five (or more) that wins under the rule. */
  | 'five'
  /** Leaves the opponent no way to win next move and gives two ways to win (open four, 4-4). */
  | 'unstoppable-four'
  /** A four plus a three: the forced reply cannot stop the next open four (found by search). */
  | 'four-three'
  /** Two open threes at once: every reply leaves a way to an open four. */
  | 'three-three'
  /** Takes away the only cell where the opponent completes five. */
  | 'block-four'
  /** After it, the opponent has no forced win (no open four, no 4-3, no fours chain). */
  | 'safe';

/** How a wrong answer fails; the tests prove it with the rules. */
export type WrongKind =
  /** Makes five, but both ends are walled so it does not win. */
  | 'dead-five'
  /** Makes a four with one finishing cell: the opponent just blocks it. */
  | 'closed-four'
  /** Leaves the opponent a cell where they make five. */
  | 'leaves-five'
  /** Leaves the opponent a forced win (open four, 4-3, 3-3...). */
  | 'opponent-forces'
  /** Makes a four that the blocked rule makes harmless: its only finishing cell is a dead five. */
  | 'dead-four'
  /** Blocks a five that could not win anyway (the opponent's five would be walled at both ends). */
  | 'wasted-block';

export interface WrongAnswer {
  readonly at: Spot;
  readonly kind?: WrongKind;
  /** Why this particular move fails. Translated. */
  readonly why: string;
}

export interface Exercise {
  readonly id: string;
  readonly rows: readonly string[];
  readonly edges?: readonly Edge[];
  readonly board?: 9 | 15 | 19;
  readonly rule?: CaroRule;
  /** Asked above the board. Translated. */
  readonly prompt: string;
  readonly goal: Goal;
  readonly answer: Spot;
  /** Why the answer works. Translated. */
  readonly because: string;
  readonly wrong: readonly WrongAnswer[];
  /** Said for any other wrong tap. Translated. */
  readonly otherWrong: string;
}

export type Block =
  | { readonly kind: 'p'; readonly text: string }
  | { readonly kind: 'h'; readonly text: string }
  | { readonly kind: 'list'; readonly items: readonly string[] }
  | { readonly kind: 'tip'; readonly text: string }
  | { readonly kind: 'diagram'; readonly diagram: Diagram }
  | { readonly kind: 'exercise'; readonly exercise: Exercise };

export type ChapterId =
  | 'basics'
  | 'rules'
  | 'shapes'
  | 'combinations'
  | 'defence'
  | 'openings'
  | 'obstacles'
  | 'beat-the-app';

export interface Chapter {
  readonly id: ChapterId;
  readonly title: string;
  readonly summary: string;
  readonly minutes: number;
  readonly blocks: readonly Block[];
}
