import { i18n } from '../services/i18n.js';

export function renderAbout() {
  return `
    <section id="about" class="about-section" aria-labelledby="about-title">
      <div class="container">
        <div class="about-grid">
          <div>
            <p class="section-eyebrow">${i18n.t('about.eyebrow')}</p>
            <h2 id="about-title" class="section-title">${i18n.t('about.title')}</h2>
            <p class="about-copy">${i18n.t('about.copy')}</p>
          </div>
          <div class="about-proof-grid">
            <article class="about-proof-card">
              <span>01</span>
              <h3>${i18n.t('about.proof_product_title')}</h3>
              <p>${i18n.t('about.proof_product_copy')}</p>
            </article>
            <article class="about-proof-card">
              <span>02</span>
              <h3>${i18n.t('about.proof_automation_title')}</h3>
              <p>${i18n.t('about.proof_automation_copy')}</p>
            </article>
            <article class="about-proof-card">
              <span>03</span>
              <h3>${i18n.t('about.proof_quality_title')}</h3>
              <p>${i18n.t('about.proof_quality_copy')}</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  `;
}
