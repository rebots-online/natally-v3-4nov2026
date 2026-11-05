# Frozen UI — Natally v3

Google Stitch project `8007307049701360266`, design system "Natally" (`assets/10690659705351619056`).
This folder is the UI. Architecture rows cite a screen and an element id from here;
coders wire these elements and never redesign them.

Each screen folder holds:

- `original.html`: the Stitch export, byte for byte. Never edited.
- `index.html`: the frozen copy. It differs from the original only by the corrections listed below.
- `elements.json`: every element that has an id.
- `notes.json`: hashes and the corrections applied.
- `stitch-screenshot.png`, `frozen-screenshot.png`: Stitch's render and a browser render of the frozen copy.

Corrections allowed at freeze, and nothing else:

1. Stitch's stand-in pictures replaced by the brand files under `public/`.
2. Astrological glyphs forced to text form.
3. Words Stitch added after a bracket placeholder removed.
4. A unique id added to any interactive element that had none.

Text in square brackets is a placeholder for live data. Example values (a name, a date,
a price, a balance) are examples; the app shows real data or values from configuration.

| Screen | Folder | Stitch screen id | Ids | Interactive | Art replaced | Ids added | sha256 of frozen copy |
|---|---|---|---|---|---|---|---|
| Pick a modality | `screens/pick-a-modality/` | `42c84a889f3f4fc79cad37a75e2b5c65` | 9 | 2 | 1 | 0 | `99c3aa311b10940f…` |
| Landing | `screens/landing-desktop/` | `5e925899faab4625b177deb87a05d9d1` | 30 | 25 | 2 | 6 | `413a1c7ecb3b68d6…` |
| Landing — phone | `screens/landing-phone/` | `6619a56c356a4eb9aeb2696e5a291162` | 17 | 13 | 2 | 0 | `6d88761aab3761ba…` |
| Sign in | `screens/sign-in/` | `e45d0018500d4f31a61e94917c9f6c68` | 11 | 9 | 1 | 0 | `460c6d7ccae62d47…` |
| Birth details | `screens/birth-details/` | `eabf25d08d6f4a16a1e8f981a4cabb40` | 10 | 9 | 1 | 0 | `1b20c79ad00ed52e…` |
| Voice setup | `screens/voice-setup/` | `f1caf1c402c6466191022b8a59681af3` | 7 | 2 | 1 | 0 | `1f0fe7565d3a4dbc…` |
| Atelier | `screens/atelier/` | `da4e8cac6b3243b2b4dd55103326206b` | 23 | 16 | 3 | 0 | `b3c6527e1566a5fb…` |
| Atelier — desktop | `screens/atelier-desktop/` | `79fbf6f8110b4f3a9fc7fe63d1745f81` | 23 | 16 | 3 | 0 | `b598c75814da2552…` |
| Atelier — chart and lesson | `screens/atelier-chart-lesson/` | `21e8917c0b7340578351df0a42f17e52` | 22 | 16 | 2 | 7 | `c6bee91626ade76a…` |
| Synastry and Share sheets | `screens/synastry-share-sheets/` | `8c2e96efef4d4b339a55c3496393fe05` | 15 | 13 | 0 | 0 | `5a6af1370770dd57…` |
| Top Up | `screens/top-up/` | `2c225fa7a6ef4de0834480c6069cab55` | 6 | 5 | 0 | 0 | `f70814e3a8351049…` |
| Profile | `screens/profile/` | `8c8e87b11d6149c9a0d15c93abb5b4cb` | 11 | 8 | 0 | 0 | `b913f97a9228bfaa…` |
| Settings | `screens/settings/` | `e04096ec95e845f09855abb2a27ac361` | 11 | 11 | 0 | 0 | `6cc2155c8c97181e…` |
| About | `screens/about/` | `1b810de1bd774bb8a307fd245577e941` | 9 | 8 | 1 | 0 | `7c2eff6e1a3e8024…` |
| Souvenir offer | `screens/souvenir-offer/` | `d873939979ba40cb86063d56f061d104` | 5 | 4 | 1 | 0 | `22450ffe82d7cd39…` |
| Souvenir atelier | `screens/souvenir-atelier/` | `63d88e49124543c0b30e9f5a349703b6` | 8 | 5 | 5 | 0 | `f86613399023e993…` |
| Souvenir PDF — opening pages | `screens/souvenir-pdf-opening/` | `705d5546832f46bd94ca7daf963be5f5` | 5 | 1 | 1 | 0 | `f2301a39e507ad9b…` |
| Souvenir PDF — element pages | `screens/souvenir-pdf-elements/` | `26e874c8c46945e59068ecd7269773c1` | 14 | 11 | 1 | 0 | `ca0129ceb2b399d3…` |

## Corrections applied, per screen

### Pick a modality (`pick-a-modality`)
- Art: 72px rounded-square app icon: <img alt="Natally robot astrologer"> inside #natally-app-icon (Stitch stand-in hosted on lh3.googleusercontent.com) → `../../../../../public/brand/192x192.png`

### Landing (`landing-desktop`)
- Art: round nav portrait img in #landing-nav (32px circle, alt "Natally Avatar") → `../../../../../public/brand/natally-still.webp`
- Art: atelier scene card illustration img inside #landing-atelier (alt "Natally in her candlelit atelier") → `../../../../../public/atelier/room.webp`
- Id added: `landing-desktop-logo-link`
- Id added: `landing-desktop-nav-your-chart`
- Id added: `landing-desktop-nav-explained-aloud`
- Id added: `landing-desktop-nav-personal-readings`
- Id added: `landing-desktop-nav-prices`
- Id added: `landing-desktop-nav-learn-astrology`

