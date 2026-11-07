// The voice module's text (§3.2 rule 5): the frozen Voice setup copy and the voice.* keys of §11.11.
export const strings = {
  'voiceSetup.cameoAlt': 'Natally',
  'voiceSetup.title': 'Natally is finding her voice.',
  'voiceSetup.subtitle': 'Her voice runs on this device. This happens once.',
  'voiceSetup.download': 'Downloading her voice',
  'voiceSetup.load': 'Loading her voice',
  'voiceSetup.tune': 'Tuning to this device',
  'voiceSetup.found': 'WHAT SHE FOUND',
  'voiceSetup.speed': 'Speed',
  'voiceSetup.speedValue': '{}× real time',
  'voiceSetup.ahead': 'Sentences ready ahead',
  'voiceSetup.workers': 'Voices working at once',
  'voiceSetup.continue': 'Continue',
  'voiceSetup.skip': 'Continue without sound',
  'voice.unsupported': "Her voice can't run on this device. You can read everything instead.",
  'voice.waiting': 'waiting',
  'voice.bytes': '{} MB of {} MB',
  'voice.loaded': '{} of {} loaded',
  'voice.candidate': '{} of {} tried',
  'voice.done': 'done',
  'voice.retry': 'Something stopped her voice from loading. Tap Continue without sound, or try again in Settings.',
  'voice.storage': "There isn't enough free space for her voice on this device.",
} as const;

/** Fills each `{}` in turn. */
export function fill(template: string, ...values: (string | number)[]): string {
  let at = 0;
  return template.replace(/\{\}/g, () => String(values[at++] ?? ''));
}
