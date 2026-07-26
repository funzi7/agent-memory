# Telegram Topic Uploader — latest handoff

> **`chat-handoff.md`, beside this file, is the canonical cross-chat bootstrap.** A brand-new
> managing conversation reads that first and this second. **Every future milestone must update
> both**, and from D6A also `/root/work/agent-memory/telegram-remote-sources/cc-latest.md`.

## Task and repository state

| Field | Value |
| --- | --- |
| Task | **D6A1** — a production-blocking hotfix: D6A remote pairing was impossible on any real device |
| Application repository | `/root/work/telegram-topic-uploader` |
| Server repository | `/root/work/telegram-remote-sources` |
| Branch | `main`, tracking `origin/main` |
| Starting application HEAD | `d209e64` (D6A) |
| Starting server HEAD | `308b4c0` (D6A) |
| **Final application HEAD** | **`2a0f74e80cb68c20a955b422517110c30fb038f3`** (`2a0f74e`) |
| **Final server HEAD** | **`31d2edf088387dd262c617457dc5fce3e660739d`** (`31d2edf`) |
| Version | code 25 → **26**, name `0.13.0-d6a` → **`0.13.1-d6a1`** |
| Room schema | **12 → 12. Unchanged.** No migration runs. |
| Deployment | **Nothing.** No VPS access, no production credential, no device, no emulator, no pairing, no Telegram request. |

No production token, Telegram identifier, chat ID, thread ID, group title, topic name, private link,
VPS address, Tailscale hostname, tailnet name, pairing code, device token, platform credential, file
name, content URI, document ID, path, folder name, destination name or media hash was requested,
used or recorded anywhere, including this file. No raw production log was copied.

## What the first real pairing attempt established — sanitised

This is the whole reason D6A1 exists, and most of it was good news.

- The private HTTPS endpoint answered the phone. **Tailscale Serve works.**
- `POST /api/v1/pairing/exchange` returned **success**. The server minted a device token.
- The application then displayed its fail-closed sentence: *the device credential could not be
  stored safely, so pairing was not retained.* **That was true, not a bug in the message.**
- Re-using the already-consumed code afterwards was **refused**. That is the design working.
- Several further fresh attempts reached the server successfully and failed at local storage the
  same way, each leaving an active server-side device record whose plaintext nobody holds.

## Root cause — exact, and there were three

**Two** gates, not one, and both named the bot token specifically:

1. `security/SecretEnvelope.kt`, `SecretEnvelopePolicy.isSupportedReference` — returned true only for
   `SecretReferences.BOT_TOKEN`. **This one fires first**, so `SecretStore.put` for the remote token
   returned `InvalidReference` before storage was ever consulted. The task brief named only gate 2;
   this one is the primary.
2. `security/AndroidKeystoreSecretStore.kt`, `AndroidNoBackupSecretPayloadStorage.fileFor` — had a
   file only for `BOT_TOKEN` and returned `null` otherwise.

D6A declared `SecretReferences.REMOTE_DEVICE_TOKEN` and wired `KeystoreRemoteDeviceTokenStore` to
it, and extended neither layer beneath. **No amount of re-pairing, clearing data or reinstalling the
same APK could ever have worked.**

**The third defect, found while fixing those, was the dangerous one.**
`AndroidKeystoreSecretCrypto` used **one** Keystore alias for every reference, and
`EnvelopeSecretStore.removeBlocking` deletes the key on removal. Merely making the device token
storable would have meant a remote **disconnect** destroyed the key the **Telegram bot token** was
encrypted under — an intact envelope nothing could ever open, no error at the time, no recovery.

## The fix

**Per-reference files.** Constant `SecretReference -> file name` map. Bot token keeps
`telegram_bot_token.envelope` exactly; remote token gets `remote_device_token.envelope`. Distinctness
asserted in `init`; nothing derived from input; undeclared references still `null` and fail closed.

