# Linkdirecte — Developer SDK for EcoleDirecte

Linkdirecte is a high-performance, type-safe, tree-shakeable TypeScript/JavaScript SDK for the private EcoleDirecte student API. It handles all authentication complexities (including session refreshing and Two-Factor Authentication), features an offline mutation queue, handles smart caching, and normalizes French API responses into structured, type-safe English models.

---

## Installation

```bash
npm install linkdirecte
```

---

## Core Concepts & Setup

### 1. Initialization & Session Restore
You do not need to manage tokens manually. Linkdirecte persists session states via Storage Adapters.

```typescript
import { login, configure, nodeStorage } from 'linkdirecte';

// Configuration (Node.js/Bun server environment)
configure({
  storage: nodeStorage('./session.json'),
  passkey: 'your-encryption-passkey', // Automatically enables AES-GCM encryption on stored tokens
});

// Perform login (supports positional and unified styles)
const session = await login({
  username: 'your_username',
  password: 'your_password',
  rememberMe: true, // Saves refresh credentials
});

// To restore a saved session upon startup later:
import { loadSession } from 'linkdirecte';
const wasRestored = await loadSession();
```

### 2. Handling 2FA Challenges
When EcoleDirecte requires a security question, the login function either triggers a callback or returns a challenge.

#### Callback approach (recommended):
```typescript
const session = await login('username', 'password', {
  on2faRequired: async (question, choices) => {
    // Return index (0) or matching choice text (case-insensitive, e.g. "Answer text")
    return 0;
  }
});
```

#### Interactive challenge approach:
```typescript
const result = await login('username', 'password');
if ('question' in result) {
  // It is a LoginChallenge object
  console.log(result.question); // "What is your secret color?"
  console.log(result.choices);  // ["Blue", "Red", "Green"]
  const session = await result.answer("Red"); // Accepts index or text string
}
```

---

## Complete API Reference

### Global Configuration (`configure`)
```typescript
interface EdConfig {
  userAgent?: string;
  proxyUrl?: string;
  maxRetries?: number;
  retryDelay?: number;
  concurrency?: number;
  timeout?: number;
  storage?: StorageAdapter;
  passkey?: string;
  offlineQueue?: boolean;
  prefetch?: PrefetchConfig;
  onError?: (error: any, retry: () => Promise<unknown>) => void | Promise<void>;
  on2faRequired?: (question: string, choices: string[]) => number | string | Promise<number | string>;
  onCredentialsRequired?: () => { identifiant: string, motdepasse: string } | Promise<{ identifiant: string, motdepasse: string }>;
  cache?: CacheConfig;
  cacheMaxEntries?: number;
}
```

### Storage Adapters
- `memoryStorage`: Volatile in-memory map.
- `indexedDBStorage`: Persistent IndexedDB backend (for browsers).
- `localStorageStorage`: Standard Web localStorage backend.
- `nodeStorage(filePath?)`: JSON file persistence (for Node/Bun).
- `cloudflareKVStorage(namespace)`: Cloudflare KV wrapper.
- `asyncStorage({ getItem, setItem, removeItem })`: Wrap any custom key-value store.
- `encryptedStorage(backend, secret)`: Transparent AES-GCM wrapping.

---

## Module Mappings & Code Snippets

### 1. Grades
```typescript
import { getGrades } from 'linkdirecte';

const result = await getGrades({
  periodId: 'A001', // Optional specific period
  raw: false,       // Returns raw API if true
  explain: false,   // Includes debug data if true
});

console.log(result.grades); // Flat array of GradeEntry
console.log(result.subjects); // Grouped SubjectEntry withcomputed average/classAverage
```

### 2. Timetable & Calendar
```typescript
import { getTimetable, getTimetableIcalUrl } from 'linkdirecte';

const schedule = await getTimetable({
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
});

const icalSubscriptionUrl = await getTimetableIcalUrl();
```

### 3. Homework (Cahier de Texte)
```typescript
import { getHomework, getHomeworkForDate, markAsDone } from 'linkdirecte';

// withContent resolves full html details and attachments in parallel
const diary = await getHomework({ withContent: true });

// Mark assignments as completed (retains local offline queue if offlineQueue is enabled)
await markAsDone([123456, 789012]);
```

### 4. Mail & Messages
```typescript
import { getMessages, getMessage, sendMessage } from 'linkdirecte';

const inbox = await getMessages({ withContent: false });
const received = inbox.messages?.received || [];

// Fetch and mark as read
const mail = await getMessage(received[0].id);
console.log(mail.content); // Decoded HTML content

// Send a message
await sendMessage({
  subject: "Absence",
  content: "Excuse body text",
  destinataires: [{ id: 1234, type: "P" }],
});
```

