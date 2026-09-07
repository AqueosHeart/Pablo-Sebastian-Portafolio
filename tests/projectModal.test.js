import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openProjectModal, closeProjectModal, nextModalImage, prevModalImage, initProjectModal } from '../src/components/projectModal.js';
import { PhysicsCanvas } from '../src/services/physicsCanvas.js';
import { i18n } from '../src/services/i18n.js';
import projectsData from '../src/data/projects.json';

describe('Project Modal Component', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    initProjectModal();
  });

  afterEach(() => {
    closeProjectModal();
    document.body.innerHTML = '';
  });

  it('should open modal when openProjectModal is called with valid project ID', () => {
    const testProject = projectsData[0];
    const currentLang = i18n.getLanguage();
    openProjectModal(testProject.id);

    const modalRoot = document.getElementById('project-modal-root');
    expect(modalRoot).not.toBeNull();
    const titleEl = modalRoot.querySelector('#modal-project-title');
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent).toContain(testProject.title[currentLang]);

    const githubLink = modalRoot.querySelector('.project-modal-source-link');
    expect(githubLink).not.toBeNull();
    expect(githubLink.getAttribute('href')).toBe(testProject.githubUrl);

    const demoLink = modalRoot.querySelector('.project-modal-demo-link');
    expect(demoLink).not.toBeNull();
    expect(demoLink.getAttribute('href')).toBe(testProject.demoUrl);

    const textPanel = modalRoot.querySelector('.project-modal-text-panel');
    expect(textPanel).not.toBeNull();

    const galleryPanel = modalRoot.querySelector('.project-modal-gallery-panel');
    expect(galleryPanel).not.toBeNull();
  });

  it('should display image and dynamic caption in the right panel', () => {
    const aarcProject = projectsData.find(p => p.id === 'aarc-auth');
    expect(aarcProject).toBeDefined();
    const currentLang = i18n.getLanguage();

    openProjectModal(aarcProject.id);
    const modalRoot = document.getElementById('project-modal-root');

    const galleryImg = modalRoot.querySelector('.project-modal-gallery-img');
    expect(galleryImg).not.toBeNull();
    expect(galleryImg.src).toContain(aarcProject.gallery[0].src);

    const captionText = modalRoot.querySelector('.project-modal-caption-text');
    expect(captionText).not.toBeNull();
    expect(captionText.textContent).toBe(aarcProject.gallery[0].caption[currentLang]);
  });

  it('should cycle through gallery images and update captions on next/prev', () => {
    const aarcProject = projectsData.find(p => p.id === 'aarc-auth');
    openProjectModal(aarcProject.id);

    const modalRoot = document.getElementById('project-modal-root');
    const counterBadge = modalRoot.querySelector('.project-modal-counter-badge');
    expect(counterBadge.textContent.trim()).toBe(`1 / ${aarcProject.gallery.length}`);

    nextModalImage();
    expect(counterBadge.textContent.trim()).toBe(`2 / ${aarcProject.gallery.length}`);

    prevModalImage();
    expect(counterBadge.textContent.trim()).toBe(`1 / ${aarcProject.gallery.length}`);
  });

  it('should close modal when closeProjectModal is called', () => {
    openProjectModal('aarc-auth');
    const modalRoot = document.getElementById('project-modal-root');
    expect(modalRoot.querySelector('.project-modal-glass-card')).not.toBeNull();
    expect(document.body.classList.contains('modal-open')).toBe(true);

    closeProjectModal();
    expect(document.body.classList.contains('modal-open')).toBe(false);
  });

  it('should detect icons with generous grab box and box corners in PhysicsCanvas', () => {
    const canvas = document.createElement('canvas');
    const container = document.createElement('div');
    container.appendChild(canvas);
    document.body.appendChild(container);

    const physics = new PhysicsCanvas(canvas);
    physics.width = 800;
    physics.height = 600;
    physics.bodies = [
      { id: 0, x: 100, y: 100, radius: 25, mass: 625, isGrabbed: false }
    ];

    // Directly centered
    expect(physics.findBodyAt({ x: 100, y: 100 })).not.toBeNull();
    // Generous corner and edge hit box
    expect(physics.findBodyAt({ x: 135, y: 135 })).not.toBeNull();
    // Far away position
    expect(physics.findBodyAt({ x: 300, y: 300 })).toBeNull();

    physics.destroy();
  });
});
