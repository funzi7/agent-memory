# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D3B1.4.2 — keep the drawer Menu icon in one fixed top-app-bar position on every screen |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `747e0994198f73c0f4ad535a62f1f830dfcb391c` (D3B1.4.1) |
| Version | code 15 -> 16, name `0.5.5-d3b1.4.1` -> `0.5.6-d3b1.4.2` |
| Room schema | **stays 7.** No entity, index, DAO statement, or schema JSON touched |
| Deployment | None. Not installed or run on any device or emulator in this session |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, file name, content URI, document ID, path, or media hash
was requested, used, or recorded anywhere, including this file.

## New user-reported device evidence (D3B1.4.1 on hardware; not observed by any agent)

- D3B1.4.1 was installed and run on the user's Android device.
- The redundant visible tile sentence was **removed successfully**.
- Dashboard drill-down **Back navigation worked**.
- Selecting **Dashboard** from the drawer opened the **real Dashboard**.
- Selecting **History** from the drawer opened **unfiltered History**.
- Dashboard **pull-to-refresh worked**.
- One defect remained, visual and navigational: when a Back arrow is present, the drawer **Menu icon
  moves from its normal fixed edge to the opposite side of the TopAppBar**.
- The user asked that the Menu icon stay in the same position on every screen, and suggested Back might
  go below it. A standard compact same-row arrangement was implemented instead; inspection showed the
  stacked layout was not necessary.
- Every other D3B1.4.1 behaviour the user was asked to check therefore passed.

## Confirmed cause of the icon shift

D3B1.4.1's top bar rendered **Back in `navigationIcon`** and **Menu in `actions`**. `navigationIcon` is
the start edge and `actions` is the end edge, so a drill-down moved Menu the full width of the bar.
It is worst in RTL, where the start edge is the right edge and Menu is the primary thumb target.

## What D3B1.4.2 implements

**One fixed-position leading cluster.** `navigationIcon` now holds a
`Row(verticalAlignment = Alignment.CenterVertically)` rendering
`TopBarLeadingCluster.controls(isDashboardDrillDown)` — `[MENU]` on an ordinary top-level screen,
`[MENU, BACK]` on a drill-down. Menu is always the first child, so it holds the identical physical
position on every screen: **leftmost in LTR, rightmost in RTL**. Back is appended immediately beside it
toward the title (right of Menu in LTR, left of Menu in RTL) and stays
`Icons.AutoMirrored.Filled.ArrowBack`. Positioning is layout-direction-aware by construction (`Row`
lays out start-to-end; the app bar places the slot with `placeRelative`), so there is no mirrored
special case.

**The `actions` parameter is removed from the `TopAppBar` call entirely.** Exactly one
`Icons.Default.Menu` and one `ArrowBack` now exist in the whole file, so no drill-down Menu can survive
at the end edge.

**Both controls stay independent `IconButton`s** — separate 48 dp touch targets, ripple, focus, and
content descriptions (`open_navigation`, `back_to_dashboard`). Menu opens the drawer; Back calls
`navigateToDashboard()`. No `Column`, no `Box` overlay, no `offset`, no negative padding, no absolute
alignment, no `LayoutDirection` branch, no app-bar height customization. The bar's own measurement
moves the title inward for two leading controls (title x = `max(TopAppBarTitleInset, navIcon.width)`),
so nothing overlaps or is clipped on an ordinary screen.

**New pure rule.** `ui/TopBarLeadingCluster.kt` holds `enum class TopBarLeadingControl { MENU, BACK }`
and `object TopBarLeadingCluster.controls(isDashboardDrillDown: Boolean): List<TopBarLeadingControl>`.
Extracting the order makes "Menu comes first" a real unit-tested fact instead of a shape grepped out of
layout code — the same approach `DashboardDrillDown` already takes.

**No navigation behaviour changed.** `navigateToDashboard`, `navigateToTopLevel`, drawer absoluteness,
unfiltered drawer destinations, **Show all**, system Back, `PullToRefreshBox`, the canonical counts, and
`RETIRED` are untouched, and the D3B1.4.2 surface test re-asserts each of them.

## Files touched

New: `ui/TopBarLeadingCluster.kt`; tests `ui/TopBarLeadingClusterTest.kt` and
`security/D3B142SurfaceTest.kt`. Modified: `ui/TelegramTopicUploaderApp.kt` (navigationIcon Row,
`actions` removed, `Row`/`Alignment` imports), `app/build.gradle.kts` (16 / `0.5.6-d3b1.4.2`),
`security/D3B141SurfaceTest.kt` (its two assertions pinning the superseded two-slot arrangement — a
Menu in `actions`, two Menu icons — and its version literal were replaced; every other D3B1.4.1
guarantee kept). Docs: README, TODO, ARCHITECTURE, PROJECT_STATE, RELEASE_REVIEW, SECURITY,
D3B1_DEVICE_CHECKLIST.

