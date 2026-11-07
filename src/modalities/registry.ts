// §5.16: the registry. A modality is a folder holding `manifest.ts` (and optionally `icon.tsx`); nothing outside this folder names one.
import type { ComponentType } from 'react';
import type { ModalityKey, ModalityManifest } from '../types';

const manifests = import.meta.glob<{ default: ModalityManifest }>('./*/manifest.ts', { eager: true });
const icons = import.meta.glob<{ default: ComponentType }>('./*/icon.tsx', { eager: true });

const folderOf = (path: string) => path.split('/')[1] ?? '';

/** Natal first, then the rest by key. */
export function listModalities(): ModalityManifest[] {
  return Object.values(manifests)
    .map((m) => m.default)
    .sort((a, b) => (a.key === 'natal' ? -1 : b.key === 'natal' ? 1 : a.key.localeCompare(b.key)));
}

export function getModality(key: ModalityKey): ModalityManifest | null {
  return listModalities().find((m) => m.key === key) ?? null;
}

/** The card icon sits beside its manifest, in the folder named by the key. */
export function modalityIcon(key: ModalityKey): ComponentType | null {
  const entry = Object.entries(icons).find(([path]) => folderOf(path) === key);
  return entry ? entry[1].default : null;
}
