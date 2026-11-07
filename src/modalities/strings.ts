// The modalities module's text (§3.2 rule 5): the frozen Pick a modality copy. `{app}` is the configured app name.
import { config } from '../config';

export const strings = {
  'pick.iconAlt': '{app} robot astrologer',
  'pick.eyebrow': 'READINGS BY {app}',
  'pick.heading': 'What shall we read tonight?',
  'pick.subtitle': 'Choose a reading.',
  'pick.begin': 'Begin',
  'pick.addOn': 'Add-on',
  'pick.addOnNote': 'Add-on readings are bought separately.',
  'pick.signIn': 'Sign in',
} as const;

export const fill = (text: string): string => text.replaceAll('{app}', config.appName);
