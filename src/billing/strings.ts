// The billing module's text (§3.2 rule 5): keys of §11.11, then the frozen `top-up` text. `{}` is interpolated.
export const strings = {
  'billing.loading': 'Loading prices…',
  'billing.catalogFailed': "We couldn't load the prices. Tap to try again.",
  'billing.opening': 'Opening checkout…',
  'billing.confirming': 'Confirming your purchase…',
  'billing.slow': "Your payment went through and your credits are on their way. They'll appear here shortly.",
  'billing.pending': 'Your payment is pending. Your credits will appear when it clears.',
  'billing.failed': "The payment didn't go through. You haven't been charged.",
  'billing.added': '{} credits added.',
  'billing.restored': '{} purchases restored.',
  'billing.nothing': 'Everything is already on your account.',
  'billing.rowCredits': 'Exploration credits',
  'billing.rowSouvenir': 'Souvenir reading',
  'billing.rowUsage': 'Personal reading',
  'topup.title': 'Top Up',
  'topup.close': 'CLOSE',
  'topup.whatTitle': 'What credits do',
  'topup.what1': "Credits pay for {}'s personal spoken readings of your chart.",
  'topup.what2': 'Her lessons on any planet, sign, house or aspect are free.',
  'topup.what3': 'Your balance stays with your account on every device.',
  'topup.choose': 'CHOOSE AN AMOUNT',
  'topup.pack': '{} — {} Cr',
  'topup.total': 'You see the total before you pay.',
  'topup.continue': 'Continue to payment',
  'topup.continuePrice': 'Continue to payment · {}',
} as const;

/** Fills each `{}` of a string in order. */
export function fill(template: string, ...values: (string | number)[]): string {
  let next = 0;
  return template.replace(/\{\}/g, () => String(values[next++]));
}
