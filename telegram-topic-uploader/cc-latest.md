# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D5B — a real navigation history so every Back returns one step to the exact screen and position it was opened from, restored screen state on return, All / Videos / Images filters on every mixed media list, pinch-to-zoom and pan on an image in Preview, and a 9GAG caption that reads as words rather than as a filename with a download identifier |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `0a54ffa` (D5A) |
| Version | code 22 -> 23, name `0.10.0-d5a` -> `0.11.0-d5b` |
| Room schema | **11, unchanged.** No `MIGRATION_11_12`, no `12.json` |
| Deployment | None. Not installed or run on any device or emulator in this session |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, nonce, file name, content URI, document ID, path, folder
name, destination name, or media hash was requested, used, or recorded anywhere, including this file.

## D5A hardware evidence, exactly as the user reported it

D5A was installed and used on the Android device. The user reports this much, and **only** this much:

- **Check 1 passed** — the real source-folder name and the local-alias behaviour.
- **Check 2 passed** — tapping the folder opens its dedicated media page.
- **Check 3 passed** — a disposable image was scanned, received a thumbnail, opened in Preview, and
  was uploaded.
- **One defect** — Back from the folder-media page returned to the Dashboard instead of to the screen
  and location the folder was opened from.
- The user established a **global product rule**: every Back control must return to the exact previous
  place and position.
- The remaining D5A checks will be exercised gradually during continuous use.

**Do not infer hardware validation of anything else.** Explicitly still unvalidated: albums; Ignored
and Restore after a rescan; manual permanent deletion without upload; pull-to-refresh on every screen;
destination popularity; same-name sibling deletion safety; album no-retry. Nothing in D5B touches
that list. **D5A checks beyond 1–3 remain ongoing.**

The user also asked for the three D5B features by name: media-type filters on Review and every other
relevant media screen, two-finger image zoom in Preview, and a 9GAG caption with the trailing numeric
download identifier removed and the hyphens shown as spaces.

## The one thing the UX gate actually resolved

The task supplied its own decisions for the Back contract, the filter values, the global selection,
the zoom and the caption rule. One genuine ambiguity remained, and it was the one the task itself
deferred ("Document the final rule"): **what a deliberate drawer selection does to the stack.**

The user chose **option 1: keep today's convention.** A drawer choice clears everything above the
Dashboard and puts the chosen screen directly above it, so Back from a drawer-opened screen lands on
the Dashboard — *because the Dashboard is genuinely the entry beneath it*, not because anything routes
there. Two consequences were stated with the option and are now true: every drawer-opened screen shows
a visible Back arrow (before D5B only a Dashboard drill-down did), and Back from the Dashboard itself
follows normal Android root behaviour.

The converse stays forbidden and is structural: **a nested Back never behaves like a drawer
selection.** Nothing nested calls `navigateToDashboard`.

## The global Back rule, in one paragraph

Back leaves whatever is on top. Preview first (it is drawn *inside* its destination, so it is on top
of the screen without being on top of the stack); otherwise pop exactly one navigation entry;
otherwise this is the root and Android's own behaviour is left alone, with no Dashboard entry
manufactured to give Back somewhere to go.

## The pieces worth re-reading

### `AppBackPolicy` — the whole navigation fix

Pure, two booleans in, one of three verbs out (`EXIT_PREVIEW` / `POP` / `ROOT`). It knows nothing
about Compose, navigation, or any screen's name. **There is deliberately no `GO_TO_DASHBOARD`**, and
`AppBackPolicyTest` asserts no action's name contains `DASHBOARD` or `HOME` — the enum's shape *is*
the guarantee.

The app shell reads `navController.previousBackStackEntry != null` and `reviewPreviewRow != null`,
asks the policy, and performs the answer. Both the arrow's *action* and its *existence* come from that
one call, so they cannot drift apart. `NavHost` was already maintaining a correct stack the whole
time; only the visible arrow ignored it.

**Preview must be answered before the stack**, and the ordering is asserted as an ordering *inside the
pure rule* (`indexOf(EXIT_PREVIEW) < indexOf(POP)`), not at the call site.

### `DashboardDrillDown` was deleted, not adapted

It answered "was this entry pushed by a tile?" from a `?group=` argument. That was a proxy for the
real fact and needed a hand-written exception per screen — D5A had already had to name the folder page
in it. Reading the stack needs none. Four tests in `DashboardTilesTest` went with it; tile route
construction and parsing are untouched.

