import { describe, it, expect, beforeEach } from 'vitest';
import { i18n } from '../src/services/i18n.js';

describe('I18nService', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should detect default language as es or en', () => {
    const lang = i18n.getLanguage();
    expect(['es', 'en']).toContain(lang);
  });

  it('should change language and persist to sessionStorage', () => {
    i18n.setLanguage('en');
    expect(i18n.getLanguage()).toBe('en');
    expect(sessionStorage.getItem('portfolio_lang')).toBe('en');

    i18n.setLanguage('es');
    expect(i18n.getLanguage()).toBe('es');
    expect(sessionStorage.getItem('portfolio_lang')).toBe('es');
  });

  it('should translate nested key paths correctly', () => {
    i18n.setLanguage('es');
    expect(i18n.t('nav.home')).toBe('Inicio');

    i18n.setLanguage('en');
    expect(i18n.t('nav.home')).toBe('Home');
  });
});
