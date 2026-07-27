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
| Task | **D6A4** — a hotfix milestone opened by a **production outage** and three device reports |
| Application repository | `/root/work/telegram-topic-uploader` |
| Server repository | `/root/work/telegram-remote-sources` — **changed this milestone** |
| Starting application HEAD | `309ae0d` (D6A3) |
| **Final application HEAD** | **`55fbd5bb1b6fbee8fabc673c58f73930a826b970`** (`55fbd5b`) |
| Starting server HEAD | `befe504` (D6A3) |
| **Final server HEAD** | **`ffab60766b070b974594c41da6363b5bc7d3dd01`** (`ffab607`) |
| Version | code 28 → **29**, name `0.13.3-d6a3` → **`0.13.4-d6a4`** |
| Room schema | **12 → 12. Unchanged.** No migration runs. |
| Deployment | **Nothing.** The production VPS was not accessed and no SSH connection was made. No production credential, no device, no pairing, no Telegram request, no real file deleted. |

No production token, Telegram identifier, chat ID, thread ID, private link, VPS address, Tailscale
hostname, SSH host, pairing code, device token, cookie, account name, file name, content URI or
media hash was requested, used or recorded anywhere, including this file.

## Live evidence — what the last round actually proved

**The D6A3 destination selector works on hardware.** Installed over the existing app, pairing stayed
connected, the chat and topic identifier fields are gone, and choosing a topic by name is materially
better. **Preserve it.** Pairing itself is still not to be reworked without an objective regression.

**The D6A3 server deployment failed.** It built, migrated, recreated the container, and then
restart-looped on `ModuleNotFoundError: No module named 'remote_sources.secrets'`. Recovery required
**copying the package to the host by hand** plus a reboot.

> **Production is healthy, and the commit it is running is not reproducible from Git.** Deploying
> the D6A4 server commit is what closes that, and it is the first action of the next session.

Also established, all authoritative over any earlier claim:

- **the advertised rollback was not real** — it restarted from the already-promoted broken tree
  without restoring code or marker;
- **`remote-sources-ctl version` returned `deployed_commit: null`** on a correct release;
- **9GAG was live-403.** The server classified it exactly right — `connector=ninegag`,
  `classification=setup_required`, `reason=http_403` — and returned it in a 200; Android showed one
  generic sentence and the platform list still said **מוכן** after a refresh;
- **D6A3's permanent deletion still failed.** The file remained, and the app showed only the
  one-sentence *"דבר לא נמחק, הקובץ עדיין במכשיר"* — **the D6A3 second sentence never surfaced**;
- devices: total 4, **active 1**, revoked 3. Loopback health ok, port bound to loopback only.
  **Preserve device state and pairing.**

## 1 — release integrity (server)

**Root cause.** `.gitignore` line 29 was `secrets/`, unanchored. It matched
`src/remote_sources/secrets/`, so the package was **never tracked**. `git archive` shipped a release
without it, `COPY src ./src` built an image without it, and `rsync --delete` removed the host's
previous copy.

**Why the suite was green.** Tests import the working tree — and the venv carries an **editable
install pointing at the checkout**, so even a deliberately isolated import was answered by the very
copy that was not going to ship. That is the general lesson worth keeping.

Rules anchored to the repository root (`/secrets/`, `/cookies/`); runtime secrets do not live in the
repository at all. A blanket `!/src/**` negation was written and **rejected** — it un-ignores
`__pycache__`; a guard test asserts both properties instead.

`tests/test_release_integrity.py` reads the **index** (`git write-tree`), not `HEAD`, so it fails
before the commit; and `_assert_loaded_from_export` asserts the loaded module's path is **inside the
export**, without which it passes on an empty archive. `scripts/release-preflight` walks the
production import graph and **refuses the pre-fix HEAD by name**.

## 2 — real rollback (server)

The old failure path printed *"attempting to restart the previous release"* and ran
`docker compose up -d` against the **already-promoted broken tree**. It restored nothing.

Now: snapshot to `.releases/previous-<id>` before promotion, prove it restorable, record the prior
marker; on failure stop, restore tree, restore marker, restore the **verified** database backup when
migrations may have run, restart, wait for health, and only then claim a rollback. Otherwise
`ROLLBACK FAILED` with the host's actual state.

`RS_DEPLOY_SSH` overrides the SSH binary, so `tests/test_deploy_rollback.py` drives a sandbox host
with stubbed `sudo`/`docker`/`rsync`/`curl`/`ss`/`tailscale`/CLI and asserts **restored state on
disk**. Thirteen tests. `RS_DEPLOY_HEALTH_RETRIES`/`_INTERVAL` keep them fast.

## 3 — release marker (server)

`version` read a **host** path the container does not mount. Now `RS_RELEASE_COMMIT_FILE`, defaulting
inside the state directory `compose.yaml` already bind-mounts — a **directory** mount, because a
missing single-file bind target makes Docker create a directory. `read_release_commit` accepts only
40 lowercase hex characters from a bounded read. A deployment whose service does not report the
promoted commit **fails and rolls back**. 20 tests.

## 4 — 9GAG classification and readiness

**Server.** `PlatformHealth` was written only by the **scheduler**, which runs for source *rows*, so
validating a source that did not exist yet touched nothing durable. `/sources/validate` now records a
sanitized signal — platform, classification, timestamp; the table has no column that could hold a URL
or an account. A later success clears a **setup-shaped** signal. It never clears a rate limit and
never writes `blocked_until` or the strong-signal count. 10 tests.