### Screen-state restoration needed **no new machinery at all**

`rememberLazyListState()` / `rememberLazyGridState()` are saveable state, and a `composable {}` body's
saveable state is scoped to that `NavBackStackEntry`'s own registry. So creating the state **inside
the destination body** — instead of letting `LazyColumn` build a default — is the entire mechanism:
pop restores item + pixel offset, and a configuration change restores it for the same reason. No state
holder, no map keyed by screen, no manual save/restore.

Same trick carries a screen's filter: folder page, Queue and History each hold a `rememberSaveable`
`MediaKindFilter` (an enum is `Serializable`, so `autoSaver` handles it — no custom `Saver` needed).

**Review is the deliberate exception**: its profile filter, media filter, sort and selection live in
`MainViewModel`, because those four together *are* "the state of Review" and are read by ViewModel
actions. Splitting them across two lifetimes would have been the drift.

Do **not** persist any of it. Room holds evidence about media; a scroll offset is not evidence.

### The hidden-selected count was the filter's one real hazard

Review's selection is global and survives filtering, so the screen states how many selected items are
out of sight. Adding a second filter without updating that count leaves a *visible sentence* quietly
understating the number — which reads as a bug in the count, not in the filter. There are now two
`hiddenSelectedCount` overloads; the four-argument one asks whether **either** filter rejects a row.

### `ImageZoomPolicy` is Compose-free on purpose

Floats in, a `Transform` out. 1x floor, 5x ceiling, centroid-anchored zoom, clamp
`viewport × (scale − 1) / 2` per axis. **At 1x the clamp is arithmetically zero**, so panning is not
disabled by a flag — it is incapable of moving anything, which is the same guarantee without a branch
someone could forget.

The centroid algebra, in case it needs re-deriving: measure offsets from the viewport centre, let
`k = newScale / oldScale`, then `newOffset = offset * k + anchor * (1 - k) + pan`, where
`anchor = centroid - viewportSize / 2`. That keeps the content point under the fingers under the
fingers, and `ImageZoomPolicyTest` asserts exactly that invariant rather than a magic number.

Compose side: `pointerInput(mediaItemId) { detectTransformGestures { … } }` on the image `Box`, and
`graphicsLayer` on the `Image`. Rotation is received and ignored. Every control is a **sibling** of
that Box in the surrounding Column, so control isolation is structural.

### The 9GAG caption rule, exactly

Order: remove final extension -> trim -> drop a final `-` followed by **ten or more ASCII digits** ->
every run of hyphens becomes one space -> collapse repeated whitespace -> trim -> existing
Unicode-safe 1 024 bound. Blank result -> `null`.

`Kittens-to-warm-the-heart-1783162900383.mp4` -> `Kittens to warm the heart`.

Removed **only** as the final hyphen-prefixed suffix, so all of these keep their numbers:
`Top 10 cats`, `2024 highlights`, `Title 123456789` (nine digits), `Title 1234567890 extra` (not at
the end), `Title1234567890` (no preceding hyphen).

**Written as deterministic character scanning — no `Regex(`, no `replace(`, no `split(`.** That was a
choice, and it is why the D4C guard is *narrowed rather than weakened*: every mechanism it banned is
still banned inside the policy, and the guard gained two positive pins (the named digit constant and
the literal `character in '0'..'9'` range). ASCII-only digits are themselves the safety property — a
title in Arabic-Indic numerals must not be truncated as if it were a download ID.

Hyphen-collapse and whitespace-collapse happen in **one pass**, or `a--  --b` would briefly become
three spaces and depend on a second rule to fix it.

## Schema decision: 11, unchanged

Where the user is standing and which chip they tapped are session state, not durable evidence. A
migration whose only purpose was to remember a scroll offset would have put an opinion about the
current screen into a database whose whole job is evidence about media. `D5BSurfaceTest` asserts
`version = 11`, the absence of `MIGRATION_11_12`, and the absence of `12.json`.

## Tests and exact results

```
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline testDebugUnitTest      # 1439 tests / 99 classes, 0 failures
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline lint                   # No issues found
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebug          # success
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebugAndroidTest  # success (compiled only)
git diff --check                                                          # clean
```

New: `AppBackPolicyTest`, `MediaKindFilterTest`, `ImageZoomPolicyTest`, `D5BSurfaceTest`.

