// I Ching: a locked add-on (§4.9). It has no routes until it is built and bought.
import type { ModalityManifest } from '../../types';

const manifest: ModalityManifest = {
  key: 'iching',
  title: 'I Ching',
  status: 'locked',
  entitlement: 'iching',
  cardElementId: 'modality-card-iching',
  load: () => Promise.resolve({ routes: [], entryPath: '/pick' }),
};

export default manifest;
