import i18nData from '../data/i18n.json';

class I18nService {
  constructor() {
    this.translations = i18nData;
    this.currentLanguage = this.detectLanguage();
  }

  detectLanguage() {
    const saved = sessionStorage.getItem('portfolio_lang');
    if (saved && (saved === 'es' || saved === 'en')) {
      return saved;
    }
    return 'en'; // Default for first-time visitors; the language switcher preserves their choice.
  }

  getLanguage() {
    return this.currentLanguage;
  }

  setLanguage(lang) {
    if (lang !== 'es' && lang !== 'en') return;
    this.currentLanguage = lang;
    sessionStorage.setItem('portfolio_lang', lang);
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent('language-changed', { detail: { lang } }));
  }

  t(keyPath) {
    const keys = keyPath.split('.');
    let current = this.translations[this.currentLanguage];
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        return keyPath; // Fallback to key
      }
    }
    return current;
  }
}

export const i18n = new I18nService();
