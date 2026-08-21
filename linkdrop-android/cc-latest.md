# LinkDrop — Milestone 6 handoff

## Identity and released state

| Field | Value |
| --- | --- |
| Repository | `funzi7/linkdrop-android` |
| Branch / upstream | `main` / `origin/main` |
| Verified starting application HEAD | `1e323c3069bb68ff848693254fbda7deed0e6b62` |
| Final pushed application HEAD | `90d3fc26480b506645c3aa7524667bfb98388573` |
| Verified starting agent-memory HEAD | `8345f4921fdb51d7e48d4107fbc143ae7958333f` |
| Android identity | `com.funzi7.linkdrop`; versionCode 7; versionName `0.1.6-feasibility` |
| SDK / ABI | minSdk 30 / targetSdk 36 / compileSdk 37 / `arm64-v8a` only |
| Room | schema 3; registered non-destructive `1 -> 2` and `2 -> 3` migrations |
| Git identity | `funzi7 <207505227+funzi7@users.noreply.github.com>` |
| Prerelease | [`v0.1.6-feasibility`](https://github.com/funzi7/linkdrop-android/releases/tag/v0.1.6-feasibility) |
| Prerelease target / tag | `90d3fc26480b506645c3aa7524667bfb98388573` |
| Release asset | `LinkDrop-v0.1.6-feasibility-arm64-debug.apk`, 126,689,139 bytes |
| APK SHA-256 | `a829b33f5298b87151ec7c05d2c0631add613733b7b898565f8c17b1913ffe71` |
| Phone delivery | `/storage/emulated/0/Download/LinkDrop/LinkDrop-v0.1.6-feasibility-arm64-debug.apk` |

The project commit was pushed without force. Local `main`, remote `main`, the lightweight release tag, and the
release target were independently verified at the exact 40-character application SHA above. The local source
APK, phone Downloads copy, GitHub API digest, and independently downloaded release asset all match the stated
size and SHA-256. The GitHub release is a prerelease with one correctly named asset.

## Why Milestone 6 was required

Milestone 5 reported 313 passing JVM tests, lint/assembly, exact-HEAD CI, and matching APK checks without an
attached device. The user then installed v0.1.5 on a Samsung Galaxy S25 Ultra running Android 16/current One UI,
arm64-v8a, tried recovery on every currently problematic row, and observed that none downloaded successfully.
Milestone 5 automation therefore did not physically validate Retry, re-evaluation, or Download Again. Those
paths entered Milestone 6 as a real runtime defect; the implementation did not assume that all sources vanished.

Standing project rule: unit tests and CI alone are insufficient for any download, network/API, yt-dlp,
ffmpeg/ffprobe, storage, background-work, Retry, or replacement change. Prefer a real Android end-to-end run
when ADB is available. If no device is available, a live integration smoke must use relevant public services,
perform real extraction/download/output creation, ffprobe every generated video, and require audio whenever
source evidence expects it. Failure or inability to execute that smoke blocks release.

## Milestone 6 implementation

### Independent source and local-file truth

- Room persists source evidence independently as `AVAILABLE`, `NOT_AVAILABLE`, `RESTRICTED`,
  `TEMPORARY_FAILURE`, or `UNKNOWN`, plus `sourceCheckedAt`.
- Successful real extraction is strong positive evidence. Only a dedicated definitive canonical probe can set
  `NOT_AVAILABLE`. Generic extractor failure, generic removed/deleted prose, 401/403, and anti-bot responses are
  not deletion proof. TikTok rehydration, 429, suitable 5xx, timeout, and transport failure are temporary;
  genuinely ambiguous evidence remains unknown.
- Source evidence has a six-hour lifecycle freshness window. A lifecycle refresh checks at most three stale
  terminal rows in a controlled background batch. Compose recomposition performs no network check. Manual
  **בדוק מקור** and explicit recovery force a fresh-enough check.
- Room persists local evidence independently as `PRESENT`, `MISSING`, `UNREADABLE`, or `UNKNOWN`, plus
  `localFileCheckedAt`. PRESENT requires a valid `content://` document row and readable descriptor, not merely
  a non-null URI. Ordinary checks are lightweight; replacement proof still fully reads and hashes candidates.
- Historical `COMPLETED` remains historical if the provider document is later deleted. Source state never
  rewrites local-file state, and local-file state never invents source availability.

### Recovery root cause and exact extraction handoff

The investigation found a concrete TikTok race: LinkDrop could successfully extract usable formats and signed
media URLs, then cause yt-dlp to query the source again when download began. That second request could return a
rehydration/anti-bot failure even though the first extraction was valid.

`YtDlpDownloaderEngine` now retains the exact successful structured response in a bounded process-memory
`ExtractionSnapshotCache`. Each downloadable child receives only an opaque token. The worker atomically leases
one reserved token and runs yt-dlp with `--load-info-json`; it never silently re-extracts the source URL during
that download. Snapshot size, aggregate bytes, entry count, and age are finite. Ownership covers the finite
format/fallback loop, and success, failure, cancellation, scheduling rejection, abandonment, and expiry all
release state. Raw JSON, tokens, signed delivery URLs, cookies, and extractor thumbnails never enter Room,
intents, diagnostics, or the smoke report.

A second root cause affected X identity. yt-dlp may report its embedded video-object ID as root `id`, which can
differ from the enclosing canonical `/status/<id>`. v0.1.5 could overwrite `platformPostId` with that media ID,
breaking later dedup/recovery sibling matching. Canonical supported source URLs now own post identity;
extractor identity remains `mediaId`. A platform-constrained numeric-suffix DAO candidate plus the normalized
matcher keeps already-polluted rows dedup-safe across handle and `/i/status/` aliases.

### Retry, Download Again, and failure ownership

- Failed-row Retry performs a fresh-enough source check, stops only for definitive `NOT_AVAILABLE`, permits
  `UNKNOWN`, reuses the same row, and atomically advances exactly one work generation. The existing identity
  mutation gate, generation CAS, and generation-specific unique work with `KEEP` prevent duplicate rows/work.
  Legacy false X images-only rows remain re-evaluable. Explicit retry resets only its intended budget; automatic
  retry, engine update, and replacement-recovery budgets remain finite and durable.
- Download Again verifies the old URI first. If PRESENT, a distinct new output is privately downloaded,
  ffprobed, staged, fully read back and length/SHA-256 verified, durably recorded, and revalidated before
  authority switch and again before old-file deletion.
- If the old file is MISSING, recovery proceeds to real download/staging and adopts the verified new URI without
  requiring preservation or deletion of a nonexistent document. If UNREADABLE/UNKNOWN, the new candidate is
  proven first and uncertain old content is not destructively touched. Same-URI candidates are rejected and
  never deleted.
- Candidate commits and recovery transitions are fenced by generation, status, authority URI, candidate URI,
  and evidence. Process-death reconciliation uses the same commit executor and a finite durable budget.
- One bounded factual failure stage is persisted with sanitized code/detail: source check, short-link
  resolution, extraction, engine update, format selection, download, media probe, audio fallback, SAF
  stage/verify/commit, old-file cleanup, work scheduling, or unknown. The stage is written at the
  generation-fenced failure boundary so Diagnostics cannot lose it.

### UI, actions, persistence, and privacy

- Meaningful Home and Diagnostics rows expose **פתח מקור** through Android ACTION_VIEW using only normalized
  supported HTTPS TikTok/X URLs. Query and fragment material are removed; no WebView or arbitrary scheme is
  accepted. Missing handlers receive factual feedback.
- A freshly confirmed PRESENT `content://` output exposes **פתח קובץ** with MIME, ClipData, and a temporary read
  permission. Missing, unreadable, unknown, or invalid URIs expose no misleading file action.
- Home remains concise: source/file warnings, Retry for retryable failures, and **הורד מחדש** for historical
  completion. Diagnostics adds source/file status and last-check time, failure stage, bounded code/detail,
  runtime yt-dlp version, generation/attempt/recovery count, manual source check, and safe open actions.
- Normal Hebrew is factual. Rehydration is temporary, unknown source evidence is not deletion, a missing local
  output says the local file is missing, and replacement failure claims preservation only when old-file evidence
  supports it.
- Schema 3's non-destructive `2 -> 3` migration preserves history and authoritative output URIs, adds the
  minimal verification/failure/candidate fields, and privacy-scrubs unused historical signed thumbnail URLs.
  There is no destructive migration fallback.

### Preserved behavior

The physically verified v0.1.4 contracts remain required: foreground Clipboard autofill works with Shizuku off;
the URL remains during download and clears only after true success; direct Share works without Shizuku; two
downloads run FIFO; Shizuku stays optional; cellular downloads are allowed; Diagnostics shows the real runtime
yt-dlp version; real X works; and duplicate submissions do not create a second physical file. Expected-audio
media still cannot silently complete without validation, a present old file cannot be deleted before new
success, and ordinary duplicates cannot bypass dedup.

## Exact-HEAD automated validation

All heavy Gradle work used `/root/work/bin/heavy-run`; the global phone-wide queue was not bypassed.

| Check | Result at `90d3fc26480b506645c3aa7524667bfb98388573` |
| --- | --- |
| `./gradlew testDebugUnitTest` | PASS — 410 tests, 0 failures, 0 errors, 0 skipped |
| `./gradlew lintDebug` | PASS — 0 errors, 39 warnings |
| `./gradlew assembleDebug` | PASS |
| `git diff --check` / worktree | PASS / clean |
| Migration | PASS — real schema-2 SQL upgraded through registered `MIGRATION_2_3` without data loss |
| DAO contracts | PASS — production Retry/replacement SQL exercised against SQLite |
| Runtime-smoke deterministic policy/self-tests | PASS |
| GitHub Android CI | PASS — run `32478173149`, exact head SHA, all configured steps |

The assembled and released host APK is 126,689,139 bytes with SHA-256
`a829b33f5298b87151ec7c05d2c0631add613733b7b898565f8c17b1913ffe71`. Packaged metadata is
`com.funzi7.linkdrop`, version 7 / `0.1.6-feasibility`, arm64-v8a only; Python, FFmpeg, ffprobe, and QuickJS are
present, and the merged WorkManager service retains `foregroundServiceType="dataSync"`.

GitHub CI independently built its own debug-signed APK. Its whole-file hash was not claimed reproducible with
the host artifact. Inspection found the same 486 package paths, with 483 byte-identical entries; the remaining
entries were two environment-dependent optimizer outputs and the same-ABI DataStore native library with a
stripped local symbol table. The release deliberately uses the exact host APK supplied to the live gate, copied
to phone Downloads, uploaded, and re-downloaded with the matching SHA above.

## Mandatory exact-HEAD live runtime smoke

No Android/ADB transport was available. The release gate therefore ran on the ARM64 development host over live
public internet without cookies/login, proxy, or external yt-dlp configuration/plugins. Exact clean repository
HEAD was verified at both start and end. The run lasted from `2026-08-21T11:36:35Z` through
`2026-08-21T11:37:55Z`.

Tool/runtime provenance:

- official latest-stable yt-dlp zipapp `2026.08.19`, upstream checksum verified, SHA-256
  `1fa6733c37ea6fb51c99ad8fe785e7b7e5f3246c9b980230329d4fb72ed8d4d6`;
- ffmpeg `7.1.5-0+deb13u1` and ffprobe `7.1.5-0+deb13u1`;
- exact APK SHA-256 `a829b33f5298b87151ec7c05d2c0631add613733b7b898565f8c17b1913ffe71`;
- APK bundled yt-dlp `2025.11.12`, payload 3,170,726 bytes, payload SHA-256
  `89a0d9058ea9018e380b7771898ff46e393a1986dcd13fef331693c87ce1fca4`; and
- checked smoke policy `bestvideo*+bestaudio/best`, followed by finite separate-video+audio, H264 muxed, and
  other muxed attempts, bound to `FormatAttemptPolicy.kt` by regression tests.

Actual generated and ffprobe-validated outputs:

| Source | Selection / streams | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `https://www.tiktok.com/@intjatarot/video/7649459254197292310` | `bytevc1_1080p_515848-1+audio`; HEVC + MP3; 2 streams; 422.164898 s | 30,504,082 | `7c0d8886fda8179d05dcdaa33899faa19fb8c5c1b4761a50dd4bbed65e30a8bb` |
| `https://x.com/Fun_Viral_Vids/status/2089115673515507916` | `hls-974+hls-audio-128000-Audio`; H264 + AAC; 2 streams; 3.784853 s | 458,853 | `a6e0a1658d26de9bca31953abcf274961e2a0ec461e450784090d9cc6c4a4295` |
| `https://www.tiktok.com/@zetazuri/video/7407465424998157600` | `bytevc1_1080p_816953-1`; HEVC + AAC; 2 streams; 56.470930 s | 5,766,775 | `85955eae01e61651bb498fe16f5d7018b4be6165a565fd25503b8a012044d0a2` |

The mandatory known rehydration URL
`https://www.tiktok.com/@israel_edits151/video/7665458835611520276`, the fallback reachability URL
`https://www.tiktok.com/@gkidsfilms/video/7306281397784694059`, and the first fallback audio-control URL
`https://www.tiktok.com/@sigmafemalethings/video/7642782992565275926` each returned TikTok universal-data
rehydration after three bounded attempts. All were recorded as `TEMPORARY_FAILURE`, never deleted.

The exact audio-bug-class TikTok was available and exposed separate HEVC video plus source audio. The normal
LinkDrop selector merged them successfully, so every expected-audio final output contained audio and ffprobe
found both video and audio. The exact silent-normal-output condition did not manifest, so the structural
fallback was planned and policy-checked but not live-triggered. This limitation is explicit and remains in the
phone acceptance plan. Overall exact smoke result: **PASSED** — two real TikTok outputs and one real X output,
two validated audio-integrity cases, zero blockers. Temporary media/tool roots were removed after evidence was
written; `/tmp/linkdrop-runtime-smoke-final.json` remains the local bounded report outside Git.

An earlier candidate smoke at `2026-08-21T10:41:15Z` correctly failed because no TikTok output was generated;
publication remained blocked. A later candidate run passed, but only the clean exact-HEAD run above authorized
the release. Unit/CI success could not override a failed live gate.

## Adversarial review conclusion

1. Generic 403, rehydration, or extractor failure cannot be labelled deleted.
2. Definitive `NOT_AVAILABLE` blocks pointless work and finite budgets prevent endless retry.
3. `UNKNOWN` is allowed to continue to recovery.
4. A provider check cannot retain `PRESENT` for a dead URI; completion history stays independent.
5. A missing old file proceeds to real recovery instead of failing preservation first.
6. A present old file cannot be deleted before exact candidate proof and durable authority.
7. Open File requires current PRESENT evidence, valid `content://`, MIME/ClipData, and a read grant.
8. Open Source accepts only normalized supported HTTPS TikTok/X targets.
9. Source checks run from explicit/lifecycle actions with freshness and batch bounds, not recomposition.
10. Identity locking, one-winner generation CAS, and unique-work `KEEP` prevent duplicate Retry rows/work.
11. Live-smoke failure blocks release even if all tests and CI pass; this behavior was observed in practice.
12. The checked smoke contract fixes selector order, bounds, flags, and extraction-snapshot semantics to the app.
13. Signed CDN URLs, tokens, raw snapshots, cookies, and old thumbnail delivery URLs are not persisted/leaked.
14. Generation-fenced failure writes retain the factual stage for Diagnostics.

Late review also fixed image-only successful extraction being incorrectly converted to snapshot-unavailable,
double leasing of one handoff token, and ownership races where a losing concurrent action could release the
winning worker's reservation. Regression tests cover each boundary. Four independent review tracks found no
remaining static or host-runtime release blocker.

## Physical validation still required

Host smoke cannot prove Samsung ContentResolver/SAF behavior, ACTION_VIEW handlers/grants, WorkManager timing,
Clipboard timing, Share UX, or the user's retained v0.1.5 Room rows. Run `docs/PHYSICAL_TEST_PLAN.md` A–G on the
target phone:

1. Open Source on X and TikTok rows and confirm the correct source opens.
2. Retry an available source; if a genuinely removed source is known, verify definitive absence prevents
   repeated pointless download work.
3. Confirm PRESENT + Open File for an existing output, delete one output externally, refresh, and confirm
   `הקובץ המקומי חסר` while historical completion remains.
4. Download Again on that missing-file row and confirm the new file becomes authoritative.
5. With an old file present, confirm it remains until a new staged/ffprobed/read-back-verified output succeeds.
6. Retry every previously problematic v0.1.5 row; any remaining failure must show independent source/local
   states plus exact stage and bounded technical detail in Diagnostics.
7. Re-run real TikTok/X/audio, Home recent, direct Share, Clipboard autofill, FIFO, cellular, runtime-version,
   and duplicate-file regression checks. Exercise a real missing-audio fallback if a source exposes it.

The `adb tcpip 5555` / localhost persistent-Shizuku experiment remains explicitly deferred. Shizuku remains
optional.
