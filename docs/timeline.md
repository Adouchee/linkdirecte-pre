<p align="center">
  <picture><source media="(prefers-color-scheme: light)" srcset="https://shieldcn.dev/header/glow.svg?title=Post-its+%26+timeline&amp;subtitle=Learn+how+to+get+post-its+and+timeline+with+Linkdirecte.&amp;logo=lu%3AStickyNote&amp;mode=light&amp;theme=blue&amp;align=left" /><img alt="Post-its &amp; timeline | Learn how to get post-its and timeline with Linkdirecte." src="https://shieldcn.dev/header/glow.svg?title=Post-its+%26+timeline&amp;subtitle=Learn+how+to+get+post-its+and+timeline+with+Linkdirecte.&amp;logo=lu%3AStickyNote&amp;mode=dark&amp;theme=blue&amp;align=left" /></picture>
</p>

The Timeline module combines student-centric activity tracking (new assignments, grades, school messages) and smart data analysis across academic and school life behaviors to reveal valuable performance correlations.

---

## 🚀 Getting Started

Let's read the latest events from the student's personalized timeline:

```typescript
import { getTimeline } from "linkdirecte";

const events = await getTimeline();

console.log(`There are ${events.length} recent events on your feed:`);

events.slice(0, 5).forEach(event => {
  console.log(`- [${event.elementType}] ${event.title || "Activity update"}`);
  if (event.subtitle) console.log(`  Detail: ${event.subtitle}`);
});
```

Let's run the **smart correlation engine** to see statistical performance trends!

```typescript
import { correlate } from "linkdirecte";

const correlations = await correlate();

correlations.forEach(insight => {
  if (insight.type === "gradeTrend") {
    console.log(`📈 Trend in [${insight.subject}]: Overall calculated average is ${insight.data.average.toFixed(2)}/20 (Based on ${insight.observations} observations).`);
  } else if (insight.type === "gradeVsDayOfWeek") {
    console.log(`📅 Weekly patterns in [${insight.subject}]:`);
    for (const [day, average] of Object.entries(insight.data)) {
      console.log(`   • ${day}: ${average.toFixed(1)}/20`);
    }
  }
});
```

---

## 📖 API Reference

### `getTimeline`

Retrieves a chronologically ordered list of events relevant to the logged-in student.

```typescript
function getTimeline(options?: {
  raw?: boolean;
  explain?: boolean;
}): Promise<TimelineEntry[]>
```

---

### `getCommonTimeline`

Fetches general school notices, bulletins, and shared announcements. Linkdirecte automatically decodes French HTML "sticky notes" (`stickyNotes`) for you in the process.

```typescript
function getCommonTimeline(options?: {
  raw?: boolean;
  explain?: boolean;
}): Promise<TimelineEntry[]>
```

---

### `correlate`

Runs an advanced correlation pass across different modules (grades and attendance) to construct statistical insights.

> **Note**: Linkdirecte only includes subjects in the analysis that have **at least 5 graded entries** to maintain statistical reliability.

```typescript
function correlate(): Promise<Correlation[]>
```

---

## 🗂️ Type Definitions

### `TimelineEntry`

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `number` | Unique ID of the event. |
| `elementType` | `string` | The event code (e.g., `"Note"`, `"Devoir"`, `"Viescolaire"`). |
| `creationDate` | `Date` | Timestamp of when the event occurred. |
| `title` | `string` *(optional)* | Primary description of the event. |
| `subtitle` | `string` *(optional)* | Supporting description or sub-label. |
| `content` | `string` *(optional)* | Extended body text. |
| `subjectLabel` | `string` *(optional)* | Classroom subject associated with this update. |
| `teacherName` | `string` *(optional)* | Teacher related to this item. |

### `Correlation`

```typescript
interface Correlation {
  type: CorrelationType;             // Category of correlation analysis
  subject: string;                   // Subject name being analyzed
  finding: string;                   // Brief summary of findings
  data: Record<string, number>;      // Key-value statistics map (averages, days, etc.)
  confidence: number;                // Statistical confidence score (from 0 to 1)
  observations: number;              // Number of entries/data-points analyzed
}
```

### `CorrelationType`

```typescript
type CorrelationType =
  | "gradeVsPresence"
  | "gradeVsDayOfWeek"
  | "gradeVsTimeOfDay"
  | "homeworkVsGrade"
  | "gradeTrend";
```
