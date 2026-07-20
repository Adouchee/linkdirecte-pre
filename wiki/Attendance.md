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
    console.log(`- Date: ${absence.date.toLocaleDateString()} | Reason: ${absence.motif || "No reason specified"}`);
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
  explain?: boolean;
}): Promise<AttendanceResult>
```

#### Parameters

- `options` *(optional)*:
  - `explain` *(boolean)*: If set to `true`, includes a special `_debug` property on the result containing detailed HTTP and cache logs.

#### Returns

A promise that resolves to an `AttendanceResult` object.
