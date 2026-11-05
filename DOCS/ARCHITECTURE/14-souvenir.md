# 14 — Souvenir pipeline

Files: `src/souvenir/` `ScreenSouvenirOffer.tsx`, `pipeline.ts`, `snapshot.ts`, `generate.ts`, `audio.ts`, `mp3.ts`, `package.ts`, `upload.ts`, `store.ts`, `strings.ts`; `pdf/render.ts`, `pdf/fonts.ts`, `pdf/text.ts`, `pdf/wheel.ts`, and the seven page files of §9.1.

## 14.1 Stages

Stage is stored in `users/{uid}/souvenirJobs/{snapshotId}`. Each stage is safe to repeat, and its output lands in OPFS `natally-souvenir/<snapshotId>/`.

| Stage | Work | Output | Resume check |
|---|---|---|---|
| `awaiting_snapshot` | Wait for ledger entry and chart. Create `SouvenirSnapshot` with `turns = loadSavedTurns()` (complete Natally and customer turns) | Create-only doc | Doc exists |
| `generating` | For each plan element, plus `opening_reading` if no Natally turn exists: `POST /api/souvenir/element`, 2 at a time | Firestore elements | Existing element returned free |
| `audio` | §14.4 | `audio/*.mp3`, `audio-index.json` | File exists |
| `pdf` | §14.5 | `souvenir.pdf` | File exists and size > 0 |
| `atelier` | §14.6 | `package/` | `package/data.json` exists |
| `uploading` | Each file in 4 MiB chunks | Remote `.part` | Server answers true offset |
| `finalizing` | `POST /api/souvenir/finalize` | Links on ledger entry | Idempotent |
| `ready` | Clear OPFS folder; effect `souvenir_ready` | | |

## 14.2 Triggers

`resumeSouvenirs()`, called by `src/app/lifecycle.ts` after each app-open or sign-in reconcile and by `ScreenSouvenirOffer` on mount and after checkout: for every `souvenir_purchase` entry with no `pdfUrl`, start or resume `pipeline.run(entryId)`; a module-level lock prevents a second run per entry. It runs on any signed-in device. Device loss costs only time, since all inputs are in Firestore.

## 14.3 Plan

Groups in order, `listChartElements` naming: `planets` (all `PLANET_KEYS`), `signs` (twelve), `aspects` (each chart aspect, orb ≤ 3°), `houses` (twelve), each with `order`. Whole Sign chart still has twelve houses; angles have no chapters, and appear in planet pages where relevant.

Prompt, `server/souvenir/prompt.ts`: system = persona as §13.1, from `public/brand/brand.json` imported by `server/souvenir/prompt.ts` and bundled, instruct JSON object with `subtitle` (short line), `relation` (how this element sits in this chart, 60 words), `aside` (Natally's dry aside, 25 words), `origins`, `traditional`, `lore`, `examples` (each 70 to 100 words). Facts: chart block, then the element. `opening_reading`: `relation` holds a full reading of about 300 words; others empty strings.

## 14.4 Replay audio

For every Natally turn sentence, and every element's `relation`, then the opening reading: `synthesizeToPcm`, encode with `lamejs` mono 44.1 kHz 64 kbps, one file per sentence, `audio/t<turn>-<n>.mp3`, `audio/e<element>-<n>.mp3`. Written with `audio-index.json` as `SouvenirAudioIndex`. Voice absent: `beginVoiceSetup` runs, measured progress shown. Unsupported or failing: `audio: null`, and the page still works as a text replay.

## 14.5 PDF

`pdf-lib` page size 612×792 pt. Coordinates in template pixels (816×1056) scaled by 0.75. Every value from the frozen `index.html`: 1 px gold frame inset 28 px, inner padding 36 44 28 44, ground `#120c1c`.

Text: `pdf/fonts.ts` fetches `public/fonts/*.woff2`, opens with `fontkit`, makes each variation by `font.getVariation({ wght, opsz })`. `pdf/text.ts` lays out with `font.layout(text)`, wraps by advance widths, and draws each glyph's `path` with `page.drawSvgPath`, so weights stay exact with no embedding. Result: vector text, Fraunces 400, Cinzel 700, Nunito Sans 400 and 700, JetBrains Mono 500, Natally Symbols. Text is not selectable: chosen because the variable fonts cannot be embedded by weight in pdf-lib.

Page order:

| # | Template | Data |
|---|---|---|
| 1 | Cover `#pdf-page-cover` | Name, birth line, flat wheel, `SOUVENIR · <purchase date>` |
| 2 | Chart `#pdf-page-chart` | `flatWheelShapes` with house numbers; angles (ASC, MC, DSC, IC with sign, degree; left out when absent); house system label |
| 3 | Positions `#pdf-page-positions` | Ten frozen bodies; top aspects with orbs |
| 4+ | Conversation `#pdf-page-conversation` | Turns paginated, Natally Fraunces, customer with coral edge, `pdf-hear-natally-conversation` link on each page |
| per group | Group cover `#pdf-page-group-cover` | Group name, title, introduction (bundled in `pdf/groups.ts`), chips with internal `GoTo` links, wrapping as needed |
| per element | Element cover `#pdf-page-element-cover` | Glyph, name, subtitle, YOU AND, relation, `[ELEMENT] · 1 OF 2`; Hear Natally link |
| per element | Deep dive `#pdf-page-deep-dive` | Aside, Origins, Traditional Interpretation, Lore, Examples; related-element chips linking to their pages; `[ELEMENT] · 2 OF 2` |

Overflowing body text shrinks by steps from 15 to 12 px, and truncation is never used: a generation over length is re-requested with `Be shorter.`, once, by the client flag `shorter: true`.

## 14.6 Frozen atelier package

Built by `vite build --config vite.souvenir.config.ts` to `dist-web/souvenir-runtime/` with `base: './'`; `scripts/postbuild-web.mjs` copies in `room.webp`, `puppet-cleanplate.webp`, `192x192.png`, `natally-still.webp`, `workshop-ambience.mp3`, fonts, and writes `souvenir-manifest.json` listing every file.

`package.ts` fetches the manifest and files from its own origin (`/souvenir-runtime/…`), writes `data.json` (`SouvenirPublicData`), adds `audio/` and `souvenir.pdf`. Upload paths are the same relative paths. `uid`, email and ledger id are never included.

The page loads `data.json`; renders per §9.2; replays turns in order, highlight per `cue`, hash `#play=conversation` or `#play=<elementKey>` starts playback after one tap, as browsers require. It makes no network call except its own folder's files. It contains no API key and no model code.

## 14.7 Delivery adapter

`server/souvenir/delivery-sftp.ts` implements `DeliveryAdapter`. It is chosen in `server/souvenir/delivery.ts`, so a later adapter adds a file. Links land on the ledger entry; Profile row and email show those two links.
