// Tarot: a locked add-on (§4.9). It has no routes until it is built and bought.
import type { ModalityManifest } from '../../types';

const manifest: ModalityManifest = {
  key: 'tarot',
  title: 'Tarot',
  status: 'locked',
  entitlement: 'tarot',
  cardElementId: 'modality-card-tarot',
  load: () => Promise.resolve({ routes: [], entryPath: '/pick' }),
};

export default manifest;
