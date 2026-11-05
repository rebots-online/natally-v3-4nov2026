// The only user-facing text of server/souvenir (§11 mail.* rows). `{}` is filled in order.
export const strings = {
  'mail.subject': 'Your souvenir from {}',
  'mail.body': 'Your souvenir is ready, {}.\n\nYour atelier: {}\nYour PDF: {}\n\nBoth links also live in your purchase history.',
} as const;

export function fill(template: string, ...values: string[]): string {
  let i = 0;
  return template.replace(/\{\}/g, () => values[i++] ?? '');
}
