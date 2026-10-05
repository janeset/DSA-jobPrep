# DSA Prep

A self-contained web app for a 12-week data structures & algorithms interview plan, tailored to
software jobs around Toronto and Kitchener-Waterloo. No build step, no backend: plain HTML, CSS
and JavaScript.

## Run it

Open `index.html` in a browser, or serve the folder (recommended, so embedded videos work):

```bash
python -m http.server 5173
```

Then visit http://localhost:5173.

## What's inside

| Tab | What it does |
| --- | --- |
| Today | Greeting, progress ring, this week's problems, spaced-repetition reviews, refresher progress |
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

## Your data

Progress is stored in the browser's `localStorage` only. Use **Settings > Export** to back it up.
