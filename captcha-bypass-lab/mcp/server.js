/**
 * MCP Server - CAPTCHA Bypass Lab
 * 
 * Exposes browser automation tools for Claude Code and WF-AI-PLATFORM.
 * 
 * Tools:
 *   - browser_launch: Launch stealth browser
 *   - browser_navigate: Navigate to URL
 *   - browser_click: Click element
 *   - browser_type: Type text
 *   - browser_screenshot: Take screenshot
 *   - browser_record_start: Start video recording
 *   - browser_record_stop: Stop video recording
 *   - captcha_status: Check CAPTCHA detection status
 *   - captcha_wait: Wait for CAPTCHA resolution
 *   - stealth_test: Run stealth detection test
 * 
 * Start: node mcp/server.js
 */

const { Server } = require('@anthropic/sdk/mcp');
const path = require('path');

// Import our agents
const { CoordinatorAgent } = require('../agents/coordinator');

class CaptchaLabMCPServer {
  constructor() {
    this.coordinator = null;
    this.server = null;
  }
  
  async start() {
    // Initialize coordinator with agents
    this.coordinator = new CoordinatorAgent({
      recordingsDir: path.join(__dirname, '../recordings'),
      profileDir: path.join(__dirname, '../browser/profile'),
      headless: false,
      pauseOnCaptcha: true
    });
    
    // Create MCP server
    this.server = new Server({
      name: 'captcha-bypass-lab',
      version: '1.0.0',
      description: 'Browser automation with CAPTCHA detection and multi-agent coordination'
    });
    
    // Register tools
    this._registerTools();
    
    // Start server on stdio
    await this.server.listen();
    
    console.log('🚀 MCP Server started');
  }
  
