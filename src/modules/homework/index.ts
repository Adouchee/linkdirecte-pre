// © 2026 typeof (Scolup) | Licensed under AGPL 3.0
import { edFetch } from '../../core/fetch';
import { postOptions, requireCurrentAccount } from '../../core/request';
import { decodeBase64Content } from '../../core/transform';
import { EdApiError } from '../../core/errors';
import { assertNonEmptyArray } from '../../core/validate';
import dayjs from 'dayjs';

export interface HomeworkEntry {
  id: number;
  subjectCode: string;
  subjectLabel: string;
  teacherName?: string;
  givenOn: Date;
  forDate: Date;
  content: string;
  isDone: boolean;
  submitOnline?: boolean;
  documentsToDo?: Array<{ id: number; label: string; url?: string }>;
  [key: string]: unknown;
}

export interface HomeworkResult {
  [date: string]: HomeworkEntry[];
}

export async function getHomework(
  options: { withContent?: boolean; raw?: boolean; explain?: boolean } = {},
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
          raw: options.raw,
          explain: options.explain,
        })) as any;
        result[date] = detail.subjects || detail;
      }),
    );
  }

  return result;
}

export async function getHomeworkForDate(
  date: string | Date,
  options: { raw?: boolean; explain?: boolean } = {},
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

  const rawResult = await edFetch<any>(request.endpoint, request.options);

  if (!options.raw && rawResult?.subjects) {
    for (const subject of rawResult.subjects) {
      if (subject.toDo?.content) {
        subject.toDo.content = decodeBase64Content(subject.toDo.content);
      }
      if (subject.toDo?.sessionContent?.content) {
        subject.toDo.sessionContent.content = decodeBase64Content(
          subject.toDo.sessionContent.content,
        );
      }
      if (subject.sessionContent?.content) {
        subject.sessionContent.content = decodeBase64Content(
          subject.sessionContent.content,
        );
      }
    }
  }

  return rawResult as any;
}

export interface MarkAsDoneResult {
  success: boolean;
  [key: string]: unknown;
}

export async function markAsDone(
  homeworkIds: number[],
  options: { raw?: boolean; explain?: boolean } = {},
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
