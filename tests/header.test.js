import { beforeEach, describe, expect, it } from 'vitest';
import { bindHeaderEvents, renderHeader } from '../src/components/header.js';

describe('mobile navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = renderHeader();
    bindHeaderEvents(document);
  });

  it('opens from the menu button and closes after selecting a link', () => {
    const header = document.querySelector('#header-outer');
    const toggle = document.querySelector('.mobile-menu-toggle');
    const homeLink = document.querySelector('.nav-link');

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    toggle.click();
    expect(header.classList.contains('menu-open')).toBe(true);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');

    homeLink.click();
    expect(header.classList.contains('menu-open')).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });
});
