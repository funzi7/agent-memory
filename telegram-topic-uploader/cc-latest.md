# Telegram Topic Uploader — latest handoff

## Task and repository state

| Field | Value |
| --- | --- |
| Task | D1.1 — focused bugfix: accept forum-topic binding commands sent by an anonymous supergroup administrator |
| Application repository | `/root/work/telegram-topic-uploader` |
| Branch | `main` |
| Tracking branch | `origin/main` |
| Starting application HEAD | `3fb09595ecabf625f76d2d040f3f274755d8ccf7` (D1) |
| Final application HEAD | `f0a9184e48e0124b076f3ba14edf924eb52c4a4c` |
| Application commit | `fix: accept anonymous-administrator forum-topic binding commands (D1.1)` (16 files, 983 insertions, 87 deletions) |
| Push | Successful (`3fb0959..f0a9184`); `main` verified clean at 0 ahead / 0 behind |
| Version | code 2 -> 3, name `0.2.0-d1` -> `0.2.1-d1.1` |
| Deployment | None |

No production token, Telegram identifier, bot username/ID, chat ID, thread ID, group title,
private link, binding nonce/command, screenshot, or user-media reference was requested, used, or
recorded anywhere, including this file.

## Confirmed root cause

Telegram Bot API `Message` semantics:

- `sender_chat` identifies the chat a message was sent on behalf of.
- For an anonymous supergroup administrator, `sender_chat` **is the supergroup itself**.
- For backward compatibility with older bots, Telegram also fills `from` with a **fake** sender in
  non-channel chats, and that fake sender can carry `is_bot: true`.

D1's `TelegramBotApiGateway` never parsed `sender_chat`, and `TopicBindingValidator` rejected
`senderIsBot == true` unconditionally with `BOT_SENDER`. Every anonymous-administrator binding
command was therefore discarded. This was a false-negative availability defect — nothing incorrect
could bind because of it.

## Implementation

- `TelegramBotApiGateway.readMessage` parses the optional `sender_chat` object with the **existing
  bounded `readChat` parser**. Presence is reported from the JSON key itself (`senderChatSeen`), so
  a present-but-unusable `sender_chat` is never mistaken for an absent one. A structurally malformed
  `sender_chat` still fails the whole page closed as `MALFORMED_RESPONSE` via the existing
  parse-exception path.
- `TelegramUpdate` gains `hasSenderChat: Boolean = false`, `senderChatId: Long? = null`,
  `senderChatType: TelegramChatType? = null`. Defaults keep every existing construction site
  meaning-preserving and fail-closed (absent => ordinary-user path).
- `BindingMessageEvidence` gains the same three fields using the project's existing `String`
  chat-type representation. `TelegramChatType -> String` mapping was extracted into a shared
  `toEvidenceChatType()` helper in `TopicBindingCoordinator.kt` and reused for both chat and
  sender chat.
- `TopicBindingValidator` now runs the chat checks (nonzero ID, `supergroup`, `is_forum`,
  `is_topic_message`) **before** classifying the author, then classifies:
  - no `sender_chat` + `from.is_bot` not true -> USER (accept)
  - no `sender_chat` + `from.is_bot` true -> BOT (`BOT_SENDER`)
  - no `sender_chat` but sender-chat ID/type present anyway -> `UNTRUSTED_SENDER_CHAT` (inconsistent)
  - `sender_chat` present, ID == message chat ID, type == `supergroup` -> ANONYMOUS_ADMINISTRATOR
    (accept; `from` ignored entirely)
  - `sender_chat` present with missing/different ID (linked channel, other chat) ->
    `UNTRUSTED_SENDER_CHAT`
  - `sender_chat` present with channel/private/group/unknown/missing type -> `UNTRUSTED_SENDER_CHAT`
- New `BindingRejectionReason.UNTRUSTED_SENDER_CHAT` is an internal diagnostic only. Per-update
  rejections never reach the UI (only `Invalidated` batch reasons map to `BindingIssue`), so UI
  errors stay sanitized and **no new string resource was needed**.
- No sender identity (user or chat) reaches `TopicBindingCandidate`, Room, or the UI. Sender-chat
  evidence lives only inside the evaluation of a single update.
- No existing D1 rejection was weakened; the secure token design is untouched. Room schema
  unchanged (still version 2).

