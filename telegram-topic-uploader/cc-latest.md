# Telegram Topic Uploader — latest handoff

> **`chat-handoff.md`, beside this file, is the canonical cross-chat bootstrap.** A brand-new
> managing conversation reads that first and this second. **Every future milestone must update
> both**, and from D6A also `/root/work/agent-memory/telegram-remote-sources/cc-latest.md`.

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D6A — Remote Sources against a new private server, plus three defects the user reported from ordinary device use |
| Application repository | `/root/work/telegram-topic-uploader` |
| Server repository | `/root/work/telegram-remote-sources` — **new this milestone**, first commit |
| Branch | `main`, tracking `origin/main` |
| Starting application HEAD | `97125dc` (D5C) |
| Version | code 24 → **25**, name `0.12.0-d5c` → **`0.13.0-d6a`** |
| Room schema | **12 → 12. Unchanged.** No migration runs. |
| Deployment | The **server** was deployed to a live VPS. The **application** was not installed or run on any device or emulator. |

No production token, Telegram identifier, chat ID, thread ID, group title, topic name, private link,
VPS address, Tailscale hostname, tailnet name, pairing code, device token, platform credential, file
name, content URI, document ID, path, folder name, destination name or media hash was requested,
used or recorded anywhere, including this file.

## Hardware evidence, exactly as it stands

**This is the section that changed most, and not in the good direction.**

### Newly reported by the user, and therefore currently FAILED on hardware

1. **Manual permanent deletion.** The application reported success and the source file was still on
   the device. Fixed in code this milestone. **Not re-verified on a device.**
2. **A 42-item send.** The application showed an album failure; most items were in the Telegram topic
   as individual posts; **three** were missing; album rows stayed in the Queue with no usable action.
   Fixed in code this milestone. **Not re-verified on a device.** The user suspected a 50 MB limit;
   that is **consistent with the evidence but not proven** for those particular three items.
3. **Selection actions unreachable without scrolling to the top.** Usability, not correctness. Fixed
   in code. **Not re-verified.**

### Still the only passed checks — unchanged since D5A

- D5A check 1 — a folder shows its real name; a local alias can be set, shown and cleared.
- D5A check 2 — tapping a folder opens its own media page.
- D5A check 3 — one disposable image scanned, thumbnailed, previewed and uploaded.
- Plus one D5A defect (Back went to the Dashboard) that D5B fixed and nobody has confirmed.

### Unvalidated on hardware

**All of D6A. All of D5C — the formal duplicate checklist has still not been run. All of D5B.** Every
D5A check beyond 1–3. Everything left after D4B and D4C.

**No previously listed checklist item is marked passed from the three reports above.** The user
described three problems; that is not a regression run.

## The UX gate

Four genuine ambiguities, asked as one grouped question, answered before a single file was edited.

1. **Pairing: typed private URL plus a short one-time code.** Not QR — so **no camera permission**,
   and the permission set is unchanged from D5C.
2. **Three separate drawer entries**, not one screen with tabs.
3. **Caption: the original platform title only.** No source link, no author handle, nothing generated.
4. **Three named schedule presets** — Relaxed ≈8h, Normal ≈4h, Attentive ≈2h — not a raw interval
   field and not a single opaque adaptive mode.

D4B raised two, D4C three, D5A four, D5B one, D5C four, D6A four.

## The three fixes, and what was actually wrong

### R2 — deletion truthfulness

The cause was **not** the addressing, which was already exact, and **not** the handling of a `false`
return, which was already correct. It was that `DocumentsContract.deleteDocument` returning **`true`**
was treated as proof of absence. It is not: it means the provider accepted the request, and some
providers return it for an operation that removed only an index entry.

`AndroidDocumentDeleter` now re-checks the exact document with **two** probes:

- a **metadata query** — which most providers answer honestly but which can be served from a stale
  cursor cache;
- an **open** — which defeats that cache because a real read has to reach the file, but which some
  providers legitimately refuse for a document that does exist.

A query saying *absent* is believed; a query saying *present* is confirmed by the open; anything else
is `Unknown`. Two new `DocumentDeletionResult` members — `NotActuallyDeleted` and
`DeletionUnverified` — are **failures at all three gates**. Because the type is a sealed interface and
all three gates match exhaustively, adding them produced a compile error at exactly the three places
that needed a decision.

**The trade, stated plainly:** the application is now strictly more conservative. A provider that
deletes correctly but answers the verification ambiguously will be reported as unverified. That is a
much safer error than the one being fixed, but it means a false "could not confirm" on real hardware
is still a finding worth reporting.

### R3 — album reconciliation

The per-item truth was never missing. Every album member is an ordinary `UploadJob` with its own
status, `telegramMessageId` and `telegramConfirmedAt`; the album is a **grouping**, not an owner. The
Queue projected the shell's state over its members, so one failed album made 42 items look unsent
including the confirmed ones. The three that never arrived had already been refused for exceeding the
documented 50 MB ceiling, and `MEDIA_TOO_LARGE` was on each row — the reason simply never reached a
screen.

`AlbumReconciliationPolicy` reads each member's own row. **Positive Telegram evidence outranks the
album's own state** — a strictly positive message ID plus a committed confirmation timestamp, the
same proof the deletion path requires before removing a byte. A row *claiming* a confirmed status
without that evidence is `RESULT_UNKNOWN`, not "delivered". Retry safety is unchanged:
`dispatchStartedAt` is set immediately before the request, so its absence is the durable proof
nothing left the device.

