// Natal chart reading, module one (§4.9, §9.1). Its routes are the three the gates protect.
import type { ComponentType } from 'react';
import type { ModalityManifest, ModalityModule } from '../../types';

type Screen = { default: ComponentType };
// Globbed, so a screen that has not landed yet is a missing route rather than a failed build (§3.2 rule 3).
const screens = import.meta.glob<Screen>([
  '../../chart/ScreenBirthDetails.tsx',
  '../../atelier/ScreenAtelier.tsx',
  '../../atelier/ScreenLesson.tsx',
]);

const screen = (path: string) => (): Promise<Screen> => {
  const load = screens[path];
  return load ? load() : Promise.reject(new Error(`screen_missing:${path}`));
};

const module_: ModalityModule = {
  entryPath: '/atelier',
  routes: [
    { path: '/birth', load: screen('../../chart/ScreenBirthDetails.tsx'), requiresAuth: true, requiresBirth: false, requiresVoiceStep: false },
    { path: '/atelier', load: screen('../../atelier/ScreenAtelier.tsx'), requiresAuth: true, requiresBirth: true, requiresVoiceStep: true },
    { path: '/atelier/lesson/:elementKey', load: screen('../../atelier/ScreenLesson.tsx'), requiresAuth: true, requiresBirth: true, requiresVoiceStep: true },
  ],
};

const manifest: ModalityManifest = {
  key: 'natal',
  title: 'Natal chart reading',
  status: 'available',
  entitlement: null,
  cardElementId: 'modality-card-natal',
  load: () => Promise.resolve(module_),
};

export default manifest;
