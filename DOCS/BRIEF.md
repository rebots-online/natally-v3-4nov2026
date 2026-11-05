# Natally v3 — build brief

This brief is the product requirement for the whole build. Run to completion.

## Rule above all: nothing from earlier Natally work

No code, architecture, checklist, PRD, handoff, session log or process note from any
earlier Natally project is opened, quoted or reused. This binds every agent until the
build is complete.

The only inputs, as a closed list:

1. This brief.
2. The frozen screens: `LIBS/UI/STITCH/` (exports of Stitch project
   `8007307049701360266`, design system "Natally").
3. The brand files, used as they are: `public/brand/` and `public/atelier/`
   (hashes in `design-system/assets-manifest.json`).
4. Pictures of the look to match, opened as images only and only for comparing the
   finished screens: `/home/robin/Desktop/devProjects/Natally-v2.0-4nov2026/design/reference-screens/v1.42.95682/`
   (operator machine only; they are not in this repository).
5. Admin-Manual for rules and credentials. Coders never need a credential.
6. Current official documentation for every library and service.

## Frozen UI prototype (Google Stitch) — architecture is written against this

Stitch project `8007307049701360266` "Natally v3 — frozen UI prototype (5 Nov 2026)".
Design system "Natally": `assets/10690659705351619056`.
Every interactive element carries a stable id; architecture rows cite screen + id.

| Screen | Stitch screen id | HTML file id |
|---|---|---|
| Pick a modality | `42c84a889f3f4fc79cad37a75e2b5c65` | `42e7f6ec3b5a49659976581cb40f4253` |
| Sign in | `e45d0018500d4f31a61e94917c9f6c68` | `22b8bcece5cf446092d8662fdaad0335` |
| Birth details | `eabf25d08d6f4a16a1e8f981a4cabb40` | `093f03e122b14e6598f938fbf5c28039` |
| Voice setup | `f1caf1c402c6466191022b8a59681af3` | `6c6a6b3c4c714c99bb0e7ff20767653b` |
| Top Up | `2c225fa7a6ef4de0834480c6069cab55` | `ec74ffecbf5b4e3a864acc283f1be220` |
| Atelier | `da4e8cac6b3243b2b4dd55103326206b` | `49070a9bd7864b4abcd38b8d389f04f6` |
| Atelier — chart and lesson | `21e8917c0b7340578351df0a42f17e52` | `04ff4bc655cc4be2b7ee0964298943da` |
| Profile | `8c8e87b11d6149c9a0d15c93abb5b4cb` | `4af5cc52e3764fd68653eca9719db4f0` |
| Souvenir offer | `d873939979ba40cb86063d56f061d104` | `f5a3d15acabd410fb192418cb5ffb34a` |
| Souvenir atelier | `63d88e49124543c0b30e9f5a349703b6` | `b24ea1b9848645bebea65c50c9d234cc` |
| Settings | `e04096ec95e845f09855abb2a27ac361` | `6726e82378d94bcb9a93b2e335b76a3c` |
| About | `1b810de1bd774bb8a307fd245577e941` | `704fc11c545d4f0f8d3046e6743b1083` |
| Synastry and Share sheets | `8c2e96efef4d4b339a55c3496393fe05` | `7659655fb98e4effb5ab87cbf87de995` |
| Landing (desktop) | `5e925899faab4625b177deb87a05d9d1` | `a351127d91ba4e209ddae9706d47f63f` |
| Landing — phone | `6619a56c356a4eb9aeb2696e5a291162` | `7d574c2e7ea34ac98d572c4b83aedf46` |
| Atelier — desktop | `79fbf6f8110b4f3a9fc7fe63d1745f81` | `dc79acecbfa1447bb62169a84cebfecf` |
| Souvenir PDF — opening pages | `705d5546832f46bd94ca7daf963be5f5` | `e9922fbd11bf44d2b3ff7429d488033d` |
| Souvenir PDF — element pages | `26e874c8c46945e59068ecd7269773c1` | `169dba7bcaa6421689bf9e2c659379b8` |

All eighteen screens are generated. HTML is fetched with the Stitch `download_file`
tool using `projects/8007307049701360266/files/<HTML file id>`.

### Journeys the prototype covers

1. **First visit on the web**: Landing → any purchase button or "Create your natal
   chart" → Sign in → Birth details → Voice setup → Atelier.
2. **Opening the installed app**: Pick a modality → Sign in if needed → Birth details and
   Voice setup the first time → Atelier.
