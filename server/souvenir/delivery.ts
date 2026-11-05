// §14.7: the adapter is chosen here, so a later adapter adds a file and changes this one line.
import type { DeliveryAdapter, DeliveryFile, Uid } from '../../src/types/index.ts';
import type { ServerConfigX } from '../core/index.ts';
import { SftpDelivery } from './delivery-sftp.ts';

/** `publish` also learns which published file is the PDF and which is the atelier page; without it the content types decide. */
export interface Delivery extends DeliveryAdapter {
  publish(snapshotId: string, files: DeliveryFile[], entry?: { pdfPath: string; atelierPath: string }): Promise<{ pdfUrl: string; atelierUrl: string }>;
}

export function deliveryFor(cfg: ServerConfigX, uid: Uid): Delivery {
  return new SftpDelivery(cfg, uid);
}
