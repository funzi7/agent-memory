# Telegram Topic Uploader — latest handoff

> **`chat-handoff.md`, beside this file, is the canonical cross-chat bootstrap.** A brand-new
> managing conversation reads that first and this second. **Every future milestone must update
> both**, and from D6A also `/root/work/agent-memory/telegram-remote-sources/cc-latest.md`.

## Task and repository state

| Field | Value |
| --- | --- |
| Task | **D6A2** — three regressions reported from ordinary device use; **two had already been "fixed" in D6A** |
| Application repository | `/root/work/telegram-topic-uploader` |
| Server repository | `/root/work/telegram-remote-sources` — **not modified this milestone** |
| Branch | `main`, tracking `origin/main` |
| Starting application HEAD | `2a0f74e` (D6A1) |
| **Final application HEAD** | **`3cdfdd8be1749884cc2a424af525e47d7564ade4`** (`3cdfdd8`) |
| Server HEAD | `31d2edf088387dd262c617457dc5fce3e660739d` — **unchanged** |
| Version | code 26 → **27**, name `0.13.1-d6a1` → **`0.13.2-d6a2`** |
| Room schema | **12 → 12. Unchanged.** No migration runs. |
| Deployment | **Nothing.** No VPS, no production credential, no device, no emulator, no pairing, no Telegram request, no real file deleted. |

No production token, Telegram identifier, chat ID, thread ID, topic name, private link, VPS address,
Tailscale hostname, pairing code, device token, file name, content URI, document ID, path, folder
name, destination name or media hash was requested, used or recorded anywhere, including this file.

## The three regressions, and why D6A did not fix two of them

This is the part worth reading. **Each failed for a structurally different reason**, and only one is
the kind that more tests of the same shape would have caught.

### 1. A completing upload closed a *different* item's Preview — newly reported

Sequence: Preview A → **Send now** → back to Review → open Preview B → A finishes → **B closes**.

Root cause: `ui/MainViewModel.kt`, `runPreviewAction` called `closeReviewPreview()` unconditionally
after `uploadNow(jobId)` returned. The coroutine is in `viewModelScope` and outlives the overlay.

The identity needed to prevent it **already existed** — `PreviewActionState.jobId`, since D4B — and
nothing read it, because the action lived in **one nullable slot**. A single slot cannot express
"this belongs to A", so every consumer was wrong at once: B drew A's stage line and A's **Cancel
now**, a cancel in B stopped A, A's `finally` cleared B's pinned row, and
`if (_previewAction.value != null) return` stopped B starting its own action at all.

Fix: `_previewActions` / `_previewPinnedRows` are **maps keyed by job ID**. Completion goes through
`closePreviewOwnedBy(jobId)`, guarded by `_reviewPreviewJobId.value == jobId`. `cancelPreviewSend`
takes the owner. The overlay independently derives `ownAction` / `ownTransfer` from its own row —
deliberate duplication, because a future call site is how this returns.

**Deliberately NOT changed:** `ExternalMediaOperationArbiter` still admits one media operation at a
time. The user's gate answer asked for B to be "fully usable"; B owns its own action and gets its own
truthful answer, but if the transfer slot is busy B is refused rather than run concurrently. That
slot stops a manual deletion removing a file an album is mid-read of. Widening it is separate work.

### 2. Permanent deletion still did not work

**The gate answer pinned this precisely.** The device showed *"The deletion could not be confirmed,
so it is not recorded as deleted. The file may still be there."* → `DELETION_UNVERIFIED` → the
absence check returned `Unknown`.

Root cause: after a genuine deletion the document URI addresses nothing, and providers say so in **at
least five ways** — empty cursor, **null cursor** (`DocumentsProvider.query` returns null on exactly
one path: its `queryDocument` threw `FileNotFoundException`), `FileNotFoundException`,
`IllegalArgumentException`, and **`SecurityException`** from the tree check refusing a child it can no
longer resolve. D6A's `existsAt` classified the null cursor and the `SecurityException` as `Unknown`.
So D6A converted a false success into a false failure.

