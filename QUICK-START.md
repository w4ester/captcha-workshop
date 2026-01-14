# Quick Start Guide

## 5-Minute Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup browser (downloads ungoogled-chromium)
npm run setup:browser

# 3. Build a "warm" browser profile
npm run profile:build

# 4. Start the lab!
npm run lab:start
```

## For Claude Code / WF-AI-PLATFORM

Add to your MCP config:

```json
{
  "mcpServers": {
    "captcha-lab": {
      "command": "node",
      "args": ["mcp/server-standalone.js"],
      "cwd": "/path/to/captcha-bypass-lab"
    }
  }
}
```

Then use tools like:
- `browser_launch`
- `browser_navigate`
- `captcha_status`
- `browser_record_start`

## Quick Commands

| Command | What it does |
|---------|--------------|
| `npm run lab:start` | Interactive mode |
| `npm run lab:demo` | Run full demo |
| `npm run lab:stealth-test` | Test stealth config |
| `npm run mcp:start` | Start MCP server |
| `npm run profile:build` | Build human-like profile |

## The "Land Ho!" System

When CAPTCHA is detected:
1. Console prints 🚢 LAND HO! alert
2. Worker agent auto-pauses
3. Recording auto-starts
4. You're notified to intervene

Type `resume` to continue after handling CAPTCHA.

## What's Different About This Setup

- **Ungoogled Chromium**: No Google telemetry
- **Human-like profile**: Pre-warmed with browsing history
- **Stealth patches**: Hides automation signals
- **Multi-agent**: Observer watches while Worker browses
- **MCP integration**: Works with Claude Code
