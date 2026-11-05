# 10 — Interactive elements

Every interactive element of the frozen UI, one row per screen and id: 174 rows. Ids shared by the phone and desktop variants of one screen appear under each. `navigate(-1) or X` means history back, else route X. Each click also fires the analytics in §15 where it is named there.

## pick-a-modality

| Id | Action |
|---|---|
| `modality-natal-begin` | Track `modality_choose`; navigate to natal `entryPath` (`/atelier`), gates apply |
| `modality-signin-link` | Navigate `/sign-in?next=/pick` |

## landing-desktop

| Id | Action |
|---|---|
| `landing-desktop-logo-link` | Scroll to top of landing |
| `landing-desktop-nav-your-chart` | Go to landing section (`scrollIntoView`) `#landing-atelier` |
| `landing-desktop-nav-explained-aloud` | Go to landing section (`scrollIntoView`) `#landing-atelier` |
| `landing-desktop-nav-personal-readings` | Go to landing section (`scrollIntoView`) `#landing-prices` |
| `landing-desktop-nav-prices` | Go to landing section (`scrollIntoView`) `#landing-prices` |
| `landing-desktop-nav-learn-astrology` | Go to landing section (`scrollIntoView`) `#landing-install`, as frozen |
| `landing-signin-button` | Navigate `/sign-in?next=/atelier` |
| `landing-cta-hero` | Souvenir product. Set `natally.pendingProduct`, then `/sign-in?next=/checkout` if signed out, else `/checkout` |
| `landing-explore-free-link` | Go to landing section (`scrollIntoView`) `#landing-atelier` |
| `landing-cta-calculated` | Souvenir product. Set `natally.pendingProduct`, then `/sign-in?next=/checkout` if signed out, else `/checkout` |
| `landing-cta-wheel` | Souvenir product. Set `natally.pendingProduct`, then `/sign-in?next=/checkout` if signed out, else `/checkout` |
| `landing-cta-credits` | First top-up slot. Set `natally.pendingProduct`, then `/sign-in?next=/checkout` if signed out, else `/checkout` |
| `landing-sound-toggle` | Flip `roomSounds`; ambience on landing example scene |
| `landing-element-select` | Highlight that element on the example wheel; options from example chart via `listChartElements` |
| `landing-create-chart-button` | Navigate `/sign-in?next=/atelier` |
| `landing-buy-souvenir` | Souvenir product. Set `natally.pendingProduct`, then `/sign-in?next=/checkout` if signed out, else `/checkout` |
| `landing-buy-credits` | First top-up slot. Set `natally.pendingProduct`, then `/sign-in?next=/checkout` if signed out, else `/checkout` |
| `landing-restore-link` | Navigate `/sign-in?next=/profile`; sign-in triggers reconcile |
| `landing-install-play` | Track `install_click` store=`play`; `openExternal(VITE_LINK_PLAY)`; hidden if empty |
| `landing-install-windows` | Track `install_click` store=`windows`; `openExternal(VITE_LINK_WINDOWS)`; hidden if empty |
| `landing-install-linux` | Track `install_click` store=`linux`; `openExternal(VITE_LINK_LINUX)`; hidden if empty |
| `landing-explore-link` | Go to landing section (`scrollIntoView`) `#landing-atelier` |
| `landing-terms-link` | Open `VITE_LINK_TERMS` |
| `landing-privacy-link` | Open `VITE_LINK_PRIVACY` |
| `landing-contact-link` | Open `VITE_LINK_CONTACT`; text shows `VITE_LEGAL_ENTITY` |

## landing-phone

| Id | Action |
|---|---|
| `landing-signin-button` | Navigate `/sign-in?next=/atelier` |
| `landing-sound-toggle` | Flip `roomSounds`; ambience on landing example scene |
| `landing-element-select` | Highlight that element on the example wheel; options from example chart via `listChartElements` |
| `landing-create-chart-button` | Navigate `/sign-in?next=/atelier` |
| `landing-cta-hero` | Souvenir product. Set `natally.pendingProduct`, then `/sign-in?next=/checkout` if signed out, else `/checkout` |
| `landing-explore-free-link` | Go to landing section (`scrollIntoView`) `#landing-atelier` |
| `landing-cta-calculated` | Souvenir product. Set `natally.pendingProduct`, then `/sign-in?next=/checkout` if signed out, else `/checkout` |
| `landing-cta-wheel` | Souvenir product. Set `natally.pendingProduct`, then `/sign-in?next=/checkout` if signed out, else `/checkout` |
| `landing-cta-credits` | First top-up slot. Set `natally.pendingProduct`, then `/sign-in?next=/checkout` if signed out, else `/checkout` |
| `landing-install-play` | Track `install_click` store=`play`; `openExternal(VITE_LINK_PLAY)`; hidden if empty |
| `landing-terms-link` | Open `VITE_LINK_TERMS` |
| `landing-privacy-link` | Open `VITE_LINK_PRIVACY` |
| `landing-contact-link` | Open `VITE_LINK_CONTACT`; text shows `VITE_LEGAL_ENTITY` |

