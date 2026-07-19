# 📚 Homework (Cahier de Texte)

The Homework module gives you programmatic access to the student's assignment diary ("Cahier de Texte"). It allows you to fetch homework assignments, load full descriptions, retrieve attachments, and mark tasks as done (even when offline!).

---

## 🚀 Getting Started

Let's read all assignments scheduled for the coming days:

```typescript
import { getHomework } from "linkdirecte";

// Retrieve homework. Use withContent: true to automatically load the details for each task
const calendar = await getHomework({ withContent: true });

for (const [date, assignments] of Object.entries(calendar)) {
  console.log(`\n📅 Assignments for ${date}:`);

  assignments.forEach(task => {
    const status = task.isDone ? "✅ DONE" : "❌ TO DO";
    console.log(`- [${status}] [${task.subjectLabel}] ${task.content || "Read class notes."}`);
  });
}
```

---

## 📖 API Reference

### `getHomework`

Fetches a calendar index of homework due over the next few weeks.

```typescript
function getHomework(options?: {
  withContent?: boolean;
  raw?: boolean;
  explain?: boolean;
}): Promise<HomeworkResult>
```

#### Parameters

- `options` *(optional)*:
  - `withContent` *(boolean)*: If set to `true`, the SDK will make background queries to resolve detailed HTML descriptions and attachments for each date. Defaults to `false`.
  - `raw` *(boolean)*: Set to `true` to disable all custom translations.
  - `explain` *(boolean)*: Includes detailed network debugging inside `_debug`.

#### Returns

A promise resolving to a `HomeworkResult` map where keys are date strings (`"YYYY-MM-DD"`) and values are arrays of `HomeworkEntry`.

---

### `getHomeworkForDate`

Loads detailed descriptions and resources for a specific day.

```typescript
function getHomeworkForDate(
  date: string | Date,
  options?: { raw?: boolean; explain?: boolean }
): Promise<HomeworkEntry[]>
```

#### Example

```typescript
import { getHomeworkForDate } from "linkdirecte";

const assignments = await getHomeworkForDate("2025-09-15");
assignments.forEach(task => {
  console.log(`Teacher: ${task.teacherName ?? "Unknown"}`);
  console.log(`Content (HTML): ${task.content}`);
});
```

---

### `markAsDone`

Updates the state of one or more homework assignments to completed.

```typescript
function markAsDone(
  homeworkIds: number[],
  options?: { raw?: boolean; explain?: boolean }
): Promise<MarkAsDoneResult>
```

#### Resilience (Offline Syncing!)
If you have `offlineQueue: true` enabled in your global configuration, and the student's device is currently offline, calling `markAsDone` won't throw an error. Instead, Linkdirecte will **automatically save the request** in local storage and queue it up. You can synchronize it later by calling `offlineQueue.flush()`.

---

## 🗂️ Type Definitions

### `HomeworkResult`

```typescript
interface HomeworkResult {
  [dateString: string]: HomeworkEntry[]; // Date keys are formatted as YYYY-MM-DD
}
```

### `HomeworkEntry`

| Property | Type | Description |
| :--- | :--- | :--- |
| `id` | `number` | Unique identifier for the assignment. |
| `subjectCode` | `string` | Code identifier of the subject. |
| `subjectLabel` | `string` | Readable subject name. |
| `teacherName` | `string` *(optional)* | Name of the teacher who assigned the work. |
| `givenOn` | `Date` | The date the homework was originally assigned. |
| `forDate` | `Date` | The deadline date when this homework is due. |
| `content` | `string` | Base64-decoded HTML containing instructions from the teacher. |
| `isDone` | `boolean` | True if the student has marked this assignment as complete. |
| `submitOnline` | `boolean` *(optional)* | Indicates if the assignment must be submitted digitally. |
| `documentsToDo` | `Array<{ id, label, url? }>` *(optional)* | Attachments or files linked to this homework. |

### `MarkAsDoneResult`

```typescript
interface MarkAsDoneResult {
  success: boolean;
}
```
