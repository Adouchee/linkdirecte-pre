import { edFetch } from '../../core/fetch';
import { requireCurrentAccount } from '../../core/request';

export interface QcmEntry {
  id: number;
  qcmId: number;
  subjectLabel?: string;
  title?: string;
  teacherName?: string;
  date?: Date;
  status?: string;
  [key: string]: unknown;
}

export interface QcmsResult {
  associations?: QcmEntry[];
  [key: string]: unknown;
}

export async function getQcms(
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<QcmsResult> {
  const account = requireCurrentAccount();
  const endpoint = `/eleves/${account.id}/qcms/0/associations.awp?v=7.14.3&verbe=get`;
  return edFetch<QcmsResult>(endpoint, {
    method: 'POST',
    body: {},
    ...options,
  });
}

export interface QcmDetailResult {
  qcmId: number;
  questions: Array<{
    id: number;
    label: string;
    choices: Array<{ id: number; label: string }>;
  }>;
  [key: string]: unknown;
}

export async function getQcmDetail(
  idQcm: number,
  idAssociation: number,
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<QcmDetailResult> {
  const account = requireCurrentAccount();
  const endpoint = `/eleves/${account.id}/qcms/${idQcm}/associations/${idAssociation}.awp?v=7.14.3&verbe=get`;
  return edFetch<QcmDetailResult>(endpoint, {
    method: 'POST',
    body: { anneeQCMs: '' },
    ...options,
  });
}

export async function updateQcmStatus(
  idQcm: number,
  idAssociation: number,
  idParticipant: number,
  action: 'updateStartDate' | 'updateEndDate',
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<{ success: boolean }> {
  const account = requireCurrentAccount();
  const endpoint = `/eleves/${account.id}/qcms/${idQcm}/associations/${idAssociation}/participants/${idParticipant}.awp?v=7.14.3&verbe=patch`;
  return edFetch<{ success: boolean }>(endpoint, {
    method: 'POST',
    body: { action },
    ...options,
  });
}

export async function submitQcmAnswer(
  params: {
    idQcm: number;
    idAssociation: number;
    idParticipant: number;
    idReponse: number;
    idQuestion: number;
    choiceIds: number[];
  },
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<{ success: boolean }> {
  const account = requireCurrentAccount();
  const endpoint = `/eleves/${account.id}/qcms/${params.idQcm}/associations/${params.idAssociation}/participants/${params.idParticipant}/reponse/${params.idReponse}.awp?v=7.14.3&verbe=patch`;
  return edFetch<{ success: boolean }>(endpoint, {
    method: 'POST',
    body: {
      reponse: {
        id: params.idReponse,
        idQuestion: params.idQuestion,
        idParticipant: params.idParticipant,
        choix: params.choiceIds,
      },
    },
    ...options,
  });
}
