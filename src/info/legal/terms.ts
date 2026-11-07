// Terms of use (§17.4), authored in full. Product facts follow §1, §6, §7, §13 and §14.
import { EFFECTIVE_DATE, type LegalDocument, type LegalParty } from './types';

export function terms({ app, entity, email }: LegalParty): LegalDocument {
  return {
    title: 'Terms',
    effective: EFFECTIVE_DATE,
    sections: [
      {
        heading: 'Who we are and what these terms cover',
        blocks: [
          `${app} is published by ${entity} ("we", "us"). These terms are the agreement between you and ${entity} for the ${app} website, the installable web app, and the Android, Linux and Windows apps (together, "the service"). By creating an account, buying credits or otherwise using the service you accept these terms. If you do not accept them, please do not use the service.`,
          `You can reach us at ${email} about anything in these terms.`,
        ],
      },
      {
        heading: 'What the service does',
        blocks: [
          `${app} calculates your birth chart from the birth date, time and place you give, shows it as an interactive wheel, teaches what each part of it means, and holds spoken and written readings with you about your chart. It also offers a daily horoscope, a comparison of your chart with another person's, a shareable chart link, and a souvenir: a personal keepsake of your reading as a PDF and as a replayable web page.`,
          `Readings, horoscopes, comparisons and souvenir text are written by artificial intelligence language models from the chart facts we calculate and the words you send. They are made for reflection, curiosity and enjoyment. They are not medical, psychological, legal, financial or any other professional advice, and they are not predictions you should rely on. Make your own decisions, and ask a qualified professional where one is needed.`,
        ],
      },
      {
        heading: 'Machine-generated voice and text',
        blocks: [
          `Her voice is machine generated. The spoken voice you hear is produced by a synthetic speech model that runs on your device, and every reading, horoscope and souvenir chapter is machine-written text. Nothing in the service is a recording of a person. If you copy, share or publish any of it, you must not present it as written or spoken by a human being, and you must say that it is machine generated.`,
        ],
      },
      {
        heading: 'Your account',
        blocks: [
          `You sign in with Google, with an email address, or with a phone number. You must be at least 16 years old, or the age at which you can consent to an online service where you live if that is higher, and you must be able to enter a binding contract to buy anything. You are responsible for what happens under your account, so keep your sign-in methods to yourself and tell us at once if you think someone else has used them.`,
          `Give details that are true to the best of your knowledge. A chart calculated from wrong birth details will be wrong, and ${app} cannot tell.`,
        ],
      },
      {
        heading: 'Credits, purchases and souvenirs',
        blocks: [
          `Readings use credits. You buy credits as one-time purchases; there are no subscriptions and nothing renews by itself. Prices are shown in the app before you pay, in the currency and with the taxes your payment provider applies. On the web and on Windows and Linux the purchase runs through a payment provider that takes your payment details directly; on Android it runs through Google Play. We never see or store your card number.`,
          `While a reading is written, credits are used in proportion to the real cost of generating it, and your balance in Profile drops a few seconds after each reading. Credits are a prepaid right to use the service, have no cash value, cannot be transferred or exchanged for money, and stay with the account that bought them. A purchase is recorded in your purchase history once the payment provider confirms it; use "Restore purchases" in Profile if a confirmed purchase has not appeared.`,
          `A souvenir is a separate one-time purchase. Once you buy it, your device builds the PDF and the replayable page from your reading, we generate the keepsake chapter text, and the finished files are placed on a web host at an address that cannot be guessed. Anyone who has that address can open the souvenir, so share it only with people you choose. We email the links to the address on your account and keep them in your purchase history.`,
          `If something goes wrong with a purchase, we will put it right: contact us at ${email}. Your statutory rights as a consumer are not affected by these terms. Refunds are handled by the payment provider that took the payment under its refund policy and the law that applies to you, and a refund issued by a provider does not by itself change the credits or souvenir already delivered to your account.`,
        ],
      },
      {
        heading: 'Shared charts',
        blocks: [
          `If you use Share, we publish a read-only picture of your chart, with the name you chose, at a public address. The shared page contains your planets, angles, houses and aspects but not your birth date, birth time or birth place. Anyone with the link can see it. You can stop sharing at any time by contacting us and asking us to remove it.`,
        ],
      },
      {
        heading: 'Analytics',
        blocks: [
          `Anonymous usage statistics are switched on when you first use the service, as the Privacy setting shows, and you can switch them off at any time in Settings. What they contain is explained in our Privacy page. Switching them off does not limit what you can do in the service.`,
        ],
      },
      {
        heading: 'How you may use the service',
        blocks: [
          `You agree to use the service lawfully and fairly. In particular you will not:`,
          [
            `use it to harass, defame or impersonate anyone, or to enter another person's birth details without a legitimate reason to hold them;`,
            `try to break, overload, probe or bypass the service, its accounts, its credits or its payment checks;`,
            `use another person's key, account or purchase, or resell access to credits;`,
            `use the service to produce or spread machine-generated content without making clear that it is machine generated;`,
            `use it for fully automated decisions that affect a person's legal rights, or to give medical advice, medical results interpretation, or advice for legal or law-enforcement purposes;`,
            `use it to discriminate against or exploit people, or to harm minors in any way.`,
          ],
          `We may suspend or close an account that breaks these rules, after telling you why where we are able to.`,
        ],
      },
      {
        heading: 'What belongs to whom',
        blocks: [
          `Your birth details, your questions and your conversations are yours. You give us permission to store them, process them and send them to the providers listed in our Privacy page for as long as is needed to run the service for you. The readings and souvenirs written for you are yours to keep and to share for personal use.`,
          `The ${app} name, characters, pictures and sounds belong to ${entity} or its licensors and are not licensed for reuse in other products. The source code of the app is published under the GNU Affero General Public License, version 3, and nothing in these terms limits the rights that licence gives you for the code. The licences of the other software and data in the app are listed on the About screen.`,
        ],
      },
      {
        heading: 'Availability and changes to the service',
        blocks: [
          `We work to keep the service running, but it depends on providers we do not control and may be interrupted, changed or withdrawn. Lessons and your saved chart keep working offline once loaded; readings, purchases and souvenirs need a connection. If we retire a feature you have paid for, we will tell you and put right any credits or souvenirs you had not been able to use.`,
        ],
      },
      {
        heading: 'Our responsibility to you',
        blocks: [
          `Nothing in these terms limits a liability that cannot be limited by law, including liability for death or personal injury caused by negligence, for fraud, or for any right you have as a consumer.`,
          `Beyond that, the service is provided as it is. We do not promise that readings are accurate, complete or suited to your situation, or that the service will be uninterrupted or free of errors. Our total liability to you for any claim arising from the service is limited to the amount you paid us in the twelve months before the claim, and we are not liable for loss that was not a foreseeable result of our breach, or for lost profits or business.`,
        ],
      },
      {
        heading: 'Ending your use',
        blocks: [
          `You can stop using the service at any time. You can erase your saved conversations yourself in Settings. To close your account and delete the data we hold for it, write to ${email}; we will delete it within a reasonable time, except for what the law requires us to keep, such as records of payments. Souvenir pages that have already been published stay at their address until we remove them on your request.`,
        ],
      },
      {
        heading: 'Changes to these terms',
        blocks: [
          `We may update these terms when the service or the law changes. The date at the top shows the latest version. If a change matters to you, such as a new charge, we will tell you in the app before it applies. Continuing to use the service after a change means you accept it.`,
        ],
      },
      {
        heading: 'Law and disputes',
        blocks: [
          `These terms are governed by the law that applies where ${entity} is established, without taking away the protection that the mandatory consumer law of the place where you live gives you. If we cannot settle a disagreement by talking, either of us may bring it before the courts that have jurisdiction under that law. If you are a consumer, you may also bring it before the courts of the place where you live.`,
        ],
      },
      {
        heading: 'Contact',
        blocks: [`${entity}, ${email}.`],
      },
    ],
  };
}
