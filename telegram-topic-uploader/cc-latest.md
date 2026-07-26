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
| Task | **D6A3** — four workstreams opened by the **first successful hardware pairing** |
| Application repository | `/root/work/telegram-topic-uploader` |
| Server repository | `/root/work/telegram-remote-sources` — **changed this milestone** |
| Starting application HEAD | `3cdfdd8` (D6A2) |
| **Final application HEAD** | **`309ae0d3723cc056bda3432f84c8b0d08a0e25f9`** (`309ae0d`) |
| Starting server HEAD | `31d2edf` (D6A1) |
| **Final server HEAD** | **`befe5040d2d0177c7cedf23feaad3d1397166e31`** (`befe504`) |
| Version | code 27 → **28**, name `0.13.2-d6a2` → **`0.13.3-d6a3`** |
| Room schema | **12 → 12. Unchanged.** No migration runs. |
| Deployment | **Nothing.** No VPS access, no production credential, no device, no pairing, no Telegram request, no real file deleted. |

No production token, Telegram identifier, chat ID, thread ID, private link, VPS address, Tailscale
hostname, SSH host, pairing code, device token, cookie, account name, file name, content URI or
media hash was requested, used or recorded anywhere, including this file.

## Live evidence — the first hardware success

**Remote pairing works end to end on the physical device.** Paired, Connected, and authenticated
system-status, destinations, sources, review and history requests all returned data. Device counts:
total 4, **active 1**, revoked 3 — one live device, the three D6A1 orphans correctly revoked.
Destination creation over the API worked.

**Do not change or rework pairing** without an objective regression.

Also established, all authoritative over any earlier claim:

- the manual chat/thread entry in the remote source form is **unacceptable product UX**;
- **9GAG validation from the deployed VPS returned 403 twice.** The validate call itself returned
  success and encoded the failure in its body, which is the contract working;
- **D6A2's permanent-deletion fix failed on hardware.** The app said nothing was deleted and the
  file was still on the device, and it really was;
- **D6A2's Preview-ownership and album-settlement fixes are still unverified on hardware.**

## A — destination selector (Android + one server API change)

Form now has **שם המקור** (source name) and **יעד בטלגרם** (a dropdown over locally connected topics,
by name). **No chat field, no thread field anywhere in the flow.** The manual form, its handler and
its six strings were **deleted**, not hidden.

`ConnectedTopicSource` — read-only `fun interface`, implemented by `RoomConnectedTopicSource` using
the **same** `DestinationReadiness` rule every local surface uses. No parallel topic store.
`RemoteViewModel.addSourceForConnectedTopic` creates-or-reuses the destination from the topic's own
record, then creates the source mapped to the answer. A failed destination step creates no source.

**Create-or-reuse had to be the server's job**, and this is the key insight: the endpoint
deliberately never returns `chat_id`/`thread_id`, so the app cannot detect a duplicate. The server
keys on `(chat_id, thread_id)` — already the unique constraint — returns the existing row untouched
including its label, and every mapped source keeps working.

## B — 9GAG 403 (server)

Two defects. `classify_http_status` calls 401/403 `AUTHENTICATION_EXPIRED`, wrong when no session was
ever configured. And `setup_required = requires_credentials and not configured` meant 9GAG (requires
none) reported **Ready** while being refused.

Fixed from evidence: no session → `SETUP_REQUIRED`; session configured → `AUTHENTICATION_EXPIRED`.
New `AdapterCapabilities.optional_credentials`; `_setup_required` also fires when an optional-credential
connector's last recorded signal was setup-shaped. **Ready now means prerequisites are satisfied.**

Optional `NINEGAG_COOKIES` + `remote-sources-configure ninegag-cookies <path>`, exactly the X
precedent. Browser-compatible headers. **No challenge solving, no proxy rotation, no retry loop.**
One sanitized log line per refused validation: connector, classification, reason.

**Not verified live.** Nothing has succeeded from the deployed host since the 403.

## C — permanent deletion still failed on hardware

**The message decodes to `PROVIDER_CLAIMED_SUCCESS_BUT_PRESENT` → `NotActuallyDeleted`**, which
requires the absence proof to have found the document **still readable** after the provider claimed
success. So the gate passed, the identity re-proof passed, the provider was asked, and it lied.

**Why D6A/D6A2 could not have fixed this:** both were about *interpretation*, and the interpretation
was right. No further classification work would have changed the outcome.

What D6A3 does — and it deliberately does not claim a fix:

- `DocumentDeletionStage`, **ten stages** covering every case the milestone lists, each with its own
  sentence in both locales, appended to the notice the user already sees;
- `deleteWithReport` returns the stage with the result, and the **production** manual path calls it;
- **one further exact attempt**: `ContentResolver.delete` on the *same document URI* — some providers
  implement `delete` where `deleteDocument` is a no-op. Same tree, same document, no name search, no
  listing, no recursion; its result is proved;
- the write grant is checked **before** the provider is asked;
- the stage is **not persisted** — schema 12 stands rather than migrating for a diagnostic sentence.

