# Telegram Topic Uploader — cross-chat bootstrap

**Read this file first. Read `cc-latest.md` second.** This is the concise, authoritative starting
point for a brand-new managing conversation; `cc-latest.md` beside it is the detailed technical
handoff for the most recently completed milestone. Neither replaces the other, and **both are updated
at the end of every substantial milestone**.

This is the one canonical copy. It deliberately does **not** exist in the application repository, so
the two cannot drift.

Nothing in this file contains a real token, Telegram identifier, bot username or ID, chat ID, thread
ID, group or topic title, private link, binding command, nonce, file name, folder name, content URI,
path, media hash, or screenshot — and nothing added to it ever may.

---

## 1. Project identity

| Field | Value |
| --- | --- |
| Application repository | `https://github.com/funzi7/telegram-topic-uploader` |
| Local path | `/root/work/telegram-topic-uploader` |
| Agent-memory repository | `https://github.com/funzi7/agent-memory` |
| Local path | `/root/work/agent-memory` |
| Main branch (both) | `main`, tracking `origin/main` |
| Detailed handoff | `/root/work/agent-memory/telegram-topic-uploader/cc-latest.md` |
| This bootstrap | `/root/work/agent-memory/telegram-topic-uploader/chat-handoff.md` |

The application is a private, local-first Android app that uploads media from folders the user granted
through the Storage Access Framework into topics of a private Telegram forum supergroup, and — only
after Telegram provably has a file — can permanently delete the source.

## 2. Working model

- **ChatGPT is the manager, planner and verifier.** It writes the milestone specification, checks the
  result, and decides what ships.
- **Claude Code or Codex performs the implementation** inside the repository.
- **The user works from Android**, through Termux with a PRoot Debian environment. Everything runs on
  that device; there is no separate workstation.
- **Standard entry:** the user starts the agent in `/root/work/telegram-topic-uploader` and hands it
  the milestone specification, which names both repositories, both expected starting HEADs, and the
  mandatory inspection and UX-gate steps.
- **No destructive git, ever.** `git reset`, `git clean`, `git restore`, `git stash`, force push,
  destructive checkout, and using an alternate worktree to bypass local changes are all forbidden.
  Existing worktree changes are preserved, never discarded.
- **The two repositories are committed and pushed separately**, application first, agent-memory
  second. Both must end clean, zero ahead, zero behind.

## 3. Installation rule

- **Always show the Termux `cp` command before installation**, so the user can copy the built APK out
  of the PRoot filesystem to somewhere the Android installer can read, for example:

  ```
  cp /root/work/telegram-topic-uploader/app/build/outputs/apk/debug/app-debug.apk /sdcard/Download/
  ```

- **Install over the existing app.** The debug signing certificate has not changed since D5A, so every
  build applies in place.
- **Do not uninstall** unless it is proven necessary. An uninstall destroys the database, and with it
  every folder grant, destination, queue item, confirmation, ignore marker and deletion tombstone.

## 4. Current completed milestone

| Field | Value |
| --- | --- |
| Milestone | **D5C** — permanent deletion from Review and Preview, exact-duplicate groups, upload once and delete every re-proven exact copy |
| APP HEAD | `97125dcebf8b923757067ae52944d1d41a4358df` |
| MEM HEAD | recorded in the same session's final report; this file is committed as part of it |
| Version | versionCode `24`, versionName `0.12.0-d5c` |
| Room schema | **12** (from 11, by one additive `MIGRATION_11_12`; `12.json` committed) |
| Unit tests | 1 549 tests, 0 failures |
| Lint | No issues found |
| Builds | `assembleDebug` success; `assembleDebugAndroidTest` compiled only, no device attached |
| APK path | `app/build/outputs/apk/debug/app-debug.apk` |
| APK size | 15,417,390 bytes |
| APK SHA-256 | `283959d388267856ffc291b08e6042a0366443970bf7772e7fbcff4f0e86c0b9` |
| Signer | `CN=Android Debug, O=Android, C=US`, cert SHA-256 `74e78654979a76704d8036d5768359fea92dde6a7e6551e204c13d0e8f3cdfd4` |
| Device-tested? | **No.** Nothing in D5C ran on a device or emulator |

