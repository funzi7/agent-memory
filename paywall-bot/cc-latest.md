# paywall-bot — Tech Feed IL source expansion wave 2 handoff

Date: 2026-07-19 UTC

This is the current authoritative agent handoff. Repository architecture and
older deployment history remain in `handoffs/CONTEXT.md`; Tech Feed IL MVP,
source-health, and wave-2 details are in §8, §9, and §10 respectively.

## Git and pull request

- Primary repository: `funzi7/paywall-bot` at `/root/work/paywall-bot`.
- Authoritative starting `origin/main`:
  `b00679d9b9633b0c2e8d5c852547a42328218f5c`.
- Branch: `feat/techfeedil-source-wave2`.
- Feature commit / local / remote / PR head:
  `88f3d5bb9e8f6df345bda8ddc523854ed491587a`.
- Ready, non-draft PR: #76,
  `https://github.com/funzi7/paywall-bot/pull/76`.
- `gh pr view` verified PR #76 is open, targets `main`, has
  `isDraft: false`, and points to the exact SHA above. `git ls-remote` verified
  the feature branch points to the same SHA. The PR was not merged.
- The feature worktree was clean after commit/push. No production state,
  health state, Telegraph token, tracked error log, session, credential,
  downloaded HTML, or third-party article body was committed.

## Delivered result

Tech Feed IL now has 14 active discovery components grouped into nine
independent first-party publishers:

1. Gadgety
2. Geektime
3. TGspot
4. The Verifier
5. N12
6. אנשים ומחשבים
7. וואלה TECH
8. HWzone
9. The Gadget Reviews

Geektime discovery is repaired. The former official
`/category/technology/feed/` remained HTTP 200/parseable but its newest row was
2026-06-01 while the publisher was actively posting. It was replaced by the
current official `https://www.geektime.co.il/feed/`, retaining
`source_id: geektime`, domain/parser identity, and stable
`feed_id: geektime-technology`.

All four requested publishers are enabled from direct first-party discovery.
No publisher was substituted by Google News, Telegram, an aggregator, or a
copied index. The official HWzone Gadgets feed was researched but not enabled:
its newest eligible row was roughly 101 days old. HWzone is healthy and active
through its current Technology and Computers feeds. This rejected endpoint is
not a task blocker.

TheMarker production behavior is preserved. No TheMarker config, parser,
identity, token, credentials, state, schedules, publishing format, tags, or
workflow was changed. Existing Tech polling and source-health schedules/job
topology/concurrency are unchanged; CI only runs the new focused suite.

## Active discovery and live verification

All accepted endpoints were fetched and parsed on 2026-07-19 UTC. Full
accepted/rejected evidence is in
`docs/techfeedil-wave2-source-validation.md`.

| Publisher | Active discovery | Live result | Representative extraction |
| --- | --- | --- | --- |
| Gadgety | four existing category RSS feeds | 10 valid per feed; newest publisher row `2026-07-19T12:20:19Z`; healthy | direct, 23 paragraphs / 2,215 chars, hero |
| Geektime | `https://www.geektime.co.il/feed/` | 30 raw / 24 eligible; newest `2026-07-19T15:45:04Z`; healthy | direct, 10 / 2,607, author + hero |
| TGspot | `https://www.tgspot.co.il/feed/rss` | 10 valid; healthy discovery | direct 403 then Jina, 5 / 1,423, hero; degraded fallback |
| The Verifier | `https://theverifier.co.il/feed/` | 10 valid; newest `2026-07-18T09:16:00Z`; healthy | direct, 12 / 1,996, author + hero |
| N12 | TECH12 HTML + filtered Digital RSS | 18 category + 15 RSS; category Radware then Jina; degraded | direct article, 11 / 4,141, author + hero |
| אנשים ומחשבים | `https://www.pc.co.il/category/news/feed/` | 30 valid; newest `/featured/455290/` at `2026-07-19T16:13:34Z`; healthy | direct, 9 / 3,069, author + hero |
| וואלה TECH | `https://rss.walla.co.il/feed/6?type=main` | 30 exact TECH rows; newest `2026-07-19T11:01:00Z`; healthy | direct, 3 / 888, author + hero |
| HWzone | `main-tech/feed/` + `main-computers/feed/` | 50 + 47 eligible; publisher newest `2026-07-01T16:38:49Z`; healthy | guarded official WP REST direct, 6 / 2,771, author + hero |
| The Gadget Reviews | `https://thegadgetreviews.com/feed/` | 50 raw / 31 eligible; newest `2026-07-19T09:32:30Z`; healthy | direct, 14 / 5,098, author + hero |