**Next hardware run: ask for the SECOND sentence of the deletion message verbatim.** That names the
provider behaviour and is the whole point of this build.

## D — one-command deployment (server)

`./scripts/deploy-production [--dry-run]`. Refuses on wrong repo, wrong branch, dirty tracked tree,
`HEAD != origin/main`, missing release files, or a host not already carrying this deployment. Backs
up + verifies the DB, ships `git archive` of committed HEAD (**no `.git`, no credential**), promotes
with `rsync --delete` — **that is what the old copy-and-unpack could not do** — excludes host-only
state by name, runs `90-deploy.sh`, verifies CLI + loopback health + application port not on a
non-loopback address + Tailscale + containers. Restarts the previous release on failure.

`RELEASE_COMMIT` marker + `remote-sources-ctl version` (validates it is a hex SHA before printing).
Config in git-ignored `deploy/production.env`: `RS_DEPLOY_HOST`, `RS_DEPLOY_KEY`, `RS_DEPLOY_PATH`.
**Never printed.** Never automatic.

## Tests and exact results

```
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline testDebugUnitTest         # 1727, 0 failures
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline lintDebug                 # No issues found
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebug             # success
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebugAndroidTest  # success (compiled only)
# server, via .venv/bin (uv is NOT installed):
ruff format --check src tests; ruff check src tests; mypy; pytest            # 369, 0 failures
```

1704 → **1727** Android (23 added); 351 → **369** server (18 for deployment). New Android files:
`D6A3SurfaceTest`, `ConnectedTopicSourceCreationTest`, `RemoteTestStubs` (shared remote fakes).

**Re-scoped, not deleted:** version literal in **ten** surface tests 27 → 28;
`DeletionTruthfulnessTest`/`D5ASurfaceTest`/`D6A2SurfaceTest` deleter guards re-scoped to
`deleteWithReport` **plus** a new assertion that no second unreported deletion call site exists; two
coordinator tests now assert the stage as well as the outcome. One 9GAG test's 403 expectation
changed — that is the behaviour change itself, and three new tests pin both sides.

## APK identity (debug development signing only)

| Field | Value |
| --- | --- |
| Version | code 28, `0.13.3-d6a3` |
| Path | `app/build/outputs/apk/debug/app-debug.apk` |
| Size | 16,654,105 bytes |
| SHA-256 | `832cdd2796315849a8e30f3c682253a7ccacb9665df3807c1d82c850545c8e61` |
| Signer cert SHA-256 | `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` — **unchanged** |

**Install over the existing app. Do not uninstall, do not clear data.**

## Hardware evidence, exactly as it stands

**Proven:** remote pairing, and authenticated requests to the private server. That is all.

**Failed on hardware:** permanent deletion, now under **two** different fixes (D6A2 and, until
proven otherwise, still open in D6A3).

**Never checked:** D6A2's Preview ownership and album settlement; everything in D6A3; every D5A check
beyond 1–3; all of D5B and D5C; everything after D4B/D4C.

## Next device action (ask for exactly this)

`docs/D6A3_DEVICE_CHECKLIST.md`, in order. Priority: **§3 deletion** — and specifically the **second
sentence** of the message, verbatim, whatever it says; then §1 the new source form; §2 the 9GAG
classification; §4 the two unproven D6A2 fixes.

§3 **deletes real files** — insist on disposable copies in a disposable folder and on checking the
system file manager rather than believing the application.

Server first: `./scripts/deploy-production`, then `sudo remote-sources-ctl version`, then
`sudo remote-sources-ctl devices` (expect **active: 1** — the pairing survives).

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `keytool -printcert -jarfile <apk>`.
- **`lintDebug` takes ~3–4 minutes.**
- **`uv` is not installed.** Use the server repo's `.venv/bin/{ruff,mypy,pytest}`.
- **`kotlin.test` is not on the unit-test classpath.** Use `org.junit.Assert`.
- **minSdk 23 means no `java.time`**; no desugaring artefact in the offline cache.
- **`UnusedResources`, `PluralsCandidate`, `NewApi` fail the zero-issue bar.** Removing a UI form
  means removing its strings from **both** locales — `LocalizationResourcesTest` compares key sets.
- **Annotations must stay adjacent to their function.** Inserting a helper between `@StringRes` /
  `@Composable` and its target is a lint failure or a compile error.
- **A doc comment can trip a source-level guard.** Reword the comment, never exempt the guard.
- **Surface tests pin the version literal** — ten of them at D6A3.
- **Known flake, pre-existing:** `TelegramMediaRepairGatewayTest` and `TelegramMediaUploadGatewayTest`
  (MockWebServer timing) fail occasionally under parallel Gradle tasks and pass on a clean re-run.
  The transport layer had **zero diff** in D6A3. Re-run before treating one as real.
- **Ruff's S603/S607 fire on `subprocess` in tests.** The deploy tests carry a per-file ignore with a
  stated reason.
- **Writing `' '` into Kotlin through a file-writing tool can land a raw NUL byte**, which makes
  `grep` treat the file as binary. If a grep over a file you just wrote returns nothing it should
  have matched, check for NUL bytes first.
