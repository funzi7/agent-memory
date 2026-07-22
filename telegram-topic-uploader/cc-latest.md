# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D1 — Android Keystore bot-token storage, explicit Telegram bot setup/validation, constrained HTTPS gateway, explicit forum-topic binding, and explicit connection testing |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting HEAD (D0) | `a8b5d77e6fc0d79d1873c5f4b49c5c04b43964bb` |
| Final application HEAD | `3fb09595ecabf625f76d2d040f3f274755d8ccf7` |
| Application commit | `feat: D1 secure bot setup and explicit forum-topic binding` (56 files, 10,841 insertions, 918 deletions) |
| Push | Successful (`a8b5d77..3fb0959`); `main` verified clean at 0 ahead / 0 behind |
| Deployment | None |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title,
private link, binding nonce, or user-media reference was requested, used, or recorded anywhere,
including this file.

## Session split: Codex work vs Claude takeover

D1 was implemented across two sessions. Codex worked ~2 hours and stopped only at its usage limit,
leaving all work uncommitted (staged plus a final unstaged batch). The Claude takeover session
preserved every Codex change unchanged (no reset/clean/restore/stash; backup patches in
`/root/work/` were never needed — the working tree already contained everything).

**Codex implemented (all of the D1 feature surface):**

- `SecretEnvelope`/`AndroidKeystoreSecretStore`: AndroidKeyStore AES/GCM/NoPadding, fresh IV per
  encryption, non-exportable 256-bit key (128-bit StrongBox fallback), version/reference/generation
  bound as GCM AAD, payload in `noBackupFilesDir` via `AtomicFile`, fail-closed typed results for
  corrupt/truncated/unsupported/key-unavailable states, buffer zeroization.
- `TelegramSetupService` + `BotTokenInputValidator`: explicit save/replace/remove, explicit
  `getMe` validation only (no launch-time network), token-generation coherence between Room and the
  envelope, `withValidatedToken` scoped access with zeroization.
- `TelegramBotApiGateway`: fixed `https://api.telegram.org/` host, only getMe / setup-only
  getUpdates / explicit text sendMessage, bounded timeouts, no logger/cache/redirects/auto-retry,
  sanitized message-less typed errors (OkHttp exceptions that embed the token URL are never
  propagated), streaming JSON parsing, Long identifiers throughout.
- `TopicBindingCoordinator`/`TopicBinding`/`BindingNonceGenerator`: SecureRandom 32-hex-char nonce,
  10-minute one-time sessions, exact `/ttu_bind_<nonce>` matching incl. optional
  `@validated_bot_username`, polling only while explicitly listening, monotonic offset progression
  persisted before candidate surfacing, fail-closed rejection of private/channel/non-forum/
  General-topic (`is_topic_message` required, positive `message_thread_id`)/stale/bot-sender/
  expired/token-changed/malformed evidence, explicit review+confirm before any persistence,
  trigger-backed `(chatId, threadId)` uniqueness, explicit unbind, explicit connection test with
  positive message-ID + destination-consistency verification, durable RESULT_UNKNOWN gating with
  NonCancellable persistence on cancellation and no automatic retry.
- Room schema 2: additive `MIGRATION_1_2` (new `telegram_setup` singleton, four nullable binding
  columns on `topic_destinations`, lookup index, uniqueness triggers), exported `2.json`, no
  destructive fallback, legacy binding metadata downgraded to RETEST_REQUIRED.
- UI: D0 navigation preserved, obscured token entry (password transformation, plain `remember`,
  cleared before save callback), FLAG_SECURE window-wide, EN/HE parity (142 = 142 keys), setup/
  validation/binding/confirmation/unbind/test states.
- 20 JVM test classes plus 3 instrumented classes (Keystore store, migration 1→2, D1 persistence),
  docs rewrite, `docs/D1_DEVICE_CHECKLIST.md`.

**Claude completed (takeover session):**

- Full diagnosis; three independent deep reviews (secret storage, gateway/binding, Room/UI) — all
  D1 requirements verified compliant; no secret leakage found by repo-wide token-pattern sweeps.
- Fixed one real defect found in review: a stale binding poll loop resuming from backoff could
  overwrite a newer session's UI state with `Expired`. All poll-loop state writes are now gated on
  the loop's session still being the active listening session (`TopicBindingCoordinator`), with a
  regression test (`stale poll loop cannot overwrite a replacement binding session`).
- Re-ran full validation (below), refreshed stale doc numbers (test count 139→141, new main-APK
  SHA-256), added takeover note and review-finding risks to `docs/PROJECT_STATE.md`, added
  `.claude/` to `.gitignore`, committed and pushed.

## Commands and exact final results

