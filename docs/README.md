# Linkdirecte Documentation

Welcome to the exhaustive documentation for `Linkdirecte`, a modern, resilient, and tree-shakable SDK for the private EcoleDirecte API.

## 📖 Table of Contents

### Getting Started
- [Authentication](auth.md) - Connecting to EcoleDirecte and handling 2FA.
- [Core Functionalities](core.md) - Global configuration, storage, and resilience.

### Main Modules
- [Grades](grades.md) - Fetching student grades.
- [Timetable](timetable.md) - Schedule management.
- [Messages](messages.md) - Full messaging system support.
- [Homework](homework.md) - Managing the student's assignment diary.

### Additional Modules
- [Timeline & Correlations](timeline.md) - Activity feed and data analysis.
- [Attendance](attendance.md) - Absences, delays, and school life.
- [Cloud Storage](cloud.md) - Accessing and managing cloud files.
- [Documents](documents.md) - Administrative documents and report cards.
- [Forms & QCMs](forms.md) - Quizzes and online assessments.
- [Events & Polling](listen.md) - Reacting to updates in real-time.
- [Settings](settings.md) - Account preferences and management.

### Reference
- [Type Reference](types.md) - Overview of common TypeScript interfaces.

## 🚀 Installation

```bash
bun add linkdirecte
# or
npm install linkdirecte
# or
yarn add linkdirecte
```

### Compatibility

| Runtime | Supported |
| --- | --- |
| Node.js 18+ | ✅ Full |
| Bun | ✅ Full |
| Deno | ✅ Full |
| React Native / Expo (Hermes) | ✅ Full |
| Browsers (Chrome, Safari, Firefox, Edge) | ✅ Full |
| Browser Extensions (Manifest V3) | ✅ Full |
| Cloudflare Workers | ✅ Full |
| Vercel Edge Runtime | ✅ Full |
| Capacitor / Cordova | ✅ Full |
| Electron | ✅ Full |

> **Timer-based features** (token keepalive, cache cleanup, auto-prefetch, polling) silently no-op in environments that lack `setInterval` (e.g. Cloudflare Workers, Vercel Edge). All other features work identically everywhere.

## 🛠️ Basic Usage

```typescript
import { login, getGrades, configure } from "linkdirecte";

// Optional: Configure persistent storage
configure({ maxRetries: 5 });

// Log in
const session = await login("username", "password");

// session is either LoginSuccess or LoginChallenge (2FA)
if ("question" in session) {
  console.log(session.question);
  const success = await session.answer(0);
  console.log(`Hello, ${success.user.firstName}!`);
} else {
  console.log(`Hello, ${session.user.firstName}!`);
}

// Fetch grades
const grades = await getGrades();
```
