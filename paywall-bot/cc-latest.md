diagnostic: PR #58 fetch-chain code + denied tools (READ-ONLY)

PR #58 branch `claude/quality-gate-jina` @ `c6141dc`. Verbatim.

## A. code facts from PR #58 branch (core/main.py AST dump)
```
MATCHED FUNCS: [(70, 98, '_quality_gate_reason'), (387, 525, 'process_item'), (528, 574, 'log_run_summary'), (595, 707, '_fetch_and_publish'), (710, 755, '_phase1_discover'), (758, 787, '_phase2_retry'), (790, 810, '_select_deferred_ready'), (913, 949, '_migrate_drop_remaining_google_news'), (952, 1014, '_migrate_google_news_deferred_items'), (1017, 1223, 'run_poll')]
===== core/main.py :: _quality_gate_reason (lines 70-98) =====
70: def _quality_gate_reason(parsed, source: str, url: str) -> str | None:
71:     """Return a defer reason ('talkback_signature' / 'teaser_shape') when
72:     the parsed article must NOT be posted, else None.
73: 
74:     (a) talkback_signature — ≥2 body paragraphs matching the leaked
75:         talkback-header shape (index + short title + HH:MM). One match
76:         could be prose ("3 שנים אחרי 19:00"); two is the comments module.
77:     (b) teaser_shape — premium URL AND a non-bypass source AND total body
78:         chars under 2× the site's min_chars floor (default 2×1500=3000):
79:         the teaser+junk renders that pass is_valid sit in this band, while
80:         genuine full bodies from one3ft/direct pass untouched.
81:     """
82:     paragraphs = parsed.paragraphs or []
83:     tb_hits = sum(
84:         1 for p in paragraphs if TALKBACK_HEADER_RE.match((p or "").strip())
85:     )
86:     if tb_hits >= 2:
87:         return "talkback_signature"
88:     marker = article_parser._premium_marker()
89:     if marker and marker in (url or "") and source in TEASER_SUSPECT_SOURCES:
90:         total_chars = sum(len(p) for p in paragraphs)
91:         min_chars = int(
92:             article_parser._cv().get(
93:                 "min_chars", article_parser.PAYWALL_MIN_BODY_CHARS
94:             )
95:         )
96:         if total_chars < 2 * min_chars:
97:             return "teaser_shape"
98:     return None
===== core/main.py :: process_item (lines 387-525) =====
387: async def process_item(item: FeedItem, state: dict, post_delay: int) -> bool:
388:     """Process a single FeedItem end-to-end. Returns True if something was posted.
389: 
390:     Catches all exceptions internally — never propagates.
391: 
392:     Non-flash items go through the defer-and-retry queue: first sight just
393:     records the item in `deferred_items` and skips. Subsequent polls only
394:     attempt fetch once `now - first_seen_at >= MIN_AGE_BEFORE_POST_SECONDS`
395:     (30 min). Each failed fetch increments retry_count; at MAX_RETRY_COUNT
396:     the item is permanently abandoned (marked posted to stop retrying).
397:     """
398:     try:
399:         kind = classify(item.link, item.description)
400: 
401:         if kind == "flash":
402:             ok = await _post_flash(item)
403:             if ok:
404:                 bump_stat(state, "posted")
405:                 mark_posted(state, _dedup_key(item.guid))
406:                 await asyncio.sleep(post_delay)
407:                 return True
408:             bump_stat(state, "errors")
409:             return False
410: 
411:         # Defer-and-retry gate. New items wait 30 min before the first fetch
412:         # attempt so one3ft cold starts + transient network errors clear up.
413:         url = item.link
414:         deferred = get_deferred(state, _dedup_key(url))
415:         if deferred is None:
416:             record_defer(state, _dedup_key(url))
417:             bump_stat(state, "deferred")
418:             log_info(f"new item recorded for delayed fetch: {url}")
419:             return False
420: 
421:         try:
422:             first_seen = datetime.fromisoformat(deferred["first_seen_at"])
423:             age_seconds = (datetime.now(timezone.utc) - first_seen).total_seconds()
424:         except (KeyError, ValueError) as exc:
425:             log_error(f"deferred_items corrupted for {url}: {exc!r}; resetting")
426:             record_defer(state, _dedup_key(url))
427:             return False
428:         if age_seconds < MIN_AGE_BEFORE_POST_SECONDS:
429:             return False  # too young, skip silently
430: 
431:         parsed, source = article_parser.fetch_and_parse(
432:             url=item.link,
433:             item_title=item.title,
434:             item_description=item.description,
435:         )
436:         if source == "none":
437:             new_retry = bump_retry(state, _dedup_key(url))
438:             if new_retry >= MAX_RETRY_COUNT:
439:                 log_warning(
440:                     f"permanent_fail after {new_retry} retries: {url}"
441:                 )
442:                 remove_deferred(state, _dedup_key(url))
443:                 bump_stat(state, "permanent_fail")
444:                 mark_posted(state, _dedup_key(item.guid))  # stop retrying next poll
445:                 return False
446:             bump_stat(state, "deferred")
447:             log_info(f"defer retry={new_retry}/{MAX_RETRY_COUNT}: {url}")
448:             return False
449: 
450:         # Pre-post quality gate: a fetch that "succeeded" but parsed into a
451:         # talkback-contaminated or teaser-shaped body is deferred exactly
452:         # like a failed fetch — retried next poll, permanent_fail after
453:         # MAX_RETRY_COUNT. Never post garbage on a technicality.
454:         gate_reason = _quality_gate_reason(parsed, source, url)
455:         if gate_reason:
456:             log_warning(
457:                 f"QUALITY-GATE: defer url={url} source={source} "
458:                 f"reason={gate_reason}"
459:             )
460:             new_retry = bump_retry(state, _dedup_key(url))
461:             if new_retry >= MAX_RETRY_COUNT:
462:                 log_warning(
463:                     f"permanent_fail after {new_retry} retries: {url}"
464:                 )
465:                 remove_deferred(state, _dedup_key(url))
466:                 bump_stat(state, "permanent_fail")
467:                 mark_posted(state, _dedup_key(item.guid))  # stop retrying next poll
468:                 return False
469:             bump_stat(state, "deferred")
470:             log_info(f"defer retry={new_retry}/{MAX_RETRY_COUNT}: {url}")
471:             return False
472: 
473:         log_info(f"article via {source}: {item.link}")
474:         bump_stat(state, f"src_{source}")
475: 
476:         if not parsed.title and item.title:
477:             parsed.title = item.title
478: 
479:         # Content-based dedup BEFORE any external work (telegraph, telegram).
480:         # An article re-fetched via a second URL produces the same fingerprint;
481:         # we mark the new GUID posted but never call post_to_channel.
482:         fp = article_parser._content_fingerprint(parsed.title, parsed.paragraphs)
483:         if has_fingerprint(state, fp):
484:             log_info(
485:                 f"DIAG dropped by content dedup: fp={fp[:30]}... url={url}"
486:             )
487:             mark_posted(state, _dedup_key(item.guid))
488:             remove_deferred(state, _dedup_key(url))
489:             bump_stat(state, "content_dedup_skipped")
490:             return False
491: 
492:         telegraph_url = telegraph_pub.publish_article(
493:             title=parsed.title,
494:             subtitle=parsed.subtitle,
495:             author=parsed.author,
496:             hero_image_url=parsed.hero_image_url,
497:             paragraphs=parsed.paragraphs,
498:             original_url=item.link,
499:             cocoon_paragraphs=parsed.cocoon_paragraphs,
500:             inline_images=parsed.inline_images,
501:             source_link=parsed.source_link,
502:         )
503:         if not telegraph_url:
504:             log_error(f"telegraph publish failed for {item.link}")
505:             bump_stat(state, "errors")
506:             return False
507:         log_info(f"telegraph_url for {item.link}: {telegraph_url}")
508: 
509:         first_p = parsed.paragraphs[0] if parsed.paragraphs else (parsed.subtitle or "")
510:         ok = await _post_article(parsed.title, first_p, telegraph_url, item.link)
511:         if ok:
512:             bump_stat(state, "posted")
513:             mark_posted(state, _dedup_key(item.guid))
514:             mark_fingerprint(state, fp)
515:             remove_deferred(state, _dedup_key(url))
516:             _log_post_record(item.link, source, parsed)
517:             await asyncio.sleep(post_delay)
518:             return True
519:         bump_stat(state, "errors")
520:         return False
521: 
522:     except Exception as exc:  # noqa: BLE001 — top-level safety net
523:         log_error(f"process_item fatal for {item.link}: {exc!r}")
524:         bump_stat(state, "errors")
525:         return False
===== core/main.py :: log_run_summary (lines 528-574) =====
528: def log_run_summary(
529:     state: dict,
530:     kind: str,
531:     bucket_before: dict | None = None,
532: ) -> None:
533:     """Print the end-of-run stats summary.
534: 
535:     When `bucket_before` is provided (a snapshot of the daily stats bucket
536:     taken at the START of this run), emits two lines so a healthy "nothing
537:     new to post" run is distinguishable from a "post-attempt failed
538:     silently" run:
539: 
540:       <kind> done. This run: posted=N (direct: A, jina: B, smry: C, ...)
541:       Today total: posted=M, deferred=K, permanent_fail=L, errors=E
542: 
543:     Previously the single line reported daily totals only, which made any
544:     quiet run look identical to a successful posting run because the daily
545:     counter stays put when posted_this_run==0. The per-run row is computed
546:     by subtracting the snapshot from the current bucket.
547: 
548:     With `bucket_before=None` (legacy callers / one-shot scripts), emits
549:     only the today-total row.
550:     """
551:     bucket = state.get("stats", {}).get(today_key(), {})
552:     daily_posted = bucket.get("posted", 0)
553:     daily_deferred = bucket.get("deferred", 0)
554:     daily_permanent_fail = bucket.get("permanent_fail", 0)
555:     daily_errors = bucket.get("errors", 0)
556:     daily_by_src = {k: bucket.get(f"src_{k}", 0) for k in SOURCE_KEYS}
557: 
558:     if bucket_before is not None:
559:         run_posted = daily_posted - bucket_before.get("posted", 0)
560:         run_by_src = {
561:             k: daily_by_src[k] - bucket_before.get(f"src_{k}", 0)
562:             for k in SOURCE_KEYS
563:         }
564:         log_info(
565:             f"{kind} done. This run: posted={run_posted} "
566:             f"(direct: {run_by_src['direct']}, jina: {run_by_src['jina']}, "
567:             f"smry: {run_by_src['smry']}, one3ft: {run_by_src['one3ft']}, "
568:             f"wayback: {run_by_src['wayback']}, telegram: {run_by_src['telegram']})"
569:         )
570:     log_info(
571:         f"Today total: posted={daily_posted}, "
572:         f"deferred={daily_deferred} (retries-pending), "
573:         f"permanent_fail={daily_permanent_fail}, errors={daily_errors}"
574:     )
===== core/main.py :: _fetch_and_publish (lines 595-707) =====
595: async def _fetch_and_publish(
596:     state: dict,
597:     url: str,
598:     item_title: str,
599:     post_delay: int,
600: ) -> str:
601:     """Run the fetch chain on `url`, dedup, publish to Telegraph, post to
602:     channel. Updates state on every outcome (posted_guids, posted_fingerprints,
603:     deferred_items, stats). Returns one of:
604:       "posted"           — full success
605:       "dedup_skipped"    — content fingerprint matched a prior post
606:       "bumped"           — fetch chain returned nothing; retry_count incremented
607:       "permanent_fail"   — retry_count reached MAX_RETRY_COUNT; abandoned
608:       "telegraph_failed" — fetch ok, Telegraph publish failed
609:       "post_failed"      — Telegraph ok, Telegram send failed
610:     """
611:     parsed, source = article_parser.fetch_and_parse(
612:         url=url,
613:         item_title=item_title,
614:         item_description="",
615:     )
616:     if source == "none":
617:         new_retry = bump_retry(state, _dedup_key(url))
618:         if new_retry >= MAX_RETRY_COUNT:
619:             log_warning(f"permanent_fail after {new_retry} retries: {url}")
620:             remove_deferred(state, _dedup_key(url))
621:             bump_stat(state, "permanent_fail")
622:             mark_posted(state, _dedup_key(url))
623:             return "permanent_fail"
624:         bump_stat(state, "deferred")
625:         log_info(f"defer retry={new_retry}/{MAX_RETRY_COUNT}: {url}")
626:         return "bumped"
627: 
628:     # Pre-post quality gate — same rules and same defer path as process_item.
629:     gate_reason = _quality_gate_reason(parsed, source, url)
630:     if gate_reason:
631:         log_warning(
632:             f"QUALITY-GATE: defer url={url} source={source} "
633:             f"reason={gate_reason}"
634:         )
635:         new_retry = bump_retry(state, _dedup_key(url))
636:         if new_retry >= MAX_RETRY_COUNT:
637:             log_warning(f"permanent_fail after {new_retry} retries: {url}")
638:             remove_deferred(state, _dedup_key(url))
639:             bump_stat(state, "permanent_fail")
640:             mark_posted(state, _dedup_key(url))
641:             return "permanent_fail"
642:         bump_stat(state, "deferred")
643:         log_info(f"defer retry={new_retry}/{MAX_RETRY_COUNT}: {url}")
644:         return "bumped"
645: 
646:     log_info(f"article via {source}: {url}")
647:     bump_stat(state, f"src_{source}")
648: 
649:     if not parsed.title and item_title:
650:         parsed.title = item_title
651: 
652:     fp = article_parser._content_fingerprint(parsed.title, parsed.paragraphs)
653:     if has_fingerprint(state, fp):
654:         log_info(f"DIAG dropped by content dedup: fp={fp[:30]}... url={url}")
655:         mark_posted(state, _dedup_key(url))
656:         remove_deferred(state, _dedup_key(url))
657:         bump_stat(state, "content_dedup_skipped")
658:         return "dedup_skipped"
659: 
660:     telegraph_url = telegraph_pub.publish_article(
661:         title=parsed.title,
662:         subtitle=parsed.subtitle,
663:         author=parsed.author,
664:         hero_image_url=parsed.hero_image_url,
665:         paragraphs=parsed.paragraphs,
666:         original_url=url,
667:         cocoon_paragraphs=parsed.cocoon_paragraphs,
668:         inline_images=parsed.inline_images,
669:         source_link=parsed.source_link,
670:     )
671:     if not telegraph_url:
672:         log_error(f"telegraph publish failed for {url}")
673:         bump_stat(state, "errors")
674:         return "telegraph_failed"
675:     log_info(f"telegraph_url for {url}: {telegraph_url}")
676: 
677:     first_p = parsed.paragraphs[0] if parsed.paragraphs else (parsed.subtitle or "")
678:     ok = await _post_article(parsed.title, first_p, telegraph_url, url)
679:     if ok:
680:         bump_stat(state, "posted")
681:         mark_posted(state, _dedup_key(url))
682:         mark_fingerprint(state, fp)
683:         remove_deferred(state, _dedup_key(url))
684:         _log_post_record(url, source, parsed)
685:         # Runtime content inspection. Wrapped — failure must never crash the
686:         # poll. Findings (if any) get appended to state["quality_issues"] and
687:         # the quality-monitor workflow (triggered on Poll completion) files a
688:         # PR with a markdown report Codex auto-fix can read.
689:         try:
690:             from .quality_inspector import inspect_published_post
691:             findings = inspect_published_post(
692:                 telegraph_url=telegraph_url,
693:                 themarker_url=url,
694:                 article_title=parsed.title or "",
695:             )
696:             if findings:
697:                 state.setdefault("quality_issues", []).extend(findings)
698:                 log_info(
699:                     f"quality_inspector: {len(findings)} findings for "
700:                     f"{url[:80]}..."
701:                 )
702:         except Exception as exc:  # noqa: BLE001 — inspector must be best-effort
703:             log_warning(f"quality_inspector failed (non-fatal): {exc!r}")
704:         await asyncio.sleep(post_delay)
705:         return "posted"
706:     bump_stat(state, "errors")
707:     return "post_failed"
===== core/main.py :: _phase1_discover (lines 710-755) =====
710: async def _phase1_discover(item: FeedItem, state: dict, post_delay: int) -> str:
711:     """Phase 1: process one freshly discovered source item.
712: 
713:     Returns one of "flash_posted", "flash_failed", "new_defer",
714:     "already_deferred", or "error". Phase 1 NEVER attempts the fetch chain
715:     on aged deferred items — that's Phase 2's job. The previous combined
716:     loop would record a URL but skip retries silently for items that aged
717:     out of the source channel feed, which is what stalled posting after
718:     the initial batch (deferred items grew unboundedly while permanent_fail
719:     stayed at 0).
720:     """
721:     try:
722:         kind = classify(item.link, item.description)
723:         if kind == "flash":
724:             ok = await _post_flash(item)
725:             if ok:
726:                 bump_stat(state, "posted")
727:                 mark_posted(state, _dedup_key(item.guid))
728:                 mark_posted(state, _dedup_key(item.link))
729:                 await asyncio.sleep(post_delay)
730:                 return "flash_posted"
731:             bump_stat(state, "errors")
732:             return "flash_failed"
733: 
734:         url = item.link
735:         # Pre-defer dedup: if this item's normalized key already exists
736:         # in posted_guids (e.g. posted earlier today under a different
737:         # URL form), don't queue it for phase2 retry. Without this the
738:         # base-URL form of a live-blog snapshot can be queued AFTER the
739:         # `?liveBlogItemId=` form was already posted.
740:         if _is_dedup_posted(state, url):
741:             log_info(
742:                 f"phase1 dedup: skipping defer for {url!r} — key "
743:                 f"{_dedup_key(url)!r} already in posted_guids"
744:             )
745:             return "already_deferred"
746:         if get_deferred(state, _dedup_key(url)) is not None:
747:             return "already_deferred"  # preserve original first_seen_at
748:         record_defer(state, _dedup_key(url))
749:         bump_stat(state, "deferred")
750:         log_info(f"new item recorded for delayed fetch: {url}")
751:         return "new_defer"
752:     except Exception as exc:  # noqa: BLE001 — top-level safety net
753:         log_error(f"phase1 fatal for {item.link}: {exc!r}")
754:         bump_stat(state, "errors")
755:         return "error"
===== core/main.py :: _phase2_retry (lines 758-787) =====
758: async def _phase2_retry(url: str, state: dict, post_delay: int) -> str:
759:     """Phase 2: attempt the fetch chain on a deferred URL whose age has
760:     passed MIN_AGE_BEFORE_POST_SECONDS. Caller is responsible for the
761:     age check; this function does not re-check.
762: 
763:     Pre-fetch dedup: if the URL's normalized dedup key already appears
764:     in posted_guids (e.g. the same article was posted under a different
765:     URL form — observed 2026-06-02 with the same live-blog article
766:     posted as `.../article` and `.../article?liveBlogItemId=...`), the
767:     deferred entry is removed and the fetch is SKIPPED. The previous
768:     fingerprint-only dedup ran AFTER fetching, and a different parser
769:     path could produce a different fingerprint, missing the dup.
770: 
771:     Returns one of "posted", "dedup_skipped", "bumped", "permanent_fail",
772:     "telegraph_failed", "post_failed", "error".
773:     """
774:     if _is_dedup_posted(state, url):
775:         log_info(
776:             f"phase2 dedup: skipping {url!r} — normalized key "
777:             f"{_dedup_key(url)!r} already in posted_guids"
778:         )
779:         remove_deferred(state, _dedup_key(url))
780:         bump_stat(state, "phase2_dedup_skipped")
781:         return "dedup_skipped"
782:     try:
783:         return await _fetch_and_publish(state, url, item_title="", post_delay=post_delay)
784:     except Exception as exc:  # noqa: BLE001 — top-level safety net
785:         log_error(f"phase2 fatal for {url}: {exc!r}")
786:         bump_stat(state, "errors")
787:         return "error"
===== core/main.py :: _select_deferred_ready (lines 790-810) =====
790: def _select_deferred_ready(state: dict, now: datetime, limit: int) -> list[str]:
791:     """Pick up to `limit` deferred URLs whose age has passed MIN_AGE_BEFORE_POST_SECONDS.
792:     Items are sorted oldest-first (longest-waiting retried first). Corrupt
793:     entries (missing/unparseable first_seen_at) are treated as fully aged so
794:     they're attempted and either succeed or hit permanent_fail rather than
795:     sitting in the queue forever.
796:     """
797:     deferred = state.get("deferred_items") or {}
798:     ready: list[tuple[str, float]] = []
799:     for url, entry in deferred.items():
800:         try:
801:             first_seen = datetime.fromisoformat(entry["first_seen_at"])
802:             age = (now - first_seen).total_seconds()
803:         except (KeyError, ValueError, TypeError):
804:             log_error(f"deferred_items corrupted for {url}; treating as ready")
805:             ready.append((url, float("inf")))
806:             continue
807:         if age >= MIN_AGE_BEFORE_POST_SECONDS:
808:             ready.append((url, age))
809:     ready.sort(key=lambda t: t[1], reverse=True)  # oldest first
810:     return [url for url, _ in ready[:limit]]
===== core/main.py :: _migrate_drop_remaining_google_news (lines 913-949) =====
913: def _migrate_drop_remaining_google_news(state: dict) -> None:
914:     """Second-pass cleanup: drop every remaining Google News wrapper URL
915:     from deferred_items, no resolve attempt.
916: 
917:     Why a second migration:
918:       - Migration v1 (`_migrate_google_news_deferred_items`) tried to
919:         resolve each wrapper via resolve_google_news_url and only abandoned
920:         on resolve failure. In production the resolver returned None for
921:         0/25 wrappers (Google's response HTML doesn't contain the canonical
922:         URL — JS-rendered redirect).
923:       - v1 ran once and set its flag, so it won't run again. But the
924:         post-v1 phase-1 fall-through path added 30 NEW wrappers to
925:         deferred_items before this commit landed. v2 cleans those out.
926: 
927:     For each wrapper URL: remove from deferred_items + mark_posted(wrapper)
928:     so it can't re-enter the queue + bump_stat("permanent_fail"). Idempotent
929:     via MIGRATION_FLAG_DROP_REMAINING_GOOGLE_NEWS.
930:     """
931:     if state.get(MIGRATION_FLAG_DROP_REMAINING_GOOGLE_NEWS):
932:         return
933:     deferred = state.get("deferred_items") or {}
934:     wrappers = [u for u in list(deferred.keys()) if "news.google.com" in (u or "")]
935:     if not wrappers:
936:         state[MIGRATION_FLAG_DROP_REMAINING_GOOGLE_NEWS] = True
937:         return
938:     log_info(
939:         f"migration drop_remaining_google_news: removing {len(wrappers)} "
940:         f"unresolvable Google News wrapper URLs from deferred_items"
941:     )
942:     for wrapper_url in wrappers:
943:         deferred.pop(wrapper_url, None)
944:         mark_posted(state, _dedup_key(wrapper_url))
945:         bump_stat(state, "permanent_fail")
946:     log_info(
947:         f"migration drop_remaining_google_news done: removed {len(wrappers)}"
948:     )
949:     state[MIGRATION_FLAG_DROP_REMAINING_GOOGLE_NEWS] = True
===== core/main.py :: _migrate_google_news_deferred_items (lines 952-1014) =====
952: def _migrate_google_news_deferred_items(state: dict) -> None:
953:     """One-shot cleanup of deferred_items entries whose URL is a Google News
954:     RSS wrapper (no underlying themarker.com URL). These were introduced by
955:     commit 84e2177's phase-1 fallback path BEFORE the resolver landed —
956:     every retry attempt will fail because the fetch chain (telegram → direct
957:     → jina → smry → one3ft → wayback) is built for themarker URLs only.
958: 
959:     For each wrapper URL:
960:       - Try resolve_google_news_url. If it succeeds, REWRITE the deferred entry
961:         under the resolved themarker URL, preserving first_seen_at + retry_count.
962:       - If it fails, do permanent_fail bookkeeping (remove_deferred + mark_posted
963:         on the wrapper URL + bump_stat("permanent_fail")) so the bot stops
964:         wasting polls on URLs the fetch chain can't possibly resolve.
965: 
966:     Sets a state-version flag so subsequent polls skip this block. The flag
967:     is set unconditionally at the end — partial failures don't re-trigger
968:     the migration (any remaining wrapper URLs hit MAX_RETRY_COUNT=5 naturally).
969:     """
970:     if state.get(MIGRATION_FLAG_GOOGLE_NEWS_CLEANUP):
971:         return
972:     deferred = state.get("deferred_items") or {}
973:     wrappers = [u for u in list(deferred.keys()) if GOOGLE_NEWS_HOST in (u or "")]
974:     if not wrappers:
975:         state[MIGRATION_FLAG_GOOGLE_NEWS_CLEANUP] = True
976:         return
977:     log_info(
978:         f"migration google_news_url_cleanup: scanning {len(wrappers)} wrapper "
979:         f"URLs in deferred_items"
980:     )
981:     rewritten = 0
982:     failed = 0
983:     for wrapper_url in wrappers:
984:         entry = deferred.get(wrapper_url)
985:         if not entry:
986:             continue
987:         resolved = resolve_google_news_url(wrapper_url)
988:         if resolved and resolved != wrapper_url and "themarker.com" in resolved:
989:             # Rewrite under the resolved key, preserve metadata.
990:             deferred.pop(wrapper_url, None)
991:             deferred[resolved] = entry
992:             rewritten += 1
993:             log_info(
994:                 f"migration: rewrote deferred entry "
995:                 f"{wrapper_url[:60]}... → {resolved}"
996:             )
997:         else:
998:             # Resolution failed — drop from deferred and mark posted (under the
999:             # wrapper URL) so the bot stops retrying. mark_posted records the
1000:             # wrapper URL as "handled"; future Google News items with the same
1001:             # wrapper won't re-enter the queue.
1002:             deferred.pop(wrapper_url, None)
1003:             mark_posted(state, _dedup_key(wrapper_url))
1004:             bump_stat(state, "permanent_fail")
1005:             failed += 1
1006:             log_warning(
1007:                 f"migration: gave up on unresolvable wrapper URL "
1008:                 f"{wrapper_url[:80]}..."
1009:             )
1010:     log_info(
1011:         f"migration google_news_url_cleanup done: rewrote {rewritten}, "
1012:         f"abandoned {failed}"
1013:     )
1014:     state[MIGRATION_FLAG_GOOGLE_NEWS_CLEANUP] = True
===== core/main.py :: run_poll (lines 1017-1223) =====
1017: async def run_poll() -> None:
1018:     state = load_state()
1019:     # Per-run delta snapshot. bump_stat() is day-keyed, so the daily bucket
1020:     # accumulates across runs of the same UTC day. Subtracting the pre-run
1021:     # values from the post-run values gives the per-run counts the alerting
1022:     # module needs (its triggers are per-run, not per-day).
1023:     day_key = today_key()
1024:     bucket_before = dict(state.get("stats", {}).get(day_key, {}))
1025: 
1026:     # One-shot cleanup of legacy Google News wrapper URLs in deferred_items
1027:     # (introduced by commit 84e2177 before the resolver landed). No-op once
1028:     # the migration flag is set.
1029:     _migrate_google_news_deferred_items(state)
1030:     # Second-pass cleanup: drop the 30 new wrappers added by the post-451763a
1031:     # fall-through path that resolved 0/30 of them. v1 won't re-fire (its
1032:     # flag is set), so v2 picks these up. No-op once its own flag is set.
1033:     _migrate_drop_remaining_google_news(state)
1034: 
1035:     # Normalize deferred_items keys via _dedup_key. Drops entries that
1036:     # share a base-URL key with an already-posted entry (the live-blog
1037:     # duplicate scenario this PR fixes) and merges any pair of queue
1038:     # entries that share a normalized key.
1039:     _normalize_deferred_queue(state)
1040: 
1041:     await _reconcile_state_with_channel(state)
1042: 
1043:     # ---------- PHASE 1: discover new items from source feed ----------
1044:     items = fetch_feed_items(_FEEDS_CONFIG)
1045:     if not items:
1046:         log_info("no items returned from feed")
1047:     # Dedup by both guid and link: Phase 2 marks_posted with the resolved URL,
1048:     # so an RSS entry whose guid differs from its link (e.g. Google News
1049:     # redirects → themarker URLs) wouldn't otherwise be filtered out.
1050:     fresh = [
1051:         i for i in items
1052:         if not _is_dedup_posted(state, i.guid) and not _is_dedup_posted(state, i.link)
1053:     ]
1054: 
1055:     # Soft-stale primary fall-through: fetch_feed_items returns whatever the
1056:     # first primary feed yielded — but a primary that responds HTTP 200 with
1057:     # parseable XML wins even if every entry is months out of date and already
1058:     # in posted_guids. When that happens, retry against the fallback feeds.
1059:     # Without this, the bot quietly stops posting whenever a primary feed
1060:     # serves stale content (which is what happened on 2026-05-11: cmlink/
1061:     # 1.144 served Feb 2026 articles all day, fallback never tried).
1062:     if items and not fresh:
1063:         log_info(
1064:             f"phase1: primary feed returned {len(items)} items, "
1065:             f"ALL already-posted; trying telethon @{TELETHON_SOURCE_CHANNEL}"
1066:         )
1067: 
1068:         # First-tier fallback: Telethon @themarkeronline. Returns themarker
1069:         # URLs directly — no per-item HTTP resolve step, no wrapper parsing.
1070:         # Google News RSS path remains as the second-tier fallback only when
1071:         # Telethon yields nothing (auth issue, flood-wait, network).
1072:         fallback_items: list[FeedItem] = await _telethon_source_items(_FEEDS_CONFIG)
1073:         if fallback_items:
1074:             log_info(
1075:                 f"phase1 telethon: {len(fallback_items)} items from "
1076:                 f"@{TELETHON_SOURCE_CHANNEL}"
1077:             )
1078:         else:
1079:             log_info(
1080:                 "phase1 telethon: no items, falling back to Google News RSS"
1081:             )
1082:             google_news_items = fetch_fallback_feed_items(_FEEDS_CONFIG)
1083:             # Resolve any Google News wrappers via the legacy path. In
1084:             # production the resolver gives ~0% success rate (Google JS-
1085:             # renders the redirect), but keep the path alive: if Google
1086:             # ever serves a server-side redirect or canonical link again,
1087:             # this picks it up automatically.
1088:             resolved_items: list[FeedItem] = []
1089:             for i, item in enumerate(google_news_items):
1090:                 if i >= MAX_GOOGLE_NEWS_RESOLVES_PER_POLL:
1091:                     log_info(
1092:                         f"phase1 google-news: hit resolve cap of "
1093:                         f"{MAX_GOOGLE_NEWS_RESOLVES_PER_POLL} this poll, "
1094:                         f"skipping remaining {len(google_news_items) - i} items"
1095:                     )
1096:                     break
1097:                 resolved_url = resolve_google_news_url(item.link)
1098:                 if not resolved_url or GOOGLE_NEWS_HOST in resolved_url:
1099:                     log_warning(
1100:                         f"phase1 google-news: failed to resolve "
1101:                         f"wrapper URL, skipping: {item.link[:100]}"
1102:                     )
1103:                     continue
1104:                 item.link = resolved_url
1105:                 item.guid = resolved_url
1106:                 resolved_items.append(item)
1107:             log_info(
1108:                 f"phase1 google-news: resolved {len(resolved_items)} of "
1109:                 f"{len(google_news_items)} fallback items"
1110:             )
1111:             fallback_items = resolved_items
1112: 
1113:         # TEMPORARY DIAG (remove after dedup root-cause is identified):
1114:         # Log a sample of state.posted_guids that look like themarker URLs,
1115:         # then per-item the dedup decision + the matching string. Helps tell
1116:         # apart "Telethon returned wrong URLs", "state has stale entry",
1117:         # "URL canonicalization mismatch" without spamming logs.
1118:         posted_guids_list = state.get("posted_guids", []) or []
1119:         themarker_posted_sample = [
1120:             g for g in posted_guids_list if g and "themarker.com" in g
1121:         ][-10:]
1122:         log_info(
1123:             f"DIAG dedup posted_guids total={len(posted_guids_list)}, "
1124:             f"last 10 themarker entries:"
1125:         )
1126:         for i, g in enumerate(themarker_posted_sample):
1127:             log_info(f"DIAG dedup posted_guids[-{len(themarker_posted_sample)-i}] {g!r}")
1128:         for it in fallback_items:
1129:             guid_match = has_posted(state, _dedup_key(it.guid))
1130:             link_match = has_posted(state, _dedup_key(it.link))
1131:             if guid_match or link_match:
1132:                 # Find the exact string that matched so we can compare against
1133:                 # the Telethon-emitted URL byte-for-byte.
1134:                 matched_key = it.guid if guid_match else it.link
1135:                 log_info(
1136:                     f"DIAG dedup ITEM SKIPPED guid={it.guid!r} link={it.link!r} "
1137:                     f"matched_in_posted_guids={matched_key!r} "
1138:                     f"(guid_match={guid_match}, link_match={link_match})"
1139:                 )
1140:             else:
1141:                 log_info(
1142:                     f"DIAG dedup ITEM FRESH guid={it.guid!r} link={it.link!r} "
1143:                     f"(neither in posted_guids)"
1144:                 )
1145:         # END TEMPORARY DIAG
1146: 
1147:         fresh = [
1148:             i for i in fallback_items
1149:             if not _is_dedup_posted(state, i.guid) and not _is_dedup_posted(state, i.link)
1150:         ]
1151:         log_info(
1152:             f"phase1 fallback: {len(fallback_items)} items, "
1153:             f"{len(fresh)} fresh after dedup"
1154:         )
1155:         items = fallback_items
1156: 
1157:     fresh = sort_oldest_first(fresh)[:MAX_ITEMS_PER_RUN]
1158: 
1159:     p1_total = len(fresh)
1160:     p1_counts = {
1161:         "flash_posted": 0,
1162:         "flash_failed": 0,
1163:         "new_defer": 0,
1164:         "already_deferred": 0,
1165:         "error": 0,
1166:     }
1167:     for item in fresh:
1168:         result = await _phase1_discover(item, state, tg_bot.POST_DELAY_POLL)
1169:         p1_counts[result] = p1_counts.get(result, 0) + 1
1170:     log_info(
1171:         f"phase1: {p1_total} source items, {p1_counts['new_defer']} newly recorded, "
1172:         f"{p1_counts['already_deferred']} already in deferred queue, "
1173:         f"{p1_counts['flash_posted']} flash posted"
1174:     )
1175: 
1176:     # ---------- PHASE 2: retry aged deferred items ----------
1177:     now = datetime.now(timezone.utc)
1178:     ready_urls = _select_deferred_ready(state, now, MAX_ITEMS_PER_RUN)
1179:     p2_counts = {
1180:         "posted": 0,
1181:         "dedup_skipped": 0,
1182:         "bumped": 0,
1183:         "permanent_fail": 0,
1184:         "telegraph_failed": 0,
1185:         "post_failed": 0,
1186:         "error": 0,
1187:     }
1188:     for url in ready_urls:
1189:         result = await _phase2_retry(url, state, tg_bot.POST_DELAY_POLL)
1190:         p2_counts[result] = p2_counts.get(result, 0) + 1
1191:     log_info(
1192:         f"phase2: {len(ready_urls)} ready for retry, "
1193:         f"{p2_counts['posted']} posted, {p2_counts['bumped']} bumped, "
1194:         f"{p2_counts['permanent_fail']} permanent_fail "
1195:         f"(dedup_skipped={p2_counts['dedup_skipped']}, "
1196:         f"telegraph_failed={p2_counts['telegraph_failed']}, "
1197:         f"post_failed={p2_counts['post_failed']})"
1198:     )
1199: 
1200:     # ---------- PHASE 3: summary ----------
1201:     # Pass bucket_before so the summary distinguishes "this run posted N"
1202:     # from "daily total is M". Otherwise a healthy quiet run logs the same
1203:     # daily total as a posting run, making log inspection misleading.
1204:     log_run_summary(state, "poll", bucket_before=bucket_before)
1205: 
1206:     # ---------- PHASE 4: alerting ----------
1207:     bucket_after = state.get("stats", {}).get(day_key, {})
1208:     run_summary = {
1209:         "posted": bucket_after.get("posted", 0) - bucket_before.get("posted", 0),
1210:         "errors": bucket_after.get("errors", 0) - bucket_before.get("errors", 0),
1211:         "deferred": bucket_after.get("deferred", 0) - bucket_before.get("deferred", 0),
1212:         "permanent_fail": (
1213:             bucket_after.get("permanent_fail", 0)
1214:             - bucket_before.get("permanent_fail", 0)
1215:         ),
1216:         "last_error_line": get_last_run_error() or "",
...(truncated at 200 lines; real end 1223)
```

