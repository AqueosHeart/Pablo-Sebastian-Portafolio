export async function fetchScrapedReference(targetUrl, apiToken) {
  const token = apiToken || import.meta.env.VITE_SCRAPE_DO_TOKEN;
  if (!token) {
    throw new Error("Scrape.do API token is missing.");
  }

  const endpoint = `https://api.scrape.do?token=${token}&url=${encodeURIComponent(targetUrl)}&render=true`;
  const response = await fetch(endpoint);
  
  if (!response.ok) {
    throw new Error(`Scrape.do returned HTTP ${response.status}`);
  }

  const html = await response.text();
  return {
    url: targetUrl,
    htmlBytes: html.length,
    status: 200
  };
}