The final forced-deep command used the real production discovery/parser chain
with alerts disabled. It created no Telegraph page, sent no channel post or
owner DM, and generated state/log changes were restored. Pre-merge missing
baseline/visibility checks are expected until the activation poll and are not
publisher extraction failures.

Final monitor metrics:

- 14 feeds / nine publishers / nine deep extractions;
- 13.466 seconds total;
- 8.815 seconds discovery;
- 4.630 seconds extraction wall time;
- 23 direct requests and two Jina requests;
- zero unfinished checks;
- projected 6.73 raw Linux minutes/month at 30 daily runs, or 30 minutes with
  a conservative one-minute billed-job floor. Normal documented range remains
  30–150 minutes/month including runner setup, below the requested cap.

## Discovery filters and parser architecture

- The production Tech fetch chain remains `direct → jina`; existing quality
  thresholds remain three meaningful paragraphs, 600 characters, 100 Hebrew
  letters, and 45% Hebrew ratio. Direct + Jina failure stays deferred/retried;
  the original publisher URL is never posted as fallback.
- Shared feed filtering now supports exact categories, bounded conditional
  title signals, strong-category bypasses, path allowlists, source-local
  inclusion/exclusion regexes, and production off-domain rejection. Health
  observes raw invalid/duplicate/unexpected-host rows before policy filtering.
- Geektime filters exact jobs/events/Insider/culture taxonomies and proven
  promotion/registration paths; normal editorial reporting is not restricted
  by brittle title keywords.
- PC uses the official News feed, excludes exact sponsored/community/event
  paths, and canonicalizes proven numeric post identities across `/featured/`,
  nested `/news/`, tracking, and terminal AMP forms.
- Walla permits only exact `tech.walla.co.il/item/<id>` rows. Its parser reads
  NewsArticle JSON-LD, reconstructs paired-`br` paragraphs, and removes
  related/talkback/player shells.
- HWzone permits guarded `/main.../<slug>/` editorial rows. Normal article HTML
  is Cloudflare 403 and Jina returned CAPTCHA, so `direct_request_url` maps only
  guarded rows to the same-origin official WordPress REST post representation.
  Exactly one published row must match the requested/canonical host and decoded
  slug. Trusted title, excerpt/subtitle, author, time, hero/caption and rendered
  body then enter the shared parser. Jina remains the fail-closed second step.
- The Gadget Reviews main feed excludes exact lifestyle and deal/coupon rows.
  `כללי` and `גיימינג` require a bounded device/technology title signal unless
  an exact verified strong category (headphones, computer accessories, robot
  vacuums, smartphones, smartwatches, or televisions) is also present. Broad
  News/Gaming do not bypass. Direct parsing truncates the related tail before
  paragraph/inline-media extraction. Jina must report the exact first-party
  source URL and supply its own independent H1; the adapter never invents one.
- JSON-LD metadata bridging is limited to the wave-2 publishers that require
  it, so established Tech parser behavior is unchanged.
- Telegraph/Telegram output remains Tech's existing behavior: generated
  Telegraph URL only in the channel post, dynamic clickable source footer on
  Telegraph, RTL-safe blocks, no AI summaries, and source/topic tags from the
  existing tag architecture.

## Safe activation / no historical flood

This is the critical deployment invariant:

- Each new feed gets an independent first-observation baseline. Current rows
  from a newly added feed are stored only in that feed's baseline; they enter
  neither `posted_guids` nor `deferred_items`.
- Established feeds continue normal discovery during the same run. A genuine
  active-feed item is not suppressed merely because a new feed also sees it.
- Geektime keeps the stable feed ID and uses `baseline_generation: 2`, so only
  the replacement endpoint is re-baselined. Existing Gadgety, TGspot, The
  Verifier and N12 baselines remain generation 1 and are untouched.
