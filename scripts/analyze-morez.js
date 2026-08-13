import fs from 'node:fs';

async function analyzeMorez() {
  console.log("Fetching https://morez.co/ ...");
  const res = await fetch('https://morez.co/');
  const html = await res.text();

  console.log("\n=== 1. SCRIPTS INCLUDED ON MOREZ.CO ===");
  const scripts = [...html.matchAll(/src=['"](.*?)['"]/g)]
    .map(m => m[1])
    .filter(s => s.includes('.js'));
  console.log(scripts.slice(0, 30));

  console.log("\n=== 2. MAIN CSS FILES ON MOREZ.CO ===");
  const css = [...html.matchAll(/href=['"](.*?)['"]/g)]
    .map(m => m[1])
    .filter(s => s.includes('.css'));
  console.log(css.slice(0, 30));

  console.log("\n=== 3. SEARCH FOR BADGE / ROTATING TEXT / SVG ===");
  const svgs = [...html.matchAll(/<svg[\s\S]*?<\/svg>/gi)].map(m => m[0]);
  console.log(`Total SVGs found: ${svgs.length}`);
  svgs.forEach((svg, i) => {
    if (svg.includes('circle') || svg.includes('text') || svg.includes('Path') || svg.includes('Besoin') || svg.includes('Devis')) {
      console.log(`\nSVG #${i} (Badge/Text):`);
      console.log(svg);
    }
  });

  console.log("\n=== 4. SEARCH FOR HERO SECTION (#hello) & MARQUEE MARKUP ===");
  const helloMatch = html.match(/<div[^>]*id=['"]hello['"][\s\S]*?<\/section>/i) || html.match(/<section[^>]*id=['"]hello['"][\s\S]*?<\/section>/i);
  if (helloMatch) {
    console.log(helloMatch[0].substring(0, 3000));
  } else {
    // search for text around 'Besoin' or 'Devis' or 'agencia web'
    const index = html.indexOf('agence web') !== -1 ? html.indexOf('agence web') : html.indexOf('agencia web');
    if (index !== -1) {
      console.log(html.substring(index - 500, index + 2500));
    }
  }

  // Also fetch the salient main theme CSS or custom CSS to check exact animation properties
  const salientCssUrl = css.find(c => c.includes('salient') || c.includes('style') || c.includes('main'));
  if (salientCssUrl) {
    console.log(`\n=== 5. FETCHING MAIN CSS: ${salientCssUrl} ===`);
    try {
      const cssRes = await fetch(salientCssUrl);
      const cssText = await cssRes.text();
      
      console.log("\nKeyframes found in CSS:");
      const keyframes = cssText.match(/@keyframes[\s\S]*?\{[\s\S]*?\}\s*\}/g) || [];
      console.log(keyframes.slice(0, 10));

      const rotateCss = cssText.match(/\.[a-zA-Z0-9_-]*rotate[a-zA-Z0-9_-]*[\s\S]*?\{[\s\S]*?\}/gi) || [];
      console.log("\nRotation classes in CSS:", rotateCss.slice(0, 5));

      const marqueeCss = cssText.match(/\.[a-zA-Z0-9_-]*scrolling[a-zA-Z0-9_-]*[\s\S]*?\{[\s\S]*?\}/gi) || [];
      console.log("\nMarquee classes in CSS:", marqueeCss.slice(0, 5));
    } catch(e) {
      console.error("Failed to fetch CSS:", e.message);
    }
  }
}

analyzeMorez();
