import { i18n } from '../services/i18n.js';
import javascriptIcon from '../assets/icons/JavaScript.svg';
import nodeIcon from '../assets/icons/Node.js.svg';
import pythonIcon from '../assets/icons/Python.svg';
import dockerIcon from '../assets/icons/Docker.svg';
import nextIcon from '../assets/icons/Next.js.svg';
import mysqlIcon from '../assets/icons/MySQL.svg';
import cssIcon from '../assets/icons/CSS3.svg';
import htmlIcon from '../assets/icons/HTML5.svg';

const TECH_TRAIL_LOGOS = [
  { name: 'JavaScript', icon: javascriptIcon, bg: 'linear-gradient(135deg, #f7df1e, #d4be10)', color: '#000000' },
  { name: 'Next.js', icon: nextIcon, bg: 'linear-gradient(135deg, #000000, #222222)', color: '#ffffff' },
  { name: 'Node.js', icon: nodeIcon, bg: 'linear-gradient(135deg, #339933, #2b7a2b)', color: '#ffffff' },
  { name: 'Python', icon: pythonIcon, bg: 'linear-gradient(135deg, #3776ab, #2b5b84)', color: '#ffffff' },
  { name: 'Docker', icon: dockerIcon, bg: 'linear-gradient(135deg, #2496ed, #1d72b8)', color: '#ffffff' },
  { name: 'MySQL', icon: mysqlIcon, bg: 'linear-gradient(135deg, #00758f, #005a6e)', color: '#ffffff' },
  { name: 'CSS3', icon: cssIcon, bg: 'linear-gradient(135deg, #1572b6, #0e5285)', color: '#ffffff' },
  { name: 'HTML5', icon: htmlIcon, bg: 'linear-gradient(135deg, #e34f26, #b83b19)', color: '#ffffff' }
];

const TICKER_ITEMS_ROW1 = [
  { name: 'JavaScript', icon: javascriptIcon },
  { name: 'Next.js', icon: nextIcon },
  { name: 'Node.js & Express', icon: nodeIcon },
  { name: 'Python', icon: pythonIcon },
  { name: 'Docker & Cloud', icon: dockerIcon },
  { name: 'MySQL', icon: mysqlIcon },
  { name: 'CSS3', icon: cssIcon },
  { name: 'HTML5', icon: htmlIcon }
];

const TICKER_ITEMS_ROW2 = [
  { name: 'Clean Architecture', icon: nextIcon },
  { name: 'Systems Engineering', icon: dockerIcon },
  { name: 'Full-Stack Dev', icon: javascriptIcon },
  { name: 'RESTful APIs', icon: nodeIcon },
  { name: 'Microservices', icon: pythonIcon },
  { name: 'UI/UX Performance', icon: cssIcon },
  { name: 'Database Tuning', icon: mysqlIcon },
  { name: 'Automated Testing', icon: htmlIcon }
];

