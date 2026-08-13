import { renderHeader, bindHeaderEvents } from './components/header.js';
import { renderHero, bindHeroEvents } from './components/hero.js';
import { renderProjects, bindProjectsEvents } from './components/projects.js';
import { renderSkills } from './components/skills.js';
import { renderContact, bindContactEvents } from './components/contact.js';

function mountApp() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    ${renderHeader()}
    <main>
      ${renderHero()}
      ${renderProjects()}
      ${renderSkills()}
      ${renderContact()}
    </main>
  `;

  // Bind Events
  bindHeaderEvents(app);
  bindHeroEvents(app);
  bindProjectsEvents(app, () => {
    // Re-render projects section on category filter change
    const projectsSec = app.querySelector('#projects');
    if (projectsSec) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = renderProjects();
      projectsSec.replaceWith(tempDiv.firstElementChild);
      bindProjectsEvents(app, () => mountApp());
    }
  });
  bindContactEvents(app);
}

// Re-render full app when language changes
window.addEventListener('language-changed', () => {
  mountApp();
});

// Mount immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}

