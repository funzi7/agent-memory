# Telegram Topic Uploader — latest handoff

> **`chat-handoff.md`, beside this file, is the canonical cross-chat bootstrap.** A brand-new
> managing conversation reads that first and this second. **Every future milestone must update
> both**, and from D6A also `/root/work/agent-memory/telegram-remote-sources/cc-latest.md`.
>
> **When the user supplies SHAs, read agent-memory before responding**, verify each against
> `origin/main`, and only then answer. A supplied SHA is a claim to verify, never a fact to repeat.

## Task and repository state

| Field | Value |
| --- | --- |
| Task | **D6A5** — confirmed-versus-queued, a manual deletion that reaches the provider, five platforms, and four device findings added mid-milestone |
| Application repository | `/root/work/telegram-topic-uploader` |
| Server repository | `/root/work/telegram-remote-sources` — **changed, committed and pushed before the interruption** |
| Starting application HEAD | `55fbd5b` (D6A4) |
| **Final application HEAD** | **`4e36dcc7ef23266fce772910e319d141c6916ccc`** (`4e36dcc`) |
| Starting server HEAD | `ffab607` (D6A4) |
| **Final server HEAD** | **`cb0174765306f429225b299845d6f11456dc666d`** (`cb01747`) |
| Version | code 29 → **30**, name `0.13.4-d6a4` → **`0.13.5-d6a5`** |
| Room schema | **12 → 12. Unchanged.** No migration runs. |
| Deployment | **Done. `cb01747` is deployed, healthy, and reports its own commit.** See below. |

No production token, Telegram identifier, chat ID, thread ID, private link, VPS address, Tailscale
hostname, SSH host, pairing code, device token, cookie, account name, file name, content URI or
media hash is recorded anywhere in this file.

## Post-D6A5 hardware result — the oldest defect in this project is closed

**Reported by the user on 2026-07-27, after D6A5 was installed.**

- `0.13.5-d6a5` / versionCode **30** was installed over the existing app, and **the Settings version
  row was read on the device.** That is simultaneously the proof the install took and the hardware
  verification of the D6A5 About row.
- **Manual permanent deletion without upload now SUCCEEDS on the physical device.** The source
  disappeared from **both the application and the Android file manager** — checked outside the app,
  which is the only evidence that counts for a deletion.

**This closes the defect the project has been chasing since D6A.** It was "fixed" in D6A, again in
D6A2, again in D6A3, diagnosed correctly in D6A4, and actually fixed in D6A5, where the cause was
one line: `SOURCE_DEPENDENT_STATUSES` included `DISCOVERED`, `AWAITING_ROUTING` and `READY`, which
is exactly what every un-uploaded item has, so the gate refused before the provider was asked.

> **D6A4's diagnosis was right, and it is the lesson to keep.** The *absence* of the second sentence
> was the finding. A refusal that cannot say which stage it reached is a refusal nobody can act on,
> and adding the stage is what made the next session look at the gate instead of at the provider.

**Keep these two apart.** Deletion **after a Telegram-confirmed upload** was already hardware-verified
**separately and earlier**; it was never the broken path. It counts *other* jobs and excludes the one
that licensed it. **They are different code paths with different evidence and must never be merged
into one claim** — conflating them is how the working path nearly got rewritten to fix the broken one.

Still unverified from D6A5: confirmed-versus-queued, the Failed row's removal, the Review row's
**Do not upload**, Preview from a folder, orphan reservations, and the five-platform list.

## Next milestone — D6A6: the 9GAG source is an Interest page, not a user profile

**Reported after D6A5. Not started; no production code has been written for it.**

The 9GAG source the user actually wants is a **9GAG Interest page**, public URL shape
`/interest/<slug>`, optionally carrying a feed mode such as `/hot`. The connector supports **only**
user-profile discovery (`/u/<username>/posts`).

> **An Interest is not a profile, and the connector must never pretend otherwise.** Silently
> rewriting a pasted Interest URL into a user profile would produce a source that looks accepted and
> then discovers the wrong feed — or nothing — with no way for the user to tell which happened.

Owned by **Android + server**. In short: an explicit Interest source type kept **distinct** from the
profile type; only genuine `/interest/<slug>` identities accepted and normalised; feed modes
supported **deliberately** rather than inherited; ordered posts with **stable post IDs** and
**bounded pagination**; cursor, idempotency, animated-media and malformed-upstream behaviour all
preserved; Android source-type selection with Hebrew and English help; deterministic fixtures and
connector-conformance coverage.

