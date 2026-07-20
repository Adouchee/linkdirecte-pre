// © 2026 typeof (Scolup) | Licensed under AGPL 3.0
import { edFetch } from '../../core/fetch';
import { postOptions } from '../../core/request';

export interface DocumentEntry {
  id: number;
  libelle: string;
  idEleve: number;
  date: Date;
  type: string;
  signatureDemandee?: boolean;
  [key: string]: unknown;
}

export interface DocumentsResult {
  factures: DocumentEntry[];
  notes?: DocumentEntry[];
  viescolaire?: DocumentEntry[];
  administratifs?: DocumentEntry[];
  listesPiecesAVerser?: any;
  [key: string]: unknown;
}

export async function getDocuments(
  options: { explain?: boolean } = {},
): Promise<DocumentsResult> {
  const request = {
    endpoint: '/elevesDocuments.awp?v=7.14.3&verbe=get',
    options: postOptions({}, options),
  };

  return edFetch<DocumentsResult>(request.endpoint, request.options);
}
