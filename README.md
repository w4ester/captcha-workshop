# CAPTCHA Automation Workshop

**Baltimore AI Producers Lab** - Learn by building, not just consuming.

---

## 3-Step Setup

```bash
# 1. Enter the lab
cd captcha-bypass-lab

# 2. Install everything
npm run setup

# 3. Start exploring!
npm run lab:start
```

That's it. You're in.

---

## What You'll Build

A multi-agent browser automation system that:
- Detects CAPTCHAs automatically ("Land Ho!" alerts)
- Records what you're doing
- Uses stealth techniques to look human
- Integrates with Claude Code via MCP

---

## Quick Commands

| Command | What it does |
|---------|--------------|
| `npm run lab:start` | Interactive mode - type commands |
| `npm run lab:demo` | Watch a full demo run |
| `npm run lab:stealth-test` | Test if you look like a bot |

### Once in Interactive Mode

```
> launch              # Start the browser
> navigate google.com # Go somewhere
> screenshot          # Capture what you see
> record start        # Start recording
> stealth             # Run bot detection test
> quit                # Exit
```

---

## The Big Idea

> "Machines bypassing machines that train machines"

Every CAPTCHA you solve trains AI models for free. This workshop teaches you to understand detection systems, not just consume tools.

**Producer Mindset**: Build systems, don't just use them.

---

## Workshop Structure

```
lesson-captcha-automation/
├── README.md              # You are here
├── 00-producer-mindset.md # The philosophy
├── QUICK-START.md         # Fast reference
└── captcha-bypass-lab/    # The actual code
    ├── lessons/           # Step-by-step guides
    ├── agents/            # Multi-agent system
    ├── browser/           # Stealth browser setup
    ├── detectors/         # CAPTCHA detection
    └── mcp/               # Claude Code integration
```

---

## For Claude Code Users

Add to your `.claude/claude_desktop_config.json` or `.claude.json`:

```json
{
  "mcpServers": {
    "captcha-lab": {
      "command": "node",
      "args": ["mcp/server-standalone.js"],
      "cwd": "/FULL/PATH/TO/captcha-bypass-lab"
    }
  }
}
```

Then Claude can control the browser directly with commands like:
- `browser_launch`
- `browser_navigate`
- `captcha_status`
- `browser_screenshot`

---

## Requirements

- **Node.js 18+** (check: `node --version`)
- **npm** (comes with Node)
- **A few minutes** to download the browser

---

## Having Issues?

**"Browser not found"** - Run `npm run setup:browser` inside captcha-bypass-lab

**"Permission denied"** - Run `chmod +x browser/*.sh`

**"Port in use"** - Another instance is running, kill it or use a different port

---

## Learn More

- `captcha-bypass-lab/lessons/00-producer-mindset.md` - Why this matters
- `captcha-bypass-lab/lessons/01-setup-browser.md` - Deep dive on the tech
- `captcha-bypass-lab/README.md` - Full architecture docs

---

## Let's GrOw!

Built with the Baltimore AI Producers Lab - where we learn by building.

**Questions?** Open an issue or reach out to the workshop facilitator.
