// The info module's text (§3.2 rule 5): the frozen Settings and About copy, the §11.11 settings.* and about.* keys, and the
// labels of the text pages. `{app}` and `{entity}` are filled from the configuration by the screen. The authored Terms,
// Privacy and licence documents live under `legal/` (§17.4).
export const strings = {
  'settings.title': 'Settings',
  'settings.close': 'CLOSE',
  'settings.sound': 'SOUND',
  'settings.readAloud': 'Read aloud',
  'settings.roomSounds': 'Room sounds',
  'settings.roomVolume': 'Room sound volume',
  'settings.retune': 'Re-tune her voice to this device',
  'settings.chart': 'CHART',
  'settings.houseSystem': 'House system',
  'settings.placidus': 'Placidus',
  'settings.wholeSign': 'Whole Sign',
  'settings.motion': 'MOTION',
  'settings.pauseMotion': 'Pause motion',
  'settings.privacy': 'PRIVACY',
  'settings.analytics': 'Share anonymous usage to improve {app}',
  'settings.erase': 'Erase my conversation history',
  'settings.account': 'ACCOUNT',
  'settings.profile': 'Profile',
  'settings.about': 'About {app}',
  'settings.eraseConfirm': 'Erase every saved conversation? Your souvenirs stay.',
  'settings.eraseYes': 'Erase',
  'settings.eraseNo': 'Keep',
  'settings.erased': 'Your conversation history is erased.',
  'settings.failed': "That didn't work. Please try again.",
  'chart.wholeSignReason': 'Without a birth time your chart uses Whole Sign houses, counted from your Sun sign.',
  'chart.polarReason': 'Placidus cannot be drawn at this latitude, so your chart uses Whole Sign houses.',

  'about.title': 'About',
  'about.close': 'CLOSE',
  'about.avatarAlt': '{app} avatar',
  'about.tagline': 'Readings by {app}',
  'about.chartTitle': 'How your chart is calculated',
  'about.chartBody':
    'Your chart is calculated with the Swiss Ephemeris from your birth date, time and place. Houses are Placidus. Without a birth time, your chart uses Whole Sign houses.',
  'about.voiceTitle': 'Her voice',
  'about.voiceBody': "{app}'s voice is generated on your device.",
  'about.machineSpeech': 'Her voice is machine generated.',
  'about.licences': 'LICENCES',
  'about.licenceSwisseph': 'Swiss Ephemeris',
  'about.licenceVoice': 'Supertonic voice model',
  'about.licenceFonts': 'Fonts',
  'about.licenceNotices': 'Open source notices',
  'about.navLabel': 'Legal and contact links',
  'about.terms': 'Terms',
  'about.privacy': 'Privacy',
  'about.contact': 'Contact',

  'legal.close': 'CLOSE',
  'legal.notFoundTitle': 'Not found',
  'legal.notFoundBody': 'There is no such page. Try the list on the About screen.',
  'legal.updated': 'Effective {date}',
  'legal.loading': 'Loading…',
  'legal.loadFailed': 'The text could not be loaded. Please try again.',
  'legal.noticesPackages': 'Packages in this app',
  'legal.noticesCount': '{n} packages',
  'legal.fontsFile': 'Licence file for {family}',
  'legal.modelCard': 'Model card and licence text',
} as const;

export type StringKey = keyof typeof strings;

/** Fills `{name}` markers. The values come from configuration, never from typed text. */
export function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (marker, name: string) => values[name] ?? marker);
}
