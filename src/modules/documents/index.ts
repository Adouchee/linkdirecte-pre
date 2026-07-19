// © 2026 typeof (Scolup) | Licensed under AGPL 3.
import { edFetch } from '../../core/fetch';
import { postOptions } from '../../core/request';

export interface DocumentEntry {
  id: number;
  name: string;
  subjectLabel?: string;
  teacherName?: string;
  date: Date;
  size?: number;
  url?: string;
  studentId?: string;
  signatureRequired?: boolean;
  type?: string;
  [key: string]: unknown;
}

export interface DocumentsResult {
  factures: DocumentEntry[];
  grades?: DocumentEntry[];
  viescolaire?: DocumentEntry[];
  administratives?: DocumentEntry[];
  toUploadList?: DocumentEntry[];
  [key: string]: unknown;
}

export async function getDocuments(
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<DocumentsResult> {
  const request = {
    endpoint: '/elevesDocuments.awp?v=7.14.3&verbe=get',
    options: postOptions({}, options),
  };

  return edFetch<DocumentsResult>(request.endpoint, request.options);
}
// © 2026 typeof (Scolup) | Licensed under AGPL 3.