3. **Free lesson**: Atelier → choose a placement by the select, a chip, or a tap on the
   chart → Atelier chart and lesson: the lesson, "You and [element]", then her invitation.
4. **Personal reading**: "Hear my personal reading" or the composer → with credits, a
   spoken reading with chart highlights → without credits, "Add credits for your personal
   reading." → Top Up.
5. **Top Up**: any Top Up control → Top Up → the provider's checkout → back in the
   Atelier with the new balance, and the reading continues.
6. **Landing purchase**: a section's button → Sign in → checkout for that product →
   credits present → Atelier. The product is chosen once, by the button pressed.
7. **Souvenir**: Souvenir button → Souvenir offer → checkout → "Your souvenir is ready" →
   Souvenir atelier or Souvenir PDF. The same two links sit on the Profile transaction
   row and in the email.
8. **Readings menu**: "My Horoscope" starts that reading in the conversation. "Synastry"
   opens the Synastry sheet → "Compare our charts" → reading in the conversation.
9. **Share**: "Share chart" → Share sheet → copy link, save image, or save PDF.
10. **Account**: Profile → Settings, About, Restore purchases, Sign out.

### Corrections applied at freeze (no redesign)

- Stitch's stand-in mascot and room art are replaced by the real brand files.
- Astrological glyphs are forced to text form so none renders as a colour emoji.
- Any words Stitch added beyond the given placeholders are removed (seen on the PDF
  deep-dive page).
- Example values stay placeholders or come from `.env`; nothing invented ships.

Existing purchases on the account are honoured: on sign-in the server reads every
RevenueCat purchase and credits any not yet in the Firebase ledger.

## What Natally is

A robot astrologer in a candlelit atelier. She calculates the customer's natal chart
exactly, explains any planet, sign, house or aspect for free with authored lessons, and
gives personal spoken readings paid for with credits. A souvenir turns a reading into a
keepsake: a PDF and a frozen interactive copy of the atelier.

Ships as a Tauri 2 app for Web, Android, Linux and Windows from one codebase.

## Requirements

**Look.** Same look and feel as the reference pictures, pixel by pixel. The mascot is
used as-is. One design system named **Natally** is extracted from the screen designs and
brand files and is the only source of colour, type, spacing and motion.

**Screens.** Modality splash ("pick a modality": natal chart reading now; tarot, I Ching
and others as add-on modules bought later). Landing. Sign in. Birth details. Atelier with
chart, conversation and voice. Profile with balance and every transaction. Top Up.
Souvenir offer. Frozen souvenir atelier. Souvenir PDF. Settings. About.

**Chart.** Swiss Ephemeris. Placidus houses; Whole Sign when the birth time is unknown.
The wheel is a real 3D object: it turns slowly, can be dragged and zoomed, and lights up
the placement Natally is speaking about. The flat wheel drawn in the prototype is a
stand-in for it. The same wheel appears large as the main view and small in the inset,
and the customer can swap the two.

**Room.** The atelier is alive but calm: the room ambience loop and the sound effects
under `public/atelier/audio/` play only when room sounds are on, Natally's head and
hands move over the clean-plate art while she speaks, and all motion stops when the
customer pauses motion or the system asks for reduced motion.

**Voice.** Supertonic text to speech on the device. On install it tests the device's
resources and calibrates itself. Synthesis is multithreaded. It always generates at least
one whole sentence ahead, and never cuts inside a sentence, so prosody stays natural.

**Readings.** OpenRouter. Each user gets their own key, provisioned by the server with an
expiry and a spend limit, and refreshed when either runs out.

**Accounts.** Firebase sign-in. Credits and the transaction ledger are stored in
Firebase and written only by the server.

**Billing.** RevenueCat is implemented now, using the account already in place: Web
Billing on web and desktop, and the RevenueCat SDK paywalls on Google Play Billing for
Android, so Play gift cards and one-tap purchase work. The billing layer is a single
interface so Chargebee and WooCommerce can be added by configuration. A requirements
document states what our custom WooCommerce plugin must provide for this project.

**Credits always arrive.** After any purchase the server confirms it with the payment
provider and writes one ledger entry keyed by the provider's transaction id, raising the
balance in the same write. The same id twice changes nothing. This runs from the
provider's notification and again whenever the app opens or returns from checkout.

