// §7.5, §14.7: the SFTP delivery adapter. One connection per call. Files live under <SFTP_BASE_PATH>/<token>/<path>,
// where the token is derived from the uid and the snapshot, so a link cannot be guessed from public ids.
import SftpClient from 'ssh2-sftp-client';
import type { DeliveryFile, Uid } from '../../src/types/index.ts';
import { HttpError, type ServerConfigX } from '../core/index.ts';
import type { Delivery } from './delivery.ts';
import { sendSouvenirMail } from './mail.ts';
import { deliveryToken, OffsetConflict } from './shared.ts';

export class SftpDelivery implements Delivery {
  readonly key = 'sftp' as const;
  constructor(private readonly cfg: ServerConfigX, private readonly uid: Uid) {}

  /** Folder name for a snapshot; also stored in serverDelivery. */
  tokenFor(snapshotId: string): string {
    return deliveryToken(this.uid, snapshotId, this.cfg.revenueCat.webhookAuth);
  }

  private settings(): { host: string; port: number; username: string; password: string; base: string; publicBase: string } {
    const s = this.cfg.sftp;
    if (!s.host || !s.user || !s.password || !s.basePath || !s.publicBaseUrl || !this.cfg.revenueCat.webhookAuth) throw new HttpError('provider_unavailable', 503);
    return { host: s.host, port: s.port, username: s.user, password: s.password, base: s.basePath.replace(/\/+$/, ''), publicBase: s.publicBaseUrl.replace(/\/+$/, '') };
  }

  private async withClient<T>(run: (c: SftpClient, base: string) => Promise<T>): Promise<T> {
    const { base, ...conn } = this.settings();
    const client = new SftpClient();
    try {
      try {
        await client.connect({ ...conn, readyTimeout: 10000, retries: 1 });
      } catch (e) {
        console.error('souvenir sftp: connect failed', e instanceof Error ? e.name : typeof e);   // never the message: it may name the host
        throw new HttpError('provider_unavailable', 503);
      }
      return await run(client, base);
    } catch (e) {
      if (e instanceof HttpError || e instanceof OffsetConflict) throw e;
      console.error('souvenir sftp: operation failed', e instanceof Error ? e.name : typeof e);
      throw new HttpError('provider_unavailable', 503);
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  private async sizeOf(c: SftpClient, remote: string): Promise<number | null> {
    return (await c.exists(remote)) === '-' ? (await c.stat(remote)).size : null;
  }

  /** The offset must equal the remote size. Returns the new size; throws OffsetConflict carrying the true size otherwise. */
  appendChunk(snapshotId: string, path: string, offset: number, chunk: Uint8Array): Promise<number> {
    const dir = `/${this.tokenFor(snapshotId)}`;
    return this.withClient(async (c, base) => {
      const finalPath = `${base}${dir}/${path}`;
      const partSize = await this.sizeOf(c, `${finalPath}.part`);
      if (partSize === null) {
        const done = await this.sizeOf(c, finalPath);   // already finalized: the true size is the finished file's, and nothing more is written
        if (done !== null) throw new OffsetConflict(done);
      }
      const size = partSize ?? 0;
      if (offset !== size) throw new OffsetConflict(size);
      if (partSize === null) await c.mkdir(finalPath.slice(0, finalPath.lastIndexOf('/')), true);
      await c.append(Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength), `${finalPath}.part`);
      return size + chunk.byteLength;
    });
  }

  /** Checks every `.part` has its declared size, renames each to its final name, answers the two public links. Safe to repeat. */
  publish(snapshotId: string, files: DeliveryFile[], entry?: { pdfPath: string; atelierPath: string }): Promise<{ pdfUrl: string; atelierUrl: string }> {
    const token = this.tokenFor(snapshotId);
    const pdf = entry?.pdfPath ?? files.find((f) => f.contentType === 'application/pdf')?.remotePath;
    const atelier = entry?.atelierPath ?? files.find((f) => f.contentType.startsWith('text/html'))?.remotePath;
    if (!pdf || !atelier) throw new HttpError('bad_request', 400, 'The PDF and the atelier page must be named.');
    return this.withClient(async (c, base) => {
      const todo: { from: string; to: string }[] = [];
      for (const f of files) {
        const to = `${base}/${token}/${f.remotePath}`;
        const part = await this.sizeOf(c, `${to}.part`);
        if (part !== null) {
          if (part !== f.bytes) throw new HttpError('conflict', 409, `${f.remotePath} is not complete.`);
          todo.push({ from: `${to}.part`, to });
        } else if ((await this.sizeOf(c, to)) !== f.bytes) {
          throw new HttpError('conflict', 409, `${f.remotePath} is not complete.`);
        }
      }
      for (const { from, to } of todo) {
        try {
          await c.posixRename(from, to);   // replaces an existing file atomically where the server supports it
        } catch {
          if ((await c.exists(to)) !== false) await c.delete(to);
          await c.rename(from, to);
        }
      }
      const url = (p: string): string => `${this.settings().publicBase}/${token}/${p}`;
      return { pdfUrl: url(pdf), atelierUrl: url(atelier) };
    });
  }

  notify(to: string, name: string, links: { pdfUrl: string; atelierUrl: string }): Promise<void> {
    return sendSouvenirMail(this.cfg, to, name, links);
  }
}