### Landing — phone (`landing-phone`)
- Art: round top-bar portrait img in #landing-nav (32px circle, alt "Natally Logo") → `../../../../../public/brand/natally-still.webp`
- Art: atelier scene card illustration img inside #landing-atelier (alt "Natally reading natal chart") → `../../../../../public/atelier/room.webp`

### Sign in (`sign-in`)
- Art: 68px rounded-square header avatar: <img> in the header row of #signin-card (Stitch stand-in hosted on lh3.googleusercontent.com) → `../../../../../public/brand/192x192.png`

### Birth details (`birth-details`)
- Art: 96px round cameo portrait: <img alt="Natally holding violet crystal ball"> above the heading (Stitch stand-in hosted on lh3.googleusercontent.com) → `../../../../../public/brand/natally-still.webp`
- Owner correction after freeze: label "Name Natally should use" changed to "Your name".

### Voice setup (`voice-setup`)
- Art: 96px round cameo portrait: <img alt="Natally"> above the heading (Stitch stand-in hosted on lh3.googleusercontent.com) → `../../../../../public/brand/natally-still.webp`

### Atelier (`atelier`)
- Art: header app icon img (48px rounded square, alt "Natally avatar") → `../../../../../public/brand/192x192.png`
- Art: scene card illustration img inside #atelier-scene (alt "Natally in her atelier") → `../../../../../public/atelier/room.webp`
- Art: conversation header portrait img (40px circle, alt "Natally avatar") → `../../../../../public/brand/natally-still.webp`
- Glyphs forced to text: 2

### Atelier — desktop (`atelier-desktop`)
- Art: header app icon img (56px rounded square, alt "Natally avatar") → `../../../../../public/brand/192x192.png`
- Art: scene card illustration img inside #atelier-scene (alt "Natally in atelier") → `../../../../../public/atelier/room.webp`
- Art: conversation header portrait img (40px circle, alt "Natally") → `../../../../../public/brand/natally-still.webp`
- Glyphs forced to text: 2

### Atelier — chart and lesson (`atelier-chart-lesson`)
- Art: header app icon img (48px rounded square, alt "Natally") → `../../../../../public/brand/192x192.png`
- Art: room picture img inside the #chart-room-inset panel (alt "Natally in room") → `../../../../../public/atelier/room.webp`
- Glyphs forced to text: 32
- Id added: `atelier-chart-lesson-chip-sun`
- Id added: `atelier-chart-lesson-chip-moon`
- Id added: `atelier-chart-lesson-chip-mercury`
- Id added: `atelier-chart-lesson-chip-venus`
- Id added: `atelier-chart-lesson-chip-mars`
- Id added: `atelier-chart-lesson-chip-jupiter`
- Id added: `atelier-chart-lesson-chip-saturn`

### Synastry and Share sheets (`synastry-share-sheets`)
- Glyphs forced to text: 12

### Top Up (`top-up`)
- None beyond the text-glyph rule.

### Profile (`profile`)
- None beyond the text-glyph rule.

### Settings (`settings`)
- None beyond the text-glyph rule.

### About (`about`)
- Art: app icon img in the centred block (88px rounded square, alt "Natally avatar") → `../../../../../public/brand/192x192.png`

### Souvenir offer (`souvenir-offer`)
- Art: wide 16:10 illustration card img (alt "Natally at her desk in the candlelit atelier") → `../../../../../public/atelier/room.webp`

### Souvenir atelier (`souvenir-atelier`)
- Art: header app icon img (40px rounded square with gold border, alt "Natally") → `../../../../../public/brand/192x192.png`
- Art: scene card illustration img inside #souvenir-scene (alt "Atelier scene") → `../../../../../public/atelier/room.webp`
- Art: conversation avatar img beside "[Natally's saved reading]" in #souvenir-conversation (28px rounded square, alt "Natally") → `../../../../../public/brand/192x192.png`
- Art: conversation avatar img beside "[Natally's saved answer]" in #souvenir-conversation (28px rounded square, alt "Natally") → `../../../../../public/brand/192x192.png`
- Art: avatar img in the keepsake reply card above #souvenir-topup-button (28px rounded square, alt "Natally") → `../../../../../public/brand/192x192.png`

### Souvenir PDF — opening pages (`souvenir-pdf-opening`)
- Art: round cameo portrait img on #pdf-page-cover beside "Read aloud by Natally" (40px circle, alt "Natally avatar") → `../../../../../public/brand/natally-still.webp`
- Glyphs forced to text: 45

### Souvenir PDF — element pages (`souvenir-pdf-elements`)
- Art: round cameo portrait img in .cameo-avatar-frame on #pdf-page-deep-dive (140px circle, alt "Natally the cute robot astrologer") → `../../../../../public/brand/natally-still.webp`
- Glyphs forced to text: 5
- Removed added words: "In relation to"
- Removed added words: "and the subtle balance within the celestial wheel."
- Removed added words: "As expressed through"
- Removed added words: "and its harmonizing light across the natal hemisphere."
- Removed added words: "Anchored by the dignity of the"
- Removed added words: ", unfolding ancient principles of correspondence."
