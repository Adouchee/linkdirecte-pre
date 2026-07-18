// © 2026 typeof (Scolup) | Licensed under AGPL 3.0
import { getGrades } from '../grades';
import { getAttendance } from '../attendance';
import dayjs from 'dayjs';

export type CorrelationType =
  | 'gradeVsPresence'
  | 'gradeVsDayOfWeek'
  | 'gradeVsTimeOfDay'
  | 'homeworkVsGrade'
  | 'gradeTrend';

export interface Correlation {
  type: CorrelationType;
  subject: string;
  finding: string;
  data: Record<string, number>;
  confidence: number;
  observations: number;
}

export async function correlate(): Promise<Correlation[]> {
  const [gradesData, attendanceData] = await Promise.all([
    getGrades(),
    getAttendance(),
  ]);

  const correlations: Correlation[] = [];
  const grades = (gradesData as any).grades || [];
  const subjectGrades = groupGradesBySubject(grades);

  subjectGrades.forEach((gradeList, subject) => {
    if (gradeList.length < 5) return;

    const values = gradeList.map(
      (g: any) =>
        (parseFloat(g.value.replace(',', '.')) / parseFloat(g.outOf)) * 20,
    );

    correlations.push(analyzeGradeTrend(subject, values, gradeList.length));
    correlations.push(analyzeDayOfWeekPattern(subject, gradeList, values));
  });

  return correlations;
}

function groupGradesBySubject(grades: any[]): Map<string, any[]> {
  const map = new Map<string, any[]>();

  for (const grade of grades) {
    const list = map.get(grade.subjectLabel) || [];
    list.push(grade);
    map.set(grade.subjectLabel, list);
  }

  return map;
}

function analyzeGradeTrend(
  subject: string,
  values: number[],
  count: number,
): Correlation {
  return {
    type: 'gradeTrend',
    subject,
    finding: 'calculated_trend',
    data: { average: values.reduce((a, b) => a + b, 0) / values.length },
    confidence: Math.min(count / 15, 1),
    observations: count,
  };
}

function analyzeDayOfWeekPattern(
  subject: string,
  gradeList: any[],
  values: number[],
): Correlation {
  const dowGrades: Record<string, number[]> = {};

  gradeList.forEach((grade, i) => {
    const day = dayjs(grade.date).format('dddd');
    const list = dowGrades[day] || [];
    list.push(values[i]);
    dowGrades[day] = list;
  });

  const dowStats: Record<string, number> = {};
  Object.entries(dowGrades).forEach(([day, vals]) => {
    dowStats[day] = vals.reduce((a, b) => a + b, 0) / vals.length;
  });

  return {
    type: 'gradeVsDayOfWeek',
    subject,
    finding: 'weekly_variation',
    data: dowStats,
    confidence: 0.5,
    observations: gradeList.length,
  };
}