**Per-reference keys — this required a redesign, not an allowlist entry.** `SecretCrypto` now takes
the reference on `encrypt`, `decrypt` and `removeKey`, so a shared key is not expressible. Constant
`SecretReference -> alias` map. Bot token keeps `…bot_token.envelope_key.v1` exactly; remote token
gets `…remote_device_token.envelope_key.v1`.

**Compatibility was the design constraint.** The bot token's file name and alias are byte-for-byte
what they were, because a real device already holds an envelope encrypted under that alias. A
prettier scheme (`secret_<ref>.envelope`, an alias template) would have orphaned it. Two tests pin
both constants.

**The reference gate** now asks `SecretReferences.fromPersistentValue`, so a reference cannot be
declared without being storable.

**Pairing is a local transaction.** `RemoteViewModel.pair` → `completePairing`. A successful exchange
is not a pairing; both local writes must succeed. `settings.setBaseUrl`'s result is no longer
discarded. Either failure: remove partial state (`tokens.clear()` if the address write fails), send
**one** best-effort authenticated revoke with the token just issued, keep the existing fail-closed
sentence, **never** repeat the exchange.

**Token ownership during rollback.** `SecretStore.put` consumes and clears its input, so the rollback
takes **one** copy *before* the store gets the original, never assigns it to a field, and clears it
in a `finally` on every path including cancellation. `RemoteServerGateway.revokeIssuedToken` consumes
the array it is handed and clears it twice.

**No new server route.** The rollback reuses authenticated `POST /api/v1/device/revoke`, token in the
`Authorization` header only, redirects off.

## Why the suite did not catch it — the lesson worth keeping

**Every secret-store test used `SecretReferences.BOT_TOKEN`.** `SecretEnvelopeStoreTest` opens with
`private val reference = SecretReferences.BOT_TOKEN` and never uses another; the instrumentation test
did the same. A defect that made the milestone's headline feature impossible on every device shipped
with a completely green suite.

**A test that only ever exercises the enumerated value that already worked proves nothing about the
one just added.**

## Tests and exact results

```
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline testDebugUnitTest         # 1638 tests, 0 failures
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline lintDebug                 # No issues found
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebug             # success
GRADLE_USER_HOME=/root/.gradle ./gradlew --offline assembleDebugAndroidTest  # success (compiled only)
git diff --check                                                             # clean
```

1601 → **1638**, 37 added. New files:

- `security/SecretReferenceIsolationTest.kt` — both references round-trip; coexistence; cross-write,
  cross-remove, cross-corrupt and replay isolation **in both directions**; undeclared refused.
- `ui/RemotePairingTransactionTest.kt` — happy path; token-store failure; address-store failure after
  the token stored; rollback attempted **exactly once**; partial state removed; rollback failure
  fail-closed; arrays cleared; **no second exchange**; ordinary refusals still refusals; only `401`
  invalidates pairing.
- `security/D6A1SurfaceTest.kt` — no layer between `SecretReferences` and the disk may name one
  reference again; bot-token file name and alias pinned; no plaintext fallback.
- `androidTest/.../AndroidKeystoreSecretStoreTest.kt` gained six isolation tests against the **real**
  Keystore — **compiled, not run**, no device attached.

**Re-scoped, not deleted** — the pattern since D4C:

- version literal in **eight** surface tests, 25 → 26, and the name to `0.13.1-d6a1`;
- `SecretEnvelopeStoreTest`'s `JceSecretCrypto` became per-reference, **matching** the production
  contract rather than being loosened to accept it.

**No security assertion was weakened.** Every fail-closed rule the store had still holds.

## APK identity (debug development signing only)

