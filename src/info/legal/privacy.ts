// Privacy policy (§17.4), authored in full. What leaves the device follows §17.2; storage follows §6.
import { EFFECTIVE_DATE, type LegalDocument, type LegalParty } from './types';

export function privacy({ app, entity, email, voiceModelUrl }: LegalParty): LegalDocument {
  return {
    title: 'Privacy',
    effective: EFFECTIVE_DATE,
    sections: [
      {
        heading: 'Who is responsible',
        blocks: [
          `${entity} publishes ${app} and decides how the personal data described here is used. Write to ${email} for anything about your data: to see it, correct it, have it deleted, or withdraw a choice you made.`,
        ],
      },
      {
        heading: 'What we hold about you',
        blocks: [
          [
            `Account: the email address, name and sign-in identifiers that come from Google, your email or your phone number when you sign in, and the account number our systems give you.`,
            `Birth details: the name you want to be called, your birth date, your birth time if you give one, and your birth place with its coordinates and time zone.`,
            `Your chart: the positions and aspects we calculate from those details.`,
            `Conversations: your questions, the readings written for you and the order of the exchange, kept so that a conversation can continue and so that you can read it again.`,
            `Purchases: a record for each purchase with its provider transaction number, the product, the credits it gave, any price shown to you, and the credits later used up by your readings.`,
            `Souvenirs: the chart snapshot, conversation and chapter text of each souvenir you buy, and the web addresses of the finished files.`,
            `Shared charts: if you use Share, a public copy of your chart under the name you chose, with no birth date, birth time or birth place.`,
          ],
          `Birth details, chart, conversations and souvenir data are stored in our Firestore database under your account, and our security rules allow only you to read or change them. We cannot see a sign-in password, because Firebase Authentication handles it.`,
        ],
      },
      {
        heading: 'What stays on your device',
        blocks: [
          `Your settings, the result of tuning her voice to your device, whether you skipped voice setup, the downloaded voice model files, and a cache of the app and of your chart for offline use are stored on your device. The key that pays for your readings is held in memory only and is dropped when you close the app or sign out. The text of her speech is turned into sound on your device; the text you hear and the sound it makes are not sent to us or to any speech service.`,
          `The desktop and Android apps also keep a random identifier and a session time on the device for the usage statistics described below.`,
        ],
      },
      {
        heading: 'Who receives data, and why',
        blocks: [
          [
            `Google (Firebase Authentication and Firestore): to sign you in and to store your account data. If you choose Google sign-in, Google also learns that you signed in to ${app}.`,
            `OpenRouter, and the model providers it passes requests to: to write your readings. A request carries your name as you gave it, your birth date, your birth time or the fact that it is unknown, your birth place name, the calculated chart facts, your question, and up to the last twelve turns of your conversation. For a comparison it also carries the other person's name and chart positions, which we never store. Each request is paid for with a key made for your account alone and limited to your credit balance.`,
            `OpenRouter, for souvenirs: the snapshot chart facts of a souvenir you buy are sent to write its keepsake chapters. This request carries chart facts and no email address or account number.`,
            `RevenueCat, Google Play and the payment provider behind checkout: to take payment, deliver your purchase and let us credit it once. They receive your account number and purchase details; card details go to the payment provider only.`,
            `The web host and email service we use to deliver souvenirs: your souvenir files are placed at a web address that cannot be guessed, and the links are sent to your account email.`,
            `Google Analytics: anonymous usage statistics, only while the setting is on (see below).`,
            `The host of the voice model (${voiceModelUrl}): your device downloads the voice model files from it once. It sees the network address of your device when you do.`,
            `The hosts that serve the app and run its server functions handle the requests the app makes to them and keep ordinary connection logs.`,
          ],
          `We do not sell your data, we do not use it for advertising, and we do not give it to anyone else except as the law requires.`,
        ],
      },
      {
        heading: 'Usage statistics and your choice',
        blocks: [
          `${app} sends anonymous usage events to Google Analytics: which screens are opened, which buttons are pressed, which sign-in and purchase steps are reached, how fast pages load, what kind of error happened, and, after voice tuning, numbers that describe how fast your device made speech. They contain no name, no email address, no birth details, no question, no reading, and no account number. Whether you are signed in is sent as a yes or no.`,
          `This is on when you first use the service. Open Settings, then Privacy, and switch "Share anonymous usage" off to stop it: from that moment nothing more is sent and the analytics library is told you declined. Your choice stays on your device until you change it. Where the law requires consent first, switching on is your consent.`,
        ],
      },
      {
        heading: 'Why we use it, and on what basis',
        blocks: [
          `We use your account, birth, chart and conversation data to provide the service you asked for, which is our contract with you. We use purchase records to deliver and account for what you bought, and to keep the records the law requires us to keep. We use anonymous statistics to make the service faster and better because that is in our legitimate interest, and we honour the setting above in every case. Where the law of your country requires your consent for any of this, we rely on it and you may withdraw it at any time by writing to us.`,
        ],
      },
      {
        heading: 'How long we keep it',
        blocks: [
          `Account, birth, chart and conversation data are kept while your account exists. You can erase every saved conversation yourself in Settings, which leaves your souvenirs, purchase history and credits in place. If you ask us to close your account we delete your data within a reasonable time, except records of payments that the law requires us to keep, and souvenir pages that were published are removed on request. Shared chart copies stay until you ask us to remove them. Anonymous statistics are kept by Google Analytics under its own retention setting.`,
        ],
      },
      {
        heading: 'Where it goes',
        blocks: [
          `Our providers run services around the world, so your data may be processed in countries other than your own, including the United States. Where required, we rely on the safeguards those providers offer, such as standard contractual clauses.`,
        ],
      },
      {
        heading: 'Your rights',
        blocks: [
          `Depending on where you live, you may have the right to see the data we hold about you, to have it corrected or deleted, to restrict or object to its use, to receive a copy in a common format, to withdraw consent, and to complain to your data protection authority. Write to ${email} and we will answer within the time the law allows. Your conversations can be erased in Settings without writing to us.`,
        ],
      },
      {
        heading: 'Children',
        blocks: [
          `${app} is not meant for anyone under 16, or the age of digital consent where you live if that is higher. If you believe a child has given us personal data, write to us and we will delete it.`,
        ],
      },
      {
        heading: 'Changes',
        blocks: [
          `If we change this page we update the date above and, where a change matters, tell you in the app before it applies.`,
        ],
      },
      {
        heading: 'Contact',
        blocks: [`${entity}, ${email}.`],
      },
    ],
  };
}
