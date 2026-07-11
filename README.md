<p align="center">
  <picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/gradient.svg?title=Linkdirecte&amp;subtitle=Your+first-rate+SDK+for+the+EcoleDirecte+API.&amp;logo=ri%3AFiBook&amp;mode=dark" /><img alt="header" src="https://shieldcn.dev/header/gradient.svg?title=Linkdirecte&amp;subtitle=Your+first-rate+SDK+for+the+EcoleDirecte+API.&amp;logo=ri%3AFiBook&amp;mode=light" /></picture>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/linkdirecte"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/npm/linkdirecte.svg?size=xs" /><img alt="badge" src="https://shieldcn.dev/npm/linkdirecte.svg?size=xs&amp;mode=light" /></picture></a>
  <a href="https://github.com/Scolup/Linkdirecte"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/github/Scolup/Linkdirecte/stars.svg?size=xs" /><img alt="badge" src="https://shieldcn.dev/github/Scolup/Linkdirecte/stars.svg?size=xs&amp;mode=light" /></picture></a>
</p>

<p align="center">
  <a href="https://github.com/Scolup/Linkdirecte/graphs/contributors"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/contributors/Scolup/Linkdirecte.svg?preset=gradient&amp;names=true&amp;mode=dark" /><img alt="contributors" src="https://shieldcn.dev/contributors/Scolup/Linkdirecte.svg?preset=gradient&amp;names=true&amp;mode=light" /></picture></a>
</p>

<p align="center">
  <picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/chart/npm/linkdirecte.svg?logo=false&amp;title=npm+downloads+%28365+days%29" /><img alt="chart" src="https://shieldcn.dev/chart/npm/linkdirecte.svg?mode=light&amp;logo=false&amp;title=npm+downloads+%28365+days%29" /></picture>
</p>

---

**Linkdirecte** is a type-safe, developer-friendly, and first-rate SDK for the **EcoleDirecte API**. It is built to take care of all the "dirty work" behind the scenes: handling the tricky multi-stage login flow, managing Two-Factor Authentication (2FA), auto-decoding Base64-encoded content, and translating raw, illogical responses into clean, elegant, and fully typed objects.

Whether you are an advanced TypeScript developer building complex integrations, or a **vibe-coder** looking to automate your school life with a simple script, Linkdirecte is designed to be painless, robust, and delightful to use.

Works seamlessly on **Bun**, **Node.js**, and in the **Browser**!

> 💡 **Student Accounts Support**: Linkdirecte currently supports most features for Student (`E`) accounts. Support for Parent (`F`) accounts is planned for a future release!

---

## Features

- **Full Student Account Coverage**: Access grades, timetables, homework, messaging, cloud documents, attendance, school timeline, and sticky notes.
- **Robust Login Flow**: Smooth multi-step authentication supporting 2FA, session persistence, automatic token refreshing, and background token keep-alives.
- **Real-Time Polling / Listening**: Register events like `newGrade`, `newMessage`, or `newTimelineEntry` to run custom code when new events occur.
- **Auto Data-Cleaning & Decoding**: Automatically decodes Base64 contents, parses messy timelines, and normalizes French dates into robust TypeScript `Date` objects.
- **Intelligent Caching & Prefetching**: Configurable cache for any API call, automatic prefetching of data in the background, and offline queues.
- **Secure File Storage**: Out-of-the-box AES-256-GCM encrypted local file storage adapter for keeping sessions safe.

---

## Installation

Install Linkdirecte using your favorite package manager:

```bash
# Using bun
bun add linkdirecte

# Using npm
npm install linkdirecte

# Using yarn
yarn add linkdirecte

# Using pnpm
pnpm add linkdirecte
```

---

## Quick Start & Complete Example

Here is a comprehensive, production-ready example demonstrating how to configure persistent file storage, authenticate (handling 2FA challenge elegantly), fetch grades and homework, and start a live polling loop to listen for new school updates.