Previous milestone: D5B, APP HEAD `5da03f87d260f4cbcddc44601f649b677872b076`, versionCode 23,
schema 11 — **also device-untested in full**.

## 5. Current in-progress milestone

**None.** D5C is complete and pushed. The next session starts from:

| Field | Value |
| --- | --- |
| Expected starting APP HEAD | `97125dcebf8b923757067ae52944d1d41a4358df` |
| Expected starting MEM HEAD | the MEM head reported at the end of the D5C session |

**Never invent or predict a final HEAD before a milestone is actually committed.** A HEAD written down
before the commit exists is a fabrication, and downstream sessions will try to verify it.

The immediate next action is **device validation of D5C** against
`docs/D5C_DEVICE_CHECKLIST.md`, whose steps 4–10 permanently delete real files and must only be run on
disposable copies in a disposable folder.

## 6. Hardware-validation ledger

**Confirmed by the user, and only this:**

- **D5A check 1** — a folder shows the name Android reports for it, and a local alias can be set,
  shown and cleared without renaming anything on the device.
- **D5A check 2** — tapping a folder opens its own media page.
- **D5A check 3** — one disposable image was scanned, received a thumbnail, opened in Preview, and was
  uploaded.
- **One D5A defect**, since fixed in D5B but never re-confirmed on hardware: Back from the folder page
  went to the Dashboard instead of to where the user came from.

**Unvalidated on hardware:**

- **All of D5C.**
- **All of D5B** — it was never reported as installed or exercised.
- Every D5A check beyond 1–3: albums, Ignored and Restore across a rescan, manual permanent deletion,
  pull-to-refresh on every screen, destination popularity ordering, same-name sibling deletion safety,
  album no-retry.
- Everything left unvalidated after D4B and D4C.

**Rules.** Do not infer validation from automated tests, lint, or a successful build — none of them
touch a device. Manual checklists given to the user cover **only new behaviour and direct
regressions**; never ask for a full historical regression, token setup, multi-topic binding, or old
repair checks unless something visibly breaks.

## 7. Permanent product decisions

- **Local source profiles are organizational only.** A profile filters and batches Review. It selects
  no chat, no thread and no destination.
- **A local folder never auto-maps to a topic.** Since D4B the routing order is simply
  `manual -> manual review`; every destination decision is made by hand in Review, Preview, the folder
  page or a duplicate group's page.
- **Per-account mapping of local folders is ruled out** by the user and is not on the roadmap.
- **Remote source/account -> Telegram topic mapping is a separate future *server* capability**, never a
  local-folder feature.
- **Telegram confirmation is exact.** A deletion may only follow a strictly positive message ID **and**
  a committed confirmation timestamp **and** the expected destination, re-read from the durable row.
  Cancellation, retryable failure, rejection, incomplete response and `RESULT_UNKNOWN` delete nothing,
  ever, and `RESULT_UNKNOWN` is never retried.
- **Deletion is of one exact document.** Addressed by the granted tree plus the recorded provider
  document ID, after re-proving identity, size and a full fresh SHA-256. No name matching, no directory
  listing, no recursion, no bulk form.
- **Back is a verb, not a destination.** Back leaves whatever is on top: Preview first, otherwise pop
  exactly one navigation entry, otherwise this is the root and Android's own behaviour is left alone.
  A drawer selection clears above the Dashboard, so Back from a drawer-opened screen lands there
  because the Dashboard genuinely is beneath it. Nothing nested ever routes to the Dashboard.
- **Every upload keeps the file's own name** as the multipart filename.
- **9GAG captions only.** For a 9GAG-profile folder the caption is the file's own name minus the final
  extension, minus a trailing `-` plus ten or more ASCII digits, with hyphen runs collapsed to single
  spaces. Every other profile sends no caption. Nothing is generated, rewritten or translated.
- **Images are first-class** beside videos; several selected items may go separately or as one album;
  albums never retry.
- **Ignored is reversible** and touches no file. **Manual permanent deletion uploads nothing**, is
  never moved to Trash, and always requires an explicit irreversible confirmation.
