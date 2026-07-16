import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  login,
  configure,
  getGrades,
  clearSession,
  offlineQueue,
} from '../src/index';
import { setAccount, setToken } from '../src/core/store';
import { EdRateLimitError, EdNetworkError } from '../src/core/errors';
import { stopTokenKeepalive } from '../src/core/health';

describe('Core Fetch Mechanism & Error Handling', () => {
  let originalFetch: typeof globalThis.fetch;
  let requests: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
  }[] = [];
  let responseQueue: (() => {
    status: number;
    headers?: Record<string, string>;
    body: any;
  })[] = [];
  let mockResponses: Map<
    string,
    (req: any) => {
      status: number;
      headers?: Record<string, string>;
      body: any;
    }
  > = new Map();

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    requests = [];
    responseQueue = [];
    mockResponses.clear();

    // Reset store config
    configure({
      storage: undefined,
      maxRetries: 2,
      retryDelay: 1,
      timeout: 1000,
      offlineQueue: false,
    });

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = input.toString();
      const method = init?.method || 'GET';
      const headers: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            headers[key] = value;
          });
        } else {
          Object.assign(headers, init.headers);
        }
      }

      let parsedBody: any = undefined;
      if (init?.body) {
        const bodyStr = init.body.toString();
        if (bodyStr.startsWith('data=')) {
          const jsonStr = decodeURIComponent(bodyStr.substring(5));
          try {
            parsedBody = JSON.parse(jsonStr);
          } catch {
            parsedBody = bodyStr;
          }
        } else {
          parsedBody = bodyStr;
        }
      }

      const requestObj = { url: urlStr, method, headers, body: parsedBody };
      requests.push(requestObj);

      // 1. Check response queue first (for order-specific mock responses like retries)
      const queuedHandler = responseQueue.shift();
      if (queuedHandler) {
        const { status, headers: resHeaders, body } = queuedHandler();
        return new Response(JSON.stringify(body), {
          status,
          headers: new Headers({
            'Content-Type': 'application/json',
            ...resHeaders,
          }),
        });
      }

      // 2. Check pattern matches
      let matchedHandler = null;
      for (const [pattern, handler] of mockResponses.entries()) {
        if (urlStr.includes(pattern)) {
          matchedHandler = handler;
          break;
        }
      }

      if (matchedHandler) {
        try {
          const {
            status,
            headers: resHeaders,
            body,
          } = matchedHandler(requestObj);
          return new Response(JSON.stringify(body), {
            status,
            headers: new Headers({
              'Content-Type': 'application/json',
              ...resHeaders,
            }),
          });
        } catch (err) {
          throw err;
        }
      }

      // Default fallback
      return new Response(JSON.stringify({ code: 404, message: 'Not found' }), {
        status: 404,
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });
    };
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    stopTokenKeepalive();
    await clearSession();
    offlineQueue.getQueue().length = 0; // Clear offline queue
  });

  const mockAccount = {
    loginId: 1234567,
    id: 9876,
    uid: 'session_uid',
    identifiant: 'Test.user',
    accountType: 'E' as const,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    schoolName: 'Ecole Test',
    main: true,
    profile: {
      sexe: 'M' as const,
      photoUrl: 'https://example.com/photo.jpg',
    },
    modules: [{ code: 'NOTES', enable: true, badge: 0, params: {} }],
  };

  it('fetches grades and applies transform correctly', async () => {
    // Manually set an authenticated account
    setAccount(mockAccount);
    setToken('valid_token');

    mockResponses.set('/notes.awp', (req) => {
      expect(req.headers['X-Token']).toBe('valid_token');
      expect(req.body.anneeScolaire).toBe('');
      return {
        status: 200,
        body: {
          code: 200,
          message: '',
          data: {
            notes: [
              {
                valeur: '15,5',
                noteSur: '20',
                coef: 2, // Use number to match interface
                enLettre: '0',
                interrogation: '1',
                dateSaisie: '2023-10-15',
                codeMatiere: 'MATHS',
                libelleMatiere: 'Mathématiques',
                codePeriode: 'TRIM1',
              },
            ],
            matieres: [
              {
                codeMatiere: 'MATHS',
                libelleMatiere: 'Mathématiques',
                coef: 2, // Use number to match interface
                nomProf: 'M. Sévère',
              },
            ],
          },
        },
      };
    });

    const result = await getGrades();

    expect(result.grades.length).toBe(1);
    expect(result.grades[0].value).toBe('15,5');
    expect(result.grades[0].coefficient).toBe(2);
    expect(result.grades[0].isTest).toBe(true);
    expect(result.grades[0].isLetter).toBe(false);
    expect(result.grades[0].subjectCode).toBe('MATHS');

    expect(result.subjects.length).toBe(1);
    expect(result.subjects[0].subjectCode).toBe('MATHS');
    expect(result.subjects[0].coefficient).toBe(2);
    expect(result.subjects[0].teacherName).toBe('M. Sévère');
  });

  it('handles automatic retries on server errors (HTTP 500)', async () => {
    setAccount(mockAccount);
    setToken('valid_token');

    // Queue 2 failures followed by 1 success
    responseQueue.push(() => ({
      status: 500,
      body: { code: 500, message: 'Internal Server Error', data: {} },
    }));
    responseQueue.push(() => ({
      status: 500,
      body: { code: 500, message: 'Internal Server Error', data: {} },
    }));
    responseQueue.push(() => ({
      status: 200,
      body: {
        code: 200,
        message: '',
        data: {
          notes: [
            {
              valeur: '12',
              noteSur: '20',
              coef: 2,
              enLettre: '0',
              interrogation: '1',
              dateSaisie: '2023-10-15',
              codeMatiere: 'MATHS',
              libelleMatiere: 'Mathématiques',
              codePeriode: 'TRIM1',
            },
          ],
          matieres: [
            {
              codeMatiere: 'MATHS',
              libelleMatiere: 'Mathématiques',
              coef: 2,
              nomProf: 'M. Sévère',
            },
          ],
        },
      },
    }));

    // Configure maxRetries: 3 to allow 2 retries
    configure({ maxRetries: 3, retryDelay: 1 });

    const result = await getGrades();
    expect(result.grades.length).toBe(1);
    expect(requests.length).toBe(3); // 1 initial request + 2 retries
  });

  it('stops retrying and throws error when maxRetries is exceeded', async () => {
    setAccount(mockAccount);
    setToken('valid_token');

    // Configure maxRetries: 1 (no retries)
    configure({ maxRetries: 0 });

    responseQueue.push(() => ({
      status: 500,
      body: { code: 500, message: 'Internal Server Error', data: {} },
    }));

    expect(getGrades()).rejects.toThrow(EdNetworkError);
  });

  it('throws EdRateLimitError on HTTP 429', async () => {
    setAccount(mockAccount);
    setToken('valid_token');

    mockResponses.set('/notes.awp', () => ({
      status: 429,
      body: { code: 429, message: 'Too many requests', data: {} },
    }));

    expect(getGrades()).rejects.toThrow(EdRateLimitError);
  });

  it('pushes mutating requests to offline queue on network error if enabled', async () => {
    setAccount(mockAccount);
    setToken('valid_token');

    configure({ offlineQueue: true, maxRetries: 0 });

    // Mock fetch to simulate complete network error (throw error)
    globalThis.fetch = async () => {
      throw new Error('Connection refused');
    };

    // Attempt a POST mutating request (simulate using custom endpoint with body)
    const { edFetch } = await import('../src/core/fetch');

    expect(
      edFetch('/some-mutation.awp', {
        method: 'POST',
        body: { homeworkId: 123, isDone: true },
      }),
    ).rejects.toThrow();

    const queue = offlineQueue.getQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].endpoint).toBe('/some-mutation.awp');
    expect(queue[0].options.body).toEqual({ homeworkId: 123, isDone: true });
  });

  it('handles automatic session refresh (re-login) on session expiry code 521', async () => {
    // Standard mock session setup
    const storageMock = {
      store: new Map<string, string>(),
      get(key: string) {
        return this.store.get(key) || null;
      },
      set(key: string, val: string) {
        this.store.set(key, val);
      },
      delete(key: string) {
        this.store.delete(key);
      },
    };

    storageMock.set('ed_access_token_9876', 'saved_access_token');
    storageMock.set('ed_uuid_9876', 'saved_uuid');

    configure({
      storage: storageMock,
      maxRetries: 0,
    });

    setAccount({
      ...mockAccount,
      accessToken: 'saved_access_token',
    });
    setToken('expired_token');

    // 1. Initial request to /notes.awp returns 521 session expired
    responseQueue.push(() => ({
      status: 200,
      body: { code: 521, message: 'Session expirée', data: {} },
    }));

    // 2. GTK fetch request during refresh
    mockResponses.set('/login.awp?gtk=1', () => ({
      status: 200,
      headers: { 'set-cookie': 'GTK=refreshed_gtk_value; Path=/' },
      body: { code: 200, token: '', message: '', data: {} },
    }));

    // 3. Login with access token request during refresh
    mockResponses.set('/login.awp?v=', (req) => {
      expect(req.body.accesstoken).toBe('saved_access_token');
      expect(req.body.isReLogin).toBe(true);
      return {
        status: 200,
        headers: { 'X-Token': 'new_valid_token' },
        body: {
          code: 200,
          token: 'new_valid_token',
          message: '',
          data: {
            accounts: [mockAccount],
          },
        },
      };
    });

    // 4. Retried request to /notes.awp succeeds with new token
    mockResponses.set('/notes.awp', (req) => {
      expect(req.headers['X-Token']).toBe('new_valid_token');
      return {
        status: 200,
        body: {
          code: 200,
          message: '',
          data: {
            notes: [
              {
                valeur: '12',
                noteSur: '20',
                coef: 2,
                enLettre: '0',
                interrogation: '1',
                dateSaisie: '2023-10-15',
                codeMatiere: 'MATHS',
                libelleMatiere: 'Mathématiques',
                codePeriode: 'TRIM1',
              },
            ],
            matieres: [
              {
                codeMatiere: 'MATHS',
                libelleMatiere: 'Mathématiques',
                coef: 2,
                nomProf: 'M. Sévère',
              },
            ],
          },
        },
      };
    });

    const result = await getGrades();
    expect(result.grades.length).toBe(1);
  });
});