**Re-scoped, not deleted** — the pattern since D4C:

- `D3B141SurfaceTest`'s "durable navigation state, not a flag" now asserts the real fact it was a
  proxy for. Ban on an in-memory boolean kept; a route-shape ban added beside it.
- `D3B142SurfaceTest` and `D3B15SurfaceTest` follow the renamed cluster argument
  (`isDashboardDrillDown` -> `backAvailable`) and the renamed string (`back_to_dashboard` ->
  `nav_back`), and D3B142 gained a ban on any Back control being wired to `navigateToDashboard`.
- `DashboardTilesTest` lost four drill-down tests with the object.
- `D4ASurfaceTest`'s filter guard now pins `underFilters(routable/attention, filter, mediaFilter)`.
- `D4CSurfaceTest`'s caption marker list, as described above.
- `TelegramCaptionPolicyTest`'s two "survives verbatim" cases now assert the transformations.

**Known flake, pre-existing:** `TelegramMediaRepairGatewayTest > a body that did not finish is
incomplete, so a retry is safe` still fails occasionally and passes on rerun (MockWebServer
`DISCONNECT_DURING_REQUEST_BODY` timing). It did not fire this session. **Do not copy that fixture
into a new test.**

## APK identity (debug development signing only)

| Field | Value |
| --- | --- |
| Package | `com.funzi7.telegramtopicuploader` |
| Version | code 23, name `0.11.0-d5b` |
| minSdk / targetSdk / compileSdk | 23 / 37 / 37 |
| Permissions | `INTERNET`, `ACCESS_NETWORK_STATE`, `RUN_USER_INITIATED_JOBS`, `POST_NOTIFICATIONS` — **unchanged** |
| Application components | 1 exported launcher activity, 1 non-exported `BatchUploadJobService` — **unchanged** |
| Path | `app/build/outputs/apk/debug/app-debug.apk` |
| Size | 15,201,065 bytes |
| SHA-256 | `f07ddb0a5a483f47e8321c59d1b4e71625db64c7f315024c52f53369666c5190` |
| Signer | `CN=Android Debug, O=Android, C=US`, RSA 2048, cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` |
| Schemes | v1 JAR yes, v2 yes (v3/v3.1/v4 not used) |

Signer unchanged, so it installs **over** D5A without an uninstall. Schema does not move, so no
migration runs.

## Agent-observed vs user-reported

**Agent-observed:** every test result, the lint result, both assemblies, the merged manifest, the APK
identity, and the schema decision.

**User-reported only:** the D5A hardware evidence above (checks 1–3 and the Back defect), the global
Back rule, and the three D5B feature requests.

## Device-untested boundaries

Nothing in D5B ran on a device or emulator. Unverified on hardware: that Back returns to the exact
Directories item and offset; that the visible arrow and the system gesture behave identically; that a
Dashboard drill-down pops one level at a time; that a rotation on a nested screen keeps the
destination; that the three filter chips read correctly in Hebrew; that a pinch feels right under a
real finger; and that a real 9GAG upload arrives with the cleaned caption and the original filename.
Instrumentation suites compile but were not run; no device was attached.

**D5A checks beyond 1–3 remain ongoing and are validated by nothing here.** Everything unvalidated
after D4B and D4C stays unvalidated.

## Next device action (ask for exactly this)

`docs/D5B_DEVICE_CHECKLIST.md`. Steps 2, 3 and 5 are the point of the milestone: Back from a folder
page must return to the same Directories position, the gesture must behave identically, and the
drawer case landing on the Dashboard is **intended** and should not be reported as the old defect.

**Do not re-run the full D5A checklist.** Ask only that its remaining checks continue during ordinary
use, and that only failures or surprises are reported. Do not ask for token setup, multi-topic
binding, old repair checks, or historical Dashboard regression.

## Roadmap after D5B

1. Whatever the device reports about Back, the filters, the zoom, and the 9GAG caption.
2. The rest of the D5A checklist as it is exercised: albums, Ignored/Restore across a rescan, manual
   permanent deletion, pull-to-refresh everywhere, destination popularity, same-name sibling safety.
3. Still owed from D4B/D4C: deletion retries, batch deletion, blocked deletion states, the launch
   scan, the Hebrew Preview.
4. Optional content-based topic *suggestions* on Review (never automatic routing).
5. Only after that is proved on hardware: high-confidence automatic routing, strictly opt-in.
6. **Explicitly not on the roadmap: per-account mapping.** The user has ruled it out.
7. Still open from before: result-unknown reconciliation that never re-sends without evidence
   (including a *manual* repair-retry design), and evidence-based resolution of an unowned or
   ambiguous legacy reservation (D3A.1).

## Process rules the user set

- **Do not ship a single-hotfix build on its own**; fold it into the next substantive milestone. D5B
  is exactly this: the Back defect shipped together with the filters, the zoom and the caption.
- **Mandatory stop-and-ask UX gate**: inspect the implementation *first*, then ask one grouped
  question with numbered options, short practical consequences, and **no preselected default**, and
  stop until answered. D4B raised two, D4C three, D5A four, D5B one. All were answered before any file
  was edited.
- Do not introduce another binding command alias or syntax without asking first.
- **Every requested item must appear in `TODO.md` with an explicit status** — completed, deliberately
  deferred, blocked, or device-untested. Nothing dropped silently.

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at
  `/opt/android-sdk/aapt2-wrapper/aapt2`.
- `apksigner` at `/opt/android-sdk/build-tools/36.0.0/apksigner`; `verify --print-certs -v` gives DN,
  cert SHA-256, key algorithm/size, and which schemes verified, in one call.
- **`lint` takes ~2.5 minutes.** Run it in the background and do other work meanwhile.
  `app/build/reports/lint-results-debug.txt` says "No issues found." when clean.
- **`dexdump` crashes (Illegal instruction)** — use `strings` over extracted `classes*.dex`.
- **The offline Gradle cache has no media3, ExoPlayer, Coil, Glide, Picasso, DataStore, and no
  `androidx.exifinterface`.** D5B needed none of them: pinch-zoom is `detectTransformGestures` +
  `graphicsLayer` from the Compose foundation already present.
- **Lint's `UnusedResources` will fail the 0-issue bar** for any string added but never referenced.
  Delete from **both** locales; `LocalizationResourcesTest` compares key sets exactly. D5B added five
  (`nav_back`, three `media_kind_filter_*`, `preview_image_zoom`) and removed one
  (`back_to_dashboard`).
- **A removed string may be pinned by an old surface test.** `back_to_dashboard` was pinned by value
  in both `D3B141SurfaceTest` and `D3B142SurfaceTest`; both had to be re-scoped in the same change.
- **A `codeOf()`-stripped source still contains the package name**, and
  `com.funzi7.telegramtopicuploader` contains the substring `upload`. A purity guard banning the bare
  word `upload` will always fail — ban `uploadJob`, `sendPhoto`, `deleteDocument` and similar instead.
  Likewise, counting `detectTransformGestures` catches the **import line** too; count
  `detectTransformGestures {`.
- **A source-shape guard must strip comments** (`codeOf()`), and several older guards do **not**.
- **The version literal is pinned in SIX surface tests**: `D3B15`, `D3B2`, `D4A`, `D4B`, `D4C`, `D5A`.
  Every bump must update all of them. The **schema** literal is pinned in `D3A`, `D3B2`, `D4A`, `D4B`,
  `D4C`, `D5A` and now `D5B`.
- No Robolectric/mockito: prove UI rules by extracting them into pure objects and asserting shapes.
  D5B is the clearest example yet — `AppBackPolicy`, `MediaKindFilter` and `ImageZoomPolicy` exist in
  that shape precisely so navigation, filtering and gesture maths are JVM-testable.
- Kotlin property initializers run in declaration order: a `StateFlow` whose `combine`/`flatMapLatest`
  touches another property must be declared **after** it.
- Room's SQL parser rejects a correlated subquery in a projection; split it and compose in Kotlin.

## Deployment declaration

Nothing was deployed, installed, or run on a device or emulator in the D5B session. **No real Telegram
request of any kind was made** — no `sendVideo`, no `sendPhoto`, no `sendDocument`, no
`sendMediaGroup`, no `editMessageMedia`, no `getUpdates`, no send. No forum topic was created,
renamed, closed, or deleted; no binding was written against a real group. **No media file was
uploaded, moved, renamed, copied, downloaded, quarantined, or deleted**, and no real document was
opened for writing on any path. No real file name was read, recorded, or used as a test fixture:
every name in the test suite is synthetic.
