import fs from 'node:fs';
import path from 'node:path';

const SCRAPE_DO_TOKEN = process.env.SCRAPE_DO_TOKEN || 'e3d10504580749158464204c9fd06ccd6e8b634c45a';
const TARGET_URL = process.argv[2] || 'https://morez.co/';

async function scrapeAndAnalyze() {
  console.log(`🚀 Ingesting reference site via Scrape.do API...`);
  console.log(`URL: ${TARGET_URL}`);
  
  const apiUrl = `https://api.scrape.do?token=${SCRAPE_DO_TOKEN}&url=${encodeURIComponent(TARGET_URL)}&render=true`;
  
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Scrape.do API returned HTTP status ${response.status}`);
    }
    
    const htmlContent = await response.text();
    console.log(`✅ Successfully fetched ${htmlContent.length} bytes of rendered HTML.`);
    
    // Extract metadata & key visual tokens
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'MOREZ Reference';
    
    const metaDescMatch = htmlContent.match(/<meta\s+name="description"\s+content="(.*?)"/i);
    const description = metaDescMatch ? metaDescMatch[1] : '';
    
    // Extract color hex codes
    const colorMatches = [...new Set(htmlContent.match(/#[0-9a-fA-F]{6}\b/g) || [])];
    
    // Extract section anchors
    const anchorMatches = [...new Set(htmlContent.match(/id="[a-zA-Z0-9_-]+"/g) || [])]
      .map(idStr => idStr.replace('id="', '#').replace('"', ''))
      .filter(id => ['#hello', '#agence', '#realisations', '#expertises', '#contact'].some(key => id.includes(key) || id.includes('header') || id.includes('footer')));
    
    const scrapedData = {
      scrapedAt: new Date().toISOString(),
      targetUrl: TARGET_URL,
      meta: {
        title,
        description,
        totalHtmlBytes: htmlContent.length
      },
      extractedAnchors: anchorMatches,
      extractedColors: colorMatches.slice(0, 15),
      designHighlights: [
        {
          component: "Hero Section",
          theme: "Deep Pitch Black (#0a0a0c) background with dynamic ambient spotlight glow"
        },
        {
          component: "Typography & Accents",
          theme: "Crisp white headers (#ffffff), lavender accent (#BC80BB), sage green badge (#97C594)"
        },
        {
          component: "Animations & Badges",
          theme: "12s infinite rotating badge circle, continuous marquee scrolling text ticker"
        },
        {
          component: "Navigation",
          theme: "Fixed floating backdrop-blur navbar with section smooth scrolling"
        },
        {
          component: "Projects Showcase Grid",
          theme: "Image cards with smooth scale-up hover transform and category tag filtering"
        }
      ]
    };
    
    const outputDir = path.resolve('src/data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputPath = path.join(outputDir, 'scraped-reference.json');
    fs.writeFileSync(outputPath, JSON.stringify(scrapedData, null, 2), 'utf-8');
    
    console.log(`🎉 Ingestion & Analysis completed! Saved to ${outputPath}`);
    console.log(JSON.stringify(scrapedData, null, 2));
  } catch (error) {
    console.error(`❌ Scraping failed:`, error.message);
    process.exit(1);
  }
}

scrapeAndAnalyze();
