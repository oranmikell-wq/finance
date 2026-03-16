# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Single-file Hebrew RTL PWA for personal financial portfolio management. All app logic lives in **`index.html`** (~5,500+ lines). The file is structured as: `<head>` CSS → `<body>` HTML → `<script>` JavaScript.

Deployed at: `https://oranmikell-wq.github.io/finance/`

## Architecture

### Single-File Structure
Everything is in `index.html`. No build system, no npm, no bundler — open the file in a browser directly. Edits go live immediately by refreshing.

### Data Flow
1. On load: `loadAssets()` reads encrypted localStorage → renders UI
2. Background fetches start after 1000ms (exchange rates, SPY price, fund NAVs)
3. All UI updates flow through `updateUI()` which calls all render functions

### State
Global variables: `assets[]`, `exchangeRate`, `btcRate`, `ethRate`, `spyPrice`, `spyPrevClose`, `chartRange`, `currentSort`, `fundDataCache`

### localStorage
Sensitive keys (auto-encrypted via device fingerprint): `portfolio-assets`, `user-profile`, `portfolio-history`, `watchlist`, `price-alerts`, `finnhub-api-key`

Non-sensitive: `exchange-rate`, `btc-rate`, `eth-rate`, `spy-price`, `fund-cache-{fundNumber}`, `app-theme`

## Asset Types
`pension`, `gemel` (גמל), `fund` (קרן השתלמות), `savings` (קרן נאמנות/mutual fund), `deposit`, `trade`, `crypto`, `real_estate`, `other`

Special variants:
- **SPY pension**: pension assets with `spyLinked=true` — value = units × spyPrice
- **Fund-tracked savings**: savings assets with `fundNumber` — NAV fetched from bizportal.co.il

## External APIs
| API | Purpose |
|-----|---------|
| Frankfurter → open.er-api → exchangerate-api | USD/ILS rate (3 fallbacks) |
| CoinGecko | BTC/ETH prices |
| Finnhub + Yahoo via corsproxy | SPY (S&P 500) price |
| bizportal.co.il via corsproxy/allorigins | Israeli mutual fund NAV |

## UI Tabs
`dashboard` → `portfolio` → `tools` (budget + retirement calculator) → `trends` (history chart + watchlist) → `settings`

## Key Conventions
- All currency conversions go through `toILS(value, currency)`
- Number parsing: `parseNum()` handles Hebrew locale commas
- Number formatting: `formatNum()` for display, `toLocaleString('he-IL')` for Hebrew
- Colors: green = `--accent-green`, red = `--accent-red`, gold = `--accent-gold`
- RTL: `dir="rtl"` on `<html>`. Flex row-reverse not needed — browser handles it
- Asset IDs: `Date.now()` timestamps
- Encryption: localStorage.setItem/getItem are monkey-patched at the top of the script

## Debugging Approach — MUST follow this order

**Before writing a single line of code for a bug report:**
1. **Ask for console logs first.** Say: "פתח DevTools → Console, רענן, ושלח לי את הלוגים הרלוונטיים"
2. **Diagnose the specific cause** from real data — not from code inspection guesses
3. **Only then** write the minimal fix for that specific cause

**Never do this:**
- Read the code, find 5 potential issues, fix them all — when only one was the actual problem
- Make speculative fixes based on "this could be the issue"
- Chain multiple refactors to answer a simple bug question

**Rule:** One bug report = one diagnosis = one targeted fix. Every token spent on unnecessary changes is waste.

## Before Deploying Any Change — Side-Effect Checklist

**Before writing or deploying code, verify these known breakage patterns:**

| Change | Must check |
|--------|-----------|
| `transform` on `body` or any ancestor of fixed elements | Breaks ALL `position:fixed` (tab bar, modals, overlays) — **never transform body** |
| `overflow:hidden` on `body`/`html` | Disables scroll on iOS |
| `z-index` changes | May hide modals or tab bar |
| New `touchstart`/`touchmove` listeners | May conflict with existing scroll/press handlers; always check `passive` requirement |
| Service worker cache version bump | Required on every deploy that changes HTML/JS/CSS |
| Modifying `saveAsset()` or `loadAssets()` | Test with existing data — must not corrupt stored assets |
| Adding global variables | Check for name collisions with existing globals |

**Rule:** If a change touches layout, CSS positioning, or touch events — mentally trace the impact on fixed elements (tab bar `#tabBar`, login overlay `#loginOverlay`, modals `.modal`) before deploying.

## Important Gotchas
- The file has no external CSS/JS dependencies except Google Fonts — everything is inline
- `updateUI()` is the master render function; always call it after mutating `assets`
- SPY assets auto-update every 1 minute during US market hours (9:30–16:00 ET)
- Fund NAV fetch uses corsproxy.io as primary and allorigins.win as fallback due to CORS
- `saveAssets()` encrypts and persists; `loadAssets()` decrypts and sets state + renders
- Portfolio history snapshots are saved once per day via `saveHistorySnapshot()`