- **Exact duplicates only.** Same complete SHA-256 over every byte plus the same exact byte size. No
  perceptual, partial, prefix, thumbnail, frame, duration or filename matching exists anywhere.

## 8. Latest UX decisions (D5C)

- **Exact duplicates require the same full SHA-256 and the same exact byte size**, both present and
  valid. A group needs at least two distinct physical documents.
- **The oldest copy is the default representative, and the user may change it** on the group page
  before confirming.
- **The representative controls the outgoing filename, the profile, and therefore the caption.**
- **A cross-profile group appears under every member's profile chip**, and its representative never
  changes with the chip.
- **The duplicate detail opens as a dedicated page**, so Back returns to Review at the exact scroll
  position.
- **Duplicate groups are excluded from the ordinary Review bulk selection**, from Send separately and
  from Send as album.
- **The explicit group action uploads one copy and, after an exact positive Telegram confirmation,
  automatically deletes every independently re-proven exact copy.** One confirmation before the
  upload, stating the counts; **no second confirmation afterwards**. Any copy that changed, is
  unreadable, is unwritable, or is still needed by another job stays.
- **No perceptual or partial matching**, and no wording anywhere says "similar" or shows a confidence.

## 9. Future roadmap that must not be lost

**The Remote Sources service — a future server milestone. Not started, not device-validated, and
nothing of it exists in the Android application.**

- **Platforms:** Instagram, TikTok, X/Twitter, **Reddit**, 9GAG.
- **Shape:** the Android app remains the management UI; a separate always-on server performs
  discovery, download, dedupe and delivery.
- **Tooling:** `gallery-dl` as the primary multi-platform discovery/downloader where suitable,
  `yt-dlp` as the video/extractor fallback, a self-hosted `cobalt` for suitable TikTok no-watermark
  extraction, `Instaloader` as the Instagram-specific fallback, Reddit OAuth/user-agent-aware
  ingestion.
- **Safety:** the existing Telegram positive-confirmation and exact-document deletion concepts are
  reused server-side rather than reinvented.
- **Mapping:** explicitly remote source/account -> Telegram topic. Local folder profiles stay
  organizational.
- **Scheduling:** conservative, adaptive and jittered, on an **hours** scale. **Never every ten
  minutes.** Less active sources back off further; stories and other expiring content may use a
  separate opt-in faster schedule; a 429, 403, CAPTCHA or session-risk signal causes a strong
  multi-hour backoff; no aggressive retry loops; source-specific last-seen IDs and archives prevent
  duplicates.

## 10. Agent rules

- **Stop-and-ask UX gate before implementation.** Inspect the actual current implementation first,
  identify the remaining *material* user-facing ambiguities, ask **one grouped question** with
  numbered options and short practical consequences and **no preselected default**, then stop and wait.
  Edit nothing — no migration, no version bump, no commit, no push — before the answer. D4B raised two
  questions, D4C three, D5A four, D5B one, D5C four.
- **Do not invent UX.** If the architecture and the specification do not already dictate one safe,
  obvious behaviour, it goes to the gate.
- **Bundle compatible changes into substantial milestones.** Do not ship a single hotfix on its own;
  fold it into the next substantive milestone.
- **Update `TODO.md` and the state documentation so no request disappears.** Every requested item gets
  an explicit status: completed, deliberately deferred with a reason, blocked, or device-untested.
- **Preserve privacy absolutely.** No real tokens, bot/chat/topic IDs, usernames, group or topic
  titles, file names, folder names, content URIs, paths, hashes, nonces, private links, or screenshots
  — not in code, tests, logs, commit messages, documentation, or agent memory. Every test fixture is
  synthetic.

## 11. New-chat startup procedure

A new managing chat must:

1. **Read this file first**, then `cc-latest.md`.
2. **Verify any supplied full APP/MEM HEADs against GitHub** before trusting them. A HEAD that does not
   exist upstream was fabricated or belongs to an unpushed session.
3. **Treat the current repository and agent-memory contents as the source of truth**, not any summary —
   including this one — if the two ever disagree.
4. **Continue from the recorded next action** in section 5 without asking the user to reconstruct the
   project's history.
