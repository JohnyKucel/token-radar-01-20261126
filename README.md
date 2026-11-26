[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/JohnyKucel/token-radar-01-20261126/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/JohnyKucel/token-radar-01-20261126/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

# Token Radar

A token launch radar: 178 protocols that record no token, ranked by what a token would be worth if their record stayed as it is — plus a farm plan for each one. Built for the [make.fun token-radar-01 bounty](https://make.fun/bounty/token-radar-01) ($1,325 USDC).

## The model (radar-2)

Every figure follows from the sealed DefiLlama snapshot (758 protocols, fetched 2026-11-14), never from a list of names:

- **Sector multiple** — the median market-cap / TVL of the token-bearing protocols in the same category (at least 3 comparables, else the market-wide median), clamped to 0.05–2.0.
- **Base** — TVL × sector multiple.
- **Growth** — the protocol's seven-day TVL change, clamped to −50…+100%, weighted 0.6.
- **Maturity** — 0.7 + min(age, 1460 days) / 1460 × 0.5. The longer a protocol has run with no token, the closer its launch is priced.
- **Implied value** — base × growth × maturity, rounded to whole dollars.

The board covers all 40 watchlist protocols, plus every rankable pre-token protocol below the $50M floor (wrapped, staked and bridged products of tokens that already trade are left out — the watchlist's own rule, applied to every row). Protocols that already trade are kept apart in a Live view; they are the comparables the sector multiples are read from.

An implied value is this entry's own claim, never a prediction of whether or when a token launches.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

`main.ts` (Node 22, standard library only) reads the snapshot, writes `board.json`, `data.js`, copies `dashboard/` and `screenshots/`, and writes `dossier.json` with the vendored `vendor/makefun-board.ts`. The program runs twice and writes the same bytes both times: nothing here reads the clock, the network or any randomness.

Open `out/dashboard/index.html` in a browser — the page renders with no network; all of its data is embedded. Sort by any column, filter by text, category or chain, open a protocol's detail view for its value breakdown and farm plan.

## Layout

- `main.ts` — the entrypoint
- `lib/model.ts` — the value model, the farm plans, the board builder
- `vendor/makefun-board.ts` — make.fun's dossier library, as shipped in the kit
- `dashboard/` — the static page (index.html, app.css, app.js)
- `screenshots/` — the board, a detail view and a filtered view
