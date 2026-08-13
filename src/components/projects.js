import projectsData from '../data/projects.json';
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

const ICON_MAP = {
  'JavaScript': javascriptIcon,
  'Vite': javascriptIcon,
  'Next.js': nextIcon,
  'Node.js': nodeIcon,
  'Python': pythonIcon,
  'Docker': dockerIcon,
  'MySQL': mysqlIcon,
  'PostgreSQL': mysqlIcon,
  'CSS3': cssIcon,
  'HTML5': htmlIcon,
  'React': reactIcon,
  'Tailwind CSS': tailwindIcon,
  'Prisma': prismaIcon,
  'Stripe': stripeIcon,
  'TypeScript': tsIcon,
  'Better-Auth': nextIcon,
  'Multimodal SEO': tsIcon,
  'Shadcn UI': reactIcon,
  'TanStack Table': reactIcon,
  'Drizzle ORM': prismaIcon,
  'Web Scraping': pythonIcon,
  'Data Extraction': pythonIcon,
  'Automation': dockerIcon,
  'Lucide Icons': reactIcon,
  'Python Automation': pythonIcon,
  'Playwright': dockerIcon,
  'Zod': tsIcon
};

export function renderProjects() {
  const currentLang = i18n.getLanguage();

  const projectsHtml = projectsData.map(proj => {
    // Collect unique SVG icon paths for this project
    const icons = [...new Set(proj.tags.map(tag => ICON_MAP[tag] || javascriptIcon))];

    return `
      <article class="project-showcase-item">
        <a href="${proj.githubUrl || '#'}" target="_blank" rel="noopener" class="project-panel-card" style="background-color: ${proj.solidColor || '#9b51e0'};">
          
          <!-- Default State: Solid Plain Pastel Color Background with Center Icon/Logo -->
          <div class="project-panel-default-content">
            <div class="project-center-logo-wrap">
              <img src="${icons[0] || javascriptIcon}" alt="Project Icon" class="project-center-logo-img" />
              <h4 class="project-center-title">${proj.title['es'].split(' ')[0]}</h4>
            </div>
          </div>

          <!-- Hover State: Smooth Transition to Reveal Real Screenshot Photo -->
          <div class="project-panel-photo-overlay">
            <img src="${proj.image}" alt="${proj.title[currentLang] || proj.title['es']}" loading="lazy" class="project-panel-photo-img" />
          </div>

        </a>

        <div class="project-info">
          <h3 class="project-title-text">${proj.title[currentLang] || proj.title['es']}</h3>
          <a href="${proj.githubUrl || '#'}" target="_blank" rel="noopener" class="project-url-link">${proj.githubUrl}</a>
          
          <!-- Stack represented by PURE WHITE ICONS ONLY (No text, labels, or pill borders) -->
          <div class="project-pure-icons-stack">
            ${icons.map(iconSrc => `
              <img src="${iconSrc}" alt="Tech Icon" class="project-pure-tech-icon" />
            `).join('')}
          </div>
        </div>
      </article>
    `;
  }).join('');

  return `
    <section id="projects" class="section">
      <div class="container">
        <h2 class="section-title">${i18n.t('projects.title')}</h2>
        <p class="section-subtitle">${i18n.t('projects.subtitle')}</p>

        <div class="projects-grid">
          ${projectsHtml}
        </div>
      </div>
    </section>
  `;
}

export function bindProjectsEvents(container, onFilterChange) {
  // No filter event bindings needed
}
