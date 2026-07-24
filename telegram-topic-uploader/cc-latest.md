# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D3B1.4.1 — remove the redundant visible tile sentence, give Dashboard drill-downs a Back arrow, make the drawer Dashboard entry absolute, and add a local-only Dashboard pull-to-refresh |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `088cf7d6fd110ae9c3e391f4f1dc223635724a8c` (D3B1.4) |
| Version | code 14 -> 15, name `0.5.4-d3b1.4` -> `0.5.5-d3b1.4.1` |
| Room schema | **stays 7.** No entity, index, DAO statement, or schema JSON touched |
| Deployment | None. Not installed or run on any device or emulator in this session |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title, forum
topic name, private link, binding command, file name, content URI, document ID, path, or media hash
was requested, used, or recorded anywhere, including this file.

## New user-reported device evidence (D3B1.4 on hardware; not observed by any agent)

- D3B1.4 was installed and run on the user's Android device.
- The Dashboard then displayed **one queued** item and **five completed** items.
- The rejected sample item was **successfully removed** using **Remove from queue**.
- After that removal the Dashboard displayed **zero queued** items and **one cancelled-or-retired**
  item.
- The sample item appeared under the **cancelled-or-retired** grouping.
- The D3B1.4 canonical count model and the safe `RETIRED` removal are therefore **user-validated**.
- The user reported three remaining UI defects:
  - the visible "Open list" / "פתיחת הרשימה" sentence on every Dashboard tile is unnecessary;
  - a filtered screen opened from a Dashboard tile has no visible Back button;
  - selecting Dashboard from the navigation drawer can restore the current filtered History/list
    screen instead of navigating to the Dashboard itself.
- The user requested **pull-to-refresh** on the Dashboard.
- **No claim** is made about Telegram traffic or source-file mutation during this UI validation,
  because the user did not report those details in this message.

## Root cause of the two navigation defects

Filtered and unfiltered Queue/Review/History are the **same `NavDestination`** — one composable
registered as `<route>?group={group}` — so:

1. the top bar could not tell a drill-down from a tab and kept showing the drawer Menu icon; and
2. `popUpTo(start) { saveState = true }` + `restoreState = true` saved a back stack **under that
   destination**, and the saved entry was the filtered one. Selecting Dashboard (or History) from the
   drawer could therefore restore the `?group=` entry the user was trying to leave.

## What D3B1.4.1 implements

**Tile surface.** `DashboardTileCard` renders only the group label and the count; the third `Text`
reading `R.string.dashboard_tile_open` is gone and the string is deleted from `values` and
`values-iw`. `Card(onClick=…)`, `Role.Button`, the ripple/focus behaviour, and the action-aware
`dashboard_tile_action` description (label + count) are unchanged; a zero-count tile is still enabled.

**Drill-down detection.** New `DashboardDrillDown.isDrillDown(routePath, groupArgument)` in
`ui/DashboardTiles.kt` — pure, unit-testable, over durable navigation state only. True iff the path is
`queue`/`review`/`history` **and** the group argument is non-null. **Show all** clears only the
`rememberSaveable` display filter, never the nav argument, so the origin survives it.

**Top bar.** `TelegramTopicUploaderApp` computes `isDashboardDrillDown` from
`backStackEntry?.arguments?.getString(DashboardTile.GROUP_ARGUMENT)`. Drill-down →
`Icons.AutoMirrored.Filled.ArrowBack` in `navigationIcon` with `R.string.back_to_dashboard`, plus a
Menu `IconButton` in `actions`. Top-level → the existing Menu navigation icon, no Back arrow, empty
actions. No list body has a Back button.

**Two private nav helpers.** `NavController.navigateToDashboard()`: no-op if already on `dashboard`;
else `popBackStack("dashboard", inclusive = false)`; else `navigate` with `launchSingleTop = true`,
`restoreState = false`, `popUpTo(start) { saveState = false }`.
`NavController.navigateToTopLevel(destination)`: delegates DASHBOARD to the above; no-op if already on
that destination *unfiltered*; else navigates to the bare route with the same options. Every drawer
entry and both batch-notification deep links go through `navigateToTopLevel`. **`restoreState = true`
and `saveState = true` no longer appear anywhere in the file** — that is the actual fix, and a surface
test pins it.