### 5. Attendance & School Life
```typescript
import { getAttendance } from 'linkdirecte';

const reports = await getAttendance();
console.log(reports.absences); // Array of absences
console.log(reports.delays); // Array of late entries
console.log(reports.punishments); // Array of detentions/sanctions
```

### 6. Cloud Storage (Porte-documents)
```typescript
import { getCloud, createFolder, deleteNodes } from 'linkdirecte';

const rootItems = await getCloud({ depth: 3 });
const folder = rootItems.find(x => x.type === 'folder');

if (folder) {
  const subFolder = await createFolder('New Homework Folder', folder);
  await deleteNodes([subFolder]); // Moves to trash
}
```

### 7. Official Documents
```typescript
import { getDocuments, download } from 'linkdirecte';

const docs = await getDocuments();
const reportCard = docs.grades?.[0];

if (reportCard?.url) {
  // Downloads document as ArrayBuffer
  const buffer = await download(reportCard.url);
}
```

### 8. Forms & QCMs
```typescript
import { getQcms, getQcmDetail, submitQcmAnswer } from 'linkdirecte';

const tests = await getQcms();
const quiz = tests.associations?.[0];

if (quiz) {
  const detail = await getQcmDetail(quiz.qcmId, quiz.id);
  // Submit multiple choices for a single question ID
  await submitQcmAnswer({
    idQcm: quiz.qcmId,
    idAssociation: quiz.id,
    idParticipant: detail.questions[0].id, // Participant ID
    idReponse: 1,
    idQuestion: detail.questions[0].id,
    choiceIds: [101, 102],
  });
}
```

### 9. Event Polling & Push Daemon
```typescript
import { startPolling, stopPolling, on } from 'linkdirecte';

on('newGrade', (grade) => console.log('New Grade!', grade));
on('newMessage', (msg) => console.log('New Message!', msg));

startPolling({ interval: 60000 }); // Query changes every 60 seconds
```

---

## TypeScript Type Definitions Reference

```typescript
export type AccountType = 'E' | 'P' | 'A' | 'F';

export interface Account {
  loginId: number;
  id: number;
  uid: string;
  identifiant: string;
  accountType: AccountType;
  firstName: string;
  lastName: string;
  email: string;
  schoolName: string;
  main: boolean;
  accessToken?: string;
  profile: {
    sexe: 'M' | 'F';
    photoUrl: string;
    classe?: {
      id: number;
      code: string;
      label: string;
    };
  };
  modules: Array<{
    code: string;
    enable: boolean;
    badge: number;
    params: Record<string, any>;
  }>;
}

export interface GradeEntry {
  value: string;
  outOf: string;
  coefficient: number;
  isLetter: boolean;
  isTest: boolean;
  date: Date;
  subjectCode: string;
  subjectLabel: string;
  periodCode: string;
  entryDate: Date;
  teacherName?: string;
  testType?: string;
  subSubjectCode?: string;
  subSubjectLabel?: string;
}

export interface SubjectEntry {
  subjectCode: string;
  subjectLabel: string;
  coefficient: number;
  teacherName?: string;
  grades: GradeEntry[];
  average?: number;
  classAverage?: number;
}

export interface TimetableEntry {
  id: number;
  subjectCode: string;
  subjectLabel: string;
  teacherName?: string;
  room?: string;
  group?: string;
  startDate: Date;
  endDate: Date;
  isCancelled?: boolean;
  isDetention?: boolean;
  isExempted?: boolean;
  color?: string;
}

export interface MessageEntry {
  id: number;
  subject: string;
  content?: string;
  fromName?: string;
  date: Date;
  isRead: boolean;
  isAnswered?: boolean;
  isTransferred?: boolean;
  canAnswer?: boolean;
}

export interface HomeworkEntry {
  id: number;
  subjectCode: string;
  subjectLabel: string;
  teacherName?: string;
  givenOn: Date;
  forDate: Date;
  content: string;
  isDone: boolean;
  submitOnline?: boolean;
  documentsToDo?: Array<{ id: number; label: string; url?: string }>;
}

export interface DocumentEntry {
  id: number;
  name: string;
  subjectLabel?: string;
  teacherName?: string;
  date: Date;
  size?: number;
  url?: string;
  studentId?: string;
  signatureRequired?: boolean;
  type?: string;
}

export interface CloudNode {
  id: string;
  type: 'file' | 'folder';
  label: string;
  date: string;
  size: number;
  isReadOnly: boolean;
  isHidden: boolean;
  isTrash: boolean;
  isLoaded?: boolean;
  quota?: number;
  displayText?: string;
  children?: CloudNode[];
}

export interface AccountSettings {
  id: number;
  identifiant: string;
  email: string;
  mobilePhone: string;
  secretQuestion: string;
  answer: string;
  accessToken: string;
  possibleQuestions: string[];
}
```
