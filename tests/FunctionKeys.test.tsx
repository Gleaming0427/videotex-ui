// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FunctionKeys } from '../src/react/FunctionKeys';

afterEach(cleanup);

const press = (key: string, init: KeyboardEventInit = {}, target: EventTarget = window) =>
  act(() => {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
  });

describe('FunctionKeys', () => {
  it('shows 8 buttons in two rows of four, in English by default', () => {
    const { getByRole, getAllByRole, container } = render(<FunctionKeys />);
    expect(getByRole('group', { name: 'Function keys' })).toBeTruthy();
    expect(getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Index',
      'Cancel',
      'Back',
      'Repeat',
      'Guide',
      'Correction',
      'Next',
      'Send',
    ]);
    expect(container.firstElementChild!.className).toContain('vtx-keys-faithful');
  });

  it('can use the French labels, custom labels and the compact layout', () => {
    const fr = render(<FunctionKeys labels="fr" />);
    expect(fr.getByRole('button', { name: 'Envoi' })).toBeTruthy();
    fr.unmount();
    const custom = render(<FunctionKeys labels={{ send: 'Go' }} layout="compact" />);
    expect(custom.getByRole('button', { name: 'Go' })).toBeTruthy();
    expect(custom.getByRole('button', { name: 'Next' })).toBeTruthy();
    expect(custom.container.firstElementChild!.className).toContain('vtx-keys-compact');
  });

  it('calls onKey, then the handler of the key, on click', () => {
    const calls: string[] = [];
    const { getByRole } = render(
      <FunctionKeys onKey={(key) => calls.push(`key:${key}`)} onSend={() => calls.push('send')} />,
    );
    fireEvent.click(getByRole('button', { name: 'Send' }));
    fireEvent.click(getByRole('button', { name: 'Next' }));
    expect(calls).toEqual(['key:send', 'send', 'key:next']);
  });

  it('listens to no shortcut by default', () => {
    const onKey = vi.fn();
    const { getByRole } = render(<FunctionKeys onKey={onKey} />);
    press('Enter');
    expect(onKey).not.toHaveBeenCalled();
    expect(getByRole('button', { name: 'Send' }).getAttribute('aria-keyshortcuts')).toBeNull();
  });

  it('runs keys from the keyboard when shortcuts are on', () => {
    const onKey = vi.fn();
    const { getByRole } = render(<FunctionKeys shortcuts onKey={onKey} />);
    press('Enter');
    press('Escape');
    press('?', { shiftKey: true });
    expect(onKey.mock.calls.map(([key]) => key)).toEqual(['send', 'cancel', 'guide']);
    expect(getByRole('button', { name: 'Send' }).getAttribute('aria-keyshortcuts')).toBe('Enter');
  });

  it('shows the key as pressed for a moment', () => {
    vi.useFakeTimers();
    const { getByRole } = render(<FunctionKeys shortcuts />);
    press('PageDown');
    expect(getByRole('button', { name: 'Next' }).hasAttribute('data-pressed')).toBe(true);
    act(() => vi.advanceTimersByTime(200));
    expect(getByRole('button', { name: 'Next' }).hasAttribute('data-pressed')).toBe(false);
    vi.useRealTimers();
  });

  it('leaves text fields, focused buttons, held keys and modifiers alone', () => {
    const onKey = vi.fn();
    const { getByRole } = render(
      <>
        <input aria-label="name" />
        <button type="button">Other</button>
        <FunctionKeys shortcuts onKey={onKey} />
      </>,
    );
    press('Enter', {}, getByRole('textbox'));
    press('Enter', {}, getByRole('button', { name: 'Other' }));
    press('PageDown', { repeat: true });
    press('Enter', { ctrlKey: true });
    expect(onKey).not.toHaveBeenCalled();
    press('PageDown', {}, getByRole('button', { name: 'Other' }));
    expect(onKey).toHaveBeenCalledWith('next');
  });

  it('accepts custom shortcuts', () => {
    const onKey = vi.fn();
    render(<FunctionKeys shortcuts={{ next: 'ArrowDown', send: null }} onKey={onKey} />);
    press('ArrowDown');
    press('Enter');
    expect(onKey.mock.calls).toEqual([['next']]);
  });

  it('stops listening when unmounted', () => {
    const onKey = vi.fn();
    const { unmount } = render(<FunctionKeys shortcuts onKey={onKey} />);
    unmount();
    press('Enter');
    expect(onKey).not.toHaveBeenCalled();
  });
});