## sign-in

| Id | Action |
|---|---|
| `signin-terms-link` | Open `VITE_LINK_TERMS` |
| `signin-privacy-link` | Open `VITE_LINK_PRIVACY` |
| `signin-google-button` | `signInGoogle()` via `platform.googleSignIn` |
| `signin-tab-login` | Mode `login`: email + password fields, submit label `Log In` |
| `signin-tab-signup` | Mode `signup`: email + password, submit label `Sign Up` |
| `signin-tab-phone` | Mode `phone`: phone number then code; `signin-email-input` becomes the phone field and `signin-password-input` the code field |
| `signin-email-input` | Email or phone value |
| `signin-password-input` | Password or SMS code value |
| `signin-submit-button` | Run the mode's Firebase call, then `next` |

## birth-details

| Id | Action |
|---|---|
| `birth-back-link` | `navigate(-1)`; to `/pick` or `/` if no history |
| `birth-name-input` | Field `name`, required |
| `birth-day-select` | Field `day`; options 1 to 31, trimmed by month |
| `birth-month-select` | Field `month`, January to December |
| `birth-year-select` | Field `year`; options current year down to 1900; frozen selection value is an example |
| `birth-time-input` | Field `time`, accepts `7:05 PM` or `19:05` |
| `birth-time-unknown-checkbox` | Disables time; chart will be Whole Sign |
| `birth-place-input` | Debounced `searchPlaces`; suggestions in a `ListRow` list under the field; a place must be picked |
| `birth-submit-button` | `parseBirthFields`, `saveBirth`, then `/voice` or next |

## voice-setup

| Id | Action |
|---|---|
| `voice-continue-button` | Enabled at `ready`; navigate to next |
| `voice-skip-link` | Set `natally.voice.skipped`; `readAloud` off; navigate to next |

## atelier

| Id | Action |
|---|---|
| `atelier-topup-button` | `useOpenTopUp()` |
| `atelier-souvenir-button` | Track `souvenir_offer_view` on arrival; navigate `/souvenir` |
| `atelier-profile-button` | Navigate `/profile` |
| `atelier-sound-toggle` | Flip `roomSounds`; label Sound On or Sound Off, chip hidden when off |
| `atelier-element-select` | Navigate `/atelier/lesson/<key>`; options from `listChartElements` |
| `atelier-share-button` | Open `SheetShare` (`?sheet=share`) |
| `atelier-horoscope-button` | `startReading({kind:'horoscope'})` |
| `atelier-synastry-button` | Open `SheetSynastry` (`?sheet=synastry`) |
| `atelier-view-room-button` | `chartMain` = `room`; play effect `swap` |
| `atelier-view-chart-button` | `chartMain` = `chart`; play effect `swap` |
| `atelier-pause-motion-button` | Flip `pauseMotion`; label Pause motion or Resume motion |
| `conversation-read-aloud-toggle` | Flip `readAloud`; off calls `stopSpeech` |
| `conversation-settings-button` | Navigate `/settings` |
| `conversation-save-button` | `saveConversation()`; toast `conversation.saved` |
| `conversation-input` | Composer text; dispatches `natally:typing` |
| `conversation-send-button` | `appendCustomerTurn`, `startReading({kind:'question'})`; refusal `no_credits` shows the Add credits bubble with Top Up |

## atelier-desktop

