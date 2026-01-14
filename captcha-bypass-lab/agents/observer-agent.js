/**
 * Observer Agent
 * 
 * Responsible for:
 * - Screen recording
 * - CAPTCHA detection monitoring
 * - Collecting evidence of what triggered detection
 * 
 * Works alongside the Worker Agent, watching everything it does.
 */

const EventEmitter = require('events');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { CaptchaDetector } = require('../detectors/detector');

class ObserverAgent extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      recordingsDir: options.recordingsDir || './recordings',
      fps: options.fps || 15,
      quality: options.quality || 80,
      autoRecordOnCaptcha: options.autoRecordOnCaptcha ?? true,
      ...options
    };
    
    this.page = null;
    this.client = null;
    this.detector = null;
    
    // Recording state
    this.ffmpeg = null;
    this.recording = false;
    this.currentRecording = null;
    this.frameCount = 0;
    
    // Ensure recordings directory exists
    if (!fs.existsSync(this.options.recordingsDir)) {
      fs.mkdirSync(this.options.recordingsDir, { recursive: true });
    }
  }
  
  async attachToPage(page) {
    this.page = page;
    this.client = await page.target().createCDPSession();
    
    // Create detector for this page
    this.detector = new CaptchaDetector(page);
    
    // Forward detection events
    this.detector.on('captcha:detected', (detection) => {
      this.emit('captcha:detected', detection);
      
      // Auto-start recording on CAPTCHA
      if (this.options.autoRecordOnCaptcha && !this.recording) {
        this.startRecording(`captcha-${Date.now()}.mp4`).catch(console.error);
      }
    });
    
    console.log('🔭 Observer attached to page');
    return this;
  }
  
  async start() {
    if (!this.page) {
      throw new Error('Must attach to page first');
    }
    
    // Start CAPTCHA detector
    await this.detector.start();
    
    console.log('🔭 Observer started monitoring');
    this.emit('started');
    
    return this;
  }
  
  stop() {
    if (this.detector) {
      this.detector.stop();
    }
    
    if (this.recording) {
      this.stopRecording().catch(console.error);
    }
    
    console.log('🔭 Observer stopped');
    this.emit('stopped');
  }
  
  /**
   * Start screen recording
   */
  async startRecording(filename) {
    if (this.recording) {
      console.log('⚠️  Already recording');
      return this.currentRecording;
    }
    
    const filepath = path.join(this.options.recordingsDir, filename);
    
    this.currentRecording = {
      path: filepath,
      startTime: Date.now(),
      frames: 0
    };
    
    // Start FFmpeg process
    this.ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f', 'image2pipe',
      '-framerate', String(this.options.fps),
      '-i', '-',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'ultrafast',
      '-crf', '23',
      filepath
    ], {
      stdio: ['pipe', 'ignore', 'ignore']
    });
    
    // Handle FFmpeg exit
    this.ffmpeg.on('close', (code) => {
      if (code !== 0 && this.recording) {
        console.error(`FFmpeg exited with code ${code}`);
      }
    });
    
    // Setup frame handler
    this.frameHandler = async (event) => {
      if (!this.recording) return;
      
      this.frameCount++;
      this.currentRecording.frames = this.frameCount;
      
      const buffer = Buffer.from(event.data, 'base64');
      
      try {
        this.ffmpeg.stdin.write(buffer);
        await this.client.send('Page.screencastFrameAck', {
          sessionId: event.sessionId
        });
      } catch (e) {
        // Ignore if stopping
      }
    };
    
    this.client.on('Page.screencastFrame', this.frameHandler);
    
    // Start screencast
    await this.client.send('Page.startScreencast', {
      format: 'jpeg',
      quality: this.options.quality,
      maxWidth: 1280,
      maxHeight: 720,
      everyNthFrame: 1
    });
    
    this.recording = true;
    this.frameCount = 0;
    
    console.log(`🎬 Recording started: ${filename}`);
    this.emit('recording:started', this.currentRecording);
    
    return this.currentRecording;
  }
  
  /**
   * Stop screen recording
   */
  async stopRecording() {
    if (!this.recording) {
      return null;
    }
    
    this.recording = false;
    
    // Stop screencast
    try {
      await this.client.send('Page.stopScreencast');
    } catch (e) {
      // Page might have closed
    }
    
    // Remove frame handler
    if (this.frameHandler) {
      this.client.removeListener('Page.screencastFrame', this.frameHandler);
    }
    
    // Close FFmpeg
    if (this.ffmpeg) {
      this.ffmpeg.stdin.end();
      await new Promise(resolve => this.ffmpeg.on('close', resolve));
    }
    
    const recording = this.currentRecording;
    recording.endTime = Date.now();
    recording.duration = (recording.endTime - recording.startTime) / 1000;
    
    // Save metadata
    const metaPath = recording.path.replace('.mp4', '.json');
    fs.writeFileSync(metaPath, JSON.stringify({
      ...recording,
      detections: this.detector?.getDetections() || []
    }, null, 2));
    
    console.log(`🎬 Recording saved: ${recording.path} (${recording.frames} frames, ${recording.duration.toFixed(1)}s)`);
    this.emit('recording:stopped', recording);
    
    this.currentRecording = null;
    
    return recording;
  }
  
  /**
   * Take a single screenshot
   */
  async screenshot(filename) {
    const filepath = path.join(this.options.recordingsDir, filename);
    
    const { data } = await this.client.send('Page.captureScreenshot', {
      format: 'png',
      quality: 100
    });
    
    fs.writeFileSync(filepath, Buffer.from(data, 'base64'));
    console.log(`📸 Screenshot: ${filepath}`);
    
    return filepath;
  }
  
  /**
   * Check if currently recording
   */
  isRecording() {
    return this.recording;
  }
  
  /**
   * Get detection history
   */
  getDetections() {
    return this.detector?.getDetections() || [];
  }
  
  /**
   * Clear detection history
   */
  clearDetections() {
    this.detector?.clearDetections();
  }
}

module.exports = { ObserverAgent };

// Demo if run directly
if (require.main === module) {
  (async () => {
    const puppeteer = require('puppeteer');
    
    console.log('=== Observer Agent Demo ===\n');
    
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    const observer = new ObserverAgent({
      recordingsDir: './recordings',
      autoRecordOnCaptcha: true
    });
    
    // Setup event handlers
    observer.on('captcha:detected', (detection) => {
      console.log('\n🎯 Observer detected CAPTCHA:', detection.type);
    });
    
    observer.on('recording:started', (recording) => {
      console.log('📹 Recording started');
    });
    
    observer.on('recording:stopped', (recording) => {
      console.log(`📹 Recording stopped (${recording.duration}s)`);
    });
    
    await observer.attachToPage(page);
    await observer.start();
    
    // Manual recording test
    await observer.startRecording('test-recording.mp4');
    
    await page.goto('https://example.com');
    await new Promise(r => setTimeout(r, 2000));
    
    await page.goto('https://www.wikipedia.org');
    await new Promise(r => setTimeout(r, 2000));
    
    await observer.stopRecording();
    
    // Now test CAPTCHA detection (should auto-record)
    console.log('\n📍 Testing CAPTCHA detection...');
    await page.goto('https://www.google.com/recaptcha/api2/demo');
    await new Promise(r => setTimeout(r, 5000));
    
    await observer.stopRecording();
    observer.stop();
    await browser.close();
    
    console.log('\n✅ Observer demo complete');
  })();
}
