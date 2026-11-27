// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPage } from '../src/core/page';
import { Frame } from '../src/react/Frame';
import { FunctionKeys } from '../src/react/FunctionKeys';
import { InputField } from '../src/react/InputField';
import { Menu } from '../src/react/Menu';
import { Screen } from '../src/react/Screen';
import { StatusRow } from '../src/react/StatusRow';
import { Title } from '../src/react/Title';

afterEach(cleanup);

const page = createPage();
const onScreen = (ui: React.ReactNode) => render(<Screen page={page}>{ui}</Screen>);

describe('Screen layer', () => {
  it('places children on the grid, outside the hidden cell grid', () => {
    const { container, getByRole } = onScreen(<Title row={3} col={2}>HELLO</Title>);
    const heading = getByRole('heading', { name: 'HELLO' });
    expect(heading.closest('.vtx-layer')).not.toBeNull();
    expect(heading.style.gridRow).toBe('3 / span 2');
    expect(heading.style.gridColumn).toBe('3 / span 10');
    expect(container.querySelector('.vtx-grid')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('renders no layer without children', () => {
    const { container } = render(<Screen page={page} />);
    expect(container.querySelector('.vtx-layer')).toBeNull();
  });

  it('hides the layer while the page is drawn, then focuses an autoFocus field', () => {
    vi.useFakeTimers();
    const { container, getByRole } = render(
      <Screen page={createPage({ ...page.cells[0]![0]!, bg: 4 })} baud={1200}>
        <InputField label="Choice" size={1} row={23} col={15} autoFocus />
      </Screen>,
    );
    expect(container.querySelector('.vtx-screen')!.className).toContain('vtx-revealing');
    expect(document.activeElement).not.toBe(getByRole('textbox'));
    act(() => vi.advanceTimersByTime(20_000));
    expect(container.querySelector('.vtx-screen')!.className).not.toContain('vtx-revealing');
    expect(document.activeElement).toBe(getByRole('textbox'));
    vi.useRealTimers();
  });
});

describe('Title', () => {
  it('is a heading of the chosen level, drawn with cells on a screen', () => {
    const { getByRole, container } = onScreen(
      <Title level={3} row={5} col={0} size="normal">
        News
      </Title>,
    );
    expect(getByRole('heading', { level: 3, name: 'News' }).style.gridRow).toBe('6 / span 1');
    expect(container.querySelectorAll('.vtx-layer .vtx-cell')).toHaveLength(4);
  });

  it('is plain styled text on its own', () => {
    const { getByRole } = render(<Title fg="cyan">News</Title>);
    const heading = getByRole('heading', { level: 2, name: 'News' });
    expect(heading.className).toContain('vtx-ui');
    expect(heading.className).toContain('vtx-fg-6');
  });
});

describe('StatusRow', () => {
  it('announces its message, on a screen and on its own', () => {
    const screen = onScreen(<StatusRow left="SERVICE" message="Saved" right="1/4" />);
    expect(screen.getByRole('status').textContent).toBe('Saved');
    expect(screen.container.querySelectorAll('.vtx-layer .vtx-cell')).toHaveLength(40);
    screen.unmount();
    const alone = render(<StatusRow left="SERVICE" message="Saved" />);
    expect(alone.getByRole('status').textContent).toBe('Saved');
    expect(alone.container.firstElementChild!.className).toContain('vtx-status');
  });
});

describe('Frame', () => {
  it('is a section named by its title, with children inside or on the screen', () => {
    const screen = onScreen(
      <Frame row={5} col={1} height={6} width={20} title="Help">
        <Title row={8} col={3} size="normal">
          Inside
        </Title>
      </Frame>,
    );
    const section = screen.getByRole('region', { name: 'Help' });
    expect(section.className).toContain('vtx-sublayer');
    expect(screen.getByRole('heading', { name: 'Inside' }).style.gridRow).toBe('9 / span 1');
    screen.unmount();
    const alone = render(
      <Frame title="Help">
        <p>Body</p>
      </Frame>,
    );
    expect(alone.getByRole('region', { name: 'Help' }).textContent).toContain('Body');
  });
});

describe('Menu', () => {
  const items = ['News', 'Weather', 'Trains'];

  it('lists numbered buttons and reports the chosen item', () => {
    const onSelect = vi.fn();
    const { getByRole } = onScreen(<Menu row={10} col={2} items={items} onSelect={onSelect} />);
    expect(getByRole('list', { name: 'Menu' })).toBeTruthy();
    fireEvent.click(getByRole('button', { name: '2 Weather' }));
    expect(onSelect).toHaveBeenCalledWith(1);
    expect(getByRole('button', { name: '3 Trains' }).closest('li')!.style.gridRow).toBe('13 / span 1');
  });

  it('moves with the arrow keys and jumps with digits, one item in the tab order', () => {
    const { getByRole, getAllByRole } = render(<Menu items={items} />);
    const buttons = getAllByRole('button');
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1]);
    buttons[0]!.focus();
    fireEvent.keyDown(buttons[0]!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(buttons[1]);
    fireEvent.keyDown(buttons[1]!, { key: 'ArrowUp' });
    fireEvent.keyDown(buttons[0]!, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(buttons[2]);
    fireEvent.keyDown(buttons[2]!, { key: '1' });
    expect(document.activeElement).toBe(getByRole('button', { name: '1 News' }));
    expect(buttons.map((b) => b.tabIndex)).toEqual([0, -1, -1]);
  });

  it('highlights the focused item on a screen', () => {
    const { getByRole, container } = onScreen(<Menu row={10} col={2} items={items} />);
    const inverseCells = () => container.querySelectorAll('.vtx-layer .vtx-bg-7').length;
    const before = inverseCells();
    act(() => getByRole('button', { name: '1 News' }).focus());
    expect(inverseCells()).toBeGreaterThan(before);
  });
});

describe('InputField', () => {
  it('draws dots and the value on a screen over a transparent input', () => {
    const { getByRole, container } = onScreen(<InputField label="Code" size={4} row={20} col={5} defaultValue="12" />);
    const input = getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    expect(input.hasAttribute('data-vtx-field')).toBe(true);
    expect(input.className).toBe('vtx-field-input');
    const chars = [...container.querySelectorAll('.vtx-layer .vtx-char')].map((c) => c.textContent).join('');
    expect(chars).toBe('12..');
  });

  it('keeps digits only and respects the size', () => {
    const onChange = vi.fn();
    const { getByRole } = render(<InputField label="Code" size={3} type="digits" onChange={onChange} />);
    const input = getByRole('textbox', { name: 'Code' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '1a2b34' } });
    expect(onChange).toHaveBeenLastCalledWith('123');
    expect(input.value).toBe('123');
    expect(input.inputMode).toBe('numeric');
    expect(input.hasAttribute('data-vtx-field')).toBe(false);
  });

  it('calls onSubmit on Enter', () => {
    const onSubmit = vi.fn();
    const { getByRole } = render(<InputField label="Name" size={8} defaultValue="Ada" onSubmit={onSubmit} />);
    fireEvent.keyDown(getByRole('textbox'), { key: 'Enter' });
    expect(onSubmit).toHaveBeenCalledWith('Ada');
  });

  it('lets FunctionKeys take Enter but not Backspace while typing on a screen', () => {
    const onKey = vi.fn();
    function Terminal() {
      const [value, setValue] = useState('');
      return (
        <>
          <Screen page={page}>
            <InputField label="Choice" size={2} row={23} col={15} value={value} onChange={setValue} />
          </Screen>
          <FunctionKeys shortcuts onKey={onKey} />
        </>
      );
    }
    const { getByRole } = render(<Terminal />);
    const input = getByRole('textbox', { name: 'Choice' });
    act(() => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    });
    expect(onKey.mock.calls).toEqual([['send']]);
  });
});
