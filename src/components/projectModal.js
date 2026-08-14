import projectsData from '../data/projects.json';
import { i18n } from '../services/i18n.js';
import { PhysicsCanvas } from '../services/physicsCanvas.js';

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

let currentProjectId = null;
let currentSlideIndex = 0;
let modalContainer = null;
let physicsInstance = null;

export function initProjectModal() {
  if (!modalContainer || !document.body.contains(modalContainer)) {
    modalContainer = document.getElementById('project-modal-root');
    if (!modalContainer) {
      modalContainer = document.createElement('div');
      modalContainer.id = 'project-modal-root';
      document.body.appendChild(modalContainer);
    }
  }

  // Global key listener for Escape and Arrow keys
  window.removeEventListener('keydown', handleKeyDown);
  window.addEventListener('keydown', handleKeyDown);

  // Listen to language changes to update active modal if open
  window.removeEventListener('language-changed', handleLanguageChange);
  window.addEventListener('language-changed', handleLanguageChange);
}

function handleKeyDown(e) {
  if (!currentProjectId) return;

  if (e.key === 'Escape') {
    closeProjectModal();
  } else if (e.key === 'ArrowLeft') {
    prevModalImage();
  } else if (e.key === 'ArrowRight') {
    nextModalImage();
  }
}

function handleLanguageChange() {
  if (currentProjectId) {
    renderActiveModal();
  }
}

export function openProjectModal(projectId) {
  const project = projectsData.find(p => p.id === projectId);
  if (!project) return;

  currentProjectId = projectId;
  currentSlideIndex = 0;

  initProjectModal();

  document.body.classList.add('modal-open');
  renderActiveModal();

  // Focus close button for accessibility
  setTimeout(() => {
    const closeBtn = modalContainer.querySelector('.project-modal-close-btn');
    if (closeBtn) closeBtn.focus();
  }, 50);
}

export function closeProjectModal() {
  if (!currentProjectId || !modalContainer) return;

  if (physicsInstance) {
    physicsInstance.destroy();
    physicsInstance = null;
  }

  document.body.classList.remove('modal-open');
  const backdrop = modalContainer.querySelector('.project-modal-backdrop');
  if (backdrop) {
    backdrop.classList.add('closing');
    setTimeout(() => {
      currentProjectId = null;
      currentSlideIndex = 0;
      modalContainer.replaceChildren();
    }, 200);
  } else {
    currentProjectId = null;
    currentSlideIndex = 0;
    modalContainer.replaceChildren();
  }
}

export function nextModalImage() {
  const project = projectsData.find(p => p.id === currentProjectId);
  if (!project || !project.gallery || project.gallery.length <= 1) return;

  currentSlideIndex = (currentSlideIndex + 1) % project.gallery.length;
  updateGalleryView(project);
}

export function prevModalImage() {
  const project = projectsData.find(p => p.id === currentProjectId);
  if (!project || !project.gallery || project.gallery.length <= 1) return;

  currentSlideIndex = (currentSlideIndex - 1 + project.gallery.length) % project.gallery.length;
  updateGalleryView(project);
}