**Live verification is a separate backlog item from the implementation**, and it is **blocked**: the
deployed host is answered **403 by 9GAG without a configured session**, so
`remote-sources-configure ninegag-cookies <path>` remains a prerequisite. Implementation being
complete will never, on its own, be evidence that this works.

Itemised as rows **29, 30 and 31** plus a D6A6 section in
`/root/work/telegram-topic-uploader/TODO.md`, and as a D6A6 section in the server's `TODO.md`.

## This session was interrupted and resumed — what survived

The Termux process was killed mid-milestone. The recovery is worth recording, because the state it
left is a shape that will recur.

- **The server work was committed and pushed** (`cb01747`) and needed nothing further. It was not
  redone.
- **The Android work existed only in the working tree** — 52 modified files, 12 new ones, nothing
  staged, nothing committed. All of it was preserved and continued.
- **`TODO.md` and the device checklist already claimed results that had not happened.** The
  checklist said *"The APK is already on the device, in Downloads"* and TODO claimed *"Lint: no
  issues"*. Neither was true: no D6A5 APK existed anywhere, and the last lint run had reported an
  `UnusedResources` warning. **Prose written ahead of the fact is the thing to distrust on
  resumption**; artefacts on disk are what to read.
- **What the artefacts actually showed:** the unit-test XMLs were current with the sources and
  green; `lint-results-debug.xml` predated the last two source edits; `app-debug.apk` was byte-size
  identical to the **D6A4** build, so `assembleDebug` had never run for D6A5.
- **`assembleDebugAndroidTest` did not compile at all.** Seven `androidTest` fixtures still called
  the pre-D6A5 `RoomScanRepository` constructor, which had gained `duplicateOperationDao` and
  `albumDao`. Only the unit-test fixtures had been updated. Fixed in this session.

## Live evidence — what the device reported, and what it turned out to be

Two reports opened the milestone, and they point in opposite directions:

- **A media item already uploaded and confirmed was refused as "already queued for that topic"**,
  with an **empty** Upload Queue. The block was right; the sentence described a row that did not
  exist. `assessOne` answered `ALREADY_QUEUED` for three different situations — a live sibling job,
  **any** non-released reservation, and a byte-identical selection mate — and Telegram confirmation
  took the second branch.
- **Manual permanent deletion, with no upload, said nothing was deleted and the file stayed.** Root
  cause is one line: `SOURCE_DEPENDENT_STATUSES` included `DISCOVERED`, `AWAITING_ROUTING` and
  `READY`. Every local item that has never been uploaded has a job in one of those — that is what
  puts it in Review — so the gate refused **before the provider was asked**. **D6A4's diagnosis was
  exactly right: the absence of the second sentence was itself the evidence.**

Four more arrived from the device while the milestone was being written:

- **No version anywhere in the UI**, so no hardware report could say which build it was about.
- **A terminal Failed item with no action on it.** The retirement mechanism existed and worked; the
  row simply drew nothing when `SafeRetirementPolicy` refused, which is indistinguishable from
  broken.
- **A Review item with no action that removed it from Review.** Review's *attention* rows are drawn
  by a different card that offers exactly one recovery action — rescan, or reauthorize — so an item
  whose reason was neither had no way out at all.
- **Preview from inside a folder did nothing.** `ReviewPreviewOverlay` was hosted by exactly two
  routes, Review and the duplicate-group page. The folder route had **no host**, so the card's tap
  set a job ID that nothing ever drew.

**Authoritative and preserved:** deletion *after* a Telegram-confirmed upload works on hardware, and
external deletion followed by a scan reconciles correctly. Neither was rewritten. The post-upload
path counts *other* jobs and excludes the one that licensed it — `AND id != :excludingUploadJobId` —
which is precisely why it worked while the manual one did not.

## 1 — confirmed is not queued (Android)

`DestinationRelationship` distinguishes all nine states: active preparation, upload in progress,
Telegram-confirmed, `RESULT_UNKNOWN`, retryable failure, permanent failure, retired preparation,
orphan reservation, and no relationship. `DestinationRelationshipPolicy` is a pure function and the
**only** place the three facts are combined, so Preview, Review, the folder page, the duplicate rows
and every bulk flow read one plan. `preview_notice_already_queued` is reachable from exactly one
relationship and `D6A5SurfaceTest` parses the mapping out of the source to prove it.