## A (cont). greps: quality helper / source-chain order / retry sites
```
----- grep: quality helper outside main.py -----
core/quality_inspector.py:535:def file_quality_findings(site: str = "themarker") -> dict | None:
----- grep: source-chain order -----
49:SOURCE_KEYS = ("telegram", "direct", "jina", "smry", "one3ft", "wayback")
54:# (2026-07-01, run 28540546618): jina rendered a paywalled premium page as
65:# these is at best a teaser. direct/one3ft/wayback are excluded — direct is
67:TEASER_SUSPECT_SOURCES = ("jina", "smry", "telegram")
80:        genuine full bodies from one3ft/direct pass untouched.
89:    if marker and marker in (url or "") and source in TEASER_SUSPECT_SOURCES:
280:        bot_token=resolve_site_env(config, "telegram_bot_token_env"),
281:        channel=resolve_site_env(config, "telegram_channel_env"),
282:        owner_id=resolve_site_env(config, "telegram_owner_id_env"),
412:        # attempt so one3ft cold starts + transient network errors clear up.
479:        # Content-based dedup BEFORE any external work (telegraph, telegram).
540:      <kind> done. This run: posted=N (direct: A, jina: B, smry: C, ...)
566:            f"(direct: {run_by_src['direct']}, jina: {run_by_src['jina']}, "
567:            f"smry: {run_by_src['smry']}, one3ft: {run_by_src['one3ft']}, "
568:            f"wayback: {run_by_src['wayback']}, telegram: {run_by_src['telegram']})"
956:    every retry attempt will fail because the fetch chain (telegram → direct
957:    → jina → smry → one3ft → wayback) is built for themarker URLs only.
----- grep: permanent_fail / retry sites -----
30:    get_deferred,
41:    record_defer,
42:    remove_deferred,
57:# (same defer/retry path as a failed fetch) instead of posting when the
71:    """Return a defer reason ('talkback_signature' / 'teaser_shape') when
122:    used as the deferred_items key.
160:def _normalize_deferred_queue(state: dict) -> None:
161:    """One-shot deduplication of deferred_items by `_dedup_key`.
176:    items = state.get("deferred_items") or {}
186:                f"deferred queue normalize: dropping {url!r} "
195:        # first_seen_at + the higher retry_count.
203:            int(existing.get("retry_count", 0) or 0),
204:            int(entry.get("retry_count", 0) or 0),
206:        keep["retry_count"] = keep_retry
209:            f"deferred queue normalize: merged {url!r} into key {key!r}"
211:    state["deferred_items"] = normalized
229:# State key for the one-shot deferred_items cleanup migration (commit
236:# deferred_items, no resolve attempt. v1 tried to resolve via
239:# v2 just abandons every wrapper outright and bumps permanent_fail. Runs
392:    Non-flash items go through the defer-and-retry queue: first sight just
393:    records the item in `deferred_items` and skips. Subsequent polls only
395:    (30 min). Each failed fetch increments retry_count; at MAX_RETRY_COUNT
414:        deferred = get_deferred(state, _dedup_key(url))
415:        if deferred is None:
416:            record_defer(state, _dedup_key(url))
417:            bump_stat(state, "deferred")
422:            first_seen = datetime.fromisoformat(deferred["first_seen_at"])
425:            log_error(f"deferred_items corrupted for {url}: {exc!r}; resetting")
426:            record_defer(state, _dedup_key(url))
440:                    f"permanent_fail after {new_retry} retries: {url}"
```

