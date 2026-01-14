/**
 * Profile Builder
 * 
 * Creates human-like browser profiles with:
 * - Browsing history
 * - Cookies
 * - Local storage data
 * - Realistic preferences
 * 
 * A "warm" profile looks more human than a fresh one.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Sites to visit to build history
const WARMUP_SITES = [
  'https://www.google.com',
  'https://www.youtube.com',
  'https://www.amazon.com',
  'https://www.wikipedia.org',
  'https://www.reddit.com',
  'https://www.github.com',
  'https://news.ycombinator.com',
  'https://www.stackoverflow.com',
];

// Random delay between visits
const randomDelay = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

async function buildProfile(profileDir) {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║           BROWSER PROFILE BUILDER                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  
  // Ensure profile directory exists
  if (!fs.existsSync(profileDir)) {
    fs.mkdirSync(profileDir, { recursive: true });
  }
  
  console.log(`📁 Profile directory: ${profileDir}`);
  console.log('🔧 Launching browser for profile warm-up...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--disable-blink-features=AutomationControlled',
    ],
    ignoreDefaultArgs: ['--enable-automation'],
  });
  
  const page = await browser.newPage();
  
  // Set realistic viewport
  await page.setViewport({ width: 1920, height: 1080 });
  
  // Apply stealth patches
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        const plugins = [
          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
          { name: 'Native Client', filename: 'internal-nacl-plugin' }
        ];
        plugins.item = i => plugins[i];
        plugins.namedItem = n => plugins.find(p => p.name === n);
        plugins.refresh = () => {};
        return plugins;
      }
    });
    
    window.chrome = { runtime: {} };
  });
  
  console.log('🌐 Visiting sites to build history...\n');
  
  for (const site of WARMUP_SITES) {
    try {
      console.log(`   📍 ${site}`);
      await page.goto(site, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      // Random scroll to simulate human behavior
      await page.evaluate(() => {
        window.scrollTo(0, Math.random() * 500);
      });
      
      // Random delay between sites
      const delay = randomDelay(1000, 3000);
      await new Promise(r => setTimeout(r, delay));
      
    } catch (e) {
      console.log(`      ⚠️ Skipped (${e.message})`);
    }
  }
  
  // Accept some cookies if prompted
  console.log('\n🍪 Looking for cookie consent dialogs...');
  
  const cookieSelectors = [
    'button[id*="accept"]',
    'button[class*="accept"]',
    'button[aria-label*="Accept"]',
    'button:has-text("Accept")',
    '[data-testid*="accept"]',
  ];
  
  for (const selector of cookieSelectors) {
    try {
      const button = await page.$(selector);
      if (button) {
        await button.click();
        console.log(`   ✅ Clicked cookie consent`);
        break;
      }
    } catch (e) {}
  }
  
  // Save some local storage data
  console.log('\n💾 Adding realistic local storage data...');
  
  await page.evaluate(() => {
    const fakeData = {
      'user_preferences': JSON.stringify({ theme: 'light', notifications: true }),
      'visited_count': '12',
      'last_visit': new Date().toISOString(),
      'consent_given': 'true'
    };
    
    Object.entries(fakeData).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, value);
      } catch (e) {}
    });
  });
  
  console.log('   ✅ Local storage populated');
  
  // Close browser (profile is saved automatically)
  await browser.close();
  
  // Create a marker file
  fs.writeFileSync(
    path.join(profileDir, '.profile-built'),
    JSON.stringify({
      builtAt: new Date().toISOString(),
      sitesVisited: WARMUP_SITES.length,
      version: '1.0'
    }, null, 2)
  );
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ PROFILE BUILD COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nProfile saved to: ${profileDir}`);
  console.log('This profile now has:');
  console.log('  • Browsing history');
  console.log('  • Cookies from major sites');
  console.log('  • Local storage data');
  console.log('  • Realistic preferences');
  console.log('\nUse this profile with:');
  console.log(`  npm run lab:start`);
  console.log('='.repeat(60) + '\n');
}

// Main execution
const profileDir = process.argv[2] || path.join(__dirname, '../browser/profile');
buildProfile(profileDir).catch(console.error);
