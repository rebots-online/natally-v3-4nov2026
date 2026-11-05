# Natally

A robot astrologer in a candlelit atelier. She calculates a natal chart exactly, explains
any planet, sign, house or aspect for free, and gives personal spoken readings.

One codebase, built with Tauri 2 for Web, Android, Linux and Windows.

- Product brief: `DOCS/BRIEF.md`
- Frozen UI: `LIBS/UI/STITCH/`
- Design system: `design-system/`
- Architecture and build recipe: `DOCS/ARCHITECTURE.md`, `CHECKLIST.md`

## Build

Copy `.env.example` to `.env`, fill in your own values, then run `./build_all.sh`.
Every name, domain, price and key comes from `.env`; nothing is typed into the code.

## Licence

AGPL-3.0-only (see `LICENSE`). The name Natally, the mascot and the brand artwork under
`public/brand/` and `public/atelier/` are brand assets of Roche Media Services and are not
licensed for use in other products. Set your own name, identifier and artwork in a fork.
