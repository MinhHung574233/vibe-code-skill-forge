import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { boardFromRows, type Board } from '../domain/board';
import { GoBoard } from './GoBoard';
import { pointName } from './labels';

const nine = (rows: string[]): Board => {
  const full = [...rows];
  while (full.length < 9) full.push('.........');
  return boardFromRows(full.map((r) => r.padEnd(9, '.')));
};

const props = {
  label: '9 by 9 Go board',
  pointLabel: (p: number) => pointName(9, p),
};

describe('GoBoard', () => {
  it('names the board and makes every empty point a labelled button in play mode', () => {
    render(<GoBoard board={nine(['X.O'])} mode="play" {...props} />);
    expect(screen.getByRole('group', { name: '9 by 9 Go board' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(81 - 2);
    expect(screen.getByRole('button', { name: 'B9, empty' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'A9, black stone' })).toBeNull();
  });

  it('in mark mode the stones are the buttons', () => {
    render(<GoBoard board={nine(['X.O'])} mode="mark" {...props} />);
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'A9, black stone' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'C9, white stone' })).toBeInTheDocument();
  });

  it('has no buttons when it is not the player turn', () => {
    render(<GoBoard board={nine([])} mode="none" {...props} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('reports taps on points', async () => {
    const onPoint = vi.fn();
    render(<GoBoard board={nine([])} mode="play" onPoint={onPoint} {...props} />);
    await userEvent.click(screen.getByRole('button', { name: 'E5, empty' }));
    expect(onPoint).toHaveBeenCalledWith(40);
  });

  it('can be played from the keyboard with arrow keys and Enter', async () => {
    const onPoint = vi.fn();
    render(<GoBoard board={nine([])} mode="play" onPoint={onPoint} {...props} />);
    screen.getByRole('group').focus();
    await userEvent.keyboard('{ArrowRight}{ArrowDown}{Enter}'); // from A9 to B8
    expect(onPoint).toHaveBeenCalledWith(9 + 1);
  });

  it('does not act on keys for an occupied point', async () => {
    const onPoint = vi.fn();
    render(<GoBoard board={nine(['X'])} mode="play" onPoint={onPoint} {...props} />);
    screen.getByRole('group').focus();
    await userEvent.keyboard('{ArrowRight}{ArrowLeft}{Enter}'); // back on the stone at A9
    expect(onPoint).not.toHaveBeenCalled();
  });

  it('crops to the playable area of a tsumego diagram', () => {
    const board = boardFromRows(['#X..#', '#XO.#', '#####']);
    render(
      <GoBoard
        board={board}
        mode="play"
        label="diagram"
        pointLabel={(p) => `p${p}`}
        edges={{ top: true, right: false, bottom: false, left: false }}
      />,
    );
    // three empty playable points; the walls are not buttons
    expect(screen.getAllByRole('button')).toHaveLength(3);
  });
});