export function renderHero() {
  const tickerListHtml1 = TICKER_ITEMS_ROW1.map(item => `
    <div class="ticker-logo-item">
      <img src="${item.icon}" alt="${item.name}" class="ticker-tech-icon" />
      <span class="ticker-text">${item.name}</span>
    </div>
  `).join('');

  const tickerListHtml2 = TICKER_ITEMS_ROW2.map(item => `
    <div class="ticker-logo-item">
      <img src="${item.icon}" alt="${item.name}" class="ticker-tech-icon" />
      <span class="ticker-text">${item.name}</span>
    </div>
  `).join('');

  return `
    <section id="hello" class="hero-section">
      <div class="container">
        
        <!-- Large Rounded Gradient Card with Interactive Cursor Trail -->
        <div class="hero-gradient-card" id="hero-gradient-card">
          
          <!-- Exact Scraped Background Degrad Layers -->
          <div class="bg-degrad--column">
            <div class="bg-degrad-layer bg-degrad-layer-col--1"></div>
            <div class="bg-degrad-layer bg-degrad-layer-col--2"></div>
            <div class="bg-degrad-layer-overlay"></div>
          </div>

          <!-- Dynamic Tech Stack Cursor Trail Container -->
          <div class="tech-trail-container" id="tech-trail-container"></div>

          <!-- Card Content -->
          <div class="hero-card-content">

            <h1 class="hero-main-title">
              ${i18n.t('hero.main_h1')}
            </h1>

            <p class="hero-mono-sub font-mono">
              ${i18n.t('hero.subtitle')}
            </p>

            <div class="hero-availability" role="status">
              <span class="availability-dot" aria-hidden="true"></span>
              ${i18n.t('hero.availability')}
            </div>

            <div class="hero-actions">
              <a class="hero-primary-btn" href="#projects">${i18n.t('hero.view_work')}</a>
              <a class="hero-secondary-btn hero-github-btn" href="https://github.com/AqueosHeart" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile">
                <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.2-3.37-1.2-.46-1.19-1.11-1.51-1.11-1.51-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.67.35-1.13.64-1.39-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05A9.28 9.28 0 0 1 12 5.91c.85 0 1.71.12 2.51.35 1.91-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.92-2.35 4.79-4.58 5.04.36.32.68.92.68 1.86 0 1.34-.01 2.42-.01 2.75 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z"/></svg>
                GitHub
              </a>
              <a class="hero-secondary-btn hero-linkedin-btn" href="https://www.linkedin.com/in/pablo-sebastian-uriarte-betancourt-234abb333" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile">
                <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M20.45 3H3.55A.55.55 0 0 0 3 3.55v16.9c0 .3.25.55.55.55h16.9c.3 0 .55-.25.55-.55V3.55c0-.3-.25-.55-.55-.55ZM8.34 18.34H5.66V9.72h2.68v8.62ZM7 8.55a1.56 1.56 0 1 1 0-3.12 1.56 1.56 0 0 1 0 3.12Zm11.35 9.79h-2.67v-4.2c0-1 0-2.28-1.39-2.28-1.39 0-1.6 1.08-1.6 2.21v4.27h-2.68V9.72h2.57v1.18h.04c.36-.68 1.23-1.39 2.53-1.39 2.71 0 3.21 1.78 3.21 4.1v4.73Z"/></svg>
                LinkedIn
              </a>
              <a class="hero-secondary-btn" href="#contact">${i18n.t('hero.contact')}</a>
              <a class="hero-download-btn" href="/Pablo-Sebastian-Uriarte-Betancourt-CV.pdf" download>
                <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false"><path d="M11 3h2v10.17l3.59-3.58L18 11l-6 6-6-6 1.41-1.41L11 13.17V3Zm-6 16h14v2H5v-2Z"/></svg>
                Descargar CV
              </a>
            </div>

          </div>

        </div> <!-- /hero-gradient-card -->

        <!-- Overlapping Bottom Circular Badge Cutout with Orbit Animation around Arrow -->
        <div class="hero-bottom-badge-wrap">
          <a href="#projects" class="hero-bottom-badge">
            <div class="hero-badge-rotating-text">
              <svg viewBox="0 0 100 100" width="100%" height="100%">
                <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="none"/>
                <text font-size="7.5" font-weight="700" fill="#ffffff" letter-spacing="1.2">
                  <textPath href="#circlePath">
                    ${i18n.t('hero.emblem')}
                  </textPath>
                </text>
              </svg>
            </div>
            <div class="hero-badge-center-arrow">
              <span>▼</span>
              <span>▼</span>
            </div>
          </a>
        </div>

      </div> <!-- /container -->

      <!-- Dual Opposite Scrolling Marquee Rows (Row 1: Right-to-Left, Row 2: Left-to-Right) -->
      <div class="dual-marquee-container">
        
        <!-- Row 1: Right to Left -->
        <div class="nectar-scrolling-text marquee-row-1">
          <div class="nectar-scrolling-text-inner marquee-right-to-left">
            ${tickerListHtml1}
            ${tickerListHtml1}
            ${tickerListHtml1}
          </div>
        </div>

        <!-- Row 2: Left to Right -->
        <div class="nectar-scrolling-text marquee-row-2">
          <div class="nectar-scrolling-text-inner marquee-left-to-right">
            ${tickerListHtml2}
            ${tickerListHtml2}
            ${tickerListHtml2}
          </div>
        </div>

      </div>

    </section>
  `;
}

export function bindHeroEvents(container) {
  const card = container.querySelector('#hero-gradient-card');
  const trailContainer = container.querySelector('#tech-trail-container');
  if (!card || !trailContainer) return;

  let lastX = 0;
  let lastY = 0;
  let logoIndex = 0;

  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dist = Math.hypot(x - lastX, y - lastY);
    if (dist < 100) return; // Spawn distance threshold

    lastX = x;
    lastY = y;

    const tech = TECH_TRAIL_LOGOS[logoIndex % TECH_TRAIL_LOGOS.length];
    logoIndex++;

    const item = document.createElement('div');
    item.className = 'tech-trail-item';

    // Random rotation between -20 and +20 degrees
    const rot = (Math.random() * 40 - 20).toFixed(1);
    item.style.setProperty('--trail-rot', `${rot}deg`);
    item.style.left = `${x}px`;
    item.style.top = `${y}px`;

    item.innerHTML = `
      <img src="${tech.icon}" alt="${tech.name}" class="tech-trail-icon" />
    `;

    trailContainer.appendChild(item);

    // Fade out and remove after 1.1 seconds
    setTimeout(() => {
      if (item.parentNode) {
        item.parentNode.removeChild(item);
      }
    }, 1100);
  });
}
