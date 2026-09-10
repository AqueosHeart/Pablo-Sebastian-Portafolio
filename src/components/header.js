import { i18n } from '../services/i18n.js';

export function renderHeader() {
  const currentLang = i18n.getLanguage();
  const resumeFile = currentLang === 'en'
    ? '/Pablo-Sebastian-Uriarte-Betancourt-CV-English.pdf'
    : '/Pablo-Sebastian-Uriarte-Betancourt-CV.pdf';
  const resumeLabel = currentLang === 'en' ? 'Resume' : 'CV';

  return `
    <header class="header-outer" id="header-outer">
      <div class="header-container">
        <a href="#hello" class="logo">
          PORTAFOLIO<span>.</span>
        </a>

        <nav class="nav">
          <ul class="nav-links">
            <li><a href="#hello" class="nav-link active">${i18n.t('nav.home')}</a></li>
            <li><a href="#about" class="nav-link">${i18n.t('nav.about')}</a></li>
            <li><a href="#projects" class="nav-link">${i18n.t('nav.projects')}</a></li>
            <li><a href="#skills" class="nav-link">${i18n.t('nav.skills')}</a></li>
            <li><a href="#contact" class="nav-link">${i18n.t('nav.contact')}</a></li>
          </ul>
        </nav>

        <div class="header-actions">
          <div class="lang-switcher">
            <button class="lang-btn ${currentLang === 'en' ? 'active' : ''}" data-lang="en">EN</button>
            <button class="lang-btn ${currentLang === 'es' ? 'active' : ''}" data-lang="es">ES</button>
          </div>
          <a href="#contact" class="header-cta-btn">
            ${i18n.t('nav.contact')}
          </a>
          <a href="${resumeFile}" class="header-resume-btn" download>
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M11 3h2v10.17l3.59-3.58L18 11l-6 6-6-6 1.41-1.41L11 13.17V3Zm-6 16h14v2H5v-2Z"/></svg>
            ${resumeLabel}
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
