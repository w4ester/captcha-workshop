# Presenter Notes

Quick reference for running the workshop.

---

## Before the Workshop

### 1. Test Everything
```bash
cd captcha-bypass-lab
npm run setup
npm run lab:start
```

### 2. Have These URLs Ready
- `bot.sannysoft.com` - Stealth test
- `nowsecure.nl` - Advanced detection
- A site with Cloudflare protection

### 3. Open These Files
- `slides/workshop-presentation.html` - The slides (press F for fullscreen)
- `agents/coordinator.js` - To show architecture
- `detectors/detector.js` - To show "Land Ho!" system

---

## Slide-by-Slide Notes

### Slide 1: Title
Just the intro. Let it sit for a moment. "Welcome to the workshop..."

### Slide 2: The Big Question
**Ask the audience**: "What do you think happens when you solve a CAPTCHA?"
Wait for answers. Most will say "proves I'm human."

### Slide 3: Extraction Economy
**Key point**: You're doing FREE LABOR for Google.
- reCAPTCHA labeled ALL of Google Street View
- Every time you click "select the traffic lights" you're training their self-driving cars
- This is the "extraction economy" - your time/data extracted as value

### Slide 4: Producer vs Consumer
**The core philosophy of the workshop.**
We're here to understand systems, not just use them.
Ask: "Which side do you want to be on?"

### Slide 5: What We're Building
Quick overview. Don't explain everything - they'll discover it.
Just get them excited about what's possible.

### Slide 6: How Detection Works
**Practical knowledge.** These are the actual signals.
Run `npm run lab:stealth-test` here to show live detection.

### Slide 7: Architecture
Draw attention to the Observer + Worker separation.
"Why separate them?" → Single responsibility, can pause worker without stopping observation.

### Slide 8: Land Ho System
**Demo time!** Navigate to a Cloudflare-protected site.
Show the alert firing in real-time.

### Slide 9: Stealth Techniques
Two sides: what we hide vs what we add.
"A bot is suspicious by what's missing, not just what's present."

### Slide 10: Ungoogled Chromium
Quick comparison. Main point: cleaner fingerprint baseline.
"We start with less Google, so we leak less signals."

### Slide 11: Let's Get Started
**TRANSITION TO HANDS-ON**
Give them 5-10 minutes to set up.
Walk around and help anyone stuck.

### Slide 12: Hands-On Time
Keep this slide up while they work.
Announce each step as the group progresses.

### Slide 13: Sites to Test
**Personal relevance.** Ask them to test THEIR company's sites.
"What protections does your employer use?"

### Slide 14: What You Learned
Quick recap. Ask them to name one thing they learned.

### Slide 15: Keep Building
Resources for after the workshop.
Point them to the lessons/ folder.

### Slide 16: Final
Thank them. Remind them of the repo URL.
"Let's GrOw!"

---

## Demo Commands Cheat Sheet

```bash
# Start the lab
npm run lab:start

# In interactive mode:
launch                    # Start browser
navigate google.com       # Go to URL
stealth                   # Run stealth test
screenshot                # Capture screen
record start              # Start recording
record stop               # Stop recording
status                    # Check CAPTCHA detections
quit                      # Exit

# Direct commands
npm run lab:demo          # Full automated demo
npm run lab:stealth-test  # Quick stealth check
npm run profile:build     # Build warm profile
```

---

## Common Issues During Workshop

### "npm not found"
They need Node.js: https://nodejs.org

### "Permission denied" on Mac
```bash
chmod +x browser/*.sh
```

### Browser won't launch
```bash
npm run setup:browser
```

### "Port already in use"
Kill existing instance or use different port.

---

## Timing Guide

| Section | Time |
|---------|------|
| Intro & Philosophy (Slides 1-4) | 10 min |
| Technical Overview (Slides 5-10) | 15 min |
| Setup Time (Slide 11-12) | 10 min |
| Hands-On Testing (Slide 13) | 20 min |
| Wrap-Up (Slides 14-16) | 5 min |
| **Total** | **~60 min** |

Adjust based on audience skill level. Beginners need more setup time.

---

## Questions to Engage Audience

1. "Who has been blocked by a CAPTCHA this week?"
2. "What do you think websites check to detect bots?"
3. "Why would you want to automate browser tasks?"
4. "What sites at YOUR work might have detection?"
5. "What's the difference between blocking bots and blocking automation?"

---

## Key Takeaways to Emphasize

1. **CAPTCHAs extract free labor** - You're training AI for free
2. **Detection is about signals** - WebDriver, plugins, timing
3. **Stealth = looking human** - Add what's missing, hide what's suspicious
4. **Multi-agent = separation of concerns** - Observer watches, Worker acts
5. **Producer mindset** - Understand and build, don't just consume

---

## After the Workshop

Share these links:
- Repo: `github.com/w4ester/captcha-workshop`
- Setup guide: `SETUP-CLAUDE-CODE.md`
- Email templates: `WORKSHOP-EMAIL.md` (for follow-up)

---

**Let's GrOw!** 🚢
