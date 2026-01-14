/**
 * CAPTCHA Detector - "Land Ho!" Alert System
 * 
 * Monitors browser for CAPTCHA detection and fires alerts.
 * Like a ship's lookout spotting land ahead.
 * 
 * Usage:
 *   const detector = new CaptchaDetector(page);
 *   detector.on('captcha:detected', (event) => {
 *     console.log('🚢 LAND HO!', event);
 *   });
 *   await detector.start();
 */

const EventEmitter = require('events');

// CAPTCHA patterns to watch for
const DETECTION_PATTERNS = {
  // Network URL patterns
  network: [
    { pattern: 'google.com/recaptcha', type: 'recaptcha' },
    { pattern: 'gstatic.com/recaptcha', type: 'recaptcha' },
    { pattern: 'recaptcha/api', type: 'recaptcha' },
    { pattern: 'recaptcha/enterprise', type: 'recaptcha' },
    { pattern: 'hcaptcha.com', type: 'hcaptcha' },
    { pattern: 'challenges.cloudflare.com', type: 'cloudflare' },
    { pattern: 'turnstile.cloudflare.com', type: 'cloudflare-turnstile' },
    { pattern: 'arkoselabs.com', type: 'arkose' },
    { pattern: 'funcaptcha.com', type: 'funcaptcha' },
    { pattern: 'api.friendlycaptcha.com', type: 'friendlycaptcha' },
    { pattern: 'mtcaptcha.com', type: 'mtcaptcha' },
  ],
  
  // DOM selectors to watch for
  dom: [
    { selector: 'iframe[src*="recaptcha"]', type: 'recaptcha' },
    { selector: 'iframe[src*="hcaptcha"]', type: 'hcaptcha' },
    { selector: 'iframe[src*="challenge"]', type: 'cloudflare' },
    { selector: '.g-recaptcha', type: 'recaptcha' },
    { selector: '.h-captcha', type: 'hcaptcha' },
    { selector: '[data-sitekey]', type: 'captcha' },
    { selector: '#cf-turnstile', type: 'cloudflare-turnstile' },
    { selector: '.cf-turnstile', type: 'cloudflare-turnstile' },
    { selector: '#challenge-form', type: 'cloudflare' },
    { selector: '#challenge-running', type: 'cloudflare' },
    { selector: '.arkose-challenge', type: 'arkose' },
  ],
  
  // Page title patterns (Cloudflare challenge pages)
  title: [
    { pattern: 'Just a moment', type: 'cloudflare' },
    { pattern: 'Attention Required', type: 'cloudflare' },
    { pattern: 'Access denied', type: 'blocked' },
    { pattern: 'Checking your browser', type: 'cloudflare' },
  ]
};

class CaptchaDetector extends EventEmitter {
  constructor(page) {
    super();
    this.page = page;
    this.client = null;
    this.isRunning = false;
    this.detections = [];
    this.checkInterval = null;
    
    // Debounce to avoid duplicate alerts
    this.lastAlert = {};
    this.debounceMs = 2000;
  }
  
  async start() {
    if (this.isRunning) return;
    
    console.log('🔭 CAPTCHA Detector starting...');
    
    // Get CDP session
    this.client = await this.page.target().createCDPSession();
    
    // Enable network monitoring
    await this.client.send('Network.enable');
    
    // Watch network requests
    this.client.on('Network.requestWillBeSent', (event) => {
      this._checkNetworkRequest(event);
    });
    
    // Start DOM polling
    this._startDOMPolling();
    
    // Watch for navigation (title changes)
    this.page.on('framenavigated', () => {
      setTimeout(() => this._checkPageTitle(), 1000);
    });
    
    this.isRunning = true;
    console.log('🔭 CAPTCHA Detector active - watching for land...');
    
    return this;
  }
  
  stop() {
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    console.log('🔭 CAPTCHA Detector stopped');
  }
  
  _checkNetworkRequest(event) {
    const url = event.request.url;
    
    for (const pattern of DETECTION_PATTERNS.network) {
      if (url.includes(pattern.pattern)) {
        this._alert({
          source: 'network',
          type: pattern.type,
          url: url,
          pageUrl: this.page.url(),
          requestId: event.requestId,
          timestamp: new Date().toISOString()
        });
        break;
      }
    }
  }
  
  _startDOMPolling() {
    // Poll DOM every 500ms for CAPTCHA elements
    this.checkInterval = setInterval(async () => {
      if (!this.isRunning) return;
      
      try {
        await this._checkDOM();
        await this._checkPageTitle();
      } catch (e) {
        // Page might have navigated
      }
    }, 500);
  }
  