  _registerTools() {
    // browser_launch
    this.server.registerTool({
      name: 'browser_launch',
      description: 'Launch the stealth browser with CAPTCHA detection enabled',
      inputSchema: {
        type: 'object',
        properties: {
          headless: {
            type: 'boolean',
            description: 'Run in headless mode (default: false)',
            default: false
          }
        }
      },
      handler: async (params) => {
        if (this.coordinator?.getState().state !== 'stopped') {
          return { success: false, error: 'Browser already running' };
        }
        
        this.coordinator = new CoordinatorAgent({
          recordingsDir: path.join(__dirname, '../recordings'),
          profileDir: path.join(__dirname, '../browser/profile'),
          headless: params.headless ?? false,
          pauseOnCaptcha: true
        });
        
        await this.coordinator.initialize();
        
        return { 
          success: true, 
          message: 'Browser launched with stealth mode and CAPTCHA detection',
          state: this.coordinator.getState()
        };
      }
    });
    
    // browser_navigate
    this.server.registerTool({
      name: 'browser_navigate',
      description: 'Navigate to a URL',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'URL to navigate to'
          }
        },
        required: ['url']
      },
      handler: async (params) => {
        if (!this.coordinator) {
          return { success: false, error: 'Browser not launched' };
        }
        
        try {
          const result = await this.coordinator.navigate(params.url);
          return { success: true, ...result };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }
    });
    
    // browser_click
    this.server.registerTool({
      name: 'browser_click',
      description: 'Click on an element',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of element to click'
          }
        },
        required: ['selector']
      },
      handler: async (params) => {
        if (!this.coordinator) {
          return { success: false, error: 'Browser not launched' };
        }
        
        try {
          const page = this.coordinator.getPage();
          await page.click(params.selector);
          return { success: true, clicked: params.selector };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }
    });
    
    // browser_type
    this.server.registerTool({
      name: 'browser_type',
      description: 'Type text into an input field',
      inputSchema: {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: 'CSS selector of input element'
          },
          text: {
            type: 'string',
            description: 'Text to type'
          }
        },
        required: ['selector', 'text']
      },
      handler: async (params) => {
        if (!this.coordinator) {
          return { success: false, error: 'Browser not launched' };
        }
        
        try {
          const page = this.coordinator.getPage();
          await page.type(params.selector, params.text, { delay: 50 });
          return { success: true, typed: params.text.length };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }
    });
    
    // browser_screenshot
    this.server.registerTool({
      name: 'browser_screenshot',
      description: 'Take a screenshot of the current page',
      inputSchema: {
        type: 'object',
        properties: {
          filename: {
            type: 'string',
            description: 'Filename for screenshot (default: screenshot-{timestamp}.png)'
          },
          fullPage: {
            type: 'boolean',
            description: 'Capture full page (default: false)',
            default: false
          }
        }
      },
      handler: async (params) => {
        if (!this.coordinator) {
          return { success: false, error: 'Browser not launched' };
        }
        
        const filename = params.filename || `screenshot-${Date.now()}.png`;
        const filepath = path.join(__dirname, '../recordings', filename);
        
        try {
          const page = this.coordinator.getPage();
          await page.screenshot({ path: filepath, fullPage: params.fullPage });
          return { success: true, path: filepath };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }
    });
    
    // browser_record_start
    this.server.registerTool({
      name: 'browser_record_start',
      description: 'Start video recording of the browser',
      inputSchema: {
        type: 'object',
        properties: {
          filename: {
            type: 'string',
            description: 'Filename for recording (default: recording-{timestamp}.mp4)'
          }
        }
      },
      handler: async (params) => {
        if (!this.coordinator) {
          return { success: false, error: 'Browser not launched' };
        }
        
        const filename = params.filename || `recording-${Date.now()}.mp4`;
        
        try {
          await this.coordinator.startRecording(filename);
          return { success: true, recording: filename };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }
    });
    
    // browser_record_stop
    this.server.registerTool({
      name: 'browser_record_stop',
      description: 'Stop video recording',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        if (!this.coordinator) {
          return { success: false, error: 'Browser not launched' };
        }
        
        try {
          const result = await this.coordinator.stopRecording();
          return { success: true, ...result };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }
    });
    
    // captcha_status
    this.server.registerTool({
      name: 'captcha_status',
      description: 'Check if CAPTCHA has been detected',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        if (!this.coordinator) {
          return { success: false, error: 'Browser not launched' };
        }
        
        const state = this.coordinator.getState();
        const history = this.coordinator.getCaptchaHistory();
        
        return {
          success: true,
          state: state.state,
          captchaDetected: state.state === 'captcha-paused',
          historyCount: history.length,
          lastDetection: history[history.length - 1] || null,
          isRecording: state.isRecording
        };
      }
    });
    
    // captcha_wait
    this.server.registerTool({
      name: 'captcha_wait',
      description: 'Wait for CAPTCHA to be resolved (by human or other means)',
      inputSchema: {
        type: 'object',
        properties: {
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds (default: 60000)',
            default: 60000
          },
          strategy: {
            type: 'string',
            description: 'Resume strategy: continue, retry, skip, abort',
            enum: ['continue', 'retry', 'skip', 'abort'],
            default: 'continue'
          }
        }
      },
      handler: async (params) => {
        if (!this.coordinator) {
          return { success: false, error: 'Browser not launched' };
        }
        
        const timeout = params.timeout || 60000;
        const strategy = params.strategy || 'continue';
        
        // Wait for CAPTCHA state to change
        const startTime = Date.now();
        
        while (this.coordinator.getState().state === 'captcha-paused') {
          if (Date.now() - startTime > timeout) {
            return { success: false, error: 'Timeout waiting for CAPTCHA resolution' };
          }
          await new Promise(r => setTimeout(r, 500));
        }
        
        // If we were paused, resume with strategy
        if (this.coordinator.getState().state === 'captcha-paused') {
          await this.coordinator.resumeAfterCaptcha(strategy);
        }
        
        return { success: true, strategy, resumed: true };
      }
    });
    
    // stealth_test
    this.server.registerTool({
      name: 'stealth_test',
      description: 'Run a stealth/bot detection test',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'Test URL (default: https://bot.sannysoft.com/)',
            default: 'https://bot.sannysoft.com/'
          }
        }
      },
      handler: async (params) => {
        if (!this.coordinator) {
          return { success: false, error: 'Browser not launched' };
        }
        
        const url = params.url || 'https://bot.sannysoft.com/';
        
        try {
          // Navigate to test page
          await this.coordinator.navigate(url);
          await new Promise(r => setTimeout(r, 3000));
          
          // Collect results
          const page = this.coordinator.getPage();
          const results = await page.evaluate(() => {
            const checkWebdriver = navigator.webdriver;
            const checkPlugins = navigator.plugins.length;
            const checkChrome = !!window.chrome;
            const checkRuntime = !!window.chrome?.runtime;
            
            return {
              webdriver: checkWebdriver,
              plugins: checkPlugins,
              chrome: checkChrome,
              chromeRuntime: checkRuntime
            };
          });
          
          return {
            success: true,
            url,
            results,
            riskLevel: results.webdriver ? 'HIGH' : 
                       results.plugins === 0 ? 'MEDIUM' : 'LOW'
          };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }
    });
    
    // browser_close
    this.server.registerTool({
      name: 'browser_close',
      description: 'Close the browser and cleanup',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      handler: async () => {
        if (!this.coordinator) {
          return { success: false, error: 'Browser not running' };
        }
        
        try {
          await this.coordinator.shutdown();
          return { success: true, message: 'Browser closed' };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }
    });
  }
}

// Handle stdio for MCP
async function main() {
  console.log('Starting CAPTCHA Bypass Lab MCP Server...');
  
  const server = new CaptchaLabMCPServer();
  await server.start();
}

// Check if @anthropic/sdk is available, otherwise provide fallback
try {
  require('@anthropic/sdk/mcp');
  main().catch(console.error);
} catch (e) {
  console.log('MCP SDK not available. Running in standalone mode...');
  console.log('For Claude Code integration, install: npm install @anthropic/sdk');
  console.log('');
  console.log('Standalone tools available via require():');
  console.log('  const { CoordinatorAgent } = require("./agents/coordinator");');
  console.log('');
  
  // Export for direct use
  module.exports = { CaptchaLabMCPServer };
}