**Pull-to-refresh.** `MainViewModel` gains `private val dashboardRefreshMutex = Mutex()`,
`dashboardRefreshing: StateFlow<Boolean>`, and `refreshDashboard()`:
`if (!tryLock()) return@launch` → set true → `stateRepairRepository.reconcileDurableState()` →
`catch CancellationException { throw }` / `catch Exception { ACTION_FAILED }` → `finally { false;
unlock() }`. `DashboardScreen(counts, isRefreshing, onRefresh, onOpenTile)` wraps the existing
`LazyVerticalGrid` in `PullToRefreshBox` with a `PullToRefreshDefaults.Indicator` carrying
`R.string.dashboard_refresh` as its content description; the grid keeps `fillMaxSize()` so a short
page is still draggable. **material3 1.4.0 from the Compose BOM 2026.06.01 already in the build — no
new dependency was added.** `Icons.AutoMirrored.Filled.ArrowBack` is in the existing
`material-icons-core` 1.7.8.

## Files touched

New: `ui/DashboardTiles.kt` gained `object DashboardDrillDown`; test
`security/D3B141SurfaceTest.kt`. Modified: `ui/Screens.kt` (tile sentence removed, `PullToRefreshBox`,
new imports incl. `Alignment` and `ExperimentalMaterial3Api`), `ui/TelegramTopicUploaderApp.kt` (top
bar, two nav helpers, drawer, deep links, refresh wiring), `ui/MainViewModel.kt` (`Mutex`,
`dashboardRefreshing`, `refreshDashboard`), `res/values{,-iw}/strings.xml` (`dashboard_tile_open`
removed; `dashboard_refresh` and `back_to_dashboard` added), `app/build.gradle.kts` (15 /
`0.5.5-d3b1.4.1`). Tests updated: `ui/DashboardTilesTest`, `ui/MainViewModelTest` (the fake catalog now
exposes a settable `counts` flow; `RecordingStateRepairRepository` gained `gate`/`failNext`/
`cancelNext`), `security/D3B14SurfaceTest` (dropped `dashboard_tile_open` from its required-key list).
Docs: README, TODO, ARCHITECTURE, PROJECT_STATE, RELEASE_REVIEW, SECURITY, D3B1_DEVICE_CHECKLIST.

## Tests and exact results

| Check | Result |
| --- | --- |
| `--offline testDebugUnitTest` | **762 tests / 64 classes, 0 failures, 0 errors, 0 skipped** (D3B1.4: 743/63) |
| `--offline lint` | **0 issues** (empty `<issues>`) |
| `--offline assembleDebug` / `assembleDebugAndroidTest` | passed |
| Instrumentation | compiles, **not run** (no device) |
| Room schema | stays **7**; no schema JSON changed |
| `git diff --check` | clean |

Key new tests. **Tile surface:** no `R.string.dashboard_tile_open` reference remains; label and count
still rendered; `Role.Button` + `dashboard_tile_action(label, value)` + `contentDescription =
description` intact; nothing disables a tile by its count; the key is absent from **both** locales and
EN/HE parity is exact. **Drill-down:** all eight dashboard-origin routes are drill-downs; all three
unfiltered drawer-origin routes are not; `dashboard`/`settings`/`directories`/`topics`/`null` are not;
a group argument on a non-filterable route is still not; the un-stripped route pattern
`history?group={group}` is not; **Show all** keeps the origin. **Top bar:** exactly one
`Icons.AutoMirrored.Filled.ArrowBack` and exactly two `Icons.Default.Menu` in the app file, none in
`Screens.kt`; Back calls `navigateToDashboard()`. **Drawer:** the helpers exist with the documented
pop/no-op shape; `restoreState = true` and `saveState = true` appear nowhere; both `= false` forms
appear exactly twice. **Refresh:** one pass per pull with zero scan/upload/batch calls; indicator true
only while a gated pass runs; three pulls during a pass yield no second transaction and the gate
reopens; failure → `ACTION_FAILED` + indicator cleared + gate released; cancellation → rethrown, no
notice, indicator cleared, gate released; `DashboardCounts` unchanged across a refresh and still the
one observed flow; the function body references no scan/upload/batch launcher, gateway, stream,
`delay(`, or `DashboardCounts(`. **Regression:** the whole D3B1.4 suite is unchanged and green.

## APK identity (debug development signing only)

- Main APK `app/build/outputs/apk/debug/app-debug.apk`: **14,410,326 bytes**, SHA-256
  `8d75aa18b0fe4a8e36d950c54957c51122606ddfeac0ce21c6966d46f05a40f1`.
- Instrumentation APK: 1,579,572 bytes, SHA-256
  `bd7195cca8f8e7cfdec7ffbd0a17a92af870b4a79346bb32c379047445f9ab4b` (unchanged from D3B1.4).
- Package `com.funzi7.telegramtopicuploader`; versionCode 15; versionName `0.5.5-d3b1.4.1`; minSdk 23;
  compile/target SDK 37; cleartext false; backup false.
