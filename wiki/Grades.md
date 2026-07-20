<p align="center">
  <picture><source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/header/glow.svg?title=Grades&amp;subtitle=Learn+how+to+get+grades+data+with+Linkdirecte.&amp;logo=lu%3AGraduationCap&amp;mode=light&amp;theme=blue&amp;align=left" /><img alt="Grades | Learn how to get grades data with Linkdirecte." src="https://shieldcn.dev/header/glow.svg?title=Grades&amp;subtitle=Learn+how+to+get+grades+data+with+Linkdirecte.&amp;logo=lu%3AGraduationCap&amp;mode=dark&amp;theme=blue&amp;align=left" /></picture>
</p>

The Grades module provides deep, structured access to a student's grades, averages, and subject performance metrics. It transforms the flat EcoleDirecte grade log into a cohesive, organized map of subjects, complete with statistical calculations.

---

## 🚀 Getting Started

Here's how to fetch your latest grades and output your average for each subject:

```typescript
import { getGrades } from "linkdirecte";

const result = await getGrades();

console.log(`Successfully loaded ${result.grades.length} grades!`);

result.subjects.forEach(subject => {
  console.log(`--- ${subject.libelleMatiere} ---`);
  console.log(`Student Average: ${subject.average ?? "N/A"}`);
  console.log(`Class Average: ${subject.classAverage ?? "N/A"}`);

  if (subject.grades.length > 0) {
    console.log("Recent Grades:");
    subject.grades.slice(0, 3).forEach(grade => {
      console.log(`  • ${grade.valeur}/${grade.noteSur} (Coeff: ${grade.coef})`);
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
  explain?: boolean;
}): Promise<GradesResult>
```

#### Parameters

- `options` *(optional)*:
  - `periodId` *(string)*: Focuses the query on a specific school term or period (e.g. `"A001"`). If not specified, returns grades across all available periods for the current year.
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
    codeMatiere: string;
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
| `valeur` | `string` | The grade valeur (e.g. `"18.5"`, or `"Abs"` for absent). |
| `noteSur` | `string` | The scale of the grade (e.g. `"20"`). |
| `coef` | `number` | Weight of this grade in overall averages. |
| `enLettre` | `boolean` | `true` if this grade is marked with a letter grade (like A, B, C) instead of a number. |
| `interrogation` | `boolean` | Indicates whether the entry represents a formal test. |
| `date` | `Date` | The date when the test/assignment was taken. |
| `codeMatiere` | `string` | Unique code of the subject. |
| `libelleMatiere` | `string` | The title of the subject (e.g., `"Mathématiques"`). |
| `periodCode` | `string` | The term/period this grade belongs to. |
| `entryDate` | `Date` | The exact day the grade was posted online. |
| `nomProf` | `string` *(optional)* | Name of the teacher who graded this test. |
| `testType` | `string` *(optional)* | Type category of the exam. |
| `subSubjectCode` | `string` *(optional)* | Sub-category code. |
| `subSubjectLabel` | `string` *(optional)* | Sub-category label. |

### `SubjectEntry`

Grouped summary of performance for a specific class:

```typescript
interface SubjectEntry {
  codeMatiere: string;               // Unique subject code
  libelleMatiere: string;              // Name of the class
  coef: number;               // Subject weight
  grades: GradeEntry[];              // Array of grades within this subject
  average?: number;                  // Computed average for the active student
  classAverage?: number;             // Class average for comparison
  nomProf?: string;              // Name of the main teacher
}
```