**Android.** `RemoteValidation.classification` maps the wire outcome through `RemoteBackoffReason`,
and every known classification has its own Hebrew and English sentence. The generic one is reachable
from **one** branch (a server newer than the app), and a test asserts that count is 1.

## 5 — deletion diagnostics (Android)

**Root cause, and not what it looked like.** The report was not discarded. The paths that refuse
**before the provider is asked** — a gate refusal, a reused settled decision, a failed exact re-proof
— returned `Blocked(outcome)` with `stage` defaulting to null, and the device's message
(`delete_source_notice_blocked`) is exactly one of those paths.

**So the absence of the sentence is itself the finding: the provider was very likely never asked.**

`NOT_ATTEMPTED_GATE_REFUSED`, `NOT_ATTEMPTED_PREVIOUS_DECISION`, `NOT_ATTEMPTED_SOURCE_CHANGED` added;
**every** refusal path carries a stage; `D6A4SurfaceTest` parses the coordinator and fails if any
`Blocked(`/`RetryAvailable(` is constructed without one. Six tests start at
`MainViewModel.deleteSourceWithoutUpload` / `retryManualDeletion` — the actual UI action.

Exactness unchanged: same granted tree, same recorded document, no name search, no listing, no
recursion, no alternative candidate, no MediaStore. **Not claimed fixed.**

## 6 — animated media (server)

`MediaKind.ANIMATION` in an existing `String(16)` column — no migration. 9GAG distinguishes
`Animated` from `Video` (MP4 rendition preferred, real `image/gif` fallback). Reddit handles direct
`.gif`, `.gifv`, `image/gif` gallery members and `reddit_video_preview.fallback_url`; a `.gifv` with
**no** MP4 is refused because it is an HTML page, and the fetch path refuses a document content type
independently. `sendAnimation` for a single animation; `video` inside an album, because
`sendMediaGroup` has no animation type. Identity is the post's. 22 tests.

## Tests and exact results

| | |
| --- | --- |
| Android unit tests | **1748, 0 failures** (1727 at D6A3) |
| Android lint | **No issues found** — `<issues>` element empty |
| `assembleDebug` / `assembleDebugAndroidTest` | success — instrumentation **compiled only** |
| Server tests | **443 passed, 1 skipped** (369 at D6A3) |
| `ruff format --check`, `ruff check`, `mypy` | clean |
| `bash -n scripts/deploy-production` | clean |
| `git diff --check` | clean, both repositories |

Commands: `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline testDebugUnitTest lintDebug
assembleDebug assembleDebugAndroidTest`; `.venv/bin/python -m pytest -q`.

**Guards re-scoped, never deleted:** eleven surface tests' version literal 28 → 29; eight
`ManualSourceDeletionCoordinatorTest` expectations gained the stage each refusal now carries; two
deploy tests (one had **pinned the false rollback wording as a requirement**); one 9GAG fixture
assertion `VIDEO` → `ANIMATION`, which is the behaviour change itself.

## APK identity (debug development signing only)

| | |
| --- | --- |
| Path | `app/build/outputs/apk/debug/app-debug.apk` |
| Bytes | 15,759,145 |
| SHA-256 | `28b1c08a161c2e5822f85f4cf90f19cb972af00670a3ffcfc42e643191d3102b` |
| Signer SHA-256 | `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` — **unchanged since D5A** |
| Application ID | unchanged |

**Install over the existing application. Do not uninstall and do not clear app data.**

## Hardware evidence, exactly as it stands

- **Proven:** pairing, authenticated requests, and the **D6A3 destination selector**.
- **Failed on hardware:** permanent deletion, now under **three** consecutive fixes; the D6A3 server
  deployment and its rollback; `version`; the 9GAG display and readiness.
- **Never checked:** D6A2's Preview ownership and album settlement; everything in D6A4; animated
  delivery; an end-to-end remote check → review → send, which has never completed.

## Next device action (ask for exactly this)

**Server first, and it is not optional:** `./scripts/deploy-production --dry-run`, then
`./scripts/deploy-production`, then `sudo remote-sources-ctl version` (**a 40-character commit, never
`null`**), then `sudo remote-sources-ctl devices` (expect **active: 1** — the pairing survives).

Then install the APK over the existing app and work `docs/D6A4_DEVICE_CHECKLIST.md` in order.
Priority: **§2 the deletion — and specifically the SECOND sentence of its message, verbatim,
whatever it says**; then §1 the 9GAG classification and the readiness refresh; §3 animated delivery;
§4 the D6A3 regressions.

§2 **deletes real files** — insist on disposable copies in a disposable folder and on checking the
system file manager rather than believing the application.

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
- **Surface tests pin the version literal** — eleven of them at D6A4.
- **Known flake, pre-existing:** `TelegramMediaRepairGatewayTest` and `TelegramMediaUploadGatewayTest`
  (MockWebServer timing) fail occasionally under parallel Gradle tasks and pass on a clean re-run.
  The transport layer had **zero diff** in D6A4. Re-run before treating one as real.
- **Ruff's S603/S607 fire on `subprocess` in tests**, and `E501` on embedded shell/Python stub
  programs. The release and deploy tests carry per-file ignores with stated reasons.
- **Writing certain literals into Kotlin through a file-writing tool can land a raw NUL byte**, which
  makes `grep` treat the file as binary. If a grep over a file you just wrote returns nothing it
  should have matched, check for NUL bytes first.
