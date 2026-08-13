# Data Model Specification: Software Engineering Portfolio

**Feature**: Software Engineering Portfolio (Bilingual)
**Date**: 2026-08-13

---

## 1. i18n Translation Dictionary Schema (`i18n.json`)

```json
{
  "es": {
    "nav": {
      "home": "Inicio",
      "about": "Sobre Mí",
      "projects": "Proyectos",
      "skills": "Habilidades",
      "contact": "Contacto"
    },
    "hero": {
      "greeting": "Hola, soy",
      "title": "Ingeniero de Software",
      "subtitle": "Especializado en arquitectura de software, sistemas distribuidos y desarrollo web moderno.",
      "cta_projects": "Ver Proyectos",
      "cta_contact": "Contactar"
    }
  },
  "en": {
    "nav": {
      "home": "Home",
      "about": "About Me",
      "projects": "Projects",
      "skills": "Skills",
      "contact": "Contact"
    },
    "hero": {
      "greeting": "Hello, I'm",
      "title": "Software Engineer",
      "subtitle": "Specialized in software architecture, distributed systems, and modern web development.",
      "cta_projects": "View Projects",
      "cta_contact": "Get in Touch"
    }
  }
}
```

---

## 2. Project Item Schema (`projects.json`)

```json
[
  {
    "id": "project-001",
    "slug": "portfolio-engine",
    "category": "web-engineering",
    "featured": true,
    "title": {
      "es": "Portafolio para Ingeniería de Software",
      "en": "Software Engineering Portfolio Engine"
    },
    "summary": {
      "es": "Portafolio web bilingüe con modo oscuro premium, optimización de velocidad y scraper de referencias.",
      "en": "Bilingual web portfolio featuring premium dark mode, speed optimization, and reference scraper."
    },
    "tags": ["JavaScript", "Vite", "CSS3", "Node.js", "Scrape.do API"],
    "githubUrl": "https://github.com/user/portfolio",
    "demoUrl": "https://portfolio-demo.com",
    "image": "assets/images/projects/portfolio-preview.webp"
  }
]
```

---

## 3. Skill & Experience Schema (`skills.json`)

```json
{
  "categories": [
    {
      "id": "languages",
      "name": { "es": "Lenguajes de Programación", "en": "Programming Languages" },
      "skills": ["JavaScript / TypeScript", "Python", "SQL", "HTML5 / CSS3"]
    },
    {
      "id": "frameworks",
      "name": { "es": "Frameworks y Herramientas", "en": "Frameworks & Tools" },
      "skills": ["Node.js", "Vite", "Git", "REST APIs", "Docker"]
    }
  ]
}
```

---

## 4. Scrape Analysis Output Schema (`scraped-reference.json`)

```json
{
  "scrapedAt": "2026-08-13T19:00:00Z",
  "targetUrl": "https://morez.co/#hello",
  "meta": {
    "title": "Agence Web Lyon 69",
    "description": "MOREZ est une Agence Web basée à Lyon..."
  },
  "sections": [
    { "id": "hero", "heading": "MOREZ", "anchors": ["#hello"] },
    { "id": "projects", "heading": "Projets", "anchors": ["#projects"] }
  ],
  "colorPalette": ["#000000", "#ffffff", "#121216", "#3b82f6"]
}
```