| Id | Action |
|---|---|
| `atelier-topup-button` | `useOpenTopUp()` |
| `atelier-souvenir-button` | Track `souvenir_offer_view` on arrival; navigate `/souvenir` |
| `atelier-profile-button` | Navigate `/profile` |
| `atelier-sound-toggle` | Flip `roomSounds`; label Sound On or Sound Off, chip hidden when off |
| `atelier-element-select` | Navigate `/atelier/lesson/<key>`; options from `listChartElements` |
| `atelier-share-button` | Open `SheetShare` (`?sheet=share`) |
| `atelier-horoscope-button` | `startReading({kind:'horoscope'})` |
| `atelier-synastry-button` | Open `SheetSynastry` (`?sheet=synastry`) |
| `atelier-view-room-button` | `chartMain` = `room`; play effect `swap` |
| `atelier-view-chart-button` | `chartMain` = `chart`; play effect `swap` |
| `atelier-pause-motion-button` | Flip `pauseMotion`; label Pause motion or Resume motion |
| `conversation-read-aloud-toggle` | Flip `readAloud`; off calls `stopSpeech` |
| `conversation-settings-button` | Navigate `/settings` |
| `conversation-save-button` | `saveConversation()`; toast `conversation.saved` |
| `conversation-input` | Composer text; dispatches `natally:typing` |
| `conversation-send-button` | `appendCustomerTurn`, `startReading({kind:'question'})`; refusal `no_credits` shows the Add credits bubble with Top Up |

## atelier-chart-lesson

| Id | Action |
|---|---|
| `lesson-topup-pill` | `useOpenTopUp()` |
| `lesson-souvenir-button` | Navigate `/souvenir` |
| `lesson-profile-button` | Navigate `/profile` |
| `lesson-sound-toggle` | Flip `roomSounds` |
| `lesson-element-select` | Replace `:elementKey` |
| `atelier-chart-lesson-chip-sun` | Replace `:elementKey` with `sun` |
| `atelier-chart-lesson-chip-moon` | Replace `:elementKey` with `moon` |
| `atelier-chart-lesson-chip-mercury` | Replace `:elementKey` with `mercury` |
| `atelier-chart-lesson-chip-venus` | Replace `:elementKey` with `venus` |
| `atelier-chart-lesson-chip-mars` | Replace `:elementKey` with `mars` |
| `atelier-chart-lesson-chip-jupiter` | Replace `:elementKey` with `jupiter` |
| `atelier-chart-lesson-chip-saturn` | Replace `:elementKey` with `saturn` |
| `lesson-personal-reading-button` | `startReading({kind:'personal_reading',focus:key})`, or with no credits scroll to the Add credits bubble |
| `lesson-topup-button` | `useOpenTopUp()`; shown only with no credits |
| `lesson-input` | Composer text; dispatches `natally:typing` |
| `lesson-send-button` | As `conversation-send-button`, with `focus` |

## synastry-share-sheets

| Id | Action |
|---|---|
| `synastry-name-input` | Field `name`, required |
| `synastry-day-select` | Field `day` |
| `synastry-month-select` | Field `month` |
| `synastry-year-select` | Field `year`; options current year down to 1900 |
| `synastry-time-input` | Field `time` |
| `synastry-time-unknown-checkbox` | Disables time |
| `synastry-place-input` | Same behaviour as `birth-place-input` |
| `synastry-submit-button` | `computeSynastry`; close sheet; `startReading({kind:'synastry',synastry})` |
| `synastry-cancel-link` | Close sheet |
| `share-copy-link-button` | `createShareLink`, `copyText`; toast `share.copied` |
| `share-save-image-button` | `renderWheelPng`, `saveFile` as `<name>-natal-chart.png` |
| `share-save-pdf-button` | One-page Letter PDF from `flatWheelShapes`, `saveFile` |
| `share-close-link` | Close sheet |

## top-up

| Id | Action |
|---|---|
| `topup-close-button` | `navigate(-1)` or `/atelier` |
| `topup-pack-5` | Select catalogue slot 0; label `<priceLabel> — <credits> Cr` |
| `topup-pack-10` | Select catalogue slot 1; selected by default |
| `topup-pack-25` | Select catalogue slot 2 |
| `topup-continue-button` | `buyProduct(selected,'credits')`; label `Continue to payment · <priceLabel>` |

## profile