function updateGalleryView(project) {
  const currentLang = i18n.getLanguage();
  const gallery = project.gallery || [{ src: project.image, caption: { es: project.subtitle, en: project.subtitle } }];
  const currentItem = gallery[currentSlideIndex];

  const imgEl = modalContainer.querySelector('.project-modal-gallery-img');
  const captionEl = modalContainer.querySelector('.project-modal-caption-text');
  const counterEl = modalContainer.querySelector('.project-modal-counter-badge');
  const dots = modalContainer.querySelectorAll('.project-modal-dot');

  if (imgEl && currentItem) {
    imgEl.style.opacity = '0';
    setTimeout(() => {
      imgEl.src = currentItem.src;
      imgEl.alt = (currentItem.caption && (currentItem.caption[currentLang] || currentItem.caption['es'])) || project.title[currentLang];
      imgEl.style.opacity = '1';
    }, 120);
  }

  if (captionEl && currentItem) {
    captionEl.style.opacity = '0';
    setTimeout(() => {
      captionEl.textContent = (currentItem.caption && (currentItem.caption[currentLang] || currentItem.caption['es'])) || '';
      captionEl.style.opacity = '1';
    }, 120);
  }

  if (counterEl) {
    counterEl.textContent = `${currentSlideIndex + 1} / ${gallery.length}`;
  }

  dots.forEach((dot, idx) => {
    if (idx === currentSlideIndex) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

function renderActiveModal() {
  const project = projectsData.find(p => p.id === currentProjectId);
  if (!project || !modalContainer) return;

  const currentLang = i18n.getLanguage();
  const title = project.title[currentLang] || project.title['es'];
  const summary = project.summary[currentLang] || project.summary['es'];
  const details = (project.details && (project.details[currentLang] || project.details['es'])) || summary;
  const features = project.features || [];
  const gallery = project.gallery && project.gallery.length > 0
    ? project.gallery
    : [{ src: project.image, caption: { es: project.subtitle, en: project.subtitle } }];

  const currentGalleryItem = gallery[currentSlideIndex] || gallery[0];
  const currentCaption = (currentGalleryItem.caption && (currentGalleryItem.caption[currentLang] || currentGalleryItem.caption['es'])) || '';
  const totalSlides = gallery.length;

  const modalHtml = `
    <div class="project-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-project-title">
      <div class="project-modal-glass-card">

        <!-- Background Interactive Physics Canvas (Physics, Collisions & Gravity) -->
        <canvas class="project-modal-physics-canvas"></canvas>

        <!-- Modal Header -->
        <header class="project-modal-header">
          <div class="project-modal-title-group">
            <h2 id="modal-project-title" class="project-modal-title">${title}</h2>
            
            <!-- GitHub Link below Title -->
            <div class="project-modal-links-bar">
              <a href="${project.githubUrl}" target="_blank" rel="noopener noreferrer" class="project-modal-github-link">
                <svg class="project-modal-link-icon" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>${project.githubUrl}</span>
              </a>
            </div>
          </div>

          <!-- Minimalist Close Icon Button -->
          <button type="button" class="project-modal-close-btn" aria-label="${i18n.t('projects.modal_close')}">
            <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <!-- Two Sections Content Body -->
        <div class="project-modal-body-grid">
          
          <!-- LEFT SECTION: Rectangular Project Text Description -->
          <div class="project-modal-text-panel">
            
            <div class="project-modal-panel-block">
              <p class="project-modal-description-paragraph">${details}</p>
            </div>

            ${features.length > 0 ? `
              <div class="project-modal-panel-block">
                <h4 class="project-modal-section-heading">
                  ${i18n.t('projects.modal_features_title')}
                </h4>
                <ul class="project-modal-features-list">
                  ${features.map(feat => `
                    <li class="project-modal-feature-item">
                      <span class="project-modal-bullet">•</span>
                      <span>${feat[currentLang] || feat['es']}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}

            <!-- Tech Stack in Left Section -->
            <div class="project-modal-panel-block">
              <h4 class="project-modal-section-heading">
                ${i18n.t('projects.modal_tech_title')}
              </h4>
              <div class="project-modal-tech-tags">
                ${project.tags.map(tag => {
                  const iconSrc = ICON_MAP[tag] || javascriptIcon;
                  return `
                    <div class="project-modal-tech-chip">
                      <img src="${iconSrc}" alt="${tag}" class="project-modal-chip-icon" />
                      <span>${tag}</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

          </div>

          <!-- RIGHT SECTION: Images Panel with Carousel & Dynamic Caption -->
          <div class="project-modal-gallery-panel">
            
            <div class="project-modal-carousel-container">
              
              <!-- Image Viewport -->
              <div class="project-modal-image-viewport">
                <img 
                  src="${currentGalleryItem.src}" 
                  alt="${currentCaption || title}" 
                  class="project-modal-gallery-img"
                  loading="eager"
                />

                ${totalSlides > 1 ? `
                  <!-- Left Navigation Arrow (High Visibility) -->
                  <button type="button" class="project-modal-arrow-btn project-modal-arrow-left" aria-label="${i18n.t('projects.modal_prev_img')}">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                  </button>

                  <!-- Right Navigation Arrow (High Visibility) -->
                  <button type="button" class="project-modal-arrow-btn project-modal-arrow-right" aria-label="${i18n.t('projects.modal_next_img')}">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>

                  <!-- Minimalist Slide Counter Badge -->
                  <div class="project-modal-counter-badge">
                    ${currentSlideIndex + 1} / ${totalSlides}
                  </div>
                ` : ''}
              </div>

              <!-- Dynamic Slide Pagination Dots (if multi-image) -->
              ${totalSlides > 1 ? `
                <div class="project-modal-dots-row">
                  ${gallery.map((_, idx) => `
                    <button type="button" class="project-modal-dot ${idx === currentSlideIndex ? 'active' : ''}" data-index="${idx}" aria-label="Slide ${idx + 1}"></button>
                  `).join('')}
                </div>
              ` : ''}

              <!-- Dynamic Changing Image Caption -->
              <div class="project-modal-caption-box">
                <p class="project-modal-caption-text">${currentCaption}</p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  `;

  modalContainer.innerHTML = modalHtml;
  bindModalInnerEvents(modalContainer, project);
}

function bindModalInnerEvents(container, project) {
  // Initialize Physics Canvas in background of card
  const canvasEl = container.querySelector('.project-modal-physics-canvas');
  if (canvasEl) {
    if (physicsInstance) {
      physicsInstance.destroy();
    }
    physicsInstance = new PhysicsCanvas(canvasEl);
  }

  // Close on Backdrop Click (safe against accidental drag release)
  let backdropMouseDownTarget = null;
  const backdrop = container.querySelector('.project-modal-backdrop');
  if (backdrop) {
    backdrop.addEventListener('mousedown', (e) => {
      backdropMouseDownTarget = e.target;
    });

    backdrop.addEventListener('click', (e) => {
      if (physicsInstance && typeof physicsInstance.isCurrentlyInteracting === 'function' && physicsInstance.isCurrentlyInteracting()) {
        return;
      }
      if (e.target === backdrop && backdropMouseDownTarget === backdrop) {
        closeProjectModal();
      }
    });
  }

  // Close Button Click
  const closeBtn = container.querySelector('.project-modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeProjectModal();
    });
  }

  // Arrows Click
  const prevBtn = container.querySelector('.project-modal-arrow-left');
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      prevModalImage();
    });
  }

  const nextBtn = container.querySelector('.project-modal-arrow-right');
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      nextModalImage();
    });
  }

  // Dots Click
  const dots = container.querySelectorAll('.project-modal-dot');
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetIdx = parseInt(dot.getAttribute('data-index'), 10);
      if (!isNaN(targetIdx)) {
        currentSlideIndex = targetIdx;
        updateGalleryView(project);
      }
    });
  });
}
