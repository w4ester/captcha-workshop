# CAPTCHA Bypass Lab 🚢

**"We've hit land!"** - A multi-agent browser automation lab for understanding and navigating CAPTCHA detection.

## The Meta Point

> "Machines used to bypass training machines" 

Every CAPTCHA you solve trains Google's ML models for free. This lab teaches the producer mindset: understand the system, then build tools that work *with* automation rather than against it.

---

## What's In This Lab

```
captcha-bypass-lab/
├── browser/                    # Custom Chromium setup
│   ├── setup.sh               # Download ungoogled-chromium
│   ├── profile/               # Human-like browser profile
│   └── launch.js              # Stealth browser launcher
├── agents/                     # Multi-agent architecture
│   ├── coordinator.js         # Orchestrates sub-agents
│   ├── observer-agent.js      # Screen recording + monitoring
│   ├── worker-agent.js        # Browsing + testing
│   └── hooks/                 # Event hooks between agents
├── mcp/                        # MCP Server for Claude Code
│   ├── server.js              # CAPTCHA detection tools
│   └── claude-config.json     # Claude Code integration
├── detectors/                  # CAPTCHA detection system
│   ├── detector.js            # Pattern matching
│   └── alerts.js              # "Land ho!" notifications
├── stealth/                    # Anti-detection toolkit
│   ├── profile-builder.js     # Build human-like profiles
│   ├── fingerprint-mask.js    # Mask automation signals
│   └── behavior-simulation.js # Human-like mouse/keyboard
└── lessons/                    # Guided exercises
    ├── 01-setup-browser.md
    ├── 02-understand-detection.md
    ├── 03-multi-agent-coordination.md
    └── 04-build-your-own-bypass.md
```

---

## Quick Start

```bash
# 1. Setup custom browser
./browser/setup.sh

# 2. Install dependencies  
npm install

# 3. Build human-like profile
npm run profile:build

# 4. Run the lab
npm run lab:start

# 5. For Claude Code integration
npm run mcp:start
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     COORDINATOR AGENT                            │
│              (Orchestrates everything)                           │
└─────────────────────┬───────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌───────────────────┐     ┌───────────────────┐
│  OBSERVER AGENT   │     │   WORKER AGENT    │
│                   │     │                   │
│ • Screen record   │     │ • Browse pages    │
│ • Watch for       │◄───►│ • Click elements  │
│   CAPTCHA         │     │ • Fill forms      │
│ • Send alerts     │     │ • Test stealth    │
└───────────────────┘     └───────────────────┘
        │                           │
        └─────────────┬─────────────┘
                      │
                      ▼
            ┌───────────────────┐
            │  CAPTCHA DETECTOR │
            │                   │
            │ • Network monitor │
            │ • DOM observer    │
            │ • "LAND HO!" hook │
            └───────────────────┘
                      │
                      ▼
            ┌───────────────────┐
            │   MCP SERVER      │
            │                   │
            │ • Claude Code     │
            │ • WF-AI-PLATFORM  │
            │ • Tool exposure   │
            └───────────────────┘
```

---

## The "Land Ho!" System

When CAPTCHA is detected, the system:

1. **Observer Agent** spots it (network request or DOM element)
2. **Alert fires** with full context (URL, type, timestamp)
3. **Recording auto-starts** to capture what triggered it
4. **Coordinator notified** to decide next action
5. **Worker Agent paused** until strategy determined

```javascript
// Hook into the "land ho!" event
detector.on('captcha:detected', (event) => {
  console.log('🚢 LAND HO! CAPTCHA SPOTTED!');
  console.log(`   Type: ${event.type}`);      // recaptcha, hcaptcha, cloudflare
  console.log(`   URL: ${event.url}`);
  console.log(`   Trigger: ${event.trigger}`); // what caused it
});
```

---

## Why Ungoogled Chromium?

| Feature | Regular Chrome | Ungoogled Chromium |
|---------|---------------|-------------------|
| Google telemetry | ✅ Phones home | ❌ Removed |
| Safe Browsing | ✅ Google servers | ❌ Disabled |
| Default search | Google | None |
| WebRTC IP leak | ✅ Yes | ❌ Patched |
| Tracking headers | ✅ Sent | ❌ Removed |

**Result**: Cleaner fingerprint, less Google tracking, better stealth baseline.

---

## For Claude Code / WF-AI-PLATFORM

The MCP server exposes these tools:

```typescript
// Available tools when connected
browser_launch      // Launch stealth browser
browser_navigate    // Go to URL
browser_screenshot  // Capture screen
browser_record_start // Start video recording
browser_record_stop  // Stop and save video
captcha_status      // Check if CAPTCHA detected
captcha_wait        // Wait for human intervention
profile_load        // Load browser profile
profile_save        // Save current state
```

Add to your Claude Code config:

```json
{
  "mcpServers": {
    "captcha-lab": {
      "command": "node",
      "args": ["./mcp/server.js"],
      "cwd": "/path/to/captcha-bypass-lab"
    }
  }
}
```

---

## Learning Objectives

1. **Understand the stack** - CDP → Puppeteer → Playwright → Your agents
2. **See detection in action** - What signals trigger CAPTCHA
3. **Build stealth profiles** - Look human to automated systems
4. **Multi-agent coordination** - Observer + Worker pattern
5. **The extraction economy** - Why CAPTCHAs exist (free ML training)

---

## License

MIT - For education and legitimate automation on your own properties.

---

## The Producer Mindset

Don't just *use* these tools. Understand:
- Why detection exists
- How fingerprinting works  
- What signals you're leaking
- How to build, not just consume

**Machines bypassing machines that train machines.** 🤖