A confirmed item gets a **dialog**: it states the confirmation, says whether the local file is still
there, and offers delete / keep / choose a different topic. It creates no second operation, alters no
confirmation, touches no History, and contacts Telegram at no point.

## 2 — the manual deletion reaches the provider (Android)

`SourceDependencyPolicy` distinguishes a preparation that has committed to a destination from one
that has not; Telegram evidence outranks any status. The safety boundary is unchanged: one exact
recorded document, its granted tree, no filename search, no folder enumeration, no recursion, no raw
path, no MediaStore, no alternate candidate. A **proved** deletion or absence reconciles through the
same reconciliation a scan runs, so the item leaves Review without a rescan; a refusal reconciles
nothing.

## 3 — orphan reservations (Android)

`OrphanReservationPolicy` releases only what it can prove. Never a reservation belonging to an active
job, a running upload, a `RESULT_UNKNOWN`, a confirmed upload, an unresolved album member or batch
operation, and never one carrying a Telegram message ID. One guarded statement, one caller.

## 4 — five platforms (Android)

Reddit, X, 9GAG, Instagram and TikTok are all selectable; the server stays the authority and an older
server still hides the two newest. Eight platform states, each with its own Hebrew and English
sentence; the generic one is reachable from exactly one branch — a platform this build has never
heard of — and a test asserts that count is 1. Per-platform setup commands always name a **path**,
never a value. `RemoteMediaKind.ANIMATION`, which the server has produced since D6A4.

## 5 — the version is on screen (Android, new)

Settings shows `versionName` and `versionCode` read from the **installed package** through
`PackageManager` — `PackageInfoCompat.getLongVersionCode`, so no `NewApi` and no deprecation at
minSdk 23.

**`BuildConfig` was considered and rejected**, and the reason is the point of the row: it records
what the *source tree* was compiled as, so it would report the new version even when the APK on the
device is the old one — exactly the confusion the row exists to end. A surface test fails the build
if any source file or either strings file ever carries a version literal of its own.

## 6 — a failed item can be removed (Android, new)

The row now **always** draws the control when removal means anything, and draws it *disabled with
its sanitized reason* when the policy refuses. A control that silently vanishes reads as broken —
this project already says exactly that on the Review card about permanent deletion.

`removeFromActiveProcessing` is strict retirement first and, **only** on
`NOT_SAFELY_RETIRABLE`, a dismissal that sets `RETIRED` while **retaining the reservation**.

> **The trade is the whole design.** Retirement is strict about the recorded error code *because it
> releases the reservation*, and a released reservation is what would permit a second send of the
> same bytes to the same topic. A dismissal keeps that reservation, so the guard the strict rule was
> protecting still stands and the code check has nothing left to defend.

Everything that could mean Telegram holds the media is still refused, and refused first: any stored
message ID or confirmation, `RESULT_UNKNOWN`, and any live or stale execution claim. The durable SQL
re-asserts all of them, so the relaxed Kotlin rule cannot widen what the database will move. No
status but `RETIRED` is written — the recorded failure, the attempt count and the batch outcome are
all kept.

## 7 — a Review item can leave Review (Android, new)

`ReviewIgnorePolicy` gates **Do not upload** on Review's attention card: refused for a positive
confirmation, for `RESULT_UNKNOWN`, and for anything in flight, each with its own sentence. It is
safe to offer on a row with no other action precisely because it commits to nothing — the file is
untouched and Restore undoes it. **It is not a deletion and is never called one.**

## 8 — Preview from a folder (Android, new)

The folder route now hosts the **same** `ReviewPreviewOverlay`, inside its own `Box`, so Back and
Close return to the same folder page with `listState` intact. A second player was deliberately not
written: one overlay means one autoplay policy, one zoom, and one D6A2 ownership rule, so another
item's completing upload still cannot close this Preview.

`observeAllReviewRows()` has no `WHERE` clause, so the resolved row exists for **every** upload job —
which is why confirmed, ignored and queued folder items are all previewable now that something draws
them. `previewAvailable` additionally requires a job identity, so a card never offers a Preview the
projection cannot honour.

## Tests and exact results

