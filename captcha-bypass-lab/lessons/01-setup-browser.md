# Lesson 1: Understanding the Setup

## Learning Objectives
- Understand why we use ungoogled-chromium
- Learn what makes a browser profile "human"
- See the multi-agent architecture

---

## Part 1: Why Not Regular Chrome?

When you use regular Chrome, Google collects:
- Every URL you visit (via Safe Browsing)
- Your search queries
- Extension usage
- Crash reports
- Much more

**Ungoogled Chromium** removes all this:
- No Google account integration
- No Safe Browsing callbacks
- No telemetry
- No default Google services

### Exercise 1.1
Open regular Chrome and ungoogled-chromium side by side. Open DevTools Network tab. Visit google.com. Compare the requests each makes in the background.

---

## Part 2: What Makes a Profile "Human"?

A fresh browser profile screams "automation":
- No browsing history
- No cookies
- Empty local storage
- No saved preferences

A "warm" profile has:
- Visited popular sites
- Accepted cookie consents
- Local storage data
- Browsing patterns

### Exercise 1.2
```bash
# Build a warm profile
npm run profile:build

# Look at what was created
ls -la browser/profile/Default/
```

---

## Part 3: Multi-Agent Architecture

```
           ┌──────────────┐
           │ Coordinator  │ ← Makes decisions
           └──────┬───────┘
                  │
       ┌──────────┴──────────┐
       │                     │
┌──────▼──────┐      ┌───────▼──────┐
│  Observer   │      │    Worker    │
│   Agent     │      │    Agent     │
│             │      │              │
│ • Monitors  │◄────►│ • Browses    │
│ • Records   │      │ • Clicks     │
│ • Alerts    │      │ • Types      │
└─────────────┘      └──────────────┘
```

**Why two agents?**
- Separation of concerns
- Observer can watch without interfering
- Worker can be paused while Observer records
- Easier to reason about

### Exercise 1.3
```bash
# Run each agent individually to see what it does
npm run agent:observer
npm run agent:worker
npm run agent:coordinator
```

---

## Part 4: The Detection Game

Sites detect automation through:

| Signal | Normal Browser | Automation |
|--------|---------------|------------|
| `navigator.webdriver` | undefined | true |
| `plugins.length` | 3-5 | 0 |
| `chrome.runtime` | exists | missing |
| Mouse movement | curved paths | jumps |
| Timing | variable | consistent |

### Exercise 1.4
```bash
# Test your stealth configuration
npm run lab:stealth-test

# Check the results in the browser window
```

---

## Reflection Questions

1. If Google makes both Chrome and reCAPTCHA, what advantage do they have in detection?

2. Why might a "warm" profile not be enough on its own?

3. What's the difference between "stealth" and "anonymity"?

---

## Next Lesson
We'll dive into CAPTCHA detection patterns and the "Land Ho!" system.
