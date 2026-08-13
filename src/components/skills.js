import skillsData from '../data/skills.json';
import { i18n } from '../services/i18n.js';

import javascriptIcon from '../assets/icons/JavaScript.svg';
import nextIcon from '../assets/icons/Next.js.svg';
import nodeIcon from '../assets/icons/Node.js.svg';
import pythonIcon from '../assets/icons/Python.svg';
import dockerIcon from '../assets/icons/Docker.svg';
import mysqlIcon from '../assets/icons/MySQL.svg';
import cssIcon from '../assets/icons/CSS3.svg';
import htmlIcon from '../assets/icons/HTML5.svg';
import reactIcon from '../assets/icons/React.svg';
import tailwindIcon from '../assets/icons/TailwindCSS.svg';
import prismaIcon from '../assets/icons/Prisma.svg';
import stripeIcon from '../assets/icons/Stripe.svg';
import tsIcon from '../assets/icons/TypeScript.svg';
import gitIcon from '../assets/icons/Git.svg';

const SKILL_ICON_MAP = {
  'JavaScript (ES6+)': javascriptIcon,
  'TypeScript': tsIcon,
  'Python': pythonIcon,
  'HTML5': htmlIcon,
  'CSS3 / Custom Props': cssIcon,
  'SQL': mysqlIcon,
  'Vite': javascriptIcon,
  'Node.js': nodeIcon,
  'Express': nodeIcon,
  'Vitest': reactIcon,
  'REST APIs': nodeIcon,
  'DOM APIs': javascriptIcon,
  'Clean Architecture': nextIcon,
  'Scrape.do API Ingestion': pythonIcon,
  'Microservices': dockerIcon,
  'Git / GitHub': gitIcon,
  'Docker': dockerIcon,
  'Performance Tuning': tsIcon,
  'Spec-Driven Development': tsIcon,
  'TDD & Unit Testing': reactIcon,
  'Bilingual i18n': javascriptIcon,
  'Responsive UI/UX': cssIcon,
  'SEO Optimization': nextIcon
};

export function renderSkills() {
  const categoriesHtml = skillsData.categories.map(cat => `
    <div class="skill-category-card">
      <h3 class="skill-category-title">${i18n.t(cat.nameKey)}</h3>
      <ul class="skill-clean-list">
        ${cat.items.map(item => {
          const iconSrc = SKILL_ICON_MAP[item] || javascriptIcon;
          return `
            <li class="skill-clean-item">
              <img src="${iconSrc}" alt="${item}" class="skill-color-icon" />
              <span class="skill-item-text">${item}</span>
            </li>
          `;
        }).join('')}
      </ul>
    </div>
  `).join('');

  return `
    <section id="skills" class="skills-section">
      <div class="container">
        
        <!-- Animated Colorful Mesh Gradient Card for Skills -->
        <div class="skills-gradient-card">
          
          <!-- Liquid Lava Lamp Background Degrad Layers -->
          <div class="bg-degrad--column">
            <div class="bg-degrad-layer bg-degrad-layer-col--1"></div>
            <div class="bg-degrad-layer bg-degrad-layer-col--2"></div>
            <div class="bg-degrad-layer-overlay"></div>
          </div>

          <!-- Skills Card Content -->
          <div class="skills-card-content">
            <h2 class="section-title text-center" style="text-align: center;">${i18n.t('skills.title')}</h2>
            <p class="section-subtitle text-center" style="text-align: center; margin-left: auto; margin-right: auto; margin-bottom: 44px;">
              ${i18n.t('skills.subtitle')}
            </p>

            <div class="skills-grid">
              ${categoriesHtml}
            </div>
          </div>

        </div> <!-- /skills-gradient-card -->

      </div>
    </section>
  `;
}
