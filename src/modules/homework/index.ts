// © 2026 typeof (Scolup) | Licensed under AGPL 3.0
import { edFetch } from '../../core/fetch';
import { postOptions, requireCurrentAccount } from '../../core/request';
import { encodeBase64 } from '../../core/transform';
import { EdApiError } from '../../core/errors';
import {
  assertNonEmptyArray,
  assertNonEmptyString,
  assertPositiveNumber,
} from '../../core/validate';
import dayjs from 'dayjs';

export interface HomeworkEntry {
  idDevoir: number;
  codeMatiere: string;
  matiere: string;
  nomProf?: string;
  donneLe: Date;
  forDate: Date;
  effectue: boolean;
  rendreEnLigne?: boolean;
  [key: string]: unknown;
}

export interface HomeworkResult {
  [date: string]: HomeworkEntry[];
}

export async function getHomework(
  options: { withContent?: boolean; explain?: boolean } = {},
): Promise<HomeworkResult> {
  const account = requireCurrentAccount();
  const result = await edFetch<HomeworkResult>(
    `/Eleves/${account.id}/cahierdetexte.awp?v=7.14.3&verbe=get`,
    postOptions({}, options),
  );

  if (options.withContent) {
    await Promise.all(
      Object.keys(result).map(async (date) => {
        const detail = (await getHomeworkForDate(date, {
          explain: options.explain,
        })) as any;
        result[date] = detail.matieres || detail.subjects || detail;
      }),
    );
  }

  return result;
}

export async function getHomeworkForDate(
  date: string | Date,
  options: { explain?: boolean } = {},
): Promise<HomeworkEntry[]> {
  const account = requireCurrentAccount();
  const formattedDate = dayjs(date).format('YYYY-MM-DD');
  if (formattedDate === 'Invalid Date') {
    throw new EdApiError(
      `Invalid date parameter: ${JSON.stringify(date)}`,
      'INVALID_ARGUMENT',
    );
  }
  const request = {
    endpoint: `/Eleves/${account.id}/cahierdetexte/${formattedDate}.awp?v=7.14.3&verbe=get`,
    options: postOptions({}, options),
  };

  return edFetch<any>(request.endpoint, request.options);
}

export interface MarkAsDoneResult {
  success: boolean;
  [key: string]: unknown;
}

export async function markAsDone(
  homeworkIds: number[],
  options: { explain?: boolean } = {},
): Promise<MarkAsDoneResult> {
  assertNonEmptyArray(homeworkIds, 'homeworkIds');
  const account = requireCurrentAccount();
  const request = {
    endpoint: `/Eleves/${account.id}/cahierdetexte.awp?v=7.14.3&verbe=put`,
    options: postOptions(
      {
        idDevoirsEffectues: homeworkIds,
        idDevoirsNonEffectues: [],
      },
      options,
    ),
  };

  return edFetch<MarkAsDoneResult>(request.endpoint, request.options);
}

export async function sendHomeworkComment(
  idContenu: number,
  message: string,
  options: { explain?: boolean } = {},
): Promise<{ id: number }> {
  assertPositiveNumber(idContenu, 'idContenu');
  assertNonEmptyString(message, 'message');
  const account = requireCurrentAccount();
  const endpoint = `/eleves/${account.id}/afaire/commentaires.awp?v=7.14.3&verbe=post`;
  return edFetch<{ id: number }>(endpoint, {
    method: 'POST',
    body: {
      idContenu,
      message: encodeBase64(message),
    },
    ...options,
  });
}