**Analytics.** Google Analytics events across the whole funnel, enough to tune conversion
and design: section and offer views, sign-up, birth details, chart, lesson, reading
request and result, paywall view, checkout, purchase, souvenir, modality choice, install
click, voice calibration result, page speed, errors. No personal data.

**Souvenir.** Offer, purchase, generated content, letter-size PDF, and a static frozen
atelier that replays the saved reading and never calls a model. No disclaimers.

**Configuration.** Everything is in `.env`: app name, identifier, domains, prices,
product ids, keys, hosts. Nothing is typed into code. `.env.example` documents every
variable with neutral defaults so a cloner's build is visibly not ours. Our own `.env`
holds pointers that the build fills from Admin-Manual. A fresh clone plus a `.env` builds,
with no orphaned file or setting.

**Hosting.** Web deploys first to `natally-v3.surge.sh`, aliased at
`natally-v3.robin.mba`. More aliases are more entries in `.env`. Static files go to
Surge. Server functions go to Netlify. Souvenir files go to the shared host.

**Admin-Manual.** A new project section for `natally-v3-4nov2026` recording that it
follows natally-ai-studio in the Natally lineage and is a greenfield clean-room one-shot.
Every credential recorded as printable plaintext with a QR code. The Namecheap key noted
in the infrastructure section.

**Process.** Architecture first as one snapshot, then a checklist of self-contained tasks
that coder subagents build in parallel. Results are judged by reading the whole artifact
against the architecture through CodeGraph and by running the real flow, never by text
search. No unit tests. A commit and a push after every task. Each generated document is
sent through the kstore MCP.

## Platform facts from current official documentation

- In-model WASM threads need cross-origin isolation, which Surge, Android WebView and
  Linux WebKitGTK do not provide today. Multithreading is therefore a pool of workers,
  each synthesizing a different sentence. Calibration turns on in-model threads or WebGPU
  only where the device passes a runtime probe, and sizes the pool by memory.
- Google blocks OAuth inside embedded webviews. Desktop signs in through the system
  browser, Android through a native sign-in plugin.
- The RevenueCat paywall launcher must be created in the Android activity's `onCreate`.
- Google Play forbids links to other payment methods inside the Android app, so the
  Android build contains Play Billing only.
- OpenRouter keys take a spend limit, an optional reset period and an ISO expiry; a
  rejected or exhausted key answers 401 or 402.

## Build order

1. **Bootstrap.** Clone Admin-Manual. In v3: `AGENTS.md`, `CLAUDE.md`, `LICENSE`,
   `.gitignore`, CodeGraph index.
2. **Design system "Natally".** Tokens, brand book, components with live previews,
   brand files with a hash manifest. Published as a Design System artifact and to Stitch.
3. **Admin-Manual.** Project section, credentials with QR codes, infrastructure note.
4. **Freeze the prototype.** Export the eighteen screens' HTML into
   `LIBS/UI/STITCH/screens/`, apply the freeze corrections, open and operate every screen
   in a browser, and record the frozen set in `LIBS/UI/STITCH/FROZEN.md`. Architecture
   starts only after this.
5. **`DOCS/ARCHITECTURE.md`, then `CHECKLIST.md`**, plus `README.md`, `DOCS/PRD.md`,
   the analytics contract, the hosting note and the WooCommerce plugin requirements.
6. **Build.** Foundation and first live deploy first, then every other task in parallel.
7. **Packages.** `build_all.sh` is the only build entry: version stamp, `.env`, web
   build, deploy, server functions, then Linux, Android and Windows packages.

## Verification

1. Fresh clone with `.env` from `.env.example` builds without Admin-Manual.
2. Our build prints no secret.
3. Live site: sign in → birth details → chart → free lesson → Top Up → credits appear in
   Firebase and on screen → spoken reading → profile lists every transaction → souvenir →
   PDF and atelier links.
4. Each screen compared against its reference picture.
5. Voice: calibration result stored, no sentence cut, generate-ahead as calibrated.
6. A returning visitor gets a new version without reloading by hand.
7. Analytics events arrive.
8. Linux, Android and Windows packages produced.
9. Committed, deployed and verified-live reported as separate states.

## Recorded, not waited on

- RevenueCat has no Play service-account credentials for Natally, so a real Play purchase
  cannot be validated until they are uploaded. The Android build and paywall are finished
  regardless.
- No Android device is attached, so the Play purchase sheet is not exercised on hardware.
- This machine has no Netlify login; I deploy through the Netlify connector.
