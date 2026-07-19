# 🔔 Event Listening & Polling

The Listen module provides a simple event system that lets you poll EcoleDirecte for changes and respond immediately when something new happens—like receiving a brand-new grade, a message, or a new school bulletin!

---

## 🚀 Getting Started

Let's set up a daemon to watch for new events in real-time.

```typescript
import { startPolling, on } from "linkdirecte";

// 1. Listen for new grades
const unsubscribeGrades = on("newGrade", (grade) => {
  console.log(`🎉 New Grade Posted! ${grade.value}/${grade.outOf} in ${grade.subjectLabel}`);
});

// 2. Listen for new messages
on("newMessage", (message) => {
  console.log(`✉️ New Message from ${message.fromName}: "${message.subject}"`);
});

// 3. Listen for polling errors (useful if servers go down)
on("pollingError", (error) => {
  console.error("⚠️ An error occurred while polling:", error);
});

// 4. Start the engine! (Polls every 30 seconds)
startPolling({ interval: 30000 });
```

---

## 📖 API Reference

### `startPolling`

Spins up a lightweight background timer that regularly pulls data from EcoleDirecte, computes differences, and emits events when updates are discovered.

```typescript
function startPolling(config?: PollingConfig): void
```

#### Parameters
- `config` *(optional)*:
  - `interval` *(number)*: How often the SDK should query EcoleDirecte, specified in milliseconds. Defaults to `60000` (1 minute).

---

### `stopPolling`

Shuts down the background timer and stops all polling requests.

```typescript
function stopPolling(): void
```

---

### `on`

Registers a listener function for a specific event.

```typescript
function on(event: string, handler: (data: any) => void): () => void
```

#### Returns
An unsubscribe function. Call it to quickly remove the listener and clean up memory!

```typescript
const unsubscribe = on("newGrade", (g) => console.log(g));

// Stop listening later
unsubscribe();
```

---

### `off`

Explicitly removes a registered listener function.

```typescript
function off(event: string, handler: (data: any) => void): void
```

---

## 🗂️ Event Types Reference

Linkdirecte processes changes across multiple student channels. You can subscribe to these events:

| Event | Emitted When | Payload Type |
| :--- | :--- | :--- |
| `"newGrade"` | A new grade is entered into the system. | `GradeEntry` |
| `"newMessage"` | A new message is received in the student's mailbox. | `MessageEntry` |
| `"newTimelineEntry"` | A new event occurs on the student's activity feed. | `TimelineEntry` |
| `"pollingError"` | An API fetch fails due to credentials, token expiry, or a network timeout. | `Error` |
