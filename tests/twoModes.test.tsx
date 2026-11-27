// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TwoModes } from '../demo/TwoModes';

afterEach(cleanup);

const renderSection = () => render(<TwoModes palette="color" crt={false} baud={false} sound={false} />);

describe('demo: one React tree, two modes', () => {
  it('starts as an ordinary web page', () => {
    const { container, getByRole } = renderSection();
    expect(container.querySelector('.vtx-screen')).toBeNull();
    expect(getByRole('button', { name: 'Switch to Videotex mode' })).toBeTruthy();
    expect(getByRole('button', { name: 'Send' })).toBeTruthy();
  });

  it('moves the same components, with their state, onto a screen and back', () => {
    const { container, getByRole, getByLabelText } = renderSection();
    fireEvent.change(getByLabelText('Your name'), { target: { value: 'Ada' } });

    fireEvent.click(getByRole('button', { name: 'Switch to Videotex mode' }));
    const screen = container.querySelector('.vtx-screen');
    expect(screen).not.toBeNull();
    expect(getByRole('heading', { name: 'Welcome' }).closest('.vtx-layer')).not.toBeNull();
    expect((getByLabelText('Your name') as HTMLInputElement).value).toBe('Ada');

    fireEvent.click(getByRole('button', { name: 'Back to web mode' }));
    expect(container.querySelector('.vtx-screen')).toBeNull();
    expect((getByLabelText('Your name') as HTMLInputElement).value).toBe('Ada');
  });

  it('answers a menu choice on the service row in both modes', () => {
    const { container, getByRole } = renderSection();
    fireEvent.click(getByRole('button', { name: /Trains/ }));
    expect(container.textContent).toContain('Trains selected');

    fireEvent.click(getByRole('button', { name: 'Switch to Videotex mode' }));
    expect(container.querySelector('.vtx-screen')!.textContent).toContain('Trains selected');
  });
});
