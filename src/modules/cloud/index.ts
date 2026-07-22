// © 2026 typeof (Scolup) | Licensed under AGPL 3.0
import { edFetch } from '../../core/fetch';
import { requireCurrentAccount } from '../../core/request';
import type { CloudNode, CloudEntry } from '../../types';

export interface GetCloudOptions {
  depth?: number;
}

export async function getCloud(options: GetCloudOptions = {}): Promise<CloudEntry[]> {
  const account = requireCurrentAccount();
  const endpoint = `/cloud/E/${account.id}.awp?v=7.14.3&verbe=get`;
  return edFetch<CloudEntry[]>(endpoint, {
    method: 'POST',
    body: { profondeur: options.depth || 3 },
    ...options,
  });
}

export async function createFolder(name: string, parentNode: CloudNode): Promise<CloudNode> {
  const account = requireCurrentAccount();
  const endpoint = `/cloud/E/${account.id}.awp?v=7.14.3&verbe=post`;
  return edFetch<CloudNode>(endpoint, {
    method: 'POST',
    queued: true,
    body: { parentNode, libelle: name, typeRessource: 'folder' },
  });
}

export async function deleteNodes(nodes: CloudNode[]): Promise<{ success: boolean }> {
  const account = requireCurrentAccount();
  const endpoint = `/cloud/E/${account.id}/visibility.awp?v=7.14.3&verbe=delete`;
  return edFetch<{ success: boolean }>(endpoint, {
    method: 'POST',
    queued: true,
    body: { tabNodes: nodes },
  });
}
