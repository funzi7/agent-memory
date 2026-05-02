# agent-memory

Shared knowledge base for Claude-based agents working on funzi7's apps.

## Purpose

Each app has a folder of markdown files that agents (Claude Projects) load as knowledge. State updates are committed back at the end of each session so the next session starts informed.

## Structure

```
agent-memory/
├── README.md                  ← this file
├── shared/                    ← cross-app conventions
│   ├── workflow.md            ← how Dima works (batching, "discuss before prompts", etc.)
│   └── naming.md              ← conventions across apps
├── thai-rent-finder/          ← TRF
│   ├── state.md               ← living: PRs, sources, blockers
│   ├── architecture.md        ← stable: stack, schema, decisions
│   ├── gotchas.md             ← lessons learned, traps
│   ├── roadmap.md             ← batches done + planned
│   └── glossary.md            ← TRF-specific terms
├── opt/                       ← OptionsProfitTracker (future)
├── hydrome/                   ← HydroMe (future)
├── ratesnow/                  ← RatesNow (future)
├── fundme/                    ← FundMe (future)
└── divtracker/                ← DivTracker (future)
```

## Update protocol

At the end of any session that produced changes:
1. Update `state.md` for the relevant app (PR status, source status, blockers)
2. If a new lesson was learned: add to `gotchas.md`
3. If a batch finished: log under "Completed batches" in `roadmap.md`
4. Commit with message: `{app}: update state after PR #N` or similar

## Agent set per app

Five core agents per app (cloned from TRF after validation):

1. **State Tracker** — answers "what's the status?" without searching chats
2. **Spec Writer** — turns feature ideas into Claude Code prompts
3. **Bug Triage** — error/log/screenshot → root cause + fix suggestion
4. **PR Reviewer** — diff → pre-merge critique, catches logic bugs

Plus app-specific agents. For TRF:
5. **Scraper Doctor** — broken scraper or new site → live HTML inspection + selector spec

## Conventions

- All files Markdown
- Section headers use `## Title`
- Tables for status, lists for items
- Code blocks with language tag
- Update timestamps at the top of `state.md` only — other files have implicit "since last commit" recency