## Tests and exact results

| Check | Result |
| --- | --- |
| `--offline testDebugUnitTest` | **776 tests / 66 classes, 0 failures, 0 errors, 0 skipped** (D3B1.4.1: 762/64) |
| `--offline lint` | **0 issues** (empty `<issues>`) |
| `--offline assembleDebug` / `assembleDebugAndroidTest` | passed |
| Instrumentation | compiles, **not run** (no device attached) |
| Room schema | stays **7**; no schema JSON changed |
| `git diff --check` | clean |

Key new tests. **`TopBarLeadingClusterTest` (pure):** an ordinary screen yields `[MENU]`; a drill-down
yields `[MENU, BACK]`; Menu leads in both **and its index does not change when Back appears**; Back is
immediately after Menu; Back never appears on an ordinary screen; neither control is duplicated; the
result is stable across repeated calls and covers every enum value. **`D3B142SurfaceTest`:** exactly one
Menu icon in the file, inside `navigationIcon`; `actions = {` appears nowhere; exactly one auto-mirrored
Back arrow, in the same slot, **after** Menu; the slot is a `Row(verticalAlignment =
Alignment.CenterVertically)` driven by `TopBarLeadingCluster.controls(isDashboardDrillDown)`; two
independent `IconButton`s with the drawer and `navigateToDashboard()` callbacks and two distinct
`contentDescription`s; the title is still the plain destination label; no `Column`, `Box`, `offset`,
`absoluteOffset`, `absolutePadding`, `AbsoluteLeft/Right/Alignment`, `Arrangement.Absolute`,
`LayoutDirection.Ltr/Rtl`, `zIndex`, `Modifier.layout`, `SubcomposeLayout`, negative dp, or
`height(`/`heightIn(`/`windowInsets =`/`expandedHeight`/`TopAppBarDefaults`; the D3B1.4.1 helpers,
absence of `restoreState`/`saveState = true`, **Show all**, `PullToRefreshBox`, and the removed tile
sentence intact; version 16 / `0.5.6-d3b1.4.2`; schema 7 with no `8.json`; four permissions, one
service, no receiver, `usesCleartextTraffic=false`, `allowBackup=false`; exact EN/HE key parity with
both control descriptions present, non-blank, and distinct. **Regression:** the whole D3B1.4 / D3B1.4.1
suite is otherwise unchanged and green.

Note: a forbidden-token scan of the app file must **strip `//` comment lines first** — the new
navigationIcon comment legitimately contains the words "offset" and "negative padding".

## APK identity (debug development signing only)

- Main APK `app/build/outputs/apk/debug/app-debug.apk`: **14,410,310 bytes**, SHA-256
  `41d19eddbd66c7f2201aecf579cf7a3307f04b64b544b740842f967f415a453b`.
- Instrumentation APK: 1,579,572 bytes, SHA-256
  `bd7195cca8f8e7cfdec7ffbd0a17a92af870b4a79346bb32c379047445f9ab4b` (unchanged since D3B1.4).
- Package `com.funzi7.telegramtopicuploader`; versionCode 16; versionName `0.5.6-d3b1.4.2`; minSdk 23;
  compile/target SDK 37; cleartext false; backup false.
- AAPT2 permissions: INTERNET, ACCESS_NETWORK_STATE, RUN_USER_INITIATED_JOBS, POST_NOTIFICATIONS (+
  AndroidX `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`). Merged manifest: one non-exported
  `platform.BatchUploadJobService` with `BIND_JOB_SERVICE`, one exported `MainActivity`; no application
  receiver (`androidx.room.MultiInstanceInvalidationService`, `androidx.startup.InitializationProvider`,
  and `androidx.profileinstaller.ProfileInstallReceiver` are library components, unchanged).
