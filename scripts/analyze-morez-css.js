import fs from 'node:fs';

async function analyzeMorezCSS() {
  const cssUrls = [
    'https://morez.co/wp-content/cache/min/1/wp-content/themes/salient/css/build/elements/element-scrolling-text.css?ver=1772619807',
    'https://morez.co/wp-content/cache/min/1/wp-content/themes/salient-child/style.css?ver=1772619807',
    'https://morez.co/wp-content/cache/min/1/wp-content/themes/salient-child/css/layout-aa.css?ver=1772619807',
    'https://morez.co/wp-content/cache/min/1/wp-content/themes/salient-child/css/pages.css?ver=1772619807',
    'https://morez.co/wp-content/cache/min/1/wp-content/themes/salient-child/css/cursor.css?ver=1772619807'
  ];

  for (const url of cssUrls) {
    console.log(`\n========================================`);
    console.log(`FETCHING: ${url}`);
    console.log(`========================================`);
    try {
      const res = await fetch(url);
      const text = await res.text();
      console.log(text.substring(0, 3000));
    } catch(e) {
      console.error(e.message);
    }
  }
}

analyzeMorezCSS();
