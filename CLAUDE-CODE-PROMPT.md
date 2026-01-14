# Claude Code Workshop Prompt

**Copy this entire prompt and paste it into Claude Code to get started!**

---

## 🚀 The Prompt (Copy Everything Below)

```
I'm attending the Baltimore AI Producers Lab CAPTCHA Automation Workshop and need your help getting set up and exploring browser automation.

## What I Need You To Do

### Phase 1: Setup (Do This First)
1. Clone the workshop repo if I haven't already:
   - https://github.com/w4ester/captcha-workshop.git
2. Navigate into the captcha-bypass-lab directory
3. Run `npm run setup` to install everything
4. Verify it works by running `npm run lab:start --help`
5. Tell me if anything failed and help me fix it

### Phase 2: Demo Walk-Through
Once setup is complete:
1. Start the lab with `npm run lab:start`
2. Launch the browser for me
3. Run the stealth test at bot.sannysoft.com
4. Take a screenshot and explain what the results mean
5. Show me if I'm being detected as a bot or passing as human

### Phase 3: Explore My Work Sites
After the demo, I'll give you URLs from my professional life to test:
- Check if they have CAPTCHA protection
- Test what bot detection they use
- See if the "Land Ho!" detector catches anything
- Take screenshots of interesting findings
- Explain what I'm seeing in educational terms

## My Setup Info
- Operating System: [I'll tell you if you need to know]
- I have/don't have Node.js installed: [I'll confirm]
- My comfort level: [beginner/intermediate/advanced]

## How I Learn Best
Please explain things as we go. I want to understand:
- WHY each step matters
- WHAT signals websites look for
- HOW the multi-agent system works
- The "producer mindset" - building vs just consuming

Let's GrOw! 🚢
```

---

## 🎯 What Happens When You Use This Prompt

Claude Code will:

1. **Check your system** — Verify Node.js, git, etc.
2. **Clone & setup** — Get the workshop code running
3. **Run the demo** — Launch browser, run stealth tests
4. **Explain everything** — Educational insights as you go
5. **Test your sites** — When you're ready, give Claude URLs to explore

---

## 💡 Example Follow-Up Prompts

After the initial setup, try these:

### Test a specific site:
```
Navigate to [your-company-site.com] and check:
1. Does it have any CAPTCHA?
2. What bot detection is it using?
3. Take a screenshot of what you find
```

### Understand detection:
```
What signals is this site checking to detect bots?
Explain each one and whether we're passing or failing.
```

### Build a warm profile:
```
Run the profile builder to create browsing history.
Explain what it's doing and why this helps avoid detection.
```

### Deep dive on architecture:
```
Show me how the coordinator.js orchestrates the observer
and worker agents. I want to understand the multi-agent pattern.
```

### Record a session:
```
Start recording, navigate to [site], interact with it,
then stop recording. Save the video so I can review later.
```

---

## 🔧 Troubleshooting Prompts

If something breaks:

```
The setup failed with this error: [paste error]
Help me fix it.
```

```
The browser won't launch. What should I check?
```

```
I'm on Windows and the bash scripts aren't working.
What's the alternative?
```

---

## 🌱 The Producer Mindset Prompt

For the philosophical discussion:

```
Explain the "extraction economy" concept from the workshop.
How do CAPTCHAs extract free labor? What's the meta-point
about "machines bypassing machines that train machines"?
```

---

## 📋 Quick Start (Minimal Version)

If you just want to get going fast:

```
Help me set up the CAPTCHA workshop from https://github.com/w4ester/captcha-workshop

Clone it, install dependencies, and run the stealth test demo.
Explain what's happening as we go.
```

---

## 🚢 Let's GrOw!

Paste any of these prompts into Claude Code and start exploring.

Remember: **Build systems, don't just use them.**