| | |
| --- | --- |
| Android unit tests | **1869, 0 failures** (1748 at D6A4) |
| Android lint | **No issues found** — `<issues>` element empty |
| `assembleDebug` / `assembleDebugAndroidTest` | success — instrumentation **compiled only**, never run |
| Server tests | **594 passed, 2 skipped** (443 passed, 1 skipped at D6A4) |
| `ruff format --check` | 67 files already formatted |
| `ruff check`, `mypy` | clean — no issues in 67 source files |
| `scripts/release-preflight` | 41 first-party modules, all present in the archive |
| `bash -n scripts/deploy-production` | clean |
| `git diff --check` | clean, all three repositories |

Commands: `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline testDebugUnitTest lintDebug
assembleDebug assembleDebugAndroidTest`; `.venv/bin/python -m pytest -q`.

**Guards re-scoped, never deleted** — both because a legitimate new surface appeared:

- `D2B2ASurfaceTest`: the correction port now exposes **five** undo operations.
  `removeFromActiveProcessing` is deliberately a separate method rather than a widened
  `retireFromQueue`, so every existing caller and every existing audit row keeps its meaning.
- `D5CSurfaceTest`: the one shared deletion action now has **four** call sites, because the folder
  page gained the Preview host it never had. The property being guarded — that every surface reaches
  the *same* action — is unchanged and is why the count is asserted at all.

**One known flake, pre-existing and re-confirmed:** `TelegramMediaRepairGatewayTest` failed once
under the parallel run and passed in isolation and on a clean re-run. The only transport diff this
milestone is `RemoteJson.kt`, which the Telegram gateway does not touch.

## Deployment — done, and verified

`./scripts/deploy-production --dry-run` then `./scripts/deploy-production`, from the development
checkout. The dry run printed the **preflight** and **snapshot** steps, as D6A4 required.

| Check | Result |
| --- | --- |
| `remote-sources-ctl version` | **`cb0174765306f429225b299845d6f11456dc666d`** — a 40-character commit, **never `null` again** |
| Deployed commit vs `origin/main` | identical |
| Container | `remote-sources-api-1 Up (healthy)` |
| `GET /api/v1/health` over loopback | **200** |
| `GET /api/v1/ready` over loopback | **200** |
| `GET /api/v1/sources` unauthenticated | **401** |
| Application port on a non-loopback address | **none — 8099 does not appear at all** |
| `remote-sources-ctl devices` | total 4, **active: 1**, revoked 3 — **the pairing survived** |

**This closes the D6A4 outage.** The host is no longer running a tree that cannot be rebuilt from
Git: it is running exactly `cb01747`, and it says so itself.

**Correction to an older note in this file:** the health routes are `/api/v1/health` and
`/api/v1/ready`, not `/health` and `/ready`. The bare paths return **404**; the deploy script has
always probed the correct ones. Anyone verifying by hand with the old paths will wrongly conclude
the service is unhealthy.

**The only non-loopback listeners** are `sshd` on 22 and `tailscaled` on its own Tailscale
addresses. Nothing about the application is publicly bound.

**No credential was requested, read, handled or recorded**, and no Telegram request was made.

## APK identity (debug development signing only)

| | |
| --- | --- |
| Path | `app/build/outputs/apk/debug/app-debug.apk` |
| Bytes | 15,846,424 |
| SHA-256 | `d2b87eaa0eddd04ada8ee027fbe18de2a23ffb90fd3cfb8518c26b81d8259b22` |
| Signer SHA-256 | `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` — **unchanged since D5A** |
| Application ID | unchanged |
| versionCode / versionName | **30** / **`0.13.5-d6a5`**, read back from `output-metadata.json` |
| Copied to Downloads | `TelegramTopicUploader-0.13.5-d6a5.apk` — **byte-for-byte identical**, `cmp` clean, same SHA-256 |

**Install over the existing application. Do not uninstall and do not clear app data.** The agent did
not install it; the user performs only Android's package-install confirmation.

## Hardware evidence, exactly as it stands

- **Proven:** pairing, authenticated requests, the D6A3 destination selector, deletion **after** a
  confirmed upload, external deletion followed by a scan, **the D6A5 Settings version row**, and
  **manual permanent deletion without upload** — the last two confirmed on 2026-07-27.
- **Failed on hardware, now under a fix that names its root cause and not yet re-checked:** a
  confirmed item described as queued; a Failed row with no action; a Review row with no action;
  Preview from a folder.
