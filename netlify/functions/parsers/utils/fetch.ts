const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Fetch a listing page using ScrapingBee to bypass WAF/CAPTCHA.
 * Falls back to direct fetch if ScrapingBee key is not configured.
 */
export async function fetchPage(url: string): Promise<string> {
  const apiKey = process.env.SCRAPINGBEE_API_KEY;

  if (apiKey) {
    return fetchViaScrapingBee(url, apiKey);
  }

  // Direct fetch fallback (works for some sites, blocked by Redfin/Zillow WAF)
  return fetchDirect(url);
}

async function fetchViaScrapingBee(url: string, apiKey: string): Promise<string> {
  const params = new URLSearchParams({
    api_key: apiKey,
    url: url,
    render_js: 'false', // 1 credit instead of 5; JSON-LD is in the static HTML
    premium_proxy: 'true', // helps bypass WAF
  });

  console.log(`Fetching via ScrapingBee: ${url}`);
  const res = await fetch(`https://app.scrapingbee.com/api/v1/?${params.toString()}`);

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`ScrapingBee error ${res.status}: ${body.slice(0, 200)}`);
    throw new Error(`ScrapingBee fetch failed: ${res.status}`);
  }

  return res.text();
}

async function fetchDirect(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': randomUA(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
    redirect: 'follow',
  });

  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }

  return res.text();
}

export async function fetchImage(url: string): Promise<Buffer> {
  // Images are served from CDNs (ssl.cdn-redfin.com, etc.) - direct fetch works fine
  const res = await fetch(url, {
    headers: {
      'User-Agent': randomUA(),
      'Accept': 'image/*',
    },
  });

  if (!res.ok) {
    throw new Error(`Image fetch failed: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Fetch Redfin's AVM API directly (doesn't require ScrapingBee).
 * Returns core listing data but no photos.
 */
export async function fetchRedfinApi(
  endpoint: string,
  params: Record<string, string>
): Promise<Record<string, any> | null> {
  const searchParams = new URLSearchParams(params);
  const url = `https://www.redfin.com/stingray/api/home/details/${endpoint}?${searchParams.toString()}`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': randomUA(),
      'Referer': 'https://www.redfin.com/',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) return null;

  const text = await res.text();
  // Strip the {}&&  prefix
  const jsonStr = text.startsWith('{}&&') ? text.slice(4) : text;
  try {
    const data = JSON.parse(jsonStr);
    return data?.payload || null;
  } catch {
    return null;
  }
}
