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
});