`UploadSizePreflight` adds the other half — naming oversized items **before** the confirmation. It
reuses limits this codebase already had; nothing was invented from the user's report.

### R1 — persistent selection actions

The bar was a `fullWidth` item **inside** the `LazyVerticalGrid`. `PersistentSelectionActions` draws
the same actions pinned outside it, reading the same selection and calling the same handlers.
Deliberately **not** one floating button: two send modes are two outcomes in the topic.

## Also fixed

The drawer filtered out only `FOLDER`, so D5C's `DUPLICATE_GROUP` page appeared as a drawer entry
despite its own declaration saying it must not — and opening it from there produced a page about no
group at all. Pre-existing since D5C.

## Schema decision: 12 stays 12

Room in this project holds **evidence** — what was discovered, reserved, confirmed, deletable.
Remote data is not evidence this application owns; the server owns it, and persisting it here would
create the second source of truth the specification forbids. The device token goes to the existing
Keystore-backed `SecretStore` under a new `SecretReferences.REMOTE_DEVICE_TOKEN`, through a narrow
`RemoteDeviceTokenStore` port that cannot reach the bot token. The private server address goes to a
single-value private preference. Nothing else is persisted.

## Tests and exact results

```
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline testDebugUnitTest      # 1601 tests, 0 failures
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline lint                   # No issues found
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebug          # success
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebugAndroidTest  # success (compiled only)
git diff --check                                                          # clean
```

New: `RemoteContractTest`, `DeletionTruthfulnessTest`, `AlbumReconciliationTest`.

**Re-scoped, not deleted** — the pattern since D4C:

- version literal in **seven** surface tests, 24 → 25;
- `D5BSurfaceTest` list-state count 5 → **8** (three new remote screens);
- `D3B2SurfaceTest` `retryOnConnectionFailure(false)` count 4 → **5** — the remote client is held to
  the same no-replay rule, for the same reason;
- `FakeDocumentDeleter` gained `claimsSuccessButKeeps` and `unverifiable`, reproducing the exact
  provider behaviour the user met.

**One guard fired correctly and was NOT weakened.** The "media mutation is unreachable" tests grep
production sources for `deleteDocument`; a new doc comment mentioned the API by name. The **comment
was reworded** rather than the guard exempted. A guard that must be exempted to describe itself has
stopped being a guard.

**Known flake, pre-existing:** `TelegramMediaRepairGatewayTest > a D3B2 cancellation ends the live
edit…` failed once mid-session and passed on rerun (MockWebServer timing). Do not copy that fixture.

## APK identity (debug development signing only)

| Field | Value |
| --- | --- |
| Package | `com.funzi7.telegramtopicuploader` |
| Version | code 25, name `0.13.0-d6a` |
| minSdk / targetSdk / compileSdk | 23 / 37 / 37 |
| Permissions | `INTERNET`, `ACCESS_NETWORK_STATE`, `RUN_USER_INITIATED_JOBS`, `POST_NOTIFICATIONS` — **unchanged. No camera.** |
| Path | `app/build/outputs/apk/debug/app-debug.apk` |
| Size | 15,714,534 bytes |
| SHA-256 | `320f52f8697472b854f12bf547c51a895f99d09dc87c1bac0194da254e338bcc` |
| Signer | `CN=Android Debug, O=Android, C=US`, RSA, cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` |
| Schemes | v1 yes, v2 yes (v3/v3.1/v4 not used) |

Signer unchanged, so it installs **over** D5C without an uninstall. The schema did not move, so no
migration runs.

## Next device action (ask for exactly this)

`docs/D6A_DEVICE_CHECKLIST.md`, **Part A first** — the three reported regressions. **A1 deletes real
files**: insist on disposable copies in a disposable folder, and insist they check the file manager
after each deletion rather than believing the application.

Priority: **A1, then A3, then A2.** The first two are the application saying something untrue.

Part B needs the server, which needs Tailscale authorization and credentials — neither done.

**Do not re-run the D5A, D5B or D5C checklists.** Ask only that their remaining checks continue
during ordinary use and that failures are reported.

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at `/opt/android-sdk/aapt2-wrapper/aapt2`.
- `apksigner` at `/opt/android-sdk/build-tools/36.0.0/apksigner`.
- **`lint` takes ~3 minutes.** Run it in the background.
- **`kotlin.test` is not on the unit-test classpath.** Use `org.junit.Assert`. `assertContentEquals`
  does not exist here; `assertEquals` over lists does.
- **minSdk 23 means no `java.time`**, and the offline cache has no desugaring artefact — `IsoInstant`
  parses ISO-8601 by hand for exactly that reason.
- The offline Gradle cache still has no media3, ExoPlayer, Coil, Glide, Picasso, DataStore or
  `androidx.exifinterface`. D6A needed none.
- **`UnusedResources`, `PluralsCandidate` and `NewApi` all fail the zero-issue bar.** A string with
  `%d` followed by a word must be a `<plurals>`; Hebrew plurals need `one`/`two`/`other`. Delete from
  **both** locales — `LocalizationResourcesTest` compares key sets exactly.
- **A doc comment can trip a source-level guard.** Reword the comment, do not exempt the guard.
- Adding a member to a sealed interface that gates match exhaustively is the *good* kind of breaking
  change: the compiler names every place that needs a decision.