## A (cont). where the chain ACCEPTS a source and STOPS (core/article_parser.py::fetch_and_parse)
```
3405: def fetch_and_parse(
3406:     url: str,
3407:     item_title: str,
3408:     item_description: str,
3409: ) -> tuple[ParsedArticle, str]:
3410:     """Try sources in the configured order; return (parsed, source).
3411: 
3412:     source ∈ configured chain ∪ {"none"}.
3413: 
3414:     Default chain (themarker): telegram, direct, jina, smry, one3ft, wayback.
3415:     Per-site override comes from site_config["fetch_chain"], applied via
3416:     configure() at startup.
3417: 
3418:     Every source must pass is_valid (≥min_paragraphs AND ≥min_chars from
3419:     site config) AND _is_valid_themarker_content (rejects bypass-service
3420:     landing pages and non-target-language bodies). If none does, returns
3421:     "none" and the caller defers the item to the next poll.
3422: 
3423:     Confirmed non-working bypass services (do not re-add):
3424:       - archive.is / archive.ph: Cloudflare blocks GHA IPs
3425:       - 12ft.io: SSL cert error + service shut down 2025
3426:       - removepaywall.com: landing-page-only response, no actual bypass
3427:       - googlecache: Google killed cache infrastructure
3428:       - paywall.vip: browser-interactive only; URL concat returns the
3429:         site's own about-paywall landing page (1731 chars, 10 EN ¶'s
3430:         about "Paywall.vip helps you bypass paywalls"). The landing page
3431:         passed is_valid, posted 21 garbage articles to the channel
3432:         2026-05-11. Content validation now rejects this class of bug.
3433: 
3434:     For /.premium/ URLs (or whatever paywall_url_marker the site config
3435:     sets) the direct step is skipped (paywall virtually certain — saves
3436:     ~30s and avoids partial-content posts).
3437: 
3438:     After whichever source wins, hero_image_url is back-filled from a
3439:     small independent og:image fetch when the chosen source didn't carry
3440:     one.
3441:     """
3442:     for source_name in _fetch_chain():
3443:         fetcher = _CHAIN_FETCHERS.get(source_name)
3444:         if fetcher is None:
3445:             log_error(f"unknown source in fetch_chain: {source_name!r}")
3446:             continue
3447:         _log_source_attempt(source_name, url)
3448:         parsed, source = fetcher(url, item_title, item_description)
3449:         if source is not None:
3450:             return _finalize(parsed, source, url)
3451: 
3452:     return ParsedArticle(), "none"
```