Fix: split **what the provider said** (`DocumentProbeSignal`) from **what it means**
(`domain/deletion/DocumentAbsencePolicy`, a pure function — every combination assertable without a
device). Rules: open descriptor = presence and outranks every cursor (D6A's original defect stays
fixed); any probe proving the identity unresolvable = absence; uncontradicted row = presence; else
unknown. The **write grant** disambiguates `SecurityException` — held grant means the tree no longer
contains it; withdrawn grant is `AccessLost` → `PermissionRevoked`, never a claimed deletion.

**Second half — false tombstones.** `ManualSourceDeletionCoordinator.attempt` short-circuits on any
terminal row and `SourceDeletionPolicy` reports `AlreadyDeleted`, so a pre-D6A wrong tombstone
**withdrew the delete control and made a fresh tap return "deleted" without reaching the provider** —
file on the device, invisible in the app, unreachable. Per the gate answer,
`repairClaimedDeletions()` runs at startup and on refresh and withdraws false tombstones **only on
positive presence** (the stricter `standalone` reading). Deletes nothing, reads no content,
idempotent.

### 3. Settled album shells stayed in the Upload Queue

**The bluntest one.** `AlbumReconciliationPolicy` was written in D6A, was correct, had a passing test
file, and `grep -rn AlbumReconciliation app/src/main` returned **only its own definition and one doc
comment**. Nothing called it. The Queue filtered on the shell's own state
(`albums.filter { it.state != AlbumState.CONFIRMED }`), so a `NOT_SENT` shell survived over confirmed
members. Nothing durable recorded a shell as finished, so any in-memory answer would have died on
restart.

A second defect sat *inside* the projection: `shellIsRetirable = summary.isFullySettled`, whose
`unresolved` counted `rejected` and `blockedByLimit`. Both terminal → a fully-settled album was never
retirable.

Fix: `keepsShellActive` = only `PENDING`, `FAILED_BEFORE_DISPATCH`, `RESULT_UNKNOWN`.
`shellIsRetirable = members.none { it.keepsShellActive }`. **`AlbumState.RETIRED`** makes it durable
(new value on an existing `TEXT` column — **no migration**). `AlbumSettlementRepair` runs at startup
and on refresh, writes **one column on one album row and never a member**. Queue asks
`state.occupiesQueue`. Per the gate answer, terminally failed members stay as their own rows with
their own reason and become correctable once their shell retires.

## The rule this milestone leaves behind

**A policy with a green test file is not a shipped behaviour until something in `src/main` calls it
and something durable records what it decided.**

D6A1's rule still applies too: a test that only exercises the enumerated value that already worked
proves nothing about the one just added.

`D6A2SurfaceTest` asserts **reachability** for all three fixes — the guarded close is the only
completion path, the deleter delegates to the shared policy, and `AlbumReconciliationPolicy` is
invoked from production and its result written durably.

## Tests and exact results

```
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline testDebugUnitTest         # 1704 tests, 0 failures
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline lintDebug                 # No issues found
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebug             # success
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebugAndroidTest  # success (compiled only)
git diff --check                                                             # clean
```

1638 → **1704**, 66 added. New files:

- `domain/deletion/DocumentAbsencePolicyTest.kt` — every provider answer combination, both readings.
- `domain/deletion/DeletionTombstoneRepairTest.kt` — revive on presence, keep on absence, leave
  unproven alone, never delete, idempotent. Tree reader and hasher **throw on every member**.
- `domain/album/AlbumSettlementRepairTest.kt` — scenarios A–H including legacy rows, restart and
  double-run.
- `ui/PreviewOperationOwnershipTest.kt` — the ownership rules stated directly.
- `security/D6A2SurfaceTest.kt` — reachability guards.
- `MainViewModelTest` gained the deterministic end-to-end sequence plus outcome variants and a
  startup-repairs-run-once test.

**Re-scoped, not deleted:**

- version literal in **nine** surface tests, 26 → 27, name to `0.13.2-d6a2`;
- `DeletionTruthfulnessTest`'s deleter-contract guard re-scoped to `DocumentAbsenceVerdict`, **plus
  two new assertions** (withdrawn grant → `PermissionRevoked`; verdict comes from the shared policy).

