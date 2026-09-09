import { describe, it, expect } from 'vitest';
import projectsData from '../src/data/projects.json';

describe('Projects Data', () => {
  it('should contain project entries with bilingual titles and summaries', () => {
    expect(projectsData.length).toBeGreaterThan(0);
    const firstProj = projectsData[0];
    expect(firstProj.title).toHaveProperty('es');
    expect(firstProj.title).toHaveProperty('en');
    expect(firstProj.summary).toHaveProperty('es');
    expect(firstProj.summary).toHaveProperty('en');
    expect(Array.isArray(firstProj.tags)).toBe(true);
  });

  it('should filter projects correctly by category', () => {
    const webProjects = projectsData.filter(p => p.category === 'web-engineering');
    expect(webProjects.every(p => p.category === 'web-engineering')).toBe(true);
  });

  it('should have rich galleries with bilingual captions and features', () => {
    projectsData.forEach(proj => {
      expect(Array.isArray(proj.gallery)).toBe(true);
      expect(proj.gallery.length).toBeGreaterThan(0);
      proj.gallery.forEach(item => {
        expect(typeof item.src).toBe('string');
        expect(item.caption).toHaveProperty('es');
        expect(item.caption).toHaveProperty('en');
      });

      if (proj.features) {
        expect(Array.isArray(proj.features)).toBe(true);
        proj.features.forEach(feat => {
          expect(feat).toHaveProperty('es');
          expect(feat).toHaveProperty('en');
        });
      }

      expect(proj.caseStudy).toBeDefined();
      for (const key of ['role', 'challenge', 'result']) {
        expect(proj.caseStudy[key]).toHaveProperty('es');
        expect(proj.caseStudy[key]).toHaveProperty('en');
      }
      if (proj.githubUrl !== null) {
        expect(proj.githubUrl).toMatch(/^https:\/\/github\.com\/AqueosHeart\//);
      }
    });
  });

  it('should expose the verified LimitLoot demo and page-capture gallery', () => {
    const shop = projectsData.find(project => project.id === 'shop-ecommerce');

    expect(shop).toBeDefined();
    expect(shop.demoUrl).toBe('https://shop-umber-theta.vercel.app');
    expect(shop.githubUrl).toBe('https://github.com/AqueosHeart/limitloot-demo');
    expect(shop.gallery).toHaveLength(3);
    expect(shop.gallery.map(item => item.src)).toEqual([
      '/assets/images/projects/limitloot-home.png',
      '/assets/images/projects/limitloot-cart.png',
      '/assets/images/projects/limitloot-checkout.png',
    ]);
  });
});
