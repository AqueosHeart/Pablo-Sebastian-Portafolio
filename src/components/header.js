import { i18n } from '../services/i18n.js';

export function renderHeader() {
  const currentLang = i18n.getLanguage();

  return `
    <header class="header-outer" id="header-outer">
      <div class="header-container">
        <a href="#hello" class="logo">
          PORTAFOLIO<span>.</span>
        </a>

        <nav class="nav">
          <ul class="nav-links">
            <li><a href="#hello" class="nav-link active">${i18n.t('nav.home')}</a></li>
            <li><a href="#projects" class="nav-link">${i18n.t('nav.projects')}</a></li>
            <li><a href="#skills" class="nav-link">${i18n.t('nav.skills')}</a></li>
            <li><a href="#contact" class="nav-link">${i18n.t('nav.contact')}</a></li>
          </ul>
        </nav>

        <div class="header-actions">
          <div class="lang-switcher">
            <button class="lang-btn ${currentLang === 'es' ? 'active' : ''}" data-lang="es">ES</button>
            <button class="lang-btn ${currentLang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
          </div>
          <a href="#contact" class="header-cta-btn">
            ${i18n.t('nav.contact')}
          </a>
        </div>
      </div>
    </header>
  `;
}

export function bindHeaderEvents(container) {
  const langBtns = container.querySelectorAll('.lang-btn');
  langBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const selectedLang = e.target.getAttribute('data-lang');
      i18n.setLanguage(selectedLang);
    });
  });
}
