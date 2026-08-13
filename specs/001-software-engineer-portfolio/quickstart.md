# Quickstart & Verification Guide: Software Engineering Portfolio

**Feature**: Software Engineering Portfolio (Bilingual)
**Date**: 2026-08-13

---

## 1. Prerequisites
- Node.js (v18.x or higher)
- npm (v9.x or higher)

---

## 2. Ingestion & Analysis Verification Script

To scrape and analyze the reference site (`https://morez.co/#hello`) using your Scrape.do API key:

```bash
# 1. Set Scrape.do token in your local environment
export SCRAPE_DO_TOKEN="your_scrape_do_token_here"  # On PowerShell: $env:SCRAPE_DO_TOKEN="your_token"

# 2. Execute the ingestion script
node scripts/scrape-reference.js https://morez.co/#hello
```

**Expected Outcome**:
Generates `src/data/scraped-reference.json` summarizing extracted layout sections, header structure, and color palettes.

---

## 3. Development Server & Bilingual Testing

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev
```

### Verification Steps
1. **Initial Load**:
   - Open browser at `http://localhost:5173`.
   - Verify initial language auto-detects browser locale (or defaults to Spanish/English as configured).
2. **Bilingual Toggle**:
   - Click the language toggle button in navigation (`ES` / `EN`).
   - Confirm all text elements, headings, project descriptions, and navigation links update instantly (<50ms).
3. **Responsive Check**:
   - Resize window to mobile viewport (<768px).
   - Confirm floating nav header adapts into a responsive mobile drawer menu.
4. **Project Filters**:
   - Click technology filter tags (e.g. `JavaScript`, `Node.js`).
   - Confirm project grid filters cards dynamically.