- A restart after the baseline commit reuses matching generations.
- Corrupt optional legacy baseline fields fail closed in production by
  re-baselining the affected feed; source health reports corrupt production
  state as shared critical.
- Old health components/observations for feeds or publishers no longer active
  are pruned. A stable replaced feed ID recovers through its current check and
  does not retain the old stale result forever.

Tests cover one and several new feeds, a genuine established-feed item in the
same run, no historical posted/deferred rows, restart, stable feed identity,
isolated Geektime generation migration, same-publisher canonical overlap,
mobile/tracking/AMP variants, and cross-publisher independence.

## Files changed in PR #76

Added:

- `docs/techfeedil-wave2-source-validation.md`
- `tests/test_techfeedil_wave2.py`

Updated:

- `.github/workflows/ci.yml`
- `README.md`
- `core/article_parser.py`
- `core/feeds.py`
- `core/main.py`
- `core/source_health.py`
- `core/url_utils.py`
- `handoffs/CONTEXT.md`
- `sites/techfeedil/config.yaml`
- `sites/techfeedil/parser.py`
- `sites/techfeedil/tags.py`
- `tests/test_source_health.py`

## Exact validation results

- `.venv/bin/python -m tests.test_message_format` — 185 checks passed; final
  line `All tests passed.`
- `.venv/bin/python -m unittest tests.test_techfeedil -v` — 21 tests, `OK`.
- `.venv/bin/python -m unittest tests.test_source_health -v` — 35 tests,
  `OK`.
- `.venv/bin/python -m unittest tests.test_techfeedil_wave2 -v` — 17 tests,
  `OK`.
- `.venv/bin/python -m compileall -q core sites tests tools` — passed.
- PyYAML `safe_load` of all 15 workflow files — passed.
- `bash -n scripts/*.sh` — passed.
- `git diff --check` — passed.
- Staged scan of all 2,954 added lines found zero bot-token, API-key,
  GitHub-token, private-key, Telethon-session, or suspicious credential-value
  patterns.
- Independent final code audit found no release blocker and verified exact 14
  feeds / two active HWzone feeds.

## Secrets and post-merge procedure

No new GitHub secret is introduced. Existing requirements remain exactly:

- `TECH_TELEGRAM_BOT_TOKEN`
- `TECH_TELEGRAM_CHANNEL`
- `TELEGRAM_OWNER_ID`

Never print or commit their values. The bot must remain administrator of
`@Tech_Feed_IL` with Post Messages permission, and the owner must have started
the bot for DMs.

After PR #76 is reviewed and merged through the normal repository process:

1. **Do not run Backfill.**
2. From `main`, manually run **Poll & Post — Tech Feed IL** once. This creates
   six new/replacement baselines: Geektime generation 2, PC, Walla, two
   HWzone feeds, and The Gadget Reviews.
3. Confirm no historical wave-2 article was posted or entered
   `deferred_items`, existing baselines did not reset, and only the intended
   baseline records changed.
4. Manually run **Source Health — Tech Feed IL** with `force_deep`.
5. Review the one owner digest, all nine publishers, Telegram bot/channel
   permissions, committed body-free health state, runtime/request metrics, and
   `GITHUB_STEP_SUMMARY` projection.
6. Wait for genuinely new articles to complete the normal 30-minute defer
   lifecycle.

## Known limitations / follow-up watchlist

- TGspot direct article fetching currently receives Cloudflare 403 and succeeds
  through Jina. This is degraded, not failed.
- N12 TECH12 category discovery currently receives a Radware shell and succeeds
  through its existing Jina category fallback. This is degraded, not failed.
- HWzone depends on its guarded official REST representation while normal
  HTML/Jina is challenged. Monitor endpoint/schema/slug parity.
- The Gadget Reviews current Jina render omits an independent H1 and therefore
  fails closed if direct extraction also fails.
- PC produced one transient 15-second feed timeout among repeated successful
  responses; normal polling retry and the two-consecutive-health-alert policy
  remain appropriate.
- Reconsider the official HWzone Gadgets feed only if it resumes current
  publication. Do not widen freshness thresholds or substitute an unapproved
  third-party source.
- Do not interpret pre-activation missing baselines/production visibility as a
  source extraction failure. Follow the exact activation sequence above.
