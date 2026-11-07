// Shape of an authored document. A paragraph is a string; a list is an array of strings.
export type LegalBlock = string | string[];
export interface LegalSection { heading: string; blocks: LegalBlock[] }
export interface LegalDocument {
  title: string;
  /** Shown as "Effective <date>" on Terms and Privacy; the licence pages carry none. */
  effective?: string;
  sections: LegalSection[];
}

/** What the documents name. Every value comes from the configuration through the caller, none is typed here. */
export interface LegalParty {
  /** Product name. */
  app: string;
  /** Legal entity that publishes the app. */
  entity: string;
  /** Address for every request in these documents. */
  email: string;
  /** Where the voice model's own card and licence are published: `<voice base>/<voice repo>`. */
  voiceModelUrl: string;
}

export const EFFECTIVE_DATE = '5 November 2026';
