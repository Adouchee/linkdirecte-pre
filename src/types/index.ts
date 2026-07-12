export interface EdResponse<T> {
  host: string;
  code: number;
  token?: string;
  message: string;
  data: T;
}

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

export interface UserProfile {
  token: string;
  accounts: Account[];
}

export interface LoginChallenge {
  type: 'securityQuestion';
  question: string;
  choices: string[];
  answer: (choiceIndex: number) => Promise<LoginSuccess>;
}

export interface LoginSuccess {
  user: Account;
  token: string;
  sessionId: string;
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

export type LoginResult = LoginChallenge | LoginSuccess;

export interface EdConfig {
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
    choices: string[],
  ) => number | Promise<number>;
  onCredentialsRequired?: () =>
    | { identifiant: string; motdepasse: string }
    | Promise<{ identifiant: string; motdepasse: string }>;
  cache?: CacheConfig;
  cacheMaxEntries?: number;
}

export interface StorageAdapter {
  get(key: string): string | null | Promise<string | null>;
  set(key: string, value: string): void | Promise<void>;
  delete(key: string): void | Promise<void>;
}

export interface PrefetchConfig {
  enabled?: boolean;
  interval?: string | false;
  modules?: string[];
}

export interface CacheConfig {
  grades?: string | false;
  timetable?: string | false;
  messages?: string | false;
  homework?: string | false;
  documents?: string | false;
  cloud?: string | false;
  attendance?: string | false;
  timeline?: string | false;
}

export type ErrorMiddleware = (
  error: any,
  retry: (options?: { delay?: number }) => Promise<unknown>,
) => void | Promise<void>;

export interface DebugInfo {
  rawResponse: unknown;
  transformLog: any[];
  requestDump: {
    url: string;
    headers: Record<string, string>;
    body: any;
  };
  cacheHit: boolean;
  retries: number;
}

export type WithDebug<T> = T & { _debug?: DebugInfo };

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
  owner?: {
    id: number;
    type: string;
    lastName: string;
    firstName: string;
    particule: string;
  };
}

export interface CloudFolderNode extends CloudNode {
  type: 'folder';
  children: CloudNode[];
}

export interface CloudFileNode extends CloudNode {
  type: 'file';
}

export type CloudEntry = CloudFolderNode | CloudFileNode;
