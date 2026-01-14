/**
 * Coordinator Agent
 * 
 * Orchestrates the Observer and Worker agents.
 * Handles CAPTCHA detection events and coordinates responses.
 * 
 * Architecture:
 *   Coordinator
 *     ├── Observer Agent (monitoring, recording)
 *     └── Worker Agent (browsing, testing)
 */

const EventEmitter = require('events');
const { ObserverAgent } = require('./observer-agent');
const { WorkerAgent } = require('./worker-agent');
const { globalBroadcaster } = require('../detectors/detector');

class CoordinatorAgent extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      recordingsDir: options.recordingsDir || './recordings',
      profileDir: options.profileDir || './browser/profile',
      headless: options.headless ?? false,
      pauseOnCaptcha: options.pauseOnCaptcha ?? true,
      ...options
    };
    
    this.observer = null;
    this.worker = null;
    this.state = 'idle';
    this.taskQueue = [];
    this.currentTask = null;
    
    // Track CAPTCHA encounters
    this.captchaHistory = [];
  }
  
  async initialize() {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           COORDINATOR AGENT INITIALIZING                     ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    
    this.state = 'initializing';
    
    // Initialize Observer Agent
    console.log('🔭 Starting Observer Agent...');
    this.observer = new ObserverAgent({
      recordingsDir: this.options.recordingsDir
    });
    
    // Initialize Worker Agent
    console.log('🔧 Starting Worker Agent...');
    this.worker = new WorkerAgent({
      profileDir: this.options.profileDir,
      headless: this.options.headless
    });
    
    await this.worker.initialize();
    
    // Connect observer to worker's page
    await this.observer.attachToPage(this.worker.getPage());
    await this.observer.start();
    
    // Setup event handlers
    this._setupEventHandlers();
    
    this.state = 'ready';
    console.log('\n✅ Coordinator ready');
    console.log('   Observer: Active');
    console.log('   Worker: Ready');
    console.log('');
    
    return this;
  }
  
  _setupEventHandlers() {
    // Handle CAPTCHA detections from observer
    this.observer.on('captcha:detected', async (detection) => {
      await this._handleCaptchaDetection(detection);
    });
    
    // Handle worker status changes
    this.worker.on('status:changed', (status) => {
      console.log(`📊 Worker status: ${status}`);
      this.emit('worker:status', status);
    });
    
    // Handle task completion
    this.worker.on('task:complete', (result) => {
      this._onTaskComplete(result);
    });
    
    // Handle errors
    this.worker.on('error', (error) => {
      console.error('❌ Worker error:', error.message);
      this.emit('error', error);
    });
    
    // Subscribe to global alert broadcaster
    globalBroadcaster.subscribe('coordinator', (alert) => {
      this.emit('alert', alert);
    });
  }
  
  async _handleCaptchaDetection(detection) {
    console.log('\n🚨 Coordinator received CAPTCHA alert!');
    
    // Record in history
    this.captchaHistory.push({
      ...detection,
      task: this.currentTask,
      handledAt: new Date().toISOString()
    });
    
    // Broadcast to all subscribers
    globalBroadcaster.broadcast(detection);
    
    // Pause worker if configured
    if (this.options.pauseOnCaptcha) {
      console.log('⏸️  Pausing worker for CAPTCHA handling...');
      this.worker.pause();
      this.state = 'captcha-paused';
      
      this.emit('captcha:encountered', {
        detection,
        workerPaused: true,
        recording: this.observer.isRecording()
      });
      
      // Observer should already be recording (auto-triggered)
      if (!this.observer.isRecording()) {
        await this.observer.startRecording(`captcha-${Date.now()}.mp4`);
      }
    }
    
    // Emit event for external handlers
    this.emit('captcha:detected', detection);
  }
  
  /**
   * Resume after CAPTCHA is handled (manually or automatically)
   */
  async resumeAfterCaptcha(strategy = 'continue') {
    console.log(`\n▶️  Resuming after CAPTCHA (strategy: ${strategy})`);
    
    switch (strategy) {
      case 'continue':
        // Just continue where we left off
        this.worker.resume();
        break;
        
      case 'retry':
        // Retry the current task
        if (this.currentTask) {
          this.worker.resume();
          await this.executeTask(this.currentTask);
        }
        break;
        
      case 'skip':
        // Skip current task, move to next
        this.worker.resume();
        this._processNextTask();
        break;
        
      case 'abort':
        // Abort all tasks
        this.taskQueue = [];
        this.currentTask = null;
        this.worker.resume();
        break;
    }
    
    this.state = 'ready';
    
    // Stop CAPTCHA recording
    if (this.observer.isRecording()) {
      await this.observer.stopRecording();
    }
  }
  
  /**
   * Queue a task for the worker
   */
  queueTask(task) {
    this.taskQueue.push({
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...task,
      queuedAt: new Date().toISOString()
    });
    
    console.log(`📝 Task queued: ${task.type} (${this.taskQueue.length} in queue)`);
    
    // Start processing if idle
    if (this.state === 'ready' && !this.currentTask) {
      this._processNextTask();
    }
    
    return this;
  }
  
  /**
   * Execute a task immediately
   */
  async executeTask(task) {
    this.currentTask = task;
    this.state = 'working';
    
    console.log(`\n🔧 Executing task: ${task.type}`);
    
    try {
      const result = await this.worker.execute(task);
      return result;
    } catch (error) {
      console.error(`❌ Task failed: ${error.message}`);
      this.emit('task:error', { task, error });
      throw error;
    }
  }
  
  _processNextTask() {
    if (this.taskQueue.length === 0) {
      this.currentTask = null;
      this.state = 'ready';
      console.log('📭 Task queue empty');
      return;
    }
    
    const task = this.taskQueue.shift();
    this.executeTask(task).catch(e => {
      console.error('Task error:', e);
    });
  }
  
  _onTaskComplete(result) {
    console.log(`✅ Task complete: ${this.currentTask?.type}`);
    this.emit('task:complete', { task: this.currentTask, result });
    this.currentTask = null;
    
    // Process next task
    this._processNextTask();
  }
  
  /**
   * Navigate to a URL
   */
  async navigate(url) {
    return this.executeTask({ type: 'navigate', url });
  }
  
  /**
   * Take a screenshot
   */
  async screenshot(path) {
    return this.executeTask({ type: 'screenshot', path });
  }
  
  /**
   * Start recording
   */
  async startRecording(filename) {
    return this.observer.startRecording(filename);
  }
  
  /**
   * Stop recording
   */
  async stopRecording() {
    return this.observer.stopRecording();
  }
  
  /**
   * Get current state
   */
  getState() {
    return {
      state: this.state,
      currentTask: this.currentTask,
      queueLength: this.taskQueue.length,
      captchaHistory: this.captchaHistory.length,
      isRecording: this.observer?.isRecording() || false
    };
  }
  
  /**
   * Get CAPTCHA encounter history
   */
  getCaptchaHistory() {
    return this.captchaHistory;
  }
  
  /**
   * Get the worker's page for direct access
   */
  getPage() {
    return this.worker?.getPage();
  }
  
  /**
   * Shutdown everything
   */
  async shutdown() {
    console.log('\n🔒 Coordinator shutting down...');
    
    this.state = 'shutting-down';
    
    if (this.observer) {
      this.observer.stop();
    }
    
    if (this.worker) {
      await this.worker.shutdown();
    }
    
    this.state = 'stopped';
    console.log('🔒 Coordinator stopped');
  }
}

module.exports = { CoordinatorAgent };

// Demo if run directly
if (require.main === module) {
  (async () => {
    console.log('=== Coordinator Agent Demo ===\n');
    
    const coordinator = new CoordinatorAgent({
      headless: false,
      pauseOnCaptcha: true
    });
    
    // Listen for events
    coordinator.on('captcha:detected', (detection) => {
      console.log('\n🎯 CAPTCHA callback triggered!');
      console.log('   Would normally handle this...');
      
      // In a real scenario, you might:
      // - Wait for human intervention
      // - Try a different approach
      // - Log and continue
      
      // For demo, auto-resume after 5 seconds
      setTimeout(() => {
        coordinator.resumeAfterCaptcha('continue');
      }, 5000);
    });
    
    await coordinator.initialize();
    
    // Test navigation
    await coordinator.navigate('https://example.com');
    await new Promise(r => setTimeout(r, 2000));
    
    // Navigate to CAPTCHA demo
    console.log('\n📍 Navigating to reCAPTCHA demo...');
    await coordinator.navigate('https://www.google.com/recaptcha/api2/demo');
    
    // Wait for detection
    await new Promise(r => setTimeout(r, 15000));
    
    await coordinator.shutdown();
  })();
}
