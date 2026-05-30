# Shared Conventions — All Dima's Apps

> Cross-app rules. Apply to every Hebrew Android app Dima builds (OPT, HydroMe, RatesNow, FundMe, DivTracker, etc.).
>
> If a convention here conflicts with an app-specific gotchas.md or architecture.md, the app-specific file wins (it has more context).

---

## Localization & layout

### Hebrew is the primary language

- All UI strings live in `values-he/strings.xml`. English fallback in `values/strings.xml`.
- `android:supportsRtl="true"` in AndroidManifest.
- Don't hardcode Hebrew strings in Composables — always reference resources.

### RTL layout — use `start`/`end`, NEVER `left`/`right`

```kotlin
// Right
Modifier.padding(start = 8.dp, end = 16.dp)

// Wrong — won't flip with locale
Modifier.padding(left = 8.dp, right = 16.dp)
```

The `left`/`right` versions don't flip with RTL locale. `start`/`end` do. Lint can catch this — keep the lint check enabled.

### Calendar arrows in RTL

In Hebrew, the visual direction of arrows often feels reversed because the locale flips them. Decouple visual direction from logical action:
- Logical "next month" should be triggered by the arrow that POINTS forward in reading direction (left arrow in Hebrew)
- Logical "previous month" by the arrow pointing backward (right arrow in Hebrew)

Test on a real Hebrew device — emulator RTL behavior often differs.

---

## Numbers, dates, signs — LTR Rule (REFINED)

### Hebrew paragraphs

- **Paragraph alignment:** Hebrew text aligns to the right edge (`textAlign = TextAlign.End` in RTL context, or `Modifier.fillMaxWidth() + horizontalAlignment = Alignment.End` in Column).
- **First word/icon position:** First letter of Hebrew text sits on the visual right side of the screen.
- **Section headers always include an icon, placed to the RIGHT of the title (visual right) since Hebrew reads right-to-left. Example: "📊 דוחות" — the bar-chart icon visually appears to the right of "דוחות" because reading direction starts at right.

### Numbers, dates, English content

- **Always wrapped in LTR** via `CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr)`.
- **Digits read left-to-right inside the LTR span.** Example: `1,234.56` not `65.432,1`.
- **Currency symbol position:** Currency sign sits to the LEFT of the digits (LTR convention): `$1,234.56`, never `1,234.56$`. Same for ₪ and ฿.
- **+/- sign position:** Sign sits to the LEFT of the digits and currency: `-$300.00`, never `$300.00-`. Same: `+$150.50`, never `$150.50+`.
- **Percentages:** `45%` (not "45 אחוז" or "45 percent"). Sign to the right of the digits.
- **Dates display:** `DD/MM/YYYY` (e.g. `28/04/2026`). Always inside an LTR wrapper inside Hebrew paragraphs.
- **Dates storage:** ISO 8601 / `LocalDate` (e.g. `2026-04-28`).

### Combining Hebrew + numbers in a single line

When a line has Hebrew text and a number/currency together (e.g. "ייצא מהקאש: $14,060"):

- The whole line is paragraph-aligned to the right (Hebrew reading direction).
- Hebrew text sits on the visual right.
- The number sits to the LEFT of the Hebrew text — **immediately adjacent**, NOT pushed to the far left edge of the screen.
- Use `Row(horizontalArrangement = Arrangement.End)` with the number wrapped in its own LTR `CompositionLocalProvider`.

Wrong layout:
  | ייצא מהקאש:                                          $14,060 |  (number flung to far left)
Wrong layout:
  | $14,060                                          ייצא מהקאש: |  (Hebrew on left)
Correct layout:
  |                              ייצא מהקאש: $14,060 |  (both adjacent on the right)

### Hebrew label + number reads RIGHT-to-LEFT (number on the RIGHT) — use natural RTL, NOT forced LTR

A Hebrew label+number line reads RIGHT->LEFT: the NUMBER sits on the RIGHT, then its Hebrew unit/noun, then any trailing token (percent/sign) on the LEFT. Example: "עברו מהשנה: 148 ימים (40.5%)" → 148 on the visual RIGHT, ימים in the middle, (40.5%) on the LEFT. Money rows are the same: Hebrew label on the right, the LTR-wrapped amount immediately to its left.