- Debug cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` — matches the
  expected value and every earlier build, so it updates over D3B1.4.1 in place.

## Untested device boundary

The D3B1.4.2 APK has **never** been installed, updated over D3B1.4.1, launched, or run. That the Menu
icon holds its physical position on the user's hardware, in the user's layout direction, is **unproven**
in this session; every guarantee above comes from JVM tests and source-shape assertions, and no Compose
UI test executes on a device here. This task added no network code path, no media access, and no file
mutation at all — its whole surface is one Compose layout slot — so the two old blank 0:00 posts remain
untouched.

## Next device action (ask for exactly this, nothing more)

1. Install `0.5.6-d3b1.4.2` over D3B1.4.1 **without uninstalling**.
2. Note the Menu icon's position on the Dashboard.
3. Tap **Completed**.
4. Confirm Menu is in exactly the same edge position.
5. Confirm Back appears immediately beside it, toward the title.
6. Confirm Menu opens the drawer.
7. Confirm Back returns to the Dashboard.
8. Confirm an ordinary top-level screen shows Menu only.

Do not ask the user to retest pull-to-refresh, counts, retirement, uploads, Telegram delivery, setup,
or folder scans.

## D3B1.5 roadmap — in-place Telegram video presentation repair (not started)

The two blank 0:00 posts from D3B1.2 are still in the topic; D3B1.4, D3B1.4.1, and D3B1.4.2 all leave
them alone. D3B1.5 should add an explicit **Repair Telegram video presentation** action from confirmed
History: operate only on a positive stored Telegram message ID sent by this bot; use `editMessageMedia`
to replace that same message in place; reuse the D3B1.3 compatibility probe, duration, dimensions, and
thumbnail; never create a duplicate automatically; require the source media to still exist and still
match its canonical hash; never retry a result-unknown edit automatically.

**D3B1.5 in-place Telegram presentation repair remains next. Multi-topic binding in one session
remains the next product feature after D3B1.5.**

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at
  `/opt/android-sdk/aapt2-wrapper/aapt2`; `apksigner` in `/opt/android-sdk/build-tools/37.0.0`.
- **`dexdump` crashes (Illegal instruction) in this sandbox** — use `strings` over extracted
  `classes*.dex` for DEX marker checks.
- Merged manifest lives at
  `app/build/intermediates/merged_manifest/debug/processDebugMainManifest/AndroidManifest.xml`; parse it
  with `xml.etree` rather than grepping, since component attributes span lines.
- Material 3 `TopAppBar` places its `navigationIcon` with `placeRelative` and puts the title at
  `max(TopAppBarTitleInset, navigationIcon.width)`, so a wider leading cluster moves the title inward
  and RTL is handled by the framework. A `Row` inside `navigationIcon` is the supported way to show two
  leading controls without touching the bar's height.
- Compose BOM `2026.06.01` resolves material3 to **1.4.0**, which has
  `androidx.compose.material3.pulltorefresh.{PullToRefreshBox, PullToRefreshDefaults,
  rememberPullToRefreshState}` — all `@ExperimentalMaterial3Api`. `material-icons-core` 1.7.8 has
  `Icons.AutoMirrored.Filled.ArrowBack`. Verify an API by unzipping the AAR from
  `/root/.gradle/caches/modules-2/files-2.1/…` and running `javap` on `classes.jar`; the sandbox is
  offline so a wrong guess costs a full failed build.
- In a `security/*SurfaceTest`, `projectFile("build.gradle.kts")` is ambiguous — the repo root has one
  too. Use `sequenceOf(File("app/build.gradle.kts"), File("build.gradle.kts"))`. Also never call
  `projectFile` on a path expected **not** to exist: it ends in `.first { it.exists() }` and throws.
- Keep the *current* `versionCode`/`versionName` literal in the **newest** release's surface test only;
  older ones should assert the stable package identity instead, or every release breaks them.
- A source-shape test that forbids tokens must strip `//` comment lines, or prose describing a rejected
  hack reads as the hack itself.
- `Bitmap.createScaledBitmap` trips lint `UseKtx`; use `androidx.core.graphics.scale`.
- `flatMapLatest` needs `@OptIn(ExperimentalCoroutinesApi::class)` in coroutines 1.11.
- No Robolectric/mockito: UI guarantees are proved with pure logic (e.g. `DashboardDrillDown`,
  `TopBarLeadingCluster`) plus source-shape assertions in `security/*SurfaceTest`, and Room behaviour in
  compiled-only androidTest. Prefer extracting any new UI rule into a pure object so it can be tested
  for real.
- Lint's `PluralsCandidate` fires on `%d` followed by a word; put the count at the end of the string.
- Each repository test file declares its own private `MutableList<T>.replaceWith` helper.

## Remaining D3B work (not started)

- **D3B1.5 in-place presentation repair** (above).
- **D3B2 immediate cancellation** of the in-flight multipart request (replaces stop-after-current).
- Result-unknown reconciliation that never re-sends without evidence. D3B1.4 *surfaces* contradictory
  and unproven-confirmation rows under Needs review but resolves neither.
- Evidence-based resolution of an unowned/ambiguous legacy reservation (D3A.1 blocker).
- Safe-deletion stage gated on a confirmed positive Telegram message ID.
- A truly background notification stop action.
- Optional future conversion stage (unsupported media → H.264/AAC); nothing transcodes today.

## Deployment declaration

Nothing was deployed, distributed, installed, or run on a device or emulator in the D3B1.4.2 session.
No real Telegram request of any kind was made, no forum topic was created/renamed/closed/deleted, and
no media was uploaded, moved, renamed, copied, downloaded, quarantined, or deleted. This task added no
network code path, no media access, and no persistence change: its whole surface is the arrangement of
two existing icons in one Compose layout slot. The two existing Telegram posts are never automatically
resent.