- AAPT2 permissions: INTERNET, ACCESS_NETWORK_STATE, RUN_USER_INITIATED_JOBS, POST_NOTIFICATIONS (+
  AndroidX `DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION`). One non-exported
  `platform.BatchUploadJobService` with `BIND_JOB_SERVICE`; no application receiver (the merged
  manifest's `androidx.room.MultiInstanceInvalidationService` and
  `androidx.profileinstaller.ProfileInstallReceiver` are library components, unchanged).
- Debug cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` — matches the
  expected value and every earlier build, so it updates over D3B1.4 in place.

## Untested device boundary

The D3B1.4.1 APK has **never** been installed, updated over D3B1.4, launched, or run. Every guarantee
above comes from JVM tests and source-shape assertions; no Compose UI test executes on a device here.
Real-touchscreen behaviour of the pull gesture — including RTL, an under-filled grid, and a drag begun
over a tile — and the actual Back/drawer behaviour on hardware are **unproven** in this session. The
refresh performs no Telegram request, media read, or file mutation anywhere in its code path, so the
two old blank 0:00 posts remain untouched.

## Next device action (ask for exactly this, nothing more)

1. Install `0.5.5-d3b1.4.1` over D3B1.4 **without uninstalling**.
2. Confirm the visible "Open list" sentence is gone from every tile.
3. Tap **Completed** and confirm a Back arrow appears.
4. Tap Back and confirm it returns to the Dashboard.
5. Enter **Completed** again, open the drawer, tap **Dashboard**, confirm the actual Dashboard opens.
6. Enter **Completed** again, open the drawer, tap **History**, confirm unfiltered History opens.
7. Pull down on the Dashboard; confirm the indicator completes without starting a scan or upload.
8. Confirm the counts remain Queued 0, Completed 5, Cancelled/removed 1 unless new work was created.

Do not ask the user to upload another video, rescan folders, rebind topics, test permissions, or
repeat the safe-retirement flow.

## D3B1.5 roadmap — in-place Telegram video presentation repair (not started)

The two blank 0:00 posts from D3B1.2 are still in the topic; neither D3B1.4 nor D3B1.4.1 touches them.
D3B1.5 should add an explicit **Repair Telegram video presentation** action from confirmed History:
operate only on a positive stored Telegram message ID sent by this bot; use `editMessageMedia` to
replace that same message in place; reuse the D3B1.3 compatibility probe, duration, dimensions, and
thumbnail; never create a duplicate automatically; require the source media to still exist and still
match its canonical hash; never retry a result-unknown edit automatically.

**D3B1.5 in-place Telegram presentation repair remains next. Multi-topic binding in one session
remains the next product feature after D3B1.5.**

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at
  `/opt/android-sdk/aapt2-wrapper/aapt2`; `apksigner` in `/opt/android-sdk/build-tools/37.0.0`.
- **`dexdump` crashes (Illegal instruction) in this sandbox** — use `strings` over extracted
  `classes*.dex` for DEX marker checks.
- Compose BOM `2026.06.01` resolves material3 to **1.4.0**, which has
  `androidx.compose.material3.pulltorefresh.{PullToRefreshBox, PullToRefreshDefaults,
  rememberPullToRefreshState}` — all `@ExperimentalMaterial3Api`. `material-icons-core` 1.7.8 has
  `Icons.AutoMirrored.Filled.ArrowBack`. Verify an API by unzipping the AAR from
  `/root/.gradle/caches/modules-2/files-2.1/…` and running `javap` on `classes.jar`; the sandbox is
  offline so a wrong guess costs a full failed build.
- In a `security/*SurfaceTest`, `projectFile("build.gradle.kts")` is ambiguous — the repo root has one
  too. Use `sequenceOf(File("app/build.gradle.kts"), File("build.gradle.kts"))`. Also never call
  `projectFile` on a path expected **not** to exist: it ends in `.first { it.exists() }` and throws.
- `Bitmap.createScaledBitmap` trips lint `UseKtx`; use `androidx.core.graphics.scale`.
- `flatMapLatest` needs `@OptIn(ExperimentalCoroutinesApi::class)` in coroutines 1.11.
- No Robolectric/mockito: UI guarantees are proved with pure logic (e.g. `DashboardDrillDown`) plus
  source-shape assertions in `security/*SurfaceTest`, and Room behaviour in compiled-only androidTest.
  Prefer extracting any new UI rule into a pure object so it can be tested for real.
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

Nothing was deployed, distributed, installed, or run on a device or emulator in the D3B1.4.1 session.
No real Telegram request of any kind was made, no forum topic was created/renamed/closed/deleted, and
no media was uploaded, moved, renamed, copied, downloaded, quarantined, or deleted. This task added no
network code path at all: its whole surface is Compose navigation, one Compose gesture, and a call to
an existing local Room reconciliation. The two existing Telegram posts are never automatically resent.