Files changed (16): `app/build.gradle.kts`, `TelegramGateway.kt`, `TelegramBotApiGateway.kt`,
`TopicBinding.kt`, `TopicBindingCoordinator.kt`, 4 test files, `README.md`, `TODO.md`, and
`docs/{ARCHITECTURE,PROJECT_STATE,RELEASE_REVIEW,SECURITY,D1_DEVICE_CHECKLIST}.md`.

## Tests and exact results

15 new JVM regression tests; total 141 -> **156 tests across 20 classes, 0 failures, 0 errors,
0 skipped**. Each new test was verified individually as PASS by name from the JUnit XML.

- `TopicBindingValidatorTest` (+7, 12 total): anonymous admin accepted with fake `is_bot=true` and
  with `@bot_username` suffix; candidate carries only chat/thread; linked-channel and other-chat
  sender IDs rejected; wrong sender-chat type at matching ID rejected; malformed/inconsistent
  evidence fails closed; real bot without `sender_chat` still `BOT_SENDER`; anonymous evidence still
  obeys command/freshness/expiry/token/destination/forum/topic/thread rules.
- `BindingBatchProcessorTest` (+1, 5 total): anonymous-admin command is the single candidate while
  an untrusted linked-channel copy is acknowledged not bound; offset still advances.
- `TopicBindingCoordinatorTest` (+3, 19 total): synthetic anonymous-admin `getUpdates` page reaches
  `CandidateFound` and confirms; `@bot_username` suffix variant accepted; linked channel + real bot
  in one page produce no candidate while the offset advances.
- `TelegramBotApiGatewayTest` (+4, 19 total): anonymous-admin JSON yields expected sender-chat ID
  and type; linked-channel vs ordinary-user pages distinguished; present-but-unusable `sender_chat`
  reported as present; structurally malformed `sender_chat` -> `MALFORMED_RESPONSE`.

Focused gateway + binding suites alone: 56 tests, 0 failures. All pre-existing offset-progression,
command, forum, topic, expiration, redaction, and security-surface tests remain green. No automated
test contacts Telegram production — MockWebServer and fakes only; fixtures are synthetic non-secret
values.

| Command/check | Result |
| --- | --- |
| `./gradlew test` | Passed: 156 tests, 20 classes, 0 failures/errors/skipped. |
| `./gradlew lint` | Passed; lint XML contains 0 issues. |
| `./gradlew assembleDebug` | Passed. |
| `./gradlew assembleDebugAndroidTest` | Passed; 15 instrumentation tests compiled, none executed. |
| `git diff --check` | Passed. |
| `adb devices -l` | Ran successfully; **zero attached devices**. |
| APK ZIP integrity | Both APKs passed `unzip -t`. |
| AAPT2 badging | `com.funzi7.telegramtopicuploader`, versionCode 3, versionName `0.2.1-d1.1`, minSdk 23, targetSdk 37; permissions INTERNET + AndroidX injected app-scoped receiver permission only; `usesCleartextTraffic=false`; `allowBackup=false`; `fullBackupContent=false`. |
| `apksigner verify` | Verifies with v1+v2 debug schemes, one signer. |
| D1 -> D1.1 update compatibility (static) | Same package, **same certificate digest**, unchanged min/target SDK and permission set, versionCode 2 -> 3. No device install performed. |
| Leakage sweep | Token-shaped patterns, `t.me`/`joinchat`, real-looking chat IDs: zero matches outside deliberately synthetic fixtures. |
| Logger/permission check | No HTTP logger and no broad storage/media permission added. |

## GOTCHA: debug keystore moved between sessions

`HOME` changed from `/root` to `/home/devagent` between the D1 and D1.1 sessions. Gradle therefore
generated a **new** debug keystore and the first D1.1 APK was signed with certificate
`c4c3d2dd…` instead of D1's `74e78654…` — that APK would have failed to install over the D1 build on
the device. Fixed by copying `/root/.android/debug.keystore` over `/home/devagent/.android/`
(the new one is backed up in the session scratchpad) and doing a `clean` rebuild.

Also: the Gradle dependency cache lives at `/root/.gradle`, not the new `$HOME/.gradle`, and the
sandbox has no network. Build with `GRADLE_USER_HOME=/root/.gradle ./gradlew --offline …`.
`/root/.gradle/gradle.properties` sets the qemu aapt2 wrapper. Verify the signer digest against a
preserved D1 APK before claiming update compatibility in future sessions.

## Artifacts (debug development signing only)

- Main APK: `app/build/outputs/apk/debug/app-debug.apk`, 13,758,427 bytes,
  SHA-256 `cb96f9c4b44b8b685a17c172e52c88a0507d6877d32480dea1582b171cea529e`.