- **DON'T force LTR on the whole value.** An LRM prefix (U+200E), an LTR isolate (U+2066 … U+2069), String(Character.toChars(0x2066)), AND a forced-`LocalLayoutDirection.Ltr` Row ALL push the number to the LEFT (English order) = WRONG. Every one of these was tried on the OPT annual "עברו מהשנה" line over many rounds and looked reversed. Forcing LTR is the bug, not the fix.
- **DO render the value group in the screen's natural RTL** (a plain `Row` that inherits the global RTL). Children then place right->left automatically: the FIRST child is the RIGHTMOST. For "148 ימים (40.5%)" put `Text("148")` first (rightmost), then `Text("ימים")`, then the percent (leftmost).
- **Wrap ONLY a parenthesized / sign-bearing sub-token in LTR** (e.g. the percent `Text("(40.5%)")`, or a `$`/`-` amount) so its glyphs render literally — `(40.5%)` not `)40.5%(`. The inner LTR affects that one Text's internal glyph order only, NOT its placement in the RTL Row.
- A single combined string works ONLY when it's pure number+sign with no Hebrew word between digits (that's why `formatCurrency`'s U+200E-prefixed amount is fine). The hard case — a Hebrew WORD between numbers — must be split into separate single-token Texts in a natural-RTL Row.
- Verify on a real Hebrew device — emulator/preview bidi differs.

### Strategy names language

- Strategy abbreviations stay in English: `CC`, `CSP`, `Wheel`, `Spread`, `Iron Condor`, `Straddle`, `Strangle`, `Long Call`, `Long Put`.
- Status labels translate to Hebrew: `פתוח`, `סגור`, `הוקצה`, `פקע`, `התגלגל`, `טיוטה`.

### Color semantics (CRITICAL — shared across all financial apps)

- **🟢 Green** = realized profit (רווח ממומש)
- **🔵 Blue** = premium received (פרמיה שהתקבלה)
- **🔴 Red** = realized loss (הפסד ממומש)
- **⚪ Gray/secondary** = informational, neutral, totals
- **🟡 Yellow/warning** = cautionary state, near-limit (e.g. close to capital cap)
- **Other colors** = strategy-specific accents only (use `AppTheme.colors.strategy(StrategyType.X)`)

These colors must NEVER swap meanings between contexts. If a number turns green it MUST be a realized profit; if it turns blue it MUST be premium received. Never use green for "premium" or blue for "profit". This rule is broken often — PR Reviewer must actively check.

---

## Compose UI conventions

### NO hardcoded colors anywhere

```kotlin
// Right
Text(color = AppTheme.colors.primary)
Text(color = MaterialTheme.colorScheme.error)

// Wrong
Text(color = Color(0xFFFF0000))
Text(color = Color.Red)
```

Reasons:
- Light/dark theme support breaks otherwise
- Background agents have already done bulk replacements multiple times
- Strategy-specific colors should come from a theme function: `AppTheme.colors.strategy(StrategyType.COVERED_CALL)`

To find violations: `grep -rn "Color(0x\|Color\." app/src/main/java/`

### Loading state, empty state, error state — every list

Whenever you render a list, plan for three states:
- Loading (spinner)
- Empty (illustration + message — Hebrew)
- Error (retry button + Hebrew error message)

Default to showing all three even if the empty case "shouldn't happen". It will.

### Save animations / feedback

Buttons that save data should show feedback (✓ "נשמר", or animate to a check icon, then revert after 2s). Don't just silently complete the operation.

---

## Build & dependency conventions

### Kotlin 2.0+, KSP only — never kapt

```kotlin
// Right
ksp("androidx.room:room-compiler:2.6.1")

// Wrong
kapt("androidx.room:room-compiler:2.6.1")
```

If a library only supports kapt, find an alternative or escalate.

### Mandatory pre-commit build check

Per CLAUDE.md (OPT) and applies to all apps:

```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
./gradlew assembleDebug
```

Build must pass. NEVER push code that doesn't compile.

### Don't introduce new dependencies without flagging

