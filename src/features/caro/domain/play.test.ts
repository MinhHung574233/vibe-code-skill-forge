import { describe, expect, it } from 'vitest';
import { replay } from './game';
import { canUndo, computerStone, outcomeOf, undoPair, type CaroSetup } from './play';

const setup = (over: Partial<CaroSetup> = {}): CaroSetup => ({
  size: 15,
  level: 'easy',
  humanStone: 1,
  ...over,
});

describe('outcomeOf', () => {
  it('is null while playing and otherwise from the person’s side', () => {
    expect(outcomeOf({ kind: 'playing' }, 1)).toBeNull();
    expect(outcomeOf({ kind: 'draw' }, 1)).toBe('draw');
    expect(outcomeOf({ kind: 'won', winner: 1, line: [] }, 1)).toBe('win');
    expect(outcomeOf({ kind: 'won', winner: 1, line: [] }, 2)).toBe('loss');
  });

  it('names the computer stone', () => {
    expect(computerStone(setup({ humanStone: 2 }))).toBe(1);
  });
});

describe('undo (Easy only, whole pairs, person’s turn)', () => {
  it('takes back the person’s move and the reply', () => {
    const g = replay(15, [112, 113, 97, 98]); // person (1), computer (2), person, computer
    expect(canUndo(g, setup())).toBe(true);
    expect(undoPair(g).moves).toEqual([112, 113]);
  });

  it('is not offered on harder levels, mid-reply, or with nothing to take back', () => {
    const g = replay(15, [112, 113]);
    expect(canUndo(g, setup({ level: 'medium' }))).toBe(false);
    expect(canUndo(g, setup({ level: 'hard' }))).toBe(false);
    expect(canUndo(replay(15, [112]), setup())).toBe(false); // computer's turn
    expect(canUndo(replay(15, []), setup())).toBe(false);
  });

  it('cannot undo the computer’s opening move when the computer starts', () => {
    const computerFirst = setup({ humanStone: 2 });
    expect(canUndo(replay(15, [112]), computerFirst)).toBe(false);
    expect(canUndo(replay(15, [112, 113, 97]), computerFirst)).toBe(true);
    expect(undoPair(replay(15, [112, 113, 97])).moves).toEqual([112]);
  });
});
