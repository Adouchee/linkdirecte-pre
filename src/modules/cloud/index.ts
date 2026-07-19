// © 2026 typeof (Scolup) | Licensed under AGPL 3.
import { edFetch } from '../../core/fetch';
import { requireCurrentAccount } from '../../core/request';
import type { CloudNode, CloudEntry } from '../../types';

export interface GetCloudOptions {
  depth?: number;
  raw?: boolean;
  explain?: boolean;
}

export async function getCloud(
  options: GetCloudOptions = {},
): Promise<CloudEntry[]> {
  const account = requireCurrentAccount();
  const endpoint = `/cloud/E/${account.id}.awp?v=7.14.3&verbe=get`;
  return edFetch<CloudEntry[]>(endpoint, {
    method: 'POST',
    body: { profondeur: options.depth || 3 },
    ...options,
  });
}

export async function createFolder(
  name: string,
  parentNode: CloudNode,
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<CloudNode> {
  const account = requireCurrentAccount();
  const endpoint = `/cloud/E/${account.id}.awp?v=7.14.3&verbe=post`;
  return edFetch<CloudNode>(endpoint, {
    method: 'POST',
    body: { parentNode, libelle: name, typeRessource: 'folder' },
    ...options,
  });
}

export async function deleteNodes(
  nodes: CloudNode[],
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<{ success: boolean }> {
  const account = requireCurrentAccount();
  const endpoint = `/cloud/E/${account.id}/visibility.awp?v=7.14.3&verbe=delete`;
  return edFetch<{ success: boolean }>(endpoint, {
    method: 'POST',
    body: { tabNodes: nodes },
    ...options,
  });
}
// © 2026 typeof (Scolup) | Licensed under AGPL 3.
