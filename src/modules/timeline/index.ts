// © 2026 typeof (Scolup) | Licensed under AGPL 3.0
import { edFetch } from '../../core/fetch';
import { requireCurrentAccount } from '../../core/request';

export interface TimelineEntry {
  id: number;
  typeElement: string;
  titre?: string;
  soustitre?: string;
  contenu?: string;
  date: Date;
  [key: string]: unknown;
}

export async function getTimeline(
  options: { explain?: boolean } = {},
): Promise<TimelineEntry[]> {
  const account = requireCurrentAccount();
  const endpoint = `/eleves/${account.id}/timeline.awp?v=7.14.3&verbe=get`;
  return edFetch<TimelineEntry[]>(endpoint, {
    method: 'POST',
    body: {},
    ...options,
  });
}

export async function getCommonTimeline(
  options: { explain?: boolean } = {},
): Promise<any> {
  const account = requireCurrentAccount();
  const endpoint = `/E/${account.id}/timelineAccueilCommun.awp?v=7.14.3&verbe=get`;
  return edFetch<any>(endpoint, {
    method: 'POST',
    body: {},
    ...options,
  });
}

export * from './correlator';
