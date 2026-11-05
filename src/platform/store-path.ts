// Shared by both model stores: a repo-relative path becomes checked segments. Nothing can climb out of the root.
import { strings } from './strings';

export const PART_SUFFIX = '.part';

export function splitStorePath(path: string): string[] {
  const segments = path.split('/').filter((s) => s.length > 0);
  if (segments.length === 0 || segments.some((s) => s === '.' || s === '..' || s.includes('\\') || s.includes('\0'))) {
    throw new Error(strings['platform.storeBadPath']);
  }
  return segments;
}
