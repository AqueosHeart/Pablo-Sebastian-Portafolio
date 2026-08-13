# Implementation Plan: Software Engineering Portfolio (Bilingual)

**Branch**: `001-software-engineer-portfolio` | **Date**: 2026-08-13 | **Spec**: [spec.md](file:///c:/Users/SEBASTIAN/Desktop/Portafolio/specs/001-software-engineer-portfolio/spec.md)

**Input**: Feature specification from `/specs/001-software-engineer-portfolio/spec.md`

## Summary

Build a high-performance, bilingual (`ES`/`EN`) Software Engineering Portfolio website replicating the exact visual design system, typography (`Geist` & `Geist Mono`), pitch black color palette (`#000000`/`#0a0a0c`), accent highlights (`#BC80BB`, `#97C594`, `#0693e3`), 12s emblem rotation animation, continuous marquee ticker, and layout structure extracted from `https://morez.co/`. Includes a Scrape.do API ingestion utility (`scripts/scrape-reference.js`), clean component architecture in Vanilla HTML/CSS/JS (Vite), static JSON localization dictionaries, and zero-framework runtime overhead for instant responsiveness (<100ms) and high Lighthouse scores (90+).

## Technical Context

**Language/Version**: JavaScript (ES6+ Modules), HTML5, CSS3 Custom Properties  
**Typography/Fonts**: `Geist` (`Geist-Regular.woff2`, `Geist-Bold.woff2`), `Geist Mono` (`Geist-Mono-Regular.woff2`)  
**Design Palette**: Deep Pitch Black (`#000000` / `#0a0a0c`), Crisp White (`#ffffff`), Muted Slate (`#abb8c3`), Lavender (`#BC80BB`), Sage Green (`#97C594`), Vivid Cyan (`#0693e3`)  
**Animations**: 12s infinite circular emblem rotation (`nectar_looped_rotate`), continuous marquee text ticker, translucent floating backdrop-blur header  
**Primary Dependencies**: Vite (Build tool & Dev server), Axios (Scraping utility)  
**Storage**: Static version-controlled `.json` data files (`projects.json`, `skills.json`, `i18n.json`)  
**Testing**: Vitest for unit tests & DOM assertions, Lighthouse CLI for performance/accessibility audit  
**Target Platform**: Modern Web Browsers (Desktop, Tablet, Mobile)  
**Project Type**: Web application / Single-page application (SPA)  
**Performance Goals**: First Contentful Paint <1.2s, Language switch <50ms, 60fps animations  
**Constraints**: Zero hardcoded secrets, Scrape.do API key isolated in `.env`, strict compliance with project constitution & 100% design fidelity lock  
**Scale/Scope**: 1 bilingual portfolio, ~5 major sections (Hero, About, Projects, Skills, Contact), ~10-20 projects  

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post Phase 1 design.*

- [x] **I. Code Quality & Maintainability**: Single-responsibility modules, CSS design tokens, clean modular JS functions.
- [x] **II. Performance & Speed Optimization**: Lightweight Vite setup, zero heavy framework runtime overhead, instant i18n switching.
- [x] **III. Premium Design & Interactive Feel**: Dark-mode aesthetic inspired by `https://morez.co/#hello`, translucent floating header, subtle hover glows & micro-interactions.
- [x] **IV. Clean & Minimal UI**: Accessible, responsive grid layout, clear typography hierarchy, and uncluttered navigation.
- [x] **V. Test Coverage & QA**: Automated tests for language switching, project filtering, and DOM state updates.

## Project Structure

### Documentation (this feature)

```text
specs/001-software-engineer-portfolio/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Reference site analysis & tech stack decisions
├── data-model.md        # Schemas for i18n, projects, skills, and scraped data
├── quickstart.md        # Runnable verification and testing guide
└── contracts/
    └── scrape-ingestion-api.json # Schema contract for Scrape.do integration
```

### Source Code Layout

```text
src/
├── assets/
│   ├── css/
│   │   ├── variables.css   # Color palette, typography & elevation tokens
│   │   ├── main.css        # Base layout & global styles
│   │   └── components.css  # Buttons, cards, modals & nav drawer
│   └── images/             # Project thumbnails & icons
├── components/
│   ├── header.js           # Translucent navbar & language toggle
│   ├── hero.js             # Hero banner & CTAs
│   ├── projects.js         # Portfolio project cards & tag filter
│   ├── skills.js           # Technical domain skills grid
│   └── contact.js          # Contact section & form
├── data/
│   ├── i18n.json           # ES & EN translation dictionary
│   ├── projects.json       # Featured projects data
│   └── skills.json         # Software engineering skill breakdown
├── services/
│   ├── i18n.js             # Client-side language switcher & storage
│   └── scraper.js          # Scrape.do API wrapper
├── index.html              # Main HTML entry point
└── main.js                 # App initialization & DOM mounting

scripts/
└── scrape-reference.js     # Scrape.do ingestion CLI script for https://morez.co/#hello

tests/
├── i18n.test.js            # Translation & locale resolution tests
└── projects.test.js        # Project filter & rendering tests
```

**Structure Decision**: Single-project web application layout with modular vanilla JS components, Vite dev pipeline, and isolated NodeJS scraping utility script.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| *None* | *All decisions strictly adhere to project constitution principles.* | *N/A* |