## B. denied tools in failed run 28586474712 (PR #58)
```
run 28586474712  job "claude" (id 84759240646, PR_NUMBER=58)  — tail (verbatim)

Running Claude Code via SDK (full output hidden for security)...
Rerun in debug mode or enable `show_full_output: true` in your workflow file for full output.
SDK options: {
  "allowedTools": [
    "Read", "Glob", "Grep", "Edit", "Write", "MultiEdit",
    "Bash(git:*)", "Bash(python:*)", "Bash(python3:*)", "Bash(pytest:*)",
    "Bash(pip:*)", "Bash(node:*)", "Bash(npm:*)", "Bash(ls:*)", "Bash(cat:*)",
    "Bash(find:*)", "Bash(head:*)", "Bash(tail:*)", "Bash(sed:*)", "Bash(mkdir:*)",
    "Bash(cp:*)", "Bash(mv:*)", "Bash(gh pr:*)", "Bash(gh issue:*)", "Bash(actionlint)"
  ],
  "systemPrompt": { "type": "preset", "preset": "claude_code" },
  ...
}
{ "type": "system", "subtype": "init", "message": "Claude Code initialized", "model": "claude-opus-4-8[1m]" }
{
  "type": "result",
  "subtype": "error_max_turns",
  "is_error": true,
  "duration_ms": 430016,
  "num_turns": 51,
  "total_cost_usd": 2.20873675,
  "permission_denials_count": 21
}
##[error]Execution failed: Reached maximum number of turns (50)
##[error]Action failed with error: Claude execution failed: Reached maximum number of turns (50)
##[error]Process completed with exit code 1.

grep -iE "permission[_ ]denial|permission denied|not in allowedTools|not allowed|requires approval|denied":
  "permission_denials_count": 21        <- the ONLY match

distill grep -oE 'Bash\([^)]*\)|"(tool_name|name)":..."' | sort | uniq -c | sort -rn:
  (matches ONLY the allowlist echo above — each Bash(...) allowlist entry x1; NO per-denial tool
   names, NO "tool_name"/"name" JSON entries, because the SDK output is HIDDEN: show_full_output=false.)

=> The individual denied tool names are NOT recoverable from this run's log. Only the aggregate
   `permission_denials_count: 21` and the configured allowedTools are logged. To capture the exact
   denied tool names, a re-run with `show_full_output: true` (or debug mode) on claude.yml is required.
```

