# Current Session Handoff — IV credit overuse / contract-specific IV
Date: 2026-05-30. Source: Claude planning chat. Purpose: continue in ChatGPT/Codex without losing context.

## Current task
IV sync reliability + MarketData credit burn. MarketData consumed ~2674 credits in ONE sync. Confirmed (MarketData docs): the app was fetching the FULL option chain (a full chain is 20,000+ credits; it also times out on the 4s read). Fix = filtered, contract-near chain.

## Just implemented — Group BO prime (verify in latest OPT commit / state.md chain)
- BO1: MarketData now fetches a FILTERED chain: URL ?dte=30&strikeLimit=2 (~4 ATM contracts, ~4 credits/ticker) → fixes credit burn + timeout + returns real IV.
- BO2: syncIvForTickers made bounded-parallel (Semaphore 6, 8s timeout); it had still been sequential despite earlier claims.
- BO3: all API-key fields LTR + multi-line (incl Finnhub).

## ALREADY EXISTS — DO NOT RE-IMPLEMENT (verified in code)
- Contract-specific IV: IvService.ContractIvKey(ticker, strike, expirationIso, type), contractIvCache, putContractIv, getContractIv, prefetchContractIvs(ticker, massiveKey).
- refreshAllPositionIVs() (DashboardViewModel ~line 994) already passes massiveKey (~932) and calls prefetchContractIvs (~944) and passes current/previous prices.
- Multi-key failover: splitApiKeys() + per-provider key rotation + IV_KEY_FAILOVER log (never logs keys) — Group BM.
- Security: API-key prefix logs removed; API_KEYS Logcat confirmed empty.
GPT's earlier plan proposed building these — they exist. VERIFY code before any IV work.

## Genuinely next (not yet done)
- MarketData credit guard + cooldown on 429/quota/credit errors (back off; skip expensive calls when limited). Tag: IV_CREDIT_GUARD.
- Verify prefetchContractIvs actually populates contract IV (ticker, expirationIso, strike, isCall) from Yahoo, and that an OPEN position's LIVE impliedVolatility uses the contract IV (not a generic ticker median). DO NOT touch ivAtOpen.
- De-dup IV requests within a sync by (ticker, expiration, strike, type).
- Historical-vol fallback: use the cached 21-day avgDailyMove (×√252) instead of the noisy 1-day calc, so tickers MarketData can't cover still show an estimate.
- Backlog: NYSE-holidays helper (session badge "סגור" + calendar gray-out non-trading days); expected-profit bug ($1400 expected → -$0.81 after CC assignment); SOXL mislabeled "long put" in monthly reports; ASTS position-open shows RKLB news.

## Manual tests (after any IV change)
- Settings → IV: keys saved; fields LTR + multi-line.
- Run IV refresh once; compare MarketData dashboard credits before/after — must NOT jump by thousands (expect tens).
- Logcat tags: IV_SOURCE, IV_KEY_FAILOVER, IV_REFRESH, IV_LOOKUP, IV_CREDIT_GUARD, IV_SERVICE.
- An open option's IV reflects its SPECIFIC contract (strike/expiration/type), not a generic median.
- Remove the MarketData key → fallback still works via Massive/Yahoo/historical.

## Safety rules (all agents)
Latest GitHub state only (git pull --rebase; Codex/ChatGPT/Claude Code all edit this repo). Build before commit. No realizedPnL/P&L change. No Room schema/migration change or deletion without explicit approval. No force-push. No reset --hard. Never log API keys or prefixes.

## Open questions
- Does the user's MarketData plan return IV for the filtered ATM contracts (24h-delayed)? Confirm after BO'.
- Are Massive/AlphaVantage keys also rate-limited, or do they return IV once MarketData is fixed?

## What to tell ChatGPT to continue immediately
"Read AGENTS.md + funzi7/agent-memory (state.md, current-session.md, gotchas.md, roadmap.md, shared/conventions.md). Work on the latest GitHub state. Contract-specific IV, massiveKey passing, and multi-key failover ALREADY EXIST — verify the code, don't rebuild them. Next: MarketData credit guard/cooldown + confirm open-position IV is contract-specific + 21-day historical fallback. Build before commit; no force-push; never log keys."
