<p align="center">
  <picture><source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/header/glow.svg?title=Attendance&amp;subtitle=Learn+how+to+get+attendance+data+with+Linkdirecte.&amp;logo=lu%3AUser&amp;mode=light&amp;theme=blue&amp;align=left" /><img alt="Attendance | Learn how to get attendance data with Linkdirecte." src="https://shieldcn.dev/header/glow.svg?title=Attendance&amp;subtitle=Learn+how+to+get+attendance+data+with+Linkdirecte.&amp;logo=lu%3AUser&amp;mode=dark&amp;theme=blue&amp;align=left" /></picture>
</p>

The attendance module makes it super easy to check on a student's absences, delays, and any disciplinary events (like punishments) recorded in EcoleDirecte.

## 🚀 Getting Started

To fetch attendance records, you'll use the `getAttendance` function. This retrieves a comprehensive summary of the student's school life events.

> [!NOTE]
> In the real EcoleDirecte API, absences and latenesses are returned together under a single `attendance` array. You can easily filter them by their `elementType` (e.g. `"Absence"` or `"Retard"`).

```typescript
import { getAttendance } from "linkdirecte";

const data = await getAttendance();

// Filter for absences
const absences = data.attendance?.filter(event => event.elementType === "Absence") ?? [];

if (absences.length > 0) {
  console.log(`Oh! You have ${absences.length} registered absence(s).`);
  absences.forEach(absence => {
    console.log(`- Date: ${absence.date.toLocaleDateString()} | Reason: ${absence.reason || "No reason specified"}`);
  });
} else {
  console.log("Hooray! No absences recorded.");
}
```

---

## 📖 API Reference

### `getAttendance`

Fetches the student's full attendance history, including lateness and punishments.

```typescript
function getAttendance(options?: {
  raw?: boolean;
  explain?: boolean;
}): Promise<AttendanceResult>
```

#### Parameters

- `options` *(optional)*:
  - `raw` *(boolean)*: If set to `true`, Linkdirecte returns the raw, unmodified API response directly from EcoleDirecte.
  - `explain` *(boolean)*: If set to `true`, includes a special `_debug` property on the result containing detailed HTTP and cache logs.

#### Returns

A promise that resolves to an `AttendanceResult` object.

---

## 📋 Example Response

Below is an example of the resolved `AttendanceResult` payload returned by `getAttendance()` in a real environment (reflecting exact transformed keys):

```typescript
{
  attendance: [
    {
      id: 3367,
      studentId: 1234,
      elementType: "Absence",
      date: new Date("2025-11-04T00:00:00.000Z"),
      displayDate: "le mardi 04 novembre 2025 de 16:30 à 17:30",
      label: "2 cours",
      reason: "Consultation médicale",
      isJustified: true,
      licensePoints: 0,
      comment: "Rendez-vous médical urgent",
      justificationType: "",
      justifiedOnline: false,
      dontNeedJustification: false,
      subjectName: "",
      day: 0
    },
    {
      id: 2876,
      studentId: 1234,
      elementType: "Retard",
      date: new Date("2025-10-13T00:00:00.000Z"),
      displayDate: "le lundi 13 octobre 2025 de 09:00 à 09:55",
      label: "00:55",
      reason: "Panne de reveil ",
      isJustified: true,
      licensePoints: 0,
      comment: "Panne de réveil",
      justificationType: "Justifiée sur Internet",
      justifiedOnline: true,
      dontNeedJustification: false,
      subjectName: "",
      day: 0
    }
  ],
  sanctionsEncouragements: [],
  dispenses: [],
  settings: {
    justificationEnLigne: true,
    absenceCommentaire: true,
    retardCommentaire: true,
    sanctionsVisible: true,
    sanctionParQui: true,
    sanctionCommentaire: true,
    encouragementsVisible: true,
    encouragementParQui: true,
    encouragementCommentaire: true,
    afficherPermisPoint: true
  }
}
```

---

## 🗂️ Type Definitions

### `AttendanceResult`

This object groups different categories of school life events together:

```typescript
interface AttendanceResult {
  absences?: AttendanceEntry[];      // List of absences
  delays?: AttendanceEntry[];        // List of latenesses/delays
  punishments?: AttendanceEntry[];   // List of punishments/sanctions
  attendance?: AttendanceEntry[];    // General school life/attendance logs
  settings?: Record<string, any>;    // Configuration parameters
}
```

### `AttendanceEntry`

Each entry provides detailed context about a specific school life event:

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `number` | A unique identifier for this record. |
| `date` | `Date` | The exact date and time the event occurred. |
| `type` | `string` | The type of event (for example, `"Absence"`, `"Retard"`, `"Punition"`). |
| `subjectLabel` | `string` *(optional)* | The name of the class subject if the event occurred during a class. |
| `isJustified` | `boolean` *(optional)* | Whether the absence or delay has been officially justified. |
| `justificationType` | `string` *(optional)* | The category/type of the justification. |
| `reason` | `string` *(optional)* | The explained reason for the delay or absence. |
| `teacherName` | `string` *(optional)* | The teacher who reported or is related to the event. |
| `licensePoints` | `number` *(optional)* | If points were deducted from a conduct license. |
| `studentId` | `number` *(optional)* | The identifier of the student. |
| `justifiedOnline` | `boolean` *(optional)* | Whether the justification was submitted through the online portal. |
| `dontNeedJustification` | `boolean` *(optional)* | `true` if the event does not require any justification. |
| `day` | `Date` *(optional)* | The day of the event. |
