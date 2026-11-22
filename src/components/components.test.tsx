import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { Badge } from './Badge';
import { Button } from './Button';
import { Chip } from './Chip';
import { ConfirmDialog } from './ConfirmDialog';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { Icon } from './Icon';
import { ProgressBar } from './ProgressBar';
import { ProgressRing, clamp01 } from './ProgressRing';
import { Screen } from './Screen';
import { ListRow } from './Section';
import { SegmentedControl } from './SegmentedControl';
import { Sheet, shouldDismissSheet } from './Sheet';

describe('Button', () => {
  it('calls onClick and defaults to type="button" (never submits a form by accident)', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('loading disables the button, marks it busy, and blocks clicks', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Saving' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('meets the 44px minimum touch target in both sizes', () => {
    render(
      <>
        <Button>Medium</Button>
        <Button size="sm">Small</Button>
      </>,
    );
    expect(screen.getByRole('button', { name: 'Medium' }).className).toContain('min-h-[50px]');
    expect(screen.getByRole('button', { name: 'Small' }).className).toContain('min-h-[44px]');
  });
});

describe('progress', () => {
  it('clamp01 handles out-of-range and NaN', () => {
    expect(clamp01(-1)).toBe(0);
    expect(clamp01(2)).toBe(1);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(Number.NaN)).toBe(0);
  });

  it('ring exposes progressbar semantics with a percentage', () => {
    render(<ProgressRing value={0.456} label="Daily goal" />);
    const ring = screen.getByRole('progressbar', { name: 'Daily goal' });
    expect(ring).toHaveAttribute('aria-valuenow', '46');
    expect(ring).toHaveAttribute('aria-valuetext', '46 percent');
  });

  it('ring and bar clamp values for assistive tech', () => {
    render(
      <>
        <ProgressRing value={3} label="Over" />
        <ProgressBar value={-2} label="Under" />
      </>,
    );
    expect(screen.getByRole('progressbar', { name: 'Over' })).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
    expect(screen.getByRole('progressbar', { name: 'Under' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });
});

describe('SegmentedControl', () => {
  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta' },
    { value: 'c', label: 'Gamma' },
  ] as const;

  it('is a radiogroup with one selected, focusable option (roving tabindex)', () => {
    render(
      <SegmentedControl label="Pick" options={options} value="b" onChange={() => undefined} />,
    );
    expect(screen.getByRole('radiogroup', { name: 'Pick' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Beta' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Beta' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('radio', { name: 'Alpha' })).toHaveAttribute('tabindex', '-1');
  });

  it('changes value on click and with arrow keys, wrapping around', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="Pick" options={options} value="c" onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Alpha' }));
    expect(onChange).toHaveBeenLastCalledWith('a');

    screen.getByRole('radio', { name: 'Gamma' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('a'); // wraps to first
    // focus moved to Alpha (index 0), so ArrowLeft wraps back to the last option
    await userEvent.keyboard('{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('c');
  });
});

describe('Chip', () => {
  it('is a toggle button only when interactive', async () => {
    const onClick = vi.fn();
    render(
      <>
        <Chip selected onClick={onClick}>
          Java
        </Chip>
        <Chip>Static</Chip>
      </>,
    );
    const toggle = screen.getByRole('button', { name: 'Java' });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(toggle);
    expect(onClick).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Static' })).toBeNull();
  });
});

describe('Icon', () => {
  it('is decorative by default and labelled when a label is given', () => {
    const { container, rerender } = render(<Icon name="check" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    rerender(<Icon name="check" label="Done" />);
    expect(screen.getByRole('img', { name: 'Done' })).toBeInTheDocument();
  });
});

describe('ListRow', () => {
  it('renders a link, a button, or plain content depending on props', async () => {
    const onClick = vi.fn();
    render(
      <MemoryRouter>
        <ListRow title="Link row" to="/practice" />
        <ListRow title="Button row" onClick={onClick} />
        <ListRow title="Static row" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: /Link row/ })).toHaveAttribute('href', '/practice');
    await userEvent.click(screen.getByRole('button', { name: /Button row/ }));
    expect(onClick).toHaveBeenCalled();
    expect(screen.getByText('Static row').closest('a,button')).toBeNull();
  });
});

describe('Badge, EmptyState, ErrorState', () => {
  it('Badge carries its meaning in text', () => {
    render(<Badge tone="danger">Overdue</Badge>);
    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('EmptyState shows title, description and the single action', () => {
    render(
      <EmptyState
        icon="cube"
        title="No solves"
        description="Solve a cube."
        action={<button>Go</button>}
      />,
    );
    expect(screen.getByRole('heading', { name: 'No solves' })).toBeInTheDocument();
    expect(screen.getByText('Solve a cube.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });

  it('ErrorState is an alert and offers retry only when a handler exists', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<ErrorState message="Failed" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    await userEvent.click(screen.getByRole('button', { name: /Try again/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(<ErrorState message="Failed" />);
    expect(screen.queryByRole('button', { name: /Try again/ })).toBeNull();
  });
});

describe('Screen', () => {
  it('has exactly one heading; the compact bar title is hidden from assistive tech', () => {
    render(
      <Screen title="Progress">
        <p>content</p>
      </Screen>,
    );
    expect(screen.getAllByRole('heading')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Progress' })).toBeInTheDocument();
    expect(document.querySelector('[aria-hidden="true"]')).toHaveTextContent('Progress');
  });
});

describe('Sheet', () => {
  it('shouldDismissSheet: distance or fast flick dismisses; small slow drags do not', () => {
    expect(shouldDismissSheet(120, 0.1)).toBe(true);
    expect(shouldDismissSheet(40, 0.9)).toBe(true);
    expect(shouldDismissSheet(40, 0.1)).toBe(false);
    expect(shouldDismissSheet(0, 5)).toBe(false);
    expect(shouldDismissSheet(-30, 5)).toBe(false);
  });

  it('opens when `open` is true and reports every cancel (Escape / back) to the parent', () => {
    const onClose = vi.fn();
    const { container, rerender } = render(
      <Sheet open={false} onClose={onClose} title="Details">
        <p>body</p>
      </Sheet>,
    );
    const dialog = container.querySelector('dialog');
    expect(dialog).not.toHaveAttribute('open');

    rerender(
      <Sheet open onClose={onClose} title="Details">
        <p>body</p>
      </Sheet>,
    );
    expect(dialog).toHaveAttribute('open');
    expect(dialog).toHaveAccessibleName('Details');

    fireEvent(dialog as HTMLDialogElement, new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes the dialog when `open` flips back to false', () => {
    const { container, rerender } = render(
      <Sheet open onClose={() => undefined} title="Details">
        <p>body</p>
      </Sheet>,
    );
    expect(container.querySelector('dialog')).toHaveAttribute('open');
    rerender(
      <Sheet open={false} onClose={() => undefined} title="Details">
        <p>body</p>
      </Sheet>,
    );
    expect(container.querySelector('dialog')).not.toHaveAttribute('open');
  });
});

describe('ConfirmDialog', () => {
  it('confirm and cancel call the right handler; cancel event maps to onCancel', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { container } = render(
      <ConfirmDialog
        open
        title="Delete?"
        message="Cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent(
      container.querySelector('dialog') as HTMLDialogElement,
      new Event('cancel', { cancelable: true }),
    );
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
