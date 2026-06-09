# ROGUE
https://trl-gger.github.io/Rogue/
### Weighted Calisthenics Tracker

I built this because I was tired of opening my notes app after every set, looking up the increment table, doing the math in my head, and writing down a number I'd have to find again next session. There had to be a better way.

Rogue is that better way. Log your reps and RIR, and it tells you exactly what weight to use next session. That's the whole thing.

---

## The Programme

Rogue is built entirely around the **Mathew Zlat weighted calisthenics periodization system** — one of the most serious and well-structured approaches to weighted calisthenics programming available. If you don't know Mathew Zlat, look him up. His work on progressive overload, autoregulation, and phase periodization for weighted pull-ups and dips is the foundation everything here is built on.

The progression engine inside Rogue implements his exact increment tables, phase structure, and autoregulation logic. When the app tells you to add 1.25kg next session, that's not a guess — that's the programme working exactly as designed.

If you're not following the Mathew Zlat programme, this app will still work for weighted dips, pull-ups, and chin-ups — but it was built with his system in mind and the logic reflects that.

---

## What It Tracks

| Exercise | Day | Session Type |
|---|---|---|
| Weighted Dips | Monday / Friday | Heavy |
| Weighted Pull-ups | Monday / Friday | Heavy |
| Paused Weighted Dips | Wednesday | Assistance |
| Weighted Chin-ups | Wednesday | Assistance |

Paused Dips weight derives automatically from Regular Dips — you never input it manually. Everything else progresses independently because chin-ups and pull-ups are completely different movements at different strength levels and treating them the same would break the logic.

---

## How It Works

Open the app on a training day and it already knows what session you're doing and what weights to hit. You train, log your sets, and the app immediately tells you what comes next. Close it and go home.

The progression engine uses your reps and RIR from the hardest set of each exercise to calculate the next increment. It handles stalls, suggests deloads when needed, and flags phase transitions when you're ready to move up. You stay in control — nothing changes without your confirmation.

---

## Features

**Core**
- RIR-based autoregulation — reps + RIR in, next weight out
- Per-exercise phase detection with separate thresholds for dips and pulling movements
- Stall detection with deload suggestions
- Phase transition suggestions you confirm manually
- 0.5kg micro-increment support

**Session Logging**
- App knows the day and loads the correct session automatically
- Log sets one by one or all at once — whatever works for you in the gym
- Rest timer after individually logged sets
- Next session prescription shown immediately after your last set
- Optional session notes

**Progress**
- Personal records tracked per exercise
- Weight over time graph — 1 month, 3 months, all time
- Full session history with set-by-set detail
- PR badge on sessions where you hit a new record

**Ranking**
- 10 ranks per exercise and one combined overall rank
- Ranks reflect real weighted calisthenics strength standards
- Different thresholds per movement — a 30kg pull-up and a 30kg dip are not the same achievement

**Data**
- Everything stored locally on your device — no accounts, no servers, no tracking
- Export to JSON with one tap
- Automatic backup reminder every 10 sessions
- Soft flag when a scheduled session was missed

---

## Ranking System

| Rank | Title |
|---|---|
| 1 | Weakling |
| 2 | Beginner |
| 3 | Grinder |
| 4 | Warrior |
| 5 | Gladiator |
| 6 | Spartan |
| 7 | Viking |
| 8 | Titan |
| 9 | Demigod |
| 10 | Olympian |

Ranks are based on 1RM added weight and use separate thresholds per exercise. Dips allow significantly more added weight than pulling movements at equivalent training levels — the standards reflect that reality.

---

## Progression Tables

**Novice** — 3 sets, 5–8 reps

| Reps | RIR | Increment |
|---|---|---|
| 8 | 1–2 | +2.5kg |
| 8 | 0 | +1.25kg |
| 7 | 1 | +1.25kg |
| 7 | 0 | +0.5kg |
| 6 | 1 | +0.5kg |
| 6 | 0 | Hold |
| 5 | Any | Hold |
| Below 5 | Any | Deload suggested |

**Advanced Novice** — 3 sets, 3–6 reps

| Reps | RIR | Increment |
|---|---|---|
| 6 | 1–2 | +2.5kg |
| 6 | 0 | +1.25kg |
| 5 | 1 | +1.25kg |
| 5 | 0 | +0.5kg |
| 4 | 1 | +0.5kg |
| 4 | 0 | Hold |
| 3 | Any | Deload suggested |

**Intermediate S2** — 3 sets, 3–6 reps

| RIR | Increment |
|---|---|
| 2+ | +2.5kg |
| 1 | +1.25kg |
| 0 | +0.5kg |
| Missed rep in 1 set | +0.5kg |
| Missed rep in 2+ sets | Hold |

---

## Installation

Rogue is a PWA — no app store, no install required in the traditional sense. Just open it in your browser once and add it to your home screen.

**Deploy your own copy to GitHub Pages:**

1. Fork this repo
2. Go to Settings → Pages
3. Set source to main branch, root folder
4. Open the provided URL on your phone

**Add to home screen:**

iOS — Share → Add to Home Screen

Android — three dot menu → Add to Home Screen

After the first load the app works completely offline. No internet needed in the gym.

---

## Your Data

Everything lives in your browser's localStorage. Nothing is sent anywhere. No accounts. No analytics. No cloud. Just your training data on your device.

Back it up. The app reminds you every 10 sessions but don't wait for the reminder — go to Settings and export a JSON file occasionally. Clearing browser data will wipe your history.

---

## Tech

Single HTML file. Vanilla JavaScript. No frameworks. No build step. No dependencies. Service Worker for offline. localStorage for data. GitHub Pages for hosting.

That's it.

---

## Credit

Programming logic based on the Mathew Zlat weighted calisthenics system. The increment tables, phase structure, autoregulation scheme, and periodization philosophy are his. This app is an implementation of that system, not a replacement for understanding it. If you're serious about weighted calisthenics, buy his programme.

---

## Roadmap

- [ ] Bodyweight tracking for total load calculation  
- [ ] Intermediate S1 Texas Method session structure  
- [ ] Advanced macrocycle builder  
- [ ] CSV export option  
- [ ] Cross-device sync

---

MIT License
