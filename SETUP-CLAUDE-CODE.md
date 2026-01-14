# Getting Started with Claude Code

**First time using Claude Code? This guide gets you from zero to running in 10 minutes.**

---

## What is Claude Code?

Claude Code is an AI assistant that runs in your terminal. It can:
- Read and write files
- Run commands
- Control browsers
- Help you code and automate tasks

**You get a free 7-day trial** - no credit card required to start.

---

## Step 1: Get Your Free Trial

1. Go to: **https://claude.ai**
2. Click **"Try Claude"** or **"Sign Up"**
3. Create an account (email or Google sign-in)
4. You now have access to Claude!

> **Note:** Claude Code uses your Anthropic account. The 7-day free trial gives you enough credits to complete this workshop.

---

## Step 2: Install Claude Code

### 🍎 Mac

Open Terminal (press `Cmd + Space`, type "Terminal", hit Enter), then run:

```bash
npm install -g @anthropic-ai/claude-code
```

**Don't have npm?** Install Node.js first:
1. Go to https://nodejs.org
2. Download the **LTS** version
3. Run the installer
4. Close and reopen Terminal
5. Now run the npm install command above

### 🪟 Windows

Open PowerShell or Command Prompt (press `Windows key`, type "powershell", hit Enter), then run:

```bash
npm install -g @anthropic-ai/claude-code
```

**Don't have npm?** Install Node.js first:
1. Go to https://nodejs.org
2. Download the **LTS** version (Windows Installer)
3. Run the installer (check "Add to PATH" if asked)
4. Close and reopen PowerShell
5. Now run the npm install command above

### 🐧 Linux

Open Terminal (`Ctrl + Alt + T`), then run:

```bash
npm install -g @anthropic-ai/claude-code
```

---

## Step 3: Start Claude Code

In your terminal, simply type:

```bash
claude
```

### First Time? You'll See:

```
Welcome to Claude Code!

To get started, you'll need to authenticate.
Press Enter to open your browser and log in...
```

1. Press **Enter**
2. Your browser opens to Anthropic's login page
3. Sign in with your account
4. You'll see "Authentication successful!"
5. Return to your terminal - Claude is ready!

---

## Step 4: You're In!

You should see something like:

```
╭─────────────────────────────────────────╮
│                                         │
│   Welcome to Claude Code!               │
│                                         │
│   Type your request or question...      │
│                                         │
╰─────────────────────────────────────────╯

>
```

**That `>` is where you type.** Claude is listening!

---

## Step 5: Run the Workshop

Now paste this prompt to get started with the CAPTCHA workshop:

```
I'm attending the Baltimore AI Producers Lab CAPTCHA Automation Workshop.

Help me get set up:
1. Clone https://github.com/w4ester/captcha-workshop.git
2. Navigate into captcha-bypass-lab
3. Run npm run setup
4. Start the lab with npm run lab:start
5. Run the stealth test demo and explain what's happening

After that, I'll give you URLs from my professional life to test for bot detection.

Let's GrOw!
```

Claude will:
- Clone the workshop code
- Install everything
- Run the demo
- Explain what you're seeing
- Wait for you to give it sites to test

---

## Quick Reference

| Command | What it does |
|---------|--------------|
| `claude` | Start Claude Code |
| `claude --help` | See all options |
| `/help` | Get help while inside Claude |
| `/clear` | Clear the conversation |
| `Ctrl + C` | Exit Claude Code |

---

## Troubleshooting

### "command not found: claude"

Node.js isn't in your PATH. Try:
```bash
# Check if Node is installed
node --version

# If not, install from nodejs.org, then:
npm install -g @anthropic-ai/claude-code
```

### "npm: command not found"

You need Node.js. Download from https://nodejs.org

### "Authentication failed"

1. Make sure you're signed into claude.ai in your browser
2. Try running `claude` again
3. Check your internet connection

### "Permission denied" (Mac/Linux)

Try with sudo:
```bash
sudo npm install -g @anthropic-ai/claude-code
```

### Need more help?

- Claude Code docs: https://docs.anthropic.com/claude-code
- Workshop issues: https://github.com/w4ester/captcha-workshop/issues

---

## What's Next?

Once Claude Code is running and you've pasted the workshop prompt:

1. **Watch Claude set up the workshop** - it'll clone the repo and install everything
2. **See the stealth test demo** - Claude will show you if browsers look like bots
3. **Test your own sites** - give Claude URLs from your work to analyze
4. **Learn the producer mindset** - understand *how* detection works, not just *what*

---

## Let's GrOw! 🚢

You're ready to start the workshop.

**Remember:** You're not just using tools - you're learning to build them.

That's the producer mindset.