- Instrumentation APK: `app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk`,
  1,328,226 bytes, SHA-256 `82f46e66a9b58bfef0041ffbaa374ae1dec28a0922e75bc26db8f9b14ba5949b`.
- Package `com.funzi7.telegramtopicuploader`; versionCode 3; versionName `0.2.1-d1.1`; minSdk 23;
  compile/target SDK 37.
- Debug certificate SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4`
  (identical to D1 and D0). Development debug signing, not release signing.

## Evidence classification

USER-REPORTED D1 device evidence only — not observed or performed by any agent:

- the D1 APK was installed and launched on an Android device;
- bot-token setup and validation were sufficient to start a binding session;
- a binding command sent by an anonymous administrator was **not detected**, with the Telegram
  composer showing "Send anonymously";
- after anonymous administrator mode was disabled and a fresh binding session was used, the
  candidate was detected and the binding was confirmed;
- the explicit connection-test message was successfully sent by the bot to the selected forum topic.

Nothing else from the device checklist is claimed. Directory-migration preservation, token
replacement/removal, restart persistence, and the remaining checklist items were **not** separately
reported and were not observed.

AGENT-OBSERVED in D1.1: repository/Git/source inspection; JVM tests, lint, Kotlin and instrumentation
compilation, both APK assemblies; ZIP, AAPT2 manifest, signature/certificate, permission and backup
inspection; the static D1-to-D1.1 update comparison against the preserved D1 APK; leakage and
logger/permission sweeps; ADB running successfully with zero attached devices.

UNTESTED device behaviour: the D1.1 APK has **never** been installed, updated over D1, launched, or
run. The anonymous-administrator fix has never been exercised against real Telegram traffic. Android
Keystore and Room migration instrumentation were compiled only. No real `getMe`/`getUpdates`/
binding/test message, forum permission, or rate-limit behaviour was observed. No media
scan/hash/upload/copy/download/quarantine/deletion, share target, external automation, AI, release
signing, distribution, or deployment.

## Remaining device regression (not executed)

`docs/D1_DEVICE_CHECKLIST.md` now has a D1.1 section: install D1.1 over D1; re-enable anonymous
administrator mode; start a **fresh** binding session; send the new command anonymously in a
non-General forum topic; start listening; confirm the candidate is detected; confirm the binding;
send the explicit test message; verify exactly one bot message in the selected topic; verify ordinary
non-anonymous binding still works if retested. Plus optional negative checks (linked-channel post,
General topic, non-forum chat). Do not record the real command or any Telegram identifier.

## Risks

- The fix is verified only by synthetic fixtures modelled on the documented Bot API shape; the real
  anonymous-admin payload was never observed by an agent. The device regression is the only
  end-to-end confirmation.
- Trust anchor is `sender_chat.id == chat.id` + type `supergroup`. This accepts **any** anonymous
  administrator of the target group — intended, since Telegram does not reveal which administrator
  sent an anonymous message; command secrecy and the 10-minute session remain the controls.
- A present-but-unusable `sender_chat` is treated as present and rejected. An explicit
  `"sender_chat": null` (which Telegram does not send) would be rejected rather than treated as an
  ordinary user message — deliberately over-conservative.
- `TelegramUpdate`/`BindingMessageEvidence` gained defaulted fields; a future producer that forgets
  them silently takes the ordinary-user path. The gateway is the only production producer.
- The debug-keystore divergence above would have produced an uninstallable update if uncaught.
- All pre-existing D1 risks still apply (Keystore/migration/UI not device-executed; token transiently
  immutable in the OkHttp URL; `validateToken` holds the mutex across `getMe`; cancelled test persists
  RESULT_UNKNOWN; a page with a missing `update_id` fails closed; schema-v1 duplicate pairs are
  RETEST_REQUIRED; binding uniqueness relies on SQLite triggers plus an in-transaction pre-check).

## Remaining D2 work (not started)

SAF-scoped media discovery, streaming SHA-256 before reservation, transactional
`(sha256, topicDestinationId)` reservation, upload-job creation via deterministic routing, queue
claiming/attempt accounting/recovery, constrained background transfer coordination, revoked-grant
detection and reauthorization, and large-file/provider-failure/process-restart/duplicate-race/
update-from-D1 tests. D1.1 added no media capability of any kind.

## Deployment declaration

Nothing was deployed, distributed, installed, or run on a device/emulator in the D1.1 session. No
Telegram production request, no media upload, and no media deletion occurred.