  async _checkDOM() {
    for (const pattern of DETECTION_PATTERNS.dom) {
      try {
        const found = await this.page.$(pattern.selector);
        if (found) {
          this._alert({
            source: 'dom',
            type: pattern.type,
            selector: pattern.selector,
            pageUrl: this.page.url(),
            timestamp: new Date().toISOString()
          });
        }
      } catch (e) {
        // Ignore errors
      }
    }
  }
  
  async _checkPageTitle() {
    try {
      const title = await this.page.title();
      
      for (const pattern of DETECTION_PATTERNS.title) {
        if (title.includes(pattern.pattern)) {
          this._alert({
            source: 'title',
            type: pattern.type,
            title: title,
            pageUrl: this.page.url(),
            timestamp: new Date().toISOString()
          });
          break;
        }
      }
    } catch (e) {
      // Ignore
    }
  }
  
  _alert(detection) {
    // Debounce duplicate alerts
    const key = `${detection.type}-${detection.source}`;
    const now = Date.now();
    
    if (this.lastAlert[key] && (now - this.lastAlert[key]) < this.debounceMs) {
      return;
    }
    
    this.lastAlert[key] = now;
    this.detections.push(detection);
    
    // Fire the event!
    this.emit('captcha:detected', detection);
    
    // Also emit specific type event
    this.emit(`captcha:${detection.type}`, detection);
    
    // Console alert
    this._printAlert(detection);
  }
  
  _printAlert(detection) {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║  🚢 LAND HO! CAPTCHA DETECTED! 🚢                            ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║  Type:   ${detection.type.padEnd(50)}║`);
    console.log(`║  Source: ${detection.source.padEnd(50)}║`);
    console.log(`║  Page:   ${(detection.pageUrl || '').slice(0, 50).padEnd(50)}║`);
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
  }
  
  getDetections() {
    return this.detections;
  }
  
  clearDetections() {
    this.detections = [];
    this.lastAlert = {};
  }
}

/**
 * Alert system for multi-agent coordination
 * Sends notifications to other agents when CAPTCHA is detected
 */
class AlertBroadcaster extends EventEmitter {
  constructor() {
    super();
    this.subscribers = new Map();
  }
  
  // Subscribe an agent to alerts
  subscribe(agentId, callback) {
    this.subscribers.set(agentId, callback);
    console.log(`📡 Agent ${agentId} subscribed to CAPTCHA alerts`);
  }
  
  unsubscribe(agentId) {
    this.subscribers.delete(agentId);
  }
  
  // Broadcast alert to all subscribers
  broadcast(detection) {
    const alert = {
      id: `alert-${Date.now()}`,
      detection,
      timestamp: new Date().toISOString(),
      priority: this._getPriority(detection.type)
    };
    
    for (const [agentId, callback] of this.subscribers) {
      try {
        callback(alert);
      } catch (e) {
        console.error(`Error notifying agent ${agentId}:`, e.message);
      }
    }
    
    this.emit('broadcast', alert);
    
    return alert;
  }
  
  _getPriority(type) {
    const priorities = {
      'cloudflare': 'HIGH',
      'recaptcha': 'HIGH',
      'hcaptcha': 'MEDIUM',
      'arkose': 'MEDIUM',
      'blocked': 'CRITICAL'
    };
    return priorities[type] || 'MEDIUM';
  }
}

// Singleton broadcaster for global access
const globalBroadcaster = new AlertBroadcaster();

module.exports = {
  CaptchaDetector,
  AlertBroadcaster,
  globalBroadcaster,
  DETECTION_PATTERNS
};

// Demo if run directly
if (require.main === module) {
  (async () => {
    const puppeteer = require('puppeteer');
    
    console.log('=== CAPTCHA Detector Demo ===\n');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    // Setup detector
    const detector = new CaptchaDetector(page);
    
    // Listen for detections
    detector.on('captcha:detected', (event) => {
      console.log('\n🎯 Detection event received:', event.type);
    });
    
    await detector.start();
    
    // Test on reCAPTCHA demo
    console.log('\nNavigating to reCAPTCHA demo page...');
    await page.goto('https://www.google.com/recaptcha/api2/demo');
    
    // Wait and watch
    await new Promise(r => setTimeout(r, 10000));
    
    console.log('\n📊 Total detections:', detector.getDetections().length);
    
    detector.stop();
    await browser.close();
  })();
}