| Command/check | Result |
| --- | --- |
| `./gradlew test` | Passed: 141 tests across 20 classes; 0 failures, 0 errors, 0 skipped. |
| `./gradlew lint` | Passed; final lint XML contains 0 issues. |
| `./gradlew assembleDebug` | Passed. |
| `./gradlew assembleDebugAndroidTest` | Passed; instrumentation APK compiled only (no device). |
| `git diff --check` (unstaged and staged) | Passed. |
| `adb devices -l` | Ran successfully; zero attached devices. |
| APK ZIP integrity | Both APKs passed `unzip -t`. |
| AAPT2 badging | `com.funzi7.telegramtopicuploader`, versionCode 2, versionName `0.2.0-d1`, minSdk 23, targetSdk 37; permissions: INTERNET plus AndroidX injected app-scoped receiver permission only; `usesCleartextTraffic=false`; `allowBackup=false`; `fullBackupContent=false`. |
| `apksigner verify` | Verifies with v1+v2 debug schemes, one signer. |
| Update compatibility (static) | D1 signer certificate SHA-256 identical to preserved D0 debug APK (`/tmp/telegram-topic-uploader-d0-debug.apk`, which matches its recorded D0 hash); same package; versionCode 1→2. No device install performed. |
| Secret leakage sweep | Token-pattern and identifier greps over the repo: zero matches; test fixtures are deliberately non-token-shaped synthetic values. |

Final artifacts (debug development signing only):

- Main APK: `app/build/outputs/apk/debug/app-debug.apk`, 14,282,619 bytes,
  SHA-256 `458f83aee3994e55604802b6fc4e10a3a3b55120a6abee57510331404d9d5e70`.
- Instrumentation APK: `app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk`,
  1,340,321 bytes, SHA-256 `0419ad7434195b45fe06f330bef00af43858752827c8890021de6103b9da8db1`
  (unchanged from the Codex build; androidTest sources were not touched in the takeover).

Room: schema version 2, explicit `MIGRATION_1_2` registered, `2.json` exported and committed,
schema 1 unchanged, no destructive fallback.

## Failures and fixes in the takeover session

- The stale-poll-loop race described above (found by review, fixed, regression-tested).
- `git add -A` initially failed on a transient `.claude/settings.local.json` tmp file (local agent
  tooling state); resolved by adding `.claude/` to `.gitignore`.
- No test, lint, or build failure occurred at any point in the takeover session.

## Evidence classification

USER-REPORTED D0 evidence only (not observed or performed by any agent): the D0 APK installed and
launched; navigation worked; Hebrew/RTL was checked; directory selection worked; the mapping
persisted after restart; disable/remove was checked; no files were deleted.

Not physically tested by either D1 session: D1 APK installation/update/launch, any Compose UI
behavior on a device, Android Keystore or Room migration instrumentation execution, real Telegram
`getMe`/`getUpdates`/binding/test messaging (all network tests used local MockWebServer or fakes
only), any media scan/hash/upload/copy/download/quarantine/deletion, share target, external
automation, AI, release signing, distribution, deployment.

## Risks and architectural decisions

- Keystore/migration/UI behavior is compiled and unit/static-verified but not device-executed; the
  unexecuted controlled checklist is `docs/D1_DEVICE_CHECKLIST.md`.
- The token transiently exists as immutable JVM `String`s at the Compose field and in the OkHttp
  URL; unavoidable, mitigated by no-logging/no-cache/no-saved-state and sanitized errors.
- Permanent Keystore key invalidation leaves saves failing closed until explicit token removal
  deletes the dead alias (recoverable but non-obvious).
- `validateToken` holds the token-mutation mutex across `getMe`; concurrent save/remove waits out
  the network timeout in the worst case (intentional coherence trade-off).
- Cancelling a connection test before dispatch persists RESULT_UNKNOWN and durably gates further
  tests until rebind/unbind — over-conservative in the safe direction.
- A `getUpdates` page containing an update without `update_id` is rejected whole (fail closed);
  binding cannot proceed past it until the backlog ages out.
- Schema-v1 duplicate non-null chat/thread evidence is preserved as RETEST_REQUIRED; new duplicates
  are trigger-rejected.
- Binding uniqueness relies on SQLite triggers plus an in-transaction pre-check, not a unique index.

## Remaining D2 work

SAF-scoped media discovery, streaming SHA-256 before reservation, transactional
`(sha256, topicDestinationId)` reservation, upload-job creation via deterministic routing, queue
claiming/attempt accounting/recovery, constrained background transfer coordination, revoked-grant
detection and reauthorization, and large-file/provider-failure/process-restart/duplicate-race/
update-from-D1 tests. D1 must remain free of media transfer side effects; none were added.

## Deployment declaration

Nothing was deployed, distributed, installed, or run on a device/emulator in the D1 sessions. No
Telegram production request, no media upload, and no media deletion occurred.