| Id | Action |
|---|---|
| `profile-close-button` | `navigate(-1)` or `/atelier` |
| `profile-topup-button` | `useOpenTopUp()` |
| `profile-souvenir-atelier-1` | First souvenir row; `openExternal(atelierUrl)`. Row *n* repeats with id `profile-souvenir-atelier-<n>` |
| `profile-souvenir-pdf-1` | First souvenir row; `openExternal(pdfUrl)`. Row *n* repeats with id `profile-souvenir-pdf-<n>` |
| `profile-restore-link` | `restorePurchases()`; toast `billing.restored` with count |
| `profile-settings-link` | Navigate `/settings` |
| `profile-about-link` | Navigate `/about` |
| `profile-signout-button` | `signOutNow`; navigate `/pick` in shells or installed PWA, else `/` |

## settings

| Id | Action |
|---|---|
| `settings-close-button` | `navigate(-1)` or `/atelier` |
| `settings-read-aloud-toggle` | Flip `readAloud` |
| `settings-room-sounds-toggle` | Flip `roomSounds` |
| `settings-room-volume-slider` | Set `roomVolume` |
| `settings-retune-voice-button` | Navigate `/voice?retune=1`: `beginVoiceSetup({force:true})` |
| `settings-house-system-select` | Shows the chart's house system as its only option, with `chart.wholeSignReason` beneath when not Placidus; read-only by design |
| `settings-pause-motion-toggle` | Flip `pauseMotion` |
| `settings-analytics-toggle` | Flip `analyticsConsent`; gtag consent update |
| `settings-erase-history-button` | `Dialog` with `settings.eraseConfirm`; then `eraseConversationHistory()` |
| `settings-profile-link` | Navigate `/profile` |
| `settings-about-link` | Navigate `/about` |

## about

| Id | Action |
|---|---|
| `about-close-button` | `navigate(-1)` or `/atelier` |
| `about-licence-swisseph` | Navigate `/legal/licence-swisseph` |
| `about-licence-voice` | Navigate `/legal/licence-voice` (OpenRAIL-M terms; states speech is machine generated) |
| `about-licence-fonts` | Navigate `/legal/licence-fonts` (OFL files) |
| `about-licence-notices` | Navigate `/legal/licence-notices` (generated `THIRD-PARTY.json`) |
| `about-terms-link` | Open `VITE_LINK_TERMS` |
| `about-privacy-link` | Open `VITE_LINK_PRIVACY` |
| `about-contact-link` | Open `VITE_LINK_CONTACT` |

## souvenir-offer

| Id | Action |
|---|---|
| `souvenir-close-button` | `navigate(-1)` or `/atelier` |
| `souvenir-buy-button` | `buyProduct(souvenirId,'souvenir')`; label `Buy souvenir · <priceLabel>` |
| `souvenir-open-atelier-button` | `openExternal(atelierUrl)` |
| `souvenir-open-pdf-button` | `openExternal(pdfUrl)` |

## souvenir-atelier

| Id | Action |
|---|---|
| `souvenir-replay-button` | Play saved audio in order with wheel highlights; toggles to Pause; text-only scroll if `audio` is null |
| `souvenir-pdf-button` | Open the sibling PDF file |
| `souvenir-question-input` | Local text only |
| `souvenir-ask-button` | Append the question and the frozen keepsake reply. No network call |
| `souvenir-topup-button` | Open `topUpUrl` |

## souvenir-pdf-opening

| Id | Action |
|---|---|
| `pdf-hear-natally-conversation` | PDF link annotation → `<atelierUrl>#play=conversation` |

## souvenir-pdf-elements

| Id | Action |
|---|---|
| `pdf-group-chip-1` | PDF link → chapter page of element 1 of the group |
| `pdf-group-chip-2` | PDF link → chapter page of element 2 |
| `pdf-group-chip-3` | PDF link → chapter page of element 3 |
| `pdf-group-chip-4` | PDF link → chapter page of element 4 |
| `pdf-group-chip-5` | PDF link → chapter page of element 5 |
| `pdf-group-chip-6` | PDF link → chapter page of element 6; further chips repeat the pattern in rows |
| `pdf-hear-natally-element-cover` | PDF link → `<atelierUrl>#play=<elementKey>` |
| `pdf-chip-venus` | PDF link → chapter of the related planet; template stand-in, real label comes from the element |
| `pdf-chip-libra` | PDF link → chapter of the related sign |
| `pdf-chip-7th-house` | PDF link → chapter of the related house |
| `pdf-hear-natally-deep-dive` | PDF link → `<atelierUrl>#play=<elementKey>` |
