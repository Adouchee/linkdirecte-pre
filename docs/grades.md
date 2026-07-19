# 🎓 Grades & Statistics

The Grades module provides deep, structured access to a student's grades, averages, and subject performance metrics. It transforms the flat EcoleDirecte grade log into a cohesive, organized map of subjects, complete with statistical calculations.

---

## 🚀 Getting Started

Here's how to fetch your latest grades and output your average for each subject:

```typescript
import { getGrades } from "linkdirecte";

const result = await getGrades();

console.log(`Successfully loaded ${result.grades.length} grades!`);

result.subjects.forEach(subject => {
  console.log(`--- ${subject.subjectLabel} ---`);
  console.log(`Student Average: ${subject.average ?? "N/A"}`);
  console.log(`Class Average: ${subject.classAverage ?? "N/A"}`);

  if (subject.grades.length > 0) {
    console.log("Recent Grades:");
    subject.grades.slice(0, 3).forEach(grade => {
      console.log(`  • ${grade.value}/${grade.outOf} (Coeff: ${grade.coefficient})`);
    });
  }
});
```

---

## 📖 API Reference

### `getGrades`

Fetches grades and statistics for either the current school period or a specific year.

```typescript
function getGrades(options?: {
  periodId?: string;
  raw?: boolean;
  explain?: boolean;
}): Promise<GradesResult>
```

#### Parameters

- `options` *(optional)*:
  - `periodId` *(string)*: Focuses the query on a specific school term or period (e.g. `"A001"`). If not specified, returns grades across all available periods for the current year.
  - `raw` *(boolean)*: Set to `true` to disable all key renaming and type conversions, returning the raw API response as is.
  - `explain` *(boolean)*: Includes networking and cache statistics in a `_debug` property.

#### Returns

A promise that resolves to a unified `GradesResult` object.

---

## 🗂️ Type Definitions

### `GradesResult`

```typescript
interface GradesResult {
  grades: GradeEntry[];               // Flat list of every single grade
  subjects: SubjectEntry[];           // Grades grouped by subject with computed averages
  averages?: Array<{                  // Overall statistical summaries
    subjectCode: string;
    average: number;
    classAverage?: number;
  }>;
  periods?: Array<{                  // List of semesters or terms found
    code: string;
    label: string;
  }>;
}
```

### `GradeEntry`

| Property | Type | Description |
| :--- | :--- | :--- |
| `value` | `string` | The grade value (e.g. `"18.5"`, or `"Abs"` for absent). |
| `outOf` | `string` | The scale of the grade (e.g. `"20"`). |
| `coefficient` | `number` | Weight of this grade in overall averages. |
| `isLetter` | `boolean` | `true` if this grade is marked with a letter grade (like A, B, C) instead of a number. |
| `isTest` | `boolean` | Indicates whether the entry represents a formal test. |
| `date` | `Date` | The date when the test/assignment was taken. |
| `subjectCode` | `string` | Unique code of the subject. |
| `subjectLabel` | `string` | The title of the subject (e.g., `"Mathématiques"`). |
| `periodCode` | `string` | The term/period this grade belongs to. |
| `entryDate` | `Date` | The exact day the grade was posted online. |
| `teacherName` | `string` *(optional)* | Name of the teacher who graded this test. |
| `testType` | `string` *(optional)* | Type category of the exam. |
| `subSubjectCode` | `string` *(optional)* | Sub-category code. |
| `subSubjectLabel` | `string` *(optional)* | Sub-category label. |

### `SubjectEntry`

Grouped summary of performance for a specific class:

```typescript
interface SubjectEntry {
  subjectCode: string;               // Unique subject code
  subjectLabel: string;              // Name of the class
  coefficient: number;               // Subject weight
  grades: GradeEntry[];              // Array of grades within this subject
  average?: number;                  // Computed average for the active student
  classAverage?: number;             // Class average for comparison
  teacherName?: string;              // Name of the main teacher
}
```
