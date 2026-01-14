/**
 * Stealth Browser Launcher
 * 
 * Launches ungoogled-chromium with maximum stealth configuration.
 * Designed to look as human as possible to detection systems.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Stealth flags that reduce automation fingerprinting
const STEALTH_ARGS = [
  // Disable automation indicators
  '--disable-blink-features=AutomationControlled',
  
  // Disable site isolation (can leak automation signals)
  '--disable-features=IsolateOrigins,site-per-process',
  '--disable-site-isolation-trials',
  
  // General stealth
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-infobars',
  '--disable-extensions',
  '--disable-popup-blocking',
  '--disable-translate',
  
  // Reduce fingerprinting surface
  '--disable-background-networking',
  '--disable-sync',
  '--disable-default-apps',
  '--metrics-recording-only',
  '--no-service-autorun',
  '--password-store=basic',
  '--use-mock-keychain',
  
  // Performance (reduces timing fingerprints)
  '--disable-backgrounding-occluded-windows',
  '--disable-renderer-backgrounding',
  '--disable-background-timer-throttling',
  '--disable-ipc-flooding-protection',
  
  // Display
  '--force-color-profile=srgb',
  '--disable-dev-shm-usage',
  '--no-sandbox',
  '--disable-setuid-sandbox'
];

// Human-like viewport sizes (common resolutions)
const VIEWPORTS = [
  { width: 1920, height: 1080 },  // Full HD (most common)
  { width: 1366, height: 768 },   // Laptop
  { width: 1536, height: 864 },   // Surface
  { width: 1440, height: 900 },   // MacBook
  { width: 2560, height: 1440 },  // QHD
];

// Realistic user agents
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

class StealthBrowser {
  constructor(options = {}) {
    this.options = {
      profileDir: options.profileDir || path.join(__dirname, 'profile'),
      headless: options.headless ?? false,
      slowMo: options.slowMo || 0,
      viewport: options.viewport || this._randomViewport(),
      userAgent: options.userAgent || this._randomUserAgent(),
      ...options
    };
    
    this.browser = null;
    this.page = null;
  }
  
  _randomViewport() {
    return VIEWPORTS[Math.floor(Math.random() * VIEWPORTS.length)];
  }
  
  _randomUserAgent() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }
  
  _findChromiumPath() {
    const paths = [
      // Lab-installed chromium
      path.join(__dirname, 'chromium', 'chromium.AppImage'),
      path.join(__dirname, 'chromium', 'chromium'),
      
      // System chromium
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/snap/bin/chromium',
      
      // Mac
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      
      // Windows
      'C:\\Program Files\\Chromium\\Application\\chromium.exe',
      'C:\\Program Files (x86)\\Chromium\\Application\\chromium.exe',
    ];
    
    for (const p of paths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }
    
    // Let Puppeteer use its bundled chromium
    return null;
  }
  
  async launch() {
    const chromiumPath = this._findChromiumPath();
    
    const launchOptions = {
      headless: this.options.headless,
      slowMo: this.options.slowMo,
      args: [
        ...STEALTH_ARGS,
        `--user-data-dir=${this.options.profileDir}`,
        `--window-size=${this.options.viewport.width},${this.options.viewport.height}`
      ],
      defaultViewport: this.options.viewport,
      ignoreDefaultArgs: ['--enable-automation'],
    };
    
    if (chromiumPath) {
      launchOptions.executablePath = chromiumPath;
      console.log(`🚀 Using custom Chromium: ${chromiumPath}`);
    } else {
      console.log('🚀 Using Puppeteer bundled Chromium');
    }
    
    this.browser = await puppeteer.launch(launchOptions);
    
    // Apply stealth patches to all new pages
    this.browser.on('targetcreated', async (target) => {
      if (target.type() === 'page') {
        const page = await target.page();
        await this._applyStealthPatches(page);
      }
    });
    
    // Create initial page with stealth
    this.page = await this.browser.newPage();
    await this._applyStealthPatches(this.page);
    
    console.log('✅ Stealth browser launched');
    console.log(`   Viewport: ${this.options.viewport.width}x${this.options.viewport.height}`);
    console.log(`   Profile: ${this.options.profileDir}`);
    
    return this;
  }
  
  async _applyStealthPatches(page) {
    // Set user agent
    await page.setUserAgent(this.options.userAgent);
    
    // Apply JavaScript patches before any page loads
    await page.evaluateOnNewDocument(() => {
      // 1. Hide webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
        configurable: true
      });
      
      // 2. Fake plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const plugins = [
            { 
              name: 'Chrome PDF Plugin', 
              filename: 'internal-pdf-viewer',
              description: 'Portable Document Format',
              length: 1,
              item: () => null,
              namedItem: () => null
            },
            { 
              name: 'Chrome PDF Viewer', 
              filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
              description: '',
              length: 1,
              item: () => null,
              namedItem: () => null
            },
            { 
              name: 'Native Client', 
              filename: 'internal-nacl-plugin',
              description: '',
              length: 2,
              item: () => null,
              namedItem: () => null
            }
          ];
          plugins.item = (i) => plugins[i] || null;
          plugins.namedItem = (name) => plugins.find(p => p.name === name) || null;
          plugins.refresh = () => {};
          return plugins;
        },
        configurable: true
      });
      
      // 3. Fake languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
        configurable: true
      });
      
      // 4. Add chrome object
      window.chrome = {
        runtime: {
          connect: () => {},
          sendMessage: () => {},
          onMessage: { addListener: () => {} }
        },
        loadTimes: () => ({
          commitLoadTime: Date.now() / 1000,
          connectionInfo: 'http/1.1',
          finishDocumentLoadTime: Date.now() / 1000,
          finishLoadTime: Date.now() / 1000,
          firstPaintAfterLoadTime: 0,
          firstPaintTime: Date.now() / 1000,
          navigationType: 'Other',
          npnNegotiatedProtocol: 'http/1.1',
          requestTime: Date.now() / 1000,
          startLoadTime: Date.now() / 1000,
          wasAlternateProtocolAvailable: false,
          wasFetchedViaSpdy: false,
          wasNpnNegotiated: false
        }),
        csi: () => ({
          onloadT: Date.now(),
          pageT: Date.now(),
          startE: Date.now(),
          tran: 15
        }),
        app: {
          isInstalled: false,
          InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
          RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' }
        }
      };
      
      // 5. Fix permissions
      const originalQuery = window.Permissions?.prototype?.query;
      if (originalQuery) {
        window.Permissions.prototype.query = function(parameters) {
          if (parameters.name === 'notifications') {
            return Promise.resolve({ state: 'prompt', onchange: null });
          }
          return originalQuery.call(this, parameters);
        };
      }
      
      // 6. Remove automation artifacts
      const automationProps = [
        '$cdc_', '$wdc_', '__driver_evaluate', '__webdriver_evaluate',
        '__selenium_evaluate', '__fxdriver_evaluate', '__driver_unwrapped',
        '__webdriver_unwrapped', 'domAutomation', 'domAutomationController'
      ];
      
      automationProps.forEach(prop => {
        try {
          Object.keys(window).forEach(key => {
            if (key.includes(prop)) delete window[key];
          });
        } catch (e) {}
      });
      
      // 7. Make console.debug work normally
      const originalDebug = console.debug;
      console.debug = function(...args) {
        if (args[0]?.includes?.('puppeteer')) return;
        return originalDebug.apply(this, args);
      };
    });
    
    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });
  }
  
  async newPage() {
    const page = await this.browser.newPage();
    await this._applyStealthPatches(page);
    return page;
  }
  
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('🔒 Browser closed');
    }
  }
  
  getPage() {
    return this.page;
  }
  
  getBrowser() {
    return this.browser;
  }
}

// Factory function for quick launch
async function launchStealthBrowser(options = {}) {
  const browser = new StealthBrowser(options);
  await browser.launch();
  return browser;
}

module.exports = {
  StealthBrowser,
  launchStealthBrowser,
  STEALTH_ARGS,
  VIEWPORTS,
  USER_AGENTS
};

// Demo if run directly
if (require.main === module) {
  (async () => {
    console.log('=== Stealth Browser Demo ===\n');
    
    const browser = await launchStealthBrowser({ headless: false });
    const page = browser.getPage();
    
    // Test on bot detection site
    await page.goto('https://bot.sannysoft.com/');
    console.log('\n📊 Check the browser window to see detection results\n');
    
    // Keep open for inspection
    await new Promise(r => setTimeout(r, 30000));
    
    await browser.close();
  })();
}
