# Natally design system

Source: Google Stitch project `8007307049701360266`, design system `assets/10690659705351619056`.
This is the text given to Stitch for every screen. The token values are in `design-system/tokens.json`.

Natally is a cute robot astrologer who reads a customer's natal chart aloud in a candlelit atelier. The interface is a quiet night room: plum-black ground, warm candle gold, cream text. Dark only. There is no light theme.

## Colour (use these exact hex values, no others)
- Canvas `#120c1c`: page background everywhere. Deepest ground `#0b0712` behind full-screen dialogs.
- Panel `#1a1226`: cards, sheets, header bars, input fields.
- Elevated `#2a1d3d`: selected rows, nested cards, pressed and active states, chips.
- Border `#3a2d50`: 1px hairline on every panel, card, input and secondary button.
- Cream `#f1e8d8`: primary text.
- Muted `#a698b5`: secondary text, captions, placeholders.
- Gold `#c9a24a`: primary buttons, selected borders, brand word, focus rings.
- Gold light `#f2ca50`: hover and active gold, key numbers, version badge text.
- Coral `#f2a38c`: the customer's own name and the customer's chat bubble accent.
- Periwinkle `#9fb4ff`: text links inside readings and harmonious chart lines.
- Violet `#b9a0e8`: small uppercase eyebrows above headings.
- Success `#8fd6b0`, Error `#ffb4ab`: status text only.

Gold is scarce: one solid gold button per screen. Never make every label or border gold. No gradient washes. No drop-shadow glows. Depth comes from the three surface steps plus hairlines.

## Type
- Fraunces, weight 400: page headings, offer titles, prices. Tight tracking, never bold.
- Cinzel, weight 700, uppercase, wide tracking: the brand word NATALLY, READINGS BY NATALLY, and small section stamps.
- Nunito Sans 400 and 700: all body text, buttons in the app header, navigation.
- JetBrains Mono 500: field labels, segmented tabs, the Continue with Google and Log In button labels, degrees and coordinates, the version badge.

No emoji anywhere. Astrological glyphs are plain Unicode characters in cream or gold.

## Shape and spacing
- Radius: controls 12px, cards and sheets 16px, the atelier scene card 20px, pills and chips 999px, app icon 24 percent.
- Every touch target is at least 44px high; primary buttons 48 to 52px.
- 4px base grid. Mobile side margin 16px. Desktop content max width 1160px.

## Components
- Primary button: solid `#c9a24a`, text `#120c1c`, 12px radius, full width on mobile. Hover `#f2ca50`.
- Secondary button: `#1a1226` fill, 1px `#3a2d50` border, cream text. Selected or hover border `#c9a24a`.
- Ghost link: cream text with underline.
- Input: `#1a1226` fill, 1px `#3a2d50` border, 48px high, mono label above. Focus border `#c9a24a`.
- Segmented tabs: one `#1a1226` bar with 1px border; the selected segment is `#2a1d3d` with gold mono text.
- Card: `#1a1226`, 1px `#3a2d50`, 16px radius, 16 to 20px padding.
- Offer card: Fraunces title on the left, price on the right in bold Nunito Sans, bullet list with small violet dots, one gold button, one line of small muted terms.
- Element chip: 32px pill, `#2a1d3d` fill, 1px `#3a2d50` border, glyph then label. Selected chip has a gold border.
- Chat bubble, Natally: `#2a1d3d`, 1px `#3a2d50` border, 16px radius with a square top-left corner, Fraunces 16px cream text. While she is speaking the border is gold.
- Chat bubble, customer: `#1a1226` with a 3px coral left edge, Nunito Sans.
- Credit pill in the header: small secondary button reading for example `79 Cr · Top Up`.
- Status line: a small dot plus short text. Dot colours: idle cream, listening mint, thinking violet, speaking gold.
- Version badge: fixed bottom right, JetBrains Mono 12px, `#f2ca50` on `#0b0712`.

## The atelier scene
A wide illustration card (aspect 1586 by 992, 20px radius, 1px border) showing Natally at her desk in the candlelit room. Overlays on the scene: a draggable inset panel titled `Move chart` with a gold 1px border showing the natal chart wheel on black; a small chip at top right `Room sounds on`; a status line at bottom left; a centred caption under the scene in muted text. The artwork is the brand file `public/atelier/room.webp`; Stitch's own drawing is a stand-in.

## The natal chart wheel
A circular wheel on near-black: thin gold outer ring, twelve house divisions, twelve sign glyphs around the rim, small coloured planet dots with glyphs, and thin aspect lines across the centre (coral for tension, periwinkle for harmony). Ascendant at nine o'clock.

## Copy rules
Plain, warm, short. No disclaimers. No invented statistics, badges, ratings or features. Prices and credit amounts shown are examples supplied by configuration.
