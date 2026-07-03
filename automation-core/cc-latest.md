# automation-core — latest Claude Code status

## fix #20 — Link-header pagination in the readonly `fetch` helpers (50-page ceiling)

**main commit `07ea30e`** (direct to main, ONE commit, author funzi7). Both changed workflows
byte-identical across `workflows/` ↔ `.github/workflows/` (merge-bot `2d80ab2`, watchdog `12a2fbb`);
actionlint + `yaml.safe_load` pass on all four copies; `node --check` on both script bodies.

### The change
fix #19 introduced built-in-`fetch` readonly helpers with a **fixed 10-page valve**
(`for (let page = 1; page <= 10; page++)` + `&page=${page}`) — which silently truncates a very chatty
head at ~1000 rows. fix #20 replaces it with **true `Link`-header pagination**, still ZERO modules:
```
async function roPage(url) { ... parse res.headers.get('link') for rel="next" ... return {data, next} }
async function roPaged(path, extract) { follow next until absent, i < 50 safety ceiling }
const roCheckRuns = (ref) => roPaged(`/repos/.../check-runs?per_page=100`, (d) => d.check_runs || []);
const roStatuses  = (ref) => roPaged(`/repos/.../statuses?per_page=100`, (d) => d);
```
- **merge-bot.yml** (`@v8`) gets all four (`roPage`/`roPaged`/`roCheckRuns`/`roStatuses`).
- **claude-fallback-watchdog.yml** (`@v7`) gets `roPage`/`roPaged`/`roCheckRuns` only — the sweep reads
  no statuses.
- **Call sites unchanged** (`await roCheckRuns(headSha)` / `await roStatuses(headSha)`); the now-unused
  `roGet` (no callers outside the paged loops) was removed. The hard rule stands: **never `require`
  anything inside github-script** — built-in `fetch` only.

### Origin
Codex flagged the 10-page cap on a downstream **sync PR** and produced a downstream fix. That can't be
merged there: the next daily sync overwrites synced workflows, and it missed the **watchdog's** copy of
the same helper. So the fix is adopted **UPSTREAM here**, where the next sync then overwrites the
downstream edit with the correct one.

### Validation
`yaml.safe_load` on both copies of both files; actionlint clean on all four; `node --check` on each
script body; greps — **ZERO** `page <= 10`, **ZERO** `&page=${page}`, the `rel="next"` regex present in
both files, call sites untouched, and the regression guard **ZERO** `require('@actions/github')` /
`__original_require__` / `getOctokit` anywhere in workflows; `git hash-object` equal per file.

**Handoffs updated in the same commit:** `handoffs/CONTEXT.md` (fetch-helper hard rule + merge-bot
bullet — pagination now follows `Link` `rel="next"` with a 50-page ceiling; notes the downstream-sync
origin and why fixes must land upstream), `LOOP_STATE.md` (merge-bot + watchdog fix #20 entries),
`handoffs/loop-build.md` (dated entry).

**Next:** a head with >1000 check-runs/statuses now paginates fully instead of truncating at page 10.
Propagates to downstreams on the next daily sync.