**One guard fired correctly and was NOT weakened.** The "media mutation is unreachable" tests grep
production sources for the removal API by name; a new doc comment in `DocumentAbsencePolicy`
mentioned it. **The comment was reworded**, exactly as in D6A.

## APK identity (debug development signing only)

| Field | Value |
| --- | --- |
| Package | `com.funzi7.telegramtopicuploader` — unchanged |
| Version | code 27, name `0.13.2-d6a2` |
| Path | `app/build/outputs/apk/debug/app-debug.apk` |
| Size | 16,531,957 bytes |
| SHA-256 | `6be3f1915beca26c7a4f89d6c031a110e5b2e29c18b73bb41f762b1f014590a2` |
| Signer cert SHA-256 | `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` — **unchanged from D6A1** |

**Install over the existing app. Do not uninstall, do not clear data.** **D6A2 supersedes D6A1** —
versionCode 26 does **not** need to be installed first.

## Hardware evidence, exactly as it stands

**Nothing in D6A, D6A1 or D6A2 has been verified on hardware.**

- Two of D6A2's three defects were reported fixed in **D6A** and confirmed on hardware **zero** times.
- **D6A1 is unverified**, including the bot token surviving install-over and a remote disconnect not
  destroying it.
- **No D6A remote end-to-end test has passed.** Pairing has never completed on a device, so nothing
  past pairing has ever run.
- Still the only passed checks, unchanged since D5A: checks 1, 2 and 3.
- Unvalidated: all of D6A2, D6A1, D6A, D5C, D5B, every D5A check beyond 1–3, everything after D4B/D4C.

## Next device action (ask for exactly this)

`docs/D6A2_DEVICE_CHECKLIST.md`, in order. Priority: **2b** (deletion truthfulness on every surface,
checked in the system file manager), **2a** (files the app wrongly claimed to delete coming back),
**1** (preview ownership), **3** (album rows gone and staying gone across a restart).

Section 2 **deletes real files** — insist on disposable copies in a disposable folder and on checking
the file manager rather than believing the application.

§4 is D6A1's first real check: **the bot token survives install-over**, and **disconnecting Remote
sources does not destroy it**.

Remote pairing still needs the server steps first: deploy the server commit (unchanged this
milestone), `sudo remote-sources-ctl revoke-all-devices --confirm`, then one fresh code.

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at `/opt/android-sdk/aapt2-wrapper/aapt2`.
- `keytool -printcert -jarfile <apk>` reads the signing certificate; `apksigner` at
  `/opt/android-sdk/build-tools/36.0.0/apksigner`.
- **`lintDebug` takes ~3–4 minutes.**
- **`kotlin.test` is not on the unit-test classpath.** Use `org.junit.Assert`.
- **minSdk 23 means no `java.time`**; no desugaring artefact in the offline cache.
- Offline Gradle cache has no media3, ExoPlayer, Coil, Glide, Picasso, DataStore or `exifinterface`.
- **`UnusedResources`, `PluralsCandidate` and `NewApi` fail the zero-issue bar.** Add/delete strings
  in **both** locales (`values`, `values-iw`) — `LocalizationResourcesTest` compares key sets exactly.
- **A doc comment can trip a source-level guard.** Reword the comment, never exempt the guard.
- **Surface tests pin the version literal** — nine of them at D6A2. Bumping the version means
  updating every one; that is the established pattern, not a weakened assertion.
- **`@StringRes` and other annotations must stay adjacent to their function.** Inserting a helper
  between an annotation and its target produces a `SupportAnnotationUsage` lint failure.
- **Known flake, pre-existing:** `TelegramMediaRepairGatewayTest` (MockWebServer timing) fails
  occasionally on a full run and passes in isolation. Seen again at D6A2 on a different method of the
  same class. Not a real failure; re-run the class alone to confirm.
- **Writing `' '` into Kotlin through a file-writing tool can land a raw NUL byte**, which makes
  `grep` treat the file as binary and print nothing. If a grep over a file you just wrote returns
  nothing it should have matched, check for NUL bytes first.
- **`uv` is not installed.** The server repo's `.venv/bin/{ruff,mypy,pytest}` are the same toolchain.