The load-bearing libraries are: Hilt, Compose, Room, WorkManager, Kotlinx Serialization or Gson, DataStore, Navigation Compose. Resist adding anything that overlaps with these.

If a new dependency is genuinely needed:
- Flag it in the PR description
- Justify why existing libraries can't do it
- Confirm the version doesn't have known security issues

### Don't bump Room DB version without a migration

Each `version` increment must have a `Migration(N, N+1)` object. The chain must be unbroken. See app-specific gotchas.md for the registration pattern (some apps register migrations in multiple places — verify).

---

## Process conventions

### Discuss before sending Claude Code prompts

Especially for medium-to-large changes:
1. Spec Writer agent drafts the prompt
2. Show Dima first
3. He confirms scope is right
4. Then send to Claude Code

Skipping this step has wasted whole sessions on misaligned work.

### Pack related work into one prompt

If 4 small bugs are in the same file/component, fix them in one Claude Code session — not four. Keeps context warm and avoids re-loading the codebase mentally.

### Clean Build is required after Application/Manifest/DB changes

When a change touches:
- `Application` class (e.g., `OptionsTrackerApp.kt`)
- `AndroidManifest.xml`
- Room schema (any DB change)

Tell Dima to do **Clean Build**, not just Run. Otherwise logs are stale and the change might not even be in the running APK.

### Mark verified vs claimed-done

Many items get stamped "done" in commits but aren't actually working on device. State Tracker should distinguish:
- ✅ Verified on device
- 🟡 Claimed done, unverified
- 🔴 Failed multiple attempts

Don't let 🟡 silently become ✅ without explicit testing.

### Don't re-prompt completed items

Spec Writer agent reads roadmap.md FIRST. State Tracker confirms before any new round. Re-prompting completed work has wasted entire sessions.

### Sign +/- positioning is non-negotiable

This rule is broken often enough that PR Reviewer must actively check it. Even small "polish" PRs sometimes regress this.

---

## Security conventions

### API keys in DataStore (encrypted ideally)

- All third-party API keys (Alpha Vantage, Anthropic, Gemini, etc.) live in the app's `AppPreferences` DataStore
- Never hardcode API keys in source
- Migration to EncryptedDataStore is open work — don't block on it but don't make it worse

### Never log sensitive data

- IBKR Flex XML contains account numbers + balances → never log full content
- API keys → log only `len=N first4=ABCD` style (see OPT's `API_KEYS` log tag for the pattern)
- Never log full user-entered passwords or PII

---

## Codex / GitHub workflow conventions

### `@codex address that feedback` triggers Codex auto-fix

When opening an Issue with a `cc @codex address that feedback` line, Codex bot will pick it up and create a PR.

### Conventional commit messages

Format: `{type}: {short description}`

Types:
- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — maintenance, tooling, deps
- `refactor:` — code restructure with no behavior change
- `docs:` — documentation only
- `state:` — agent-memory state update (this repo only)
- `roadmap:` — agent-memory roadmap update (this repo only)
- `ci:` — workflow / actions changes

### Branch naming

`claude/batch{N}-{description}` for Claude Code work.
`claude/{round-label}-{description}` (e.g., `claude/r1-sync-correctness`) for round work.

---

## Shared agent guardrails (Group BN prime)

BOTH Claude Code and Codex now share the same git-safety rules, recorded in the OPT repo's `CLAUDE.md` (Claude Code) and `AGENTS.md` (Codex):
- `git pull --rebase origin main` before editing; STOP if there are uncommitted local changes.
- `./gradlew clean assembleDebug` must pass (read the output, don't assume) before commit.
- Never force-push; never rewrite remote history; never `git reset --hard` without explicit user approval.
- Never delete user data or Room migrations.
- Use the Edit tool, NOT regex/PowerShell mass-replace, on `.kt` files (a botched regex has corrupted files before).

Both agents read THIS repo (`funzi7/agent-memory`) at the start of each task for current state — `options-profit-tracker/state.md`, `roadmap.md`, `gotchas.md`, and this file are the source of truth (e.g. Room DB is v30, not the v11 still listed in CLAUDE.md's historical section).
