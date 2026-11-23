import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NumberStepper } from './NumberStepper';

const setup = (value: number, onChange = vi.fn()) => {
  render(
    <NumberStepper
      label="daily goal"
      value={value}
      min={5}
      max={20}
      step={5}
      format={(v) => `${v} min`}
      onChange={onChange}
    />,
  );
  return onChange;
};

describe('NumberStepper', () => {
  it('shows the formatted value in a labelled group', () => {
    setup(10);
    expect(screen.getByRole('group', { name: 'daily goal' })).toBeInTheDocument();
    expect(screen.getByText('10 min')).toBeInTheDocument();
  });

  it('steps up and down by the step size', async () => {
    const onChange = setup(10);
    await userEvent.click(screen.getByRole('button', { name: 'Increase daily goal' }));
    expect(onChange).toHaveBeenLastCalledWith(15);
    await userEvent.click(screen.getByRole('button', { name: 'Decrease daily goal' }));
    expect(onChange).toHaveBeenLastCalledWith(5);
  });

  it('disables the buttons at the limits so the value can never leave the range', () => {
    const { unmount } = render(
      <NumberStepper label="x" value={5} min={5} max={20} step={5} onChange={() => undefined} />,
    );
    expect(screen.getByRole('button', { name: 'Decrease x' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase x' })).toBeEnabled();
    unmount();
    render(
      <NumberStepper label="y" value={20} min={5} max={20} step={5} onChange={() => undefined} />,
    );
    expect(screen.getByRole('button', { name: 'Increase y' })).toBeDisabled();
  });

  it('clamps a step that would overshoot (e.g. a stored value off the grid)', async () => {
    const onChange = vi.fn();
    render(<NumberStepper label="z" value={18} min={5} max={20} step={5} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Increase z' }));
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it('has 44px touch targets', () => {
    setup(10);
    expect(screen.getByRole('button', { name: 'Increase daily goal' }).className).toContain(
      'size-11',
    );
    expect(screen.getByRole('button', { name: 'Decrease daily goal' }).className).toContain(
      'size-11',
    );
  });
});
