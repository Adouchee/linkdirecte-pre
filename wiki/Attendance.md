<p align="center">
  <picture><source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/header/glow.svg?title=Attendance&amp;subtitle=Learn+how+to+get+attendance+data+with+Linkdirecte.&amp;logo=lu%3AUser&amp;mode=light&amp;theme=blue&amp;align=left" /><img alt="Attendance | Learn how to get attendance data with Linkdirecte." src="https://shieldcn.dev/header/glow.svg?title=Attendance&amp;subtitle=Learn+how+to+get+attendance+data+with+Linkdirecte.&amp;logo=lu%3AUser&amp;mode=dark&amp;theme=blue&amp;align=left" /></picture>
</p>

The attendance module makes it super easy to check on a student's absences, delays, and any disciplinary events (like punishments) recorded in EcoleDirecte.

## 🚀 Getting Started

To fetch attendance records, you'll use the `getAttendance` function. This retrieves a comprehensive summary of the student's school life events.

```typescript
import { getAttendance } from "linkdirecte";

const data = await getAttendance();

// Check if there are any absences
if (data.absences && data.absences.length > 0) {
  console.log(`Oh! You have ${data.absences.length} registered absence(s).`);
  data.absences.forEach(absence => {
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
