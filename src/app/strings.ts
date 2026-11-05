// The app shell's text (§3.2 rule 5). Keys of §11.11, plus the configuration state.
export const strings = {
  'app.offline': "You're offline. Lessons and your chart still work.",
  'app.chunkFailed': 'Loading…',
  'app.configNeededTitle': 'This build is not configured yet',
  'shell.updateAvailable': 'A new version is available.',
  'shell.updateAction': 'Download',
  'app.configNeededBody': 'The page is live, but it needs these settings in its .env before it can open:',
} as const;
