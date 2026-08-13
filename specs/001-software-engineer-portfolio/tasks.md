# Tasks: Software Engineering Portfolio (Bilingual)

**Feature**: Software Engineering Portfolio (Bilingual)
**Branch**: `001-software-engineer-portfolio`
**Spec**: [spec.md](file:///c:/Users/SEBASTIAN/Desktop/Portafolio/specs/001-software-engineer-portfolio/spec.md) | **Plan**: [plan.md](file:///c:/Users/SEBASTIAN/Desktop/Portafolio/specs/001-software-engineer-portfolio/plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic folder structure

- [x] T001 Create project folder structure (`src/assets`, `src/components`, `src/data`, `src/services`, `scripts`, `tests`) per implementation plan
- [x] T002 Initialize npm project dependencies (`vite`, `vitest`, `axios`, `dotenv`) in `package.json`
- [x] T003 [P] Configure Vite dev server and build settings in `vite.config.js`
- [x] T004 [P] Create environment variable template file `.env.example` containing `SCRAPE_DO_TOKEN` placeholder

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core CSS design tokens, HTML entry point, and shared utilities

- [x] T005 Create design system tokens with exact `morez.co` palette (`#000000`/`#0a0a0c`, `#ffffff`, `#BC80BB`, `#97C594`, `#0693e3`) and `Geist` / `Geist Mono` `@font-face` rules in `src/assets/css/variables.css`
- [x] T006 [P] Create global reset, layout grid, and backdrop-blur header styles matching `morez.co` in `src/assets/css/main.css`
- [x] T007 [P] Create reusable UI component styles and keyframe animations (`nectar_looped_rotate` 12s, marquee ticker) matching `morez.co` in `src/assets/css/components.css`
- [x] T008 Create base HTML index structure with SEO metadata, font links, and mounting targets in `index.html`
- [x] T009 Create application entry point and DOM initialization in `src/main.js`

---

## Phase 3: User Story 1 - Bilingual Experience & Language Switching (Priority: P1) 🎯 MVP

**Goal**: Enable seamless instant language switching between Spanish (ES) and English (EN) with browser locale auto-detection and persistent storage.

**Independent Test**: Load page, verify auto-detected language, toggle between ES and EN, and confirm all headings and text elements update instantly (<50ms).

- [x] T010 [P] [US1] Create bilingual translation dictionary with full ES and EN text content in `src/data/i18n.json`
- [x] T011 [US1] Implement language state management, browser locale auto-detection, and `sessionStorage` persistence in `src/services/i18n.js`
- [x] T012 [US1] Implement floating header navbar with logo, navigation links, and language toggle control in `src/components/header.js`
- [x] T013 [US1] Create unit tests for locale resolution, fallback behavior, and dictionary translation lookups in `tests/i18n.test.js`

---

## Phase 4: User Story 2 - Software Engineer Showcase & Project Portfolio (Priority: P1) 🎯 MVP

**Goal**: Present software engineer bio, technical skills grouped by domain, and featured project cards with technology tag filtering.

**Independent Test**: Render project cards, click category filter tags, and verify matching projects display while others hide cleanly.

- [x] T014 [P] [US2] Create featured project portfolio dataset in `src/data/projects.json`
- [x] T015 [P] [US2] Create categorized software engineering skills dataset in `src/data/skills.json`
- [x] T016 [US2] Implement Hero section component with greeting, tagline, and call-to-action buttons in `src/components/hero.js`
- [x] T017 [US2] Implement Projects section component with dynamic card rendering and technology tag filtering in `src/components/projects.js`
- [x] T018 [US2] Implement Skills section component with domain breakdown in `src/components/skills.js`
- [x] T019 [US2] Create unit tests for project tag filtering and dynamic card DOM updates in `tests/projects.test.js`

---

## Phase 5: User Story 3 - Reference Webpage Scraping & Design Adaptation Workflow (Priority: P2)

**Goal**: Provide a Scrape.do API CLI script to scrape `https://morez.co/#hello` and generate a design adaptation summary.

**Independent Test**: Execute `node scripts/scrape-reference.js https://morez.co/#hello` with a valid token and confirm `src/data/scraped-reference.json` is generated.

- [x] T020 [US3] Create Scrape.do API client service in `src/services/scraper.js`
- [x] T021 [US3] Implement Node.js CLI script for fetching reference site markup and extracting layout nodes in `scripts/scrape-reference.js`
- [x] T022 [US3] Generate local reference site analysis output in `src/data/scraped-reference.json`

---

## Phase 6: User Story 4 - Contact & Professional Engagement (Priority: P3)

**Goal**: Enable visitors to contact the engineer and access external social profiles (GitHub, LinkedIn).

**Independent Test**: Fill out contact form fields, submit, and verify bilingual confirmation feedback message.

- [x] T023 [US4] Implement Contact section component with form validation and social profile links in `src/components/contact.js`

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Responsive fine-tuning, accessibility audit, and validation

- [x] T024 [P] Fine-tune responsive mobile drawer menu and touch interactions in `src/assets/css/components.css`
- [x] T025 [P] Verify Lighthouse accessibility, contrast, and performance audit targets (>90 score)
- [x] T026 Execute quickstart validation scenarios defined in `specs/001-software-engineer-portfolio/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) - BLOCKS all User Stories.
- **User Stories (Phases 3-6)**: All depend on Foundational (Phase 2) completion.
- **Polish (Phase 7)**: Depends on User Stories completion.

### Parallel Opportunities
- T003, T004 in Setup can run in parallel.
- T006, T007 in Foundational can run in parallel.
- T010 [US1], T014 [US2], T015 [US2] data files can be created in parallel.
- T024, T025 in Polish can run in parallel.
