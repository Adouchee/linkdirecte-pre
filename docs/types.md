# 🗂️ Complete Type Reference

This index gathers and explains all public TypeScript interfaces and data structures exported by Linkdirecte. Use this as a quick-lookup reference when building typed integrations or setting up custom applications!

---

## 🛠️ Configurations & Options

### `EdConfig`

Defines global parameters passed to `configure()`.

```typescript
interface EdConfig {
  userAgent?: string;
  proxyUrl?: string;
  maxRetries?: number;
  retryDelay?: number;
  concurrency?: number;
  timeout?: number;
  storage?: StorageAdapter;
  offlineQueue?: boolean;
  prefetch?: PrefetchConfig;
  onError?: ErrorMiddleware;
  on2faRequired?: (
    question: string,
    choices: string[]
  ) => number | string | Promise<number | string>;
  onCredentialsRequired?: () =>
    | { identifiant: string; motdepasse: string }
    | Promise<{ identifiant: string; motdepasse: string }>;
  cache?: CacheConfig;
  cacheMaxEntries?: number;
}
```

### `PrefetchConfig`

Configures the background cache prefetching daemon.

```typescript
interface PrefetchConfig {
  enabled?: boolean;
  interval?: string | false; // e.g., "30s", "5m", "1h", or false to disable
  modules?: string[];
}
```

### `CacheConfig`

Per-module cache durations. You can configure how long items should stay cached.

```typescript
interface CacheConfig {
  grades?: string | false;
  timetable?: string | false;
  messages?: string | false;
  homework?: string | false;
  documents?: string | false;
  cloud?: string | false;
  attendance?: string | false;
  timeline?: string | false;
}
```

### `StorageAdapter`

The standard interface for defining custom data storage persistence.

```typescript
interface StorageAdapter {
  get(key: string): string | null | Promise<string | null>;
  set(key: string, value: string): void | Promise<void>;
  delete(key: string): void | Promise<void>;
}
```

---

## 🔑 Session & Authentication

### `LoginResult`

The result returned from `login()` is a union type representing either a successful session or a 2FA prompt.

```typescript
type LoginResult = LoginSuccess | LoginChallenge;
```

### `LoginSuccess`

```typescript
interface LoginSuccess {
  user: Account;
  token: string;
  sessionId: string;
}
```

### `LoginChallenge`

```typescript
interface LoginChallenge {
  type: "securityQuestion";
  question: string;
  choices: string[];
  answer: (choiceIndexOrText: number | string) => Promise<LoginSuccess>;
}
```

### `Account`

Contains the profile and module details for a registered student.

```typescript
interface Account {
  loginId: number;
  id: number;
  uid: string;
  identifiant: string;
  accountType: "E" | "P" | "A" | "F"; // "E" for Student (Élève)
  firstName: string;
  lastName: string;
  email: string;
  schoolName: string;
  main: boolean;
  accessToken?: string;
  profile: {
    sexe: "M" | "F";
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
```

### `AccountSettings`

```typescript
interface AccountSettings {
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

---

## 📊 Modules Types

### Grades Module

#### `GradesResult`
```typescript
interface GradesResult {
  grades: GradeEntry[];
  subjects: SubjectEntry[];
  averages?: Array<{
    subjectCode: string;
    average: number;
    classAverage?: number;
  }>;
  periods?: Array<{ code: string; label: string }>;
}
```

#### `GradeEntry`
```typescript
interface GradeEntry {
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
```

#### `SubjectEntry`
```typescript
interface SubjectEntry {
  subjectCode: string;
  subjectLabel: string;
  coefficient: number;
  teacherName?: string;
  grades: GradeEntry[];
  average?: number;
  classAverage?: number;
}
```

---

### Timetable Module

#### `TimetableResult`
```typescript
interface TimetableResult {
  timetable: TimetableEntry[];
}
```

#### `TimetableEntry`
```typescript
interface TimetableEntry {
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
```

---

### Messages Module

#### `MessagesResult`
```typescript
interface MessagesResult {
  messages?: {
    received?: MessageEntry[];
    sent?: MessageEntry[];
    drafts?: MessageEntry[];
  };
}
```

#### `MessageEntry`
```typescript
interface MessageEntry {
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
```

#### `SendMessageData`
```typescript
interface SendMessageData {
  subject: string;
  content: string;
  destinataires: Array<{
    id: number;
    type: string;
    [key: string]: any;
  }>;
}
```

---

### Homework Module

#### `HomeworkResult`
```typescript
interface HomeworkResult {
  [date: string]: HomeworkEntry[];
}
```

#### `HomeworkEntry`
```typescript
interface HomeworkEntry {
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
```

---

### Timeline Module

#### `TimelineEntry`
```typescript
interface TimelineEntry {
  id: number;
  elementType: string;
  title?: string;
  subtitle?: string;
  content?: string;
  creationDate: Date;
  subjectLabel?: string;
  teacherName?: string;
}
```

#### `Correlation`
```typescript
interface Correlation {
  type: "gradeVsPresence" | "gradeVsDayOfWeek" | "gradeVsTimeOfDay" | "homeworkVsGrade" | "gradeTrend";
  subject: string;
  finding: string;
  data: Record<string, number>;
  confidence: number;
  observations: number;
}
```

---

### Attendance Module

#### `AttendanceResult`
```typescript
interface AttendanceResult {
  absences?: AttendanceEntry[];
  delays?: AttendanceEntry[];
  punishments?: AttendanceEntry[];
  attendance?: AttendanceEntry[];
  settings?: Record<string, unknown>;
}
```

#### `AttendanceEntry`
```typescript
interface AttendanceEntry {
  id: number;
  date: Date;
  type: string;
  subjectLabel?: string;
  isJustified?: boolean;
  justificationType?: string;
  teacherName?: string;
  licensePoints?: number;
  studentId?: number;
  reason?: string;
  justifiedOnline?: boolean;
  dontNeedJustification?: boolean;
  day?: Date;
}
```

---

### Cloud Module

#### `CloudNode`
```typescript
interface CloudNode {
  id: string;
  type: "file" | "folder";
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
  owner?: {
    id: number;
    type: string;
    lastName: string;
    firstName: string;
    particule: string;
  };
}
```

#### `CloudEntry`
```typescript
type CloudEntry = CloudFolderNode | CloudFileNode;

interface CloudFolderNode extends CloudNode {
  type: "folder";
  children: CloudNode[];
}

interface CloudFileNode extends CloudNode {
  type: "file";
}
```

---

### Documents Module

#### `DocumentsResult`
```typescript
interface DocumentsResult {
  factures: DocumentEntry[];
  grades?: DocumentEntry[];
  viescolaire?: DocumentEntry[];
  administratives?: DocumentEntry[];
  toUploadList?: DocumentEntry[];
}
```

#### `DocumentEntry`
```typescript
interface DocumentEntry {
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
```

---

### Forms (QCM) Module

#### `QcmsResult`
```typescript
interface QcmsResult {
  associations?: QcmEntry[];
}
```

#### `QcmEntry`
```typescript
interface QcmEntry {
  id: number;
  qcmId: number;
  subjectLabel?: string;
  title?: string;
  teacherName?: string;
  date?: Date;
  status?: string;
}
```

#### `QcmDetailResult`
```typescript
interface QcmDetailResult {
  qcmId: number;
  questions: Array<{
    id: number;
    label: string;
    choices: Array<{ id: number; label: string }>;
  }>;
}
```