## VERDICT
- **(a) teaser-length body ACCEPTED + chain stops:** `core/article_parser.py :: fetch_and_parse`, **lines 3442-3450** — the loop `for source_name in _fetch_chain():` calls `parsed, source = fetcher(url, ...)` (L3448) and `if source is not None: return _finalize(parsed, source, url)` (**L3449-3450**). The per-source fetcher only checks `is_valid` (≥min_paragraphs AND ≥min_chars) + `_is_valid_themarker_content` — NOT the teaser gate — so a teaser render from telegram/jina/smry that clears the min-chars floor returns a non-None source and the chain RETURNS immediately, never reaching one3ft/wayback. (Reached in main.py at `_fetch_and_publish` L611: `parsed, source = article_parser.fetch_and_parse(...)`.)
- **(b) quality gate rejects it but only bumps the retry counter:** `core/main.py :: _fetch_and_publish`, gate at **lines 629-644** — `gate_reason = _quality_gate_reason(parsed, source, url)` (L629); on a `teaser_shape` reason it calls `bump_retry(state, _dedup_key(url))` (L635) and `return "bumped"` (L644) [or `permanent_fail` at MAX_RETRY_COUNT, L636-641] — it DEFERS the whole item to the next poll instead of continuing the chain. The gate logic itself is `_quality_gate_reason` **lines 70-98** (teaser_shape branch **L88-97**: premium marker in URL AND `source in TEASER_SUSPECT_SOURCES` AND `total_chars < 2*min_chars`). So the fix Codex wants — 'continue the fetch chain before deferring teaser parses' — means moving/applying this teaser gate INSIDE `fetch_and_parse` so a teaser result is treated like an invalid source (keep looping to one3ft/wayback) rather than accepted-then-deferred.
- **(c) source-chain order as coded:** `core/main.py:49` `SOURCE_KEYS = ("telegram", "direct", "jina", "smry", "one3ft", "wayback")`; the runtime order is `article_parser._fetch_chain()` (site config `fetch_chain`, default identical — see `fetch_and_parse` docstring L3414 and main.py L956-957: `telegram → direct → jina → smry → one3ft → wayback`). Teaser-suspect sources: `TEASER_SUSPECT_SOURCES = ("jina", "smry", "telegram")` (main.py:67). So a teaser accepted from telegram/jina/smry pre-empts the trustworthy one3ft/wayback that come LATER in the chain.
- **(d) denied tool names + counts:** the run log records `permission_denials_count: 21` (run 28586474712, 51 turns, $2.21, model claude-opus-4-8[1m], `error_max_turns`) but does **NOT enumerate the individual denied tools** — the Claude Code SDK ran with `show_full_output: false` ("full output hidden for security"), so the only denial signal is the aggregate count. The configured `allowedTools` at the time were: Read, Glob, Grep, Edit, Write, MultiEdit, Bash(git:*), Bash(python:*), Bash(python3:*), Bash(pytest:*), Bash(pip:*), Bash(node:*), Bash(npm:*), Bash(ls:*), Bash(cat:*), Bash(find:*), Bash(head:*), Bash(tail:*), Bash(sed:*), Bash(mkdir:*), Bash(cp:*), Bash(mv:*), Bash(gh pr:*), Bash(gh issue:*), Bash(actionlint). **To get the exact denied tool names, claude.yml must be re-run with `show_full_output: true` (or debug mode)** — they are not present in this run's log.