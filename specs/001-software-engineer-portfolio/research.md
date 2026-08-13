# Exact Scraped Design Specification: Reference `https://morez.co/`

**Status**: 🔒 LOCKED DESIGN BLUEPRINT (No alterations to colors, fonts, or animations without explicit user approval)  
**Date**: 2026-08-13  

---

## 1. Typography & Fonts (Strict 1:1 Mirror)

- **Primary Font**: `Geist` (`Geist-Regular.woff2`, `Geist-Bold.woff2`)
- **Monospace Font**: `Geist Mono` (`Geist-Mono-Regular.woff2`, `Geist-Mono-Bold.woff2`)
- **Fallback Stack**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

```css
@font-face {
  font-family: 'Geist';
  src: url('https://morez.co/wp-content/themes/salient-child/fonts/Geist/Geist-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
}

@font-face {
  font-family: 'Geist';
  src: url('https://morez.co/wp-content/themes/salient-child/fonts/Geist/Geist-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
}

@font-face {
  font-family: 'Geist Mono';
  src: url('https://morez.co/wp-content/themes/salient-child/fonts/Geist/Geist-Mono-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
}
```

---

## 2. Color Palette (Strict 1:1 Mirror - Unchanged)

```css
:root {
  --bg-primary: #000000;
  --bg-secondary: #0a0a0c;
  --text-primary: #ffffff;
  --text-secondary: #abb8c3;
  --accent-cyan: #0693e3;
  --accent-purple: #9b51e0;
  --accent-lavender: #BC80BB;
  --accent-sage: #97C594;
  --accent-blue: #669ACA;
  --border-color: rgba(255, 255, 255, 0.1);
}
```

---

## 3. Animations & Keyframes (Strict 1:1 Mirror)

### 3.1 Looped Rotating Badge Animation (`nectar_looped_rotate`)
```css
.looped-animation-rotate .inner {
  animation: nectar_looped_rotate 12s forwards infinite linear;
}

@keyframes nectar_looped_rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### 3.2 Continuous Marquee Text Ticker (`nectar-scrolling-text`)
```css
@keyframes scrollingTicker {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-50%); }
}

.nectar-scrolling-text-inner {
  display: flex;
  white-space: nowrap;
  animation: scrollingTicker 25s linear infinite;
}
```

### 3.3 Translucent Header Backdrop Blur
```css
#header-outer.transparent {
  background-color: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border-color);
}
```

---

## 4. Section Structure Blueprint (`morez.co`)

1. **Floating Navigation Bar** (`#header-outer`):
   - Logo, Anchor links (`#hello`, `#agence`, `#realisations`, `#expertises`, `#contact`), Language Toggle (`ES` / `EN`).
2. **Hero / Intro Section** (`#hello`):
   - Ambient degradation background glow layers (`bg-degrad-layer`).
   - High-contrast primary title (`h1`).
   - Monospace summary lead paragraph (`font-mono`).
   - 12s spinning badge emblem overlay.
3. **Continuous Partner / Skill Ticker** (`nectar-scrolling-text`):
   - Infinite horizontal marquee with technical logos and badges.
4. **About & Engineering Agency** (`#agence`):
   - Methodology breakdown, statistics counter, interactive visual cards.
5. **Projects Showcase Grid** (`#realisations`):
   - Filterable project grid with hover scale-up transforms and detail cards.
6. **Skills & Domain Breakdown** (`#expertises`):
   - Domain category cards (Languages, Frameworks, Architecture, Cloud).
7. **Contact & Footer Section** (`#contact`):
   - Contact inquiry form, direct email, location, and social links.
