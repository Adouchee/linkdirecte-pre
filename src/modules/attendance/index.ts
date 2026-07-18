// © 2026 typeof (Scolup) | Licensed under AGPL 3.0
import { edFetch } from '../../core/fetch';
import { requireCurrentAccount } from '../../core/request';

export interface AttendanceEntry {
  id: number;
  date: Date;
  type: string;
  subjectLabel?: string;
  isJustified?: boolean;
  justificationType?: string;
  teacherName?: string;
  licensePoints?: number;
  studentId?: number;
  reason?: string;
  justifiedOnline?: boolean;
  dontNeedJustification?: boolean;
  day?: Date;
  [key: string]: unknown;
}

export interface AttendanceResult {
  absences?: AttendanceEntry[];
  delays?: AttendanceEntry[];
  punishments?: AttendanceEntry[];
  attendance?: AttendanceEntry[];
  settings?: Record<string, unknown>;
  [key: string]: unknown;
}

export async function getAttendance(
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<AttendanceResult> {
  const account = requireCurrentAccount();
  const endpoint = `/eleves/${account.id}/viescolaire.awp?v=7.14.3&verbe=get`;
  return edFetch<AttendanceResult>(endpoint, {
    method: 'POST',
    body: {},
    ...options,
  });
}
