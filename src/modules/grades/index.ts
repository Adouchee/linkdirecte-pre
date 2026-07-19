// © 2026 typeof (Scolup) | Licensed under AGPL 3.
import { edFetch } from '../../core/fetch';
import { requireCurrentAccount } from '../../core/request';

export interface GradeEntry {
  value: string;
  outOf: string;
  coefficient: number;
  isLetter: boolean;
  isTest: boolean;
  date: Date;
  subjectCode: string;
  subjectLabel: string;
  periodCode: string;
  entryDate: Date;
  teacherName?: string;
  testType?: string;
  subSubjectCode?: string;
  subSubjectLabel?: string;
  [key: string]: unknown;
}

export interface SubjectEntry {
  subjectCode: string;
  subjectLabel: string;
  coefficient: number;
  teacherName?: string;
  grades: GradeEntry[];
  average?: number;
  classAverage?: number;
  [key: string]: unknown;
}

export interface GradesResult {
  grades: GradeEntry[];
  subjects: SubjectEntry[];
  averages?: Array<{
    subjectCode: string;
    average: number;
    classAverage?: number;
  }>;
  periods?: Array<{ code: string; label: string }>;
  [key: string]: unknown;
}

export async function getGrades(
  options: { periodId?: string; raw?: boolean; explain?: boolean } = {},
): Promise<GradesResult> {
  const account = requireCurrentAccount();
  const endpoint = `/eleves/${account.id}/notes.awp?v=7.14.3&verbe=get`;
  return edFetch<GradesResult>(endpoint, {
    method: 'POST',
    body: { anneeScolaire: options.periodId || '' },
    ...options,
  });
}
// © 2026 typeof (Scolup) | Licensed under AGPL 3.