```typescript
import {
  configure,
  login,
  getGrades,
  getHomework,
  fileStorage,
  startPolling,
  on
} from "linkdirecte";
import readline from "node:readline/promises";

// Create readline interface to prompt for 2FA answer if needed
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  // 1. Configure Linkdirecte with a persistent secure storage & custom 2FA prompt
  configure({
    // Securely encrypts and stores cookies/tokens locally in a file
    storage: fileStorage("./my_session.json", "SUPER_SECRET_ENCRYPTION_KEY"),

    // Callback if EcoleDirecte requires answering a security question (2FA)
    on2faRequired: async (question, choices) => {
      console.log(`\n🔒 Two-Factor Authentication Required!`);
      console.log(`Question: ${question}`);
      choices.forEach((choice, index) => {
        console.log(`[${index}] ${choice}`);
      });
      const answerIndexStr = await rl.question("Choose the correct option number: ");
      return parseInt(answerIndexStr, 10);
    }
  });

  try {
    console.log("Logging into EcoleDirecte...");

    // 2. Perform the Login flow
    // If you enable rememberMe, Linkdirecte persists tokens for future seamless logins
    const loginResult = await login("my_username", "my_password", {
      rememberMe: true,
    });

    if ("type" in loginResult && loginResult.type === "securityQuestion") {
      // (Optional fallback) If on2faRequired is not configured, login() returns a challenge
      console.log(`Question: ${loginResult.question}`);
      const chosenIndex = 0; // Select response index
      const success = await loginResult.answer(chosenIndex);
      console.log(`Successfully logged in as ${success.user.firstName} ${success.user.lastName}!`);
    } else {
      console.log(`Logged in successfully as ${loginResult.user.firstName} ${loginResult.user.lastName}!`);
    }

    // 3. Retrieve Grades and Homework
    console.log("\n--- Fetching school data ---");

    const gradesData = await getGrades();
    console.log(`GPA (Moyenne générale): ${gradesData.averages?.[0]?.average ?? "N/A"}`);
    console.log(`Latest 3 Grades:`);
    gradesData.grades.slice(0, 3).forEach(grade => {
      console.log(` - [${grade.subjectLabel}] ${grade.value}/${grade.outOf} (Coeff: ${grade.coefficient})`);
    });

    const homeworkData = await getHomework({ withContent: true });
    const upcomingDates = Object.keys(homeworkData).slice(0, 3);
    console.log(`\nUpcoming Homework Dates:`);
    upcomingDates.forEach(date => {
      console.log(`Date: ${date}`);
      homeworkData[date].forEach(hw => {
        console.log(` - Subject: ${hw.subjectLabel} (Done: ${hw.isDone ? "✅" : "❌"})`);
      });
    });

    // 4. Start Live Real-Time Polling for new events (runs every 60 seconds by default)
    console.log("\nStarting live real-time observer...");
    startPolling({ interval: 60000 });

    on("newGrade", (grade) => {
      console.log(`🔔 NEW GRADE DETECTED! [${grade.subjectLabel}] - Grade: ${grade.value}/${grade.outOf}`);
    });

    on("newMessage", (message) => {
      console.log(`🔔 NEW MESSAGE RECEIVED! From: ${message.fromName} - Subject: ${message.subject}`);
    });

    on("newTimelineEntry", (entry) => {
      console.log(`🔔 NEW TIMELINE ENTRY! [${entry.elementType}] - Title: ${entry.title}`);
    });

    on("pollingError", (error) => {
      console.error("⚠️ Polling Error occurred:", error);
    });

  } catch (error) {
    console.error("An error occurred in Linkdirecte SDK:", error);
  } finally {
    rl.close();
  }
}

main();
```

---

## API Reference & Modules

Linkdirecte organizes EcoleDirecte modules into beautifully structured APIs. Every API method supports automatic caching and retry strategies behind the scenes.

### 🔐 Authentication & Session management

The SDK handles all required headers, tokens (`X-Token`, `2FA-Token`, `GTK`), and credential keep-alives automatically.

```typescript
import { login, logout, refreshToken, loadSession } from "linkdirecte";

// Regular Login
const result = await login("username", "password", { rememberMe: true });

// Check if a saved session is present in storage and resume it automatically
const resumed = await loadSession();
if (resumed) {
  console.log("Logged in seamlessly from stored session!");
}

// Refresh token manually if needed (or let the internal keepalive do it)
const newToken = await refreshToken();

// Logout and clear tokens from storage
await logout();
```

### 📚 Homework & Assignments

Track, view, and mark assignments as completed on EcoleDirecte.

```typescript
import { getHomework, getHomeworkForDate, markAsDone } from "linkdirecte";

// Get homework overview grouped by date
const homework = await getHomework();

// Get detailed homework with full HTML/Text contents
const detailedHomework = await getHomework({ withContent: true });

// Fetch assignments for a specific date
const homeworkForDate = await getHomeworkForDate("2026-03-10");

// Mark homework tasks as completed/done using their IDs
await markAsDone([102934, 102935]);
```

### 📝 Grades & Averages

Get detailed transcript notes, coefficients, period averages, and class averages.

```typescript
import { getGrades } from "linkdirecte";

const result = await getGrades();
// Array of all notes/grades
console.log(result.grades);
// Array of subjects with nested grades
console.log(result.subjects);
// General and class averages
console.log(result.averages);
```

### 📅 Timetable & Agenda

Access school timetables, check for cancelled classes, and retrieve the public iCal calendar URL.

