/**
 * Worker Agent
 * 
 * Responsible for:
 * - Browser automation tasks
 * - Navigation, clicking, form filling
 * - Testing stealth configurations
 * 
 * Can be paused by Coordinator when CAPTCHA is detected.
 */

const EventEmitter = require('events');
const { StealthBrowser, launchStealthBrowser } = require('../browser/launch');

class WorkerAgent extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      profileDir: options.profileDir || './browser/profile',
      headless: options.headless ?? false,
      slowMo: options.slowMo || 0,
      ...options
    };
    
    this.browser = null;
    this.page = null;
    this.status = 'idle';
    this.paused = false;
    this.currentTask = null;
    
    // Task results
    this.taskHistory = [];
  }
  
  async initialize() {
    console.log('🔧 Worker Agent initializing...');
    
    this.browser = await launchStealthBrowser({
      profileDir: this.options.profileDir,
      headless: this.options.headless,
      slowMo: this.options.slowMo
    });
    
    this.page = this.browser.getPage();
    
    // Setup page event handlers
    this._setupPageHandlers();
    
    this._setStatus('ready');
    console.log('🔧 Worker Agent ready');
    
    return this;
  }
  
  _setupPageHandlers() {
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.emit('page:error', msg.text());
      }
    });
    
    this.page.on('pageerror', error => {
      this.emit('page:error', error.message);
    });
    
    this.page.on('framenavigated', frame => {
      if (frame === this.page.mainFrame()) {
        this.emit('navigated', frame.url());
      }
    });
  }
  
  _setStatus(status) {
    this.status = status;
    this.emit('status:changed', status);
  }
  
  /**
   * Execute a task
   */
  async execute(task) {
    // Wait if paused
    while (this.paused) {
      await new Promise(r => setTimeout(r, 100));
    }
    
    this.currentTask = task;
    this._setStatus('working');
    
    const startTime = Date.now();
    let result = null;
    let error = null;
    
    try {
      switch (task.type) {
        case 'navigate':
          result = await this._navigate(task);
          break;
        case 'click':
          result = await this._click(task);
          break;
        case 'type':
          result = await this._type(task);
          break;
        case 'screenshot':
          result = await this._screenshot(task);
          break;
        case 'evaluate':
          result = await this._evaluate(task);
          break;
        case 'wait':
          result = await this._wait(task);
          break;
        case 'stealth-test':
          result = await this._stealthTest(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }
    } catch (e) {
      error = e;
    }
    
    const taskResult = {
      task,
      result,
      error: error?.message,
      success: !error,
      duration: Date.now() - startTime
    };
    
    this.taskHistory.push(taskResult);
    this.currentTask = null;
    this._setStatus('ready');
    
    if (error) {
      this.emit('task:error', taskResult);
      throw error;
    }
    
    this.emit('task:complete', taskResult);
    return result;
  }
  
  async _navigate(task) {
    const { url, waitUntil = 'networkidle2', timeout = 30000 } = task;
    
    console.log(`   📍 Navigating to: ${url}`);
    
    await this.page.goto(url, { waitUntil, timeout });
    
    return {
      url: this.page.url(),
      title: await this.page.title()
    };
  }
  
  async _click(task) {
    const { selector, timeout = 5000 } = task;
    
    console.log(`   🖱️  Clicking: ${selector}`);
    
    await this.page.waitForSelector(selector, { timeout });
    
    // Human-like click with slight delay
    await this.page.click(selector, { delay: 50 + Math.random() * 100 });
    
    return { clicked: selector };
  }
  
  async _type(task) {
    const { selector, text, timeout = 5000 } = task;
    
    console.log(`   ⌨️  Typing in: ${selector}`);
    
    await this.page.waitForSelector(selector, { timeout });
    await this.page.click(selector);
    
    // Human-like typing with variable delay
    for (const char of text) {
      await this.page.keyboard.type(char, { delay: 50 + Math.random() * 100 });
    }
    
    return { typed: text.length };
  }
  
  async _screenshot(task) {
    const { path: filepath, fullPage = false } = task;
    
    console.log(`   📸 Screenshot: ${filepath}`);
    
    await this.page.screenshot({ path: filepath, fullPage });
    
    return { path: filepath };
  }
  
  async _evaluate(task) {
    const { script } = task;
    
    console.log(`   💻 Evaluating script`);
    
    const result = await this.page.evaluate(script);
    
    return result;
  }
  
  async _wait(task) {
    const { ms = 1000, selector, visible } = task;
    
    if (selector) {
      console.log(`   ⏳ Waiting for: ${selector}`);
      await this.page.waitForSelector(selector, { visible });
    } else {
      console.log(`   ⏳ Waiting ${ms}ms`);
      await new Promise(r => setTimeout(r, ms));
    }
    
    return { waited: ms || 'selector' };
  }
  
  async _stealthTest(task) {
    const { url = 'https://bot.sannysoft.com/' } = task;
    
    console.log(`   🧪 Running stealth test at: ${url}`);
    
    await this.page.goto(url, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));
    
    // Collect test results from the page
    const results = await this.page.evaluate(() => {
      const rows = document.querySelectorAll('table tr');
      const tests = {};
      
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 2) {
          const testName = cells[0].id || cells[0].textContent.trim();
          const passed = row.classList.contains('passed') || 
                        cells[1]?.classList.contains('passed');
          tests[testName] = passed;
        }
      });
      
      return tests;
    });
    
    const passed = Object.values(results).filter(v => v === true).length;
    const total = Object.keys(results).length;
    
    return {
      url,
      passed,
      total,
      score: `${passed}/${total}`,
      results
    };
  }
  
  /**
   * Pause the worker (called by Coordinator on CAPTCHA)
   */
  pause() {
    this.paused = true;
    this._setStatus('paused');
    console.log('⏸️  Worker paused');
  }
  
  /**
   * Resume the worker
   */
  resume() {
    this.paused = false;
    this._setStatus('ready');
    console.log('▶️  Worker resumed');
  }
  
  /**
   * Get the page for direct access
   */
  getPage() {
    return this.page;
  }
  
  /**
   * Get the browser
   */
  getBrowser() {
    return this.browser;
  }
  
  /**
   * Get task history
   */
  getTaskHistory() {
    return this.taskHistory;
  }
  
  /**
   * Shutdown
   */
  async shutdown() {
    this._setStatus('shutting-down');
    
    if (this.browser) {
      await this.browser.close();
    }
    
    this._setStatus('stopped');
    console.log('🔧 Worker Agent stopped');
  }
}

module.exports = { WorkerAgent };

// Demo if run directly
if (require.main === module) {
  (async () => {
    console.log('=== Worker Agent Demo ===\n');
    
    const worker = new WorkerAgent({ headless: false });
    
    worker.on('status:changed', status => {
      console.log(`Status: ${status}`);
    });
    
    worker.on('task:complete', result => {
      console.log(`Task complete: ${result.task.type}`);
    });
    
    await worker.initialize();
    
    // Run some tasks
    await worker.execute({ type: 'navigate', url: 'https://example.com' });
    await worker.execute({ type: 'wait', ms: 1000 });
    await worker.execute({ type: 'screenshot', path: 'example.png' });
    
    // Run stealth test
    console.log('\n🧪 Running stealth test...');
    const stealthResult = await worker.execute({ type: 'stealth-test' });
    console.log(`\nStealth score: ${stealthResult.score}`);
    
    await new Promise(r => setTimeout(r, 5000));
    await worker.shutdown();
    
    console.log('\n✅ Worker demo complete');
  })();
}
