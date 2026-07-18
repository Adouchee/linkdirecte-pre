// © 2026 typeof (Scolup) | Licensed under AGPL 3.0
import { edFetch } from '../../core/fetch';
import { requireCurrentAccount } from '../../core/request';
import { decodeBase64Content } from '../../core/transform';

export interface TimelineEntry {
  id: number;
  elementType: string;
  title?: string;
  subtitle?: string;
  content?: string;
  creationDate: Date;
  subjectLabel?: string;
  teacherName?: string;
  [key: string]: unknown;
}

export async function getTimeline(
  options: { raw?: boolean; explain?: boolean } = {},
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
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<TimelineEntry[]> {
  const account = requireCurrentAccount();
  const endpoint = `/E/${account.id}/timelineAccueilCommun.awp?v=7.14.3&verbe=get`;
  const result = await edFetch<any>(endpoint, {
    method: 'POST',
    body: {},
    ...options,
  });

  if (!options.raw && result?.stickyNotes) {
    for (const postit of result.stickyNotes) {
      if (typeof postit.content === 'string') {
        postit.content = decodeBase64Content(postit.content);
      }
    }
  }

  return result;
}

export * from './correlator';
