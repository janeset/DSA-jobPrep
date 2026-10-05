# Prep Hub

A self-contained web app for interview prep, tailored to software jobs around Toronto and
Kitchener-Waterloo, with three tracks: **DSA Prep** (12-week algorithms plan), **Cloud Prep**
(AWS + Azure, 8 weeks) and **AI / LLM Prep** (8 weeks). No build step, no backend: plain HTML,
CSS and JavaScript.

## Run it

Open `index.html` in a browser, or serve the folder (recommended, so embedded videos work):

```bash
python -m http.server 5173
```

Then visit http://localhost:5173.

## What's inside

| Page | What it does |
| --- | --- |
| Home | Hub with progress for all three tracks and a suggested weekly rhythm |
| AWS Certs | Exam prep for CLF-C02, SAA-C03, AIF-C01 and AIP-C01: official domains and weightings, study notes, readiness checklists, week-by-week plans, timed practice exams and tutor mode with per-domain results |
| Cloud / AI tracks | Overview, roadmap, lessons (AWS vs Azure maps; runnable Python exercises for AI), interview question bank, exam-style quiz, hands-on labs/projects with resume bullets, certification paths |
| DSA: Today | Greeting, progress ring, this week's problems, spaced-repetition reviews, refresher progress |
| Roadmap | 12 weeks, one pattern family at a time |
| Refreshers | Python, Java and C# lessons with exercises; Big-O (growth calculator + quiz); data structures in Python/Java/C#; DSA pattern notes; full courses |
| Problems | ~130 curated LeetCode problems filtered by level (Core / Mid / Stretch), with attempt logging |
| Solutions | Worked Python solution and NeetCode video for every problem (hidden until revealed) |
| Practice | In-browser Python editor (Pyodide) with an interview timer |
| Companies | Local employer tiers and an application tracker |
| Settings | 9 themes, accent colour, text size, density, plan start date, export / import |

Python exercises are auto-graded in the browser via [Pyodide](https://pyodide.org) (loaded from a
CDN on first run). Java and C# exercises are self-checked: each has sample cases and a reference
solution, plus links to online compilers.

## Files

| File | Contents |
| --- | --- |
| `index.html`, `style.css`, `app.js` | App shell, design system / themes, views and logic |
| `data.js` | Roadmap weeks, problem list, pattern notes, company tiers |
| `solutions1-3.js` | Python solutions for every problem |
| `refresher.js`, `langlessons.js` | Python, Java and C# lessons and exercises |
| `bigo.js`, `datastructures.js` | Big-O and data-structure content |
| `videos.js` | YouTube video IDs (each verified for channel and title) |
| `cloud.js`, `ai.js` | Cloud and AI/LLM track content (`ai.js` also holds the track registry and `extendTrack`) |
| `cloud-more.js`, `ai-more.js` | Extra lessons, exercises, glossaries and questions merged into the tracks |
| `trackview.js` | Track engine (overview, learn, questions, quiz, labs, certs) and the Home page |
| `awscerts.js`, `awsview.js` | AWS certification content and the practice-exam engine |
| `systemdesign.js` | System design lessons and case studies |

## Your data

Progress is stored in the browser's `localStorage` only. Use **Settings > Export** to back it up.
