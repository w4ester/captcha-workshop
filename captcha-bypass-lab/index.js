#!/usr/bin/env node
/**
 * CAPTCHA Bypass Lab - Main Entry Point
 * 
 * Usage:
 *   node index.js              # Interactive mode
 *   node index.js --demo       # Run demo
 *   node index.js --stealth-test  # Test stealth config
 */

const readline = require('readline');
const { CoordinatorAgent } = require('./agents/coordinator');
const { launchStealthBrowser } = require('./browser/launch');

// ASCII art banner
const BANNER = `
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║   🚢  CAPTCHA BYPASS LAB  🚢                                     ║
║                                                                  ║
║   Multi-Agent Browser Automation with CAPTCHA Detection          ║
║   "Machines bypassing machines that train machines"              ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`;

class LabCLI {
  constructor() {
    this.coordinator = null;
    this.rl = null;
  }
  
  async start() {
    console.log(BANNER);
    
    // Parse args
    const args = process.argv.slice(2);
    
    if (args.includes('--demo')) {
      await this.runDemo();
      return;
    }
    
    if (args.includes('--stealth-test')) {
      await this.runStealthTest();
      return;
    }
    
    if (args.includes('--help') || args.includes('-h')) {
      this.printHelp();
      return;
    }
    
    // Interactive mode
    await this.interactiveMode();
  }
  
  printHelp() {
    console.log(`
Usage: npm run lab:start [options]

Options:
  --demo          Run the full demo (navigate, detect, record)
  --stealth-test  Quick stealth configuration test
  --help, -h      Show this help message

Interactive Commands:
  launch          Launch the browser
  navigate <url>  Navigate to URL
  screenshot      Take a screenshot
  record start    Start recording
  record stop     Stop recording
  status          Check CAPTCHA status
  stealth         Run stealth test
  quit            Exit the lab
`);
  }
  
  async initCoordinator() {
    if (this.coordinator) return;
    
    console.log('\n🔧 Initializing coordinator with agents...\n');
    
    this.coordinator = new CoordinatorAgent({
      headless: false,
      pauseOnCaptcha: true
    });
    
    // Setup event handlers
    this.coordinator.on('captcha:detected', (detection) => {
      console.log('\n' + '='.repeat(60));
      console.log('🚢 LAND HO! CAPTCHA DETECTED!');
      console.log('='.repeat(60));
      console.log(`Type: ${detection.type}`);
      console.log(`Source: ${detection.source}`);
      console.log(`Page: ${detection.pageUrl}`);
      console.log('='.repeat(60));
      console.log('\nWorker paused. Recording started.');
      console.log('Resolve CAPTCHA manually, then type "resume" to continue.\n');
    });
    
    await this.coordinator.initialize();
  }
  
  async interactiveMode() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('Interactive mode. Type "help" for commands.\n');
    
    const prompt = () => {
      this.rl.question('captcha-lab> ', async (input) => {
        const [cmd, ...args] = input.trim().split(' ');
        
        try {
          await this.handleCommand(cmd, args);
        } catch (e) {
          console.error(`Error: ${e.message}`);
        }
        
        if (cmd !== 'quit' && cmd !== 'exit') {
          prompt();
        }
      });
    };
    
