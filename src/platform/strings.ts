// User-facing text of the platform module (§3.2 rule 5). Thrown errors reach the caller's toast.
export const strings = {
  'platform.copyFailed': 'Could not copy to the clipboard.',
  'platform.saveFailed': 'Could not save the file.',
  'platform.linkRefused': 'That link cannot be opened.',
  'platform.bridgeNeedsOrigin': 'Sign-in on this device needs the canonical web address, which is not configured.',
  'platform.storeBadPath': 'That file path is not allowed.',
} as const;