- **Never checked:** everything in D6A5; everything in D6A4; D6A2's Preview ownership and album
  settlement; an end-to-end remote check → review → send, which has never completed.
- **New this milestone and verified against production:** the deployment, the release marker, the
  rollback's preconditions, loopback-only exposure, and the surviving pairing.

## Next device action (ask for exactly this)

The server is already deployed and healthy; **nothing needs doing on the VPS.**

1. ~~Install the APK and confirm the Settings version.~~ **Done — it read `0.13.5-d6a5` / `30`.**
2. ~~§1 the manual deletion.~~ **Done, and it passed** — the file was gone from the Android file
   manager as well as from the app.
3. **Remaining, in this order:** §3 the confirmed-versus-queued dialog; §6 the four new findings
   (Settings/About is already confirmed, so 21–23 remain); §5 the five platforms; §7 the D6A4
   regressions.

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `keytool -printcert -jarfile <apk>`.
- **`lintDebug` takes ~3–4 minutes.**
- **`uv` is not installed.** Use the server repo's `.venv/bin/{ruff,mypy,pytest}`.
- **`rsync` is not installed** in this environment. The deploy tests ship a Python `rsync` stub that
  honours `--exclude` for both copy and delete.
- **The server venv carries an editable install pointing at the checkout**
  (`_editable_impl_remote_sources.pth`). Any test about what a release *ships* must assert the loaded
  module's path, or the checkout answers the import and the test is worthless.
- **`python3 -I` ignores `PYTHONPATH`.** Insert the path with `sys.path.insert` inside the `-c`
  snippet.
- **`kotlin.test` is not on the unit-test classpath.** Use `org.junit.Assert`.
- **minSdk 23 means no `java.time`**; no desugaring artefact in the offline cache.
- **`UnusedResources`, `PluralsCandidate`, `NewApi` fail the zero-issue bar.** Removing a UI form
  means removing its strings from **both** locales — `LocalizationResourcesTest` compares key sets.
- **An apostrophe in an Android string resource** ("server's") is an *"Invalid unicode escape
  sequence"* build failure. Rephrase rather than escape.
- **Annotations must stay adjacent to their function.** Inserting a helper between `@StringRes` /
  `@Composable` and its target is a lint failure or a compile error.
- **A doc comment can trip a source-level guard.** Reword the comment, never exempt the guard.
- **Surface tests pin the version literal** — eleven of them at D6A4, and D6A5 adds the opposite
  guard: no *production* source or strings file may contain a version literal at all, because the
  About row reads the installed package instead.
- **`BuildConfig` is not generated** — `buildFeatures.buildConfig` is off, so a unit test cannot
  import it. Read `build.gradle.kts` if a test needs the declared version.
- **The androidTest source set is not compiled by `testDebugUnitTest`.** A constructor change that
  updates the unit-test fixtures can leave `assembleDebugAndroidTest` broken for a whole session
  while every unit test stays green. D6A5 found seven such fixtures. Always run the full four-task
  command, never just the tests.
- **The health routes are `/api/v1/health` and `/api/v1/ready`.** The bare `/health` and `/ready`
  return 404. Verifying by hand with the short paths produces a false alarm.
- **`deploy/production.env` holds `RS_DEPLOY_HOST`, `RS_DEPLOY_KEY`, `RS_DEPLOY_PATH`.** Reuse the
  deploy script's own `remote()` construction — `-o BatchMode=yes` plus `-i "$RS_DEPLOY_KEY"`.
  Rebuilding the SSH invocation by hand and omitting the key fails **and** prints the host address,
  which must never be recorded.
- **Known flake, pre-existing:** `TelegramMediaRepairGatewayTest` and `TelegramMediaUploadGatewayTest`
  (MockWebServer timing) fail occasionally under parallel Gradle tasks and pass on a clean re-run.
  The transport layer had **zero diff** in D6A4. Re-run before treating one as real.
- **Ruff's S603/S607 fire on `subprocess` in tests**, and `E501` on embedded shell/Python stub
  programs. The release and deploy tests carry per-file ignores with stated reasons.
- **Writing certain literals into Kotlin through a file-writing tool can land a raw NUL byte**, which
  makes `grep` treat the file as binary. If a grep over a file you just wrote returns nothing it
  should have matched, check for NUL bytes first.