    prompt();
  }
  
  async handleCommand(cmd, args) {
    switch (cmd) {
      case 'help':
        this.printHelp();
        break;
        
      case 'launch':
        await this.initCoordinator();
        console.log('✅ Browser launched');
        break;
        
      case 'navigate':
      case 'goto':
        if (!args[0]) {
          console.log('Usage: navigate <url>');
          return;
        }
        await this.initCoordinator();
        const url = args[0].startsWith('http') ? args[0] : `https://${args[0]}`;
        await this.coordinator.navigate(url);
        console.log(`✅ Navigated to ${url}`);
        break;
        
      case 'screenshot':
      case 'ss':
        await this.initCoordinator();
        const filename = args[0] || `screenshot-${Date.now()}.png`;
        await this.coordinator.screenshot(`./recordings/${filename}`);
        console.log(`✅ Screenshot saved: ${filename}`);
        break;
        
      case 'record':
        await this.initCoordinator();
        if (args[0] === 'start') {
          const recFilename = args[1] || `recording-${Date.now()}.mp4`;
          await this.coordinator.startRecording(recFilename);
          console.log('✅ Recording started');
        } else if (args[0] === 'stop') {
          await this.coordinator.stopRecording();
          console.log('✅ Recording stopped');
        } else {
          console.log('Usage: record start|stop');
        }
        break;
        
      case 'status':
        if (!this.coordinator) {
          console.log('Browser not launched');
          return;
        }
        const state = this.coordinator.getState();
        console.log('\nStatus:');
        console.log(`  State: ${state.state}`);
        console.log(`  CAPTCHA detections: ${state.captchaHistory}`);
        console.log(`  Recording: ${state.isRecording}`);
        break;
        
      case 'resume':
        if (!this.coordinator) {
          console.log('Browser not launched');
          return;
        }
        await this.coordinator.resumeAfterCaptcha('continue');
        console.log('✅ Resumed after CAPTCHA');
        break;
        
      case 'stealth':
        await this.runStealthTest();
        break;
        
      case 'demo':
        await this.runDemo();
        break;
        
      case 'quit':
      case 'exit':
        console.log('Shutting down...');
        if (this.coordinator) {
          await this.coordinator.shutdown();
        }
        this.rl.close();
        process.exit(0);
        break;
        
      case '':
        break;
        
      default:
        console.log(`Unknown command: ${cmd}. Type "help" for commands.`);
    }
  }
  
  async runDemo() {
    console.log('🎬 Running demo...\n');
    
    await this.initCoordinator();
    
    // Navigate to example
    console.log('📍 Step 1: Navigate to example.com');
    await this.coordinator.navigate('https://example.com');
    await new Promise(r => setTimeout(r, 2000));
    
    // Start recording
    console.log('\n📹 Step 2: Start recording');
    await this.coordinator.startRecording('demo-recording.mp4');
    
    // Navigate to Wikipedia
    console.log('\n📍 Step 3: Navigate to wikipedia.org');
    await this.coordinator.navigate('https://www.wikipedia.org');
    await new Promise(r => setTimeout(r, 2000));
    
    // Take screenshot
    console.log('\n📸 Step 4: Take screenshot');
    await this.coordinator.screenshot('./recordings/demo-screenshot.png');
    
    // Navigate to CAPTCHA demo
    console.log('\n📍 Step 5: Navigate to reCAPTCHA demo (CAPTCHA will be detected!)');
    await this.coordinator.navigate('https://www.google.com/recaptcha/api2/demo');
    
    // Wait for potential CAPTCHA detection
    await new Promise(r => setTimeout(r, 5000));
    
    // Stop recording
    console.log('\n📹 Step 6: Stop recording');
    await this.coordinator.stopRecording();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('DEMO COMPLETE');
    console.log('='.repeat(60));
    
    const state = this.coordinator.getState();
    console.log(`CAPTCHA detections: ${this.coordinator.getCaptchaHistory().length}`);
    console.log(`Recordings: ./recordings/`);
    console.log('='.repeat(60) + '\n');
    
    // Don't shutdown in interactive mode
    if (!this.rl) {
      await this.coordinator.shutdown();
    }
  }
  
  async runStealthTest() {
    console.log('🧪 Running stealth test...\n');
    
    const browser = await launchStealthBrowser({ headless: false });
    const page = browser.getPage();
    
    await page.goto('https://bot.sannysoft.com/');
    console.log('📊 Check the browser window for detection results\n');
    
    // Wait for tests to run
    await new Promise(r => setTimeout(r, 5000));
    
    // Collect results
    const results = await page.evaluate(() => ({
      webdriver: navigator.webdriver,
      plugins: navigator.plugins.length,
      languages: navigator.languages?.length,
      chrome: !!window.chrome,
      chromeRuntime: !!window.chrome?.runtime
    }));
    
    console.log('\n📊 Stealth Test Results:');
    console.log('='.repeat(40));
    console.log(`navigator.webdriver: ${results.webdriver || 'undefined'} ${results.webdriver ? '❌' : '✅'}`);
    console.log(`plugins.length: ${results.plugins} ${results.plugins > 0 ? '✅' : '❌'}`);
    console.log(`languages.length: ${results.languages} ${results.languages > 0 ? '✅' : '❌'}`);
    console.log(`window.chrome: ${results.chrome} ${results.chrome ? '✅' : '❌'}`);
    console.log(`chrome.runtime: ${results.chromeRuntime} ${results.chromeRuntime ? '✅' : '❌'}`);
    console.log('='.repeat(40));
    
    const score = [
      !results.webdriver,
      results.plugins > 0,
      results.languages > 0,
      results.chrome,
      results.chromeRuntime
    ].filter(Boolean).length;
    
    console.log(`\nStealth Score: ${score}/5`);
    console.log(`Risk Level: ${score >= 4 ? '🟢 LOW' : score >= 2 ? '🟡 MEDIUM' : '🔴 HIGH'}\n`);
    
    // Keep open for inspection
    console.log('Browser will close in 10 seconds...');
    await new Promise(r => setTimeout(r, 10000));
    
    await browser.close();
  }
}

// Main execution
const cli = new LabCLI();
cli.start().catch(console.error);