```typescript
import { getTimetable, getTimetableIcalUrl } from "linkdirecte";

// Get timetable for a given week/date range
const result = await getTimetable({
  startDate: "2026-03-09",
  endDate: "2026-03-13"
});

// Fetch standard iCal integration URL for external apps (Apple Calendar, Google Calendar, etc.)
const icalUrl = await getTimetableIcalUrl();
```

### 💬 Messages & Mailbox

Read received/sent emails, drafts, load messages contents, and send fully formatted secure messages to teachers/staff.

```typescript
import { getMessages, getMessage, sendMessage } from "linkdirecte";

// Retrieve list of messages (received)
const result = await getMessages();

// Retrieve list of messages with contents preloaded automatically
const resultWithContents = await getMessages({ withContent: true });

// Retrieve details of a single message
const message = await getMessage(452934);

// Send a message
await sendMessage({
  subject: "Question about physics project",
  content: "Hello, could you clarify when the physics project is due? Thank you!",
  destinataires: [ { id: 1234, role: "P" } ] // Destination array
});
```

### ☁️ Cloud & Documents

Browse the personal cloud workspace, create folders, upload/download files, and manage documents.

```typescript
import { getCloud, createFolder, deleteNodes } from "linkdirecte";

// Retrieve full Cloud hierarchy
const cloudNodes = await getCloud({ depth: 3 });

// Create a folder inside a parent folder
const parentFolderNode = cloudNodes[0];
const newFolder = await createFolder("Math Exercises", parentFolderNode);

// Delete files or folders
await deleteNodes([newFolder]);
```

Also, fetch official administrative school documents (like invoices, bulletins, reports, certificates):

```typescript
import { getDocuments } from "linkdirecte";

const docs = await getDocuments();
console.log(docs.factures);       // Invoices
console.log(docs.grades);         // Official report cards
console.log(docs.viescolaire);    // Life reports
```

### 📊 Forms & QCMS

Find assigned school quizzes (QCMs), fetch details, and submit answers programmatically.

```typescript
import { getQcms, getQcmDetail, submitQcmAnswer } from "linkdirecte";

// Get all accessible QCMS
const qcms = await getQcms();

// Load details of a single QCM quiz
const details = await getQcmDetail(qcmId, associationId);

// Submit an answer
await submitQcmAnswer({
  idQcm: 123,
  idAssociation: 456,
  idParticipant: 789,
  idReponse: 101112,
  idQuestion: 222,
  choiceIds: [1, 3] // Chosen option IDs
});
```

### 🏫 School Life & Attendance (Vie Scolaire)

Retrieve attendance events, tardiness, detentions, and punitives points.

```typescript
import { getAttendance } from "linkdirecte";

const schoolLife = await getAttendance();
console.log(schoolLife.absences);    // List of absences
console.log(schoolLife.delays);      // List of delays
console.log(schoolLife.punishments); // List of punishments/detentions
```

### 📌 Timeline & Sticky Notes

Access personal student feed timeline events and general landing page sticky notes (decoded automatically).

```typescript
import { getTimeline, getCommonTimeline } from "linkdirecte";

// Get the school feed/timeline
const feed = await getTimeline();

// Get public portal landing page sticky notes
const notes = await getCommonTimeline();
```

---

## Advanced Options & System Configuration

Configure cache duration, retry options, concurrency, timeout limit, or implement custom token error middleware by passing a configuration block into `configure()`.

```typescript
import { configure, memoryStorage, fileStorage } from "linkdirecte";

configure({
  // Storage Adapter: persistent fileStorage or memoryStorage
  storage: fileStorage("./session.json", "secret_key"),

  // HTTP behaviors
  maxRetries: 5,
  retryDelay: 1000,
  concurrency: 5,
  timeout: 10000,

  // Custom global error middleware for retrying or handling token expiration
  onError: (error, retry) => {
    console.error("An error occurred during request:", error);
    // You can retry the request manually if needed
    return retry({ delay: 1000 });
  },

  // Intelligent selective Cache settings per-module (e.g., Cache for 10 minutes)
  cacheMaxEntries: 100,
  cache: {
    grades: "10m",
    timetable: "1h",
    messages: "5m",
    homework: "15m",
    documents: "1d",
  }
});
```

### Background prefetching

Optimize performance by proactively loading and refreshing modules in the background:

```typescript
import { startAutoPrefetch, stopAutoPrefetch, prefetchAll } from "linkdirecte";

// Prefetch all data into local cache immediately
await prefetchAll();

// Proactively keep local cache fresh every 5 minutes in the background
startAutoPrefetch({
  interval: "5m",
  modules: ["grades", "homework", "timetable"]
});

// Stop prefetching
stopAutoPrefetch();
```

---

## License

This project is licensed under the [AGPL-3.0-or-later License](LICENSE.md).