| Field | Value |
| --- | --- |
| Package | `com.funzi7.telegramtopicuploader` — unchanged |
| Version | code 26, name `0.13.1-d6a1` |
| minSdk / targetSdk / compileSdk | 23 / 37 / 37 |
| Permissions | `INTERNET`, `ACCESS_NETWORK_STATE`, `RUN_USER_INITIATED_JOBS`, `POST_NOTIFICATIONS` — **unchanged. No camera.** |
| Path | `app/build/outputs/apk/debug/app-debug.apk` |
| Size | 15,714,515 bytes |
| SHA-256 | `27e046d3d8faea267d899b93a18b49259604132b17f3f5e7948eca7686392730` |
| Signer cert SHA-256 | `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` — **unchanged from D6A** |

**Install over the existing app. Do not uninstall, do not clear data.** The bot token's envelope was
deliberately left in place so it survives the upgrade — and step A3 of the checklist is the check.

## Hardware evidence, exactly as it stands

**No D6A remote end-to-end test has passed. Not one.** Pairing has never completed on a device, so
nothing past pairing — sources, review, send, history, disconnect — has ever run.

D6A1 removes the reason pairing failed. It **does not** demonstrate that anything past pairing works,
and D6A1 itself is unverified on hardware.

Still FAILED on hardware and untouched by D6A1: manual permanent deletion reporting success while the
file remained; the 42-item send whose status did not match Telegram; selection actions unreachable
without scrolling. All three were fixed in code at D6A and none re-verified.

Still the only passed checks, unchanged since D5A: checks 1, 2 and 3.

Unvalidated: **all of D6A, all of D5C, all of D5B**, every D5A check beyond 1–3, everything after
D4B and D4C.

## Next device action (ask for exactly this)

`docs/D6A1_DEVICE_CHECKLIST.md`, **in order** — the order is the point:

1. server: `remote-sources-ctl devices`, then `revoke-all-devices --confirm`, then `devices` again
   (expect `active: 0`);
2. install the APK **over** the app — no uninstall, no data clear;
3. **check the Telegram bot is still configured before anything else** (A3);
4. mint one code, pair immediately, confirm **Connected** and `active: 1`;
5. **disconnect, then check the bot token is still configured** (A6) — the shared-key defect's test;
6. only then Part B, which has never run.

Then `docs/D6A_DEVICE_CHECKLIST.md` **Part A** — the three regressions. It needs no server and is
still the highest-value thing to run. **A1 deletes real files**: insist on disposable copies in a
disposable folder and on checking the file manager rather than believing the application.

**Do not re-run the D5A, D5B or D5C checklists.**

## Env notes (still current)

- `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`; `aapt2` at `/opt/android-sdk/aapt2-wrapper/aapt2`.
- `apksigner` at `/opt/android-sdk/build-tools/36.0.0/apksigner`; `keytool -printcert -jarfile` also
  reads the APK's certificate.
- **`lint` takes ~3 minutes.** Run it in the background.
- **`kotlin.test` is not on the unit-test classpath.** Use `org.junit.Assert`.
- **minSdk 23 means no `java.time`**; no desugaring artefact in the offline cache.
- The offline Gradle cache has no media3, ExoPlayer, Coil, Glide, Picasso, DataStore or
  `androidx.exifinterface`.
- **`UnusedResources`, `PluralsCandidate` and `NewApi` all fail the zero-issue bar.** Delete strings
  from **both** locales — `LocalizationResourcesTest` compares key sets exactly.
- **A doc comment can trip a source-level guard.** Reword the comment, do not exempt the guard.
- **Surface tests pin the version literal.** Eight of them did at D6A1. Bumping the version means
  updating every one; that is the established pattern, not a weakened assertion.
- **Writing `' '` into a Kotlin source through a file-writing tool can land a raw NUL byte**,
  which makes `grep` treat the file as binary and silently print nothing. If a grep over a file you
  just wrote returns nothing it should have matched, check for NUL bytes first.
- **`uv` is not installed in this environment.** The server repo's `.venv/bin/{ruff,mypy,pytest}` are
  the same toolchain `uv run` would use.
