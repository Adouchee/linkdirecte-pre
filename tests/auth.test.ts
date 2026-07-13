import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  login,
  logout,
  refreshToken,
  configure,
  getAccount,
  getLastTokenRefresh,
  clearSession,
} from '../src/index';
import { EdAuthError } from '../src/core/errors';
import { stopTokenKeepalive } from '../src/core/health';

// Helper to encode to base64 as EcoleDirecte expects
function encodeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

describe('Authentication Flow', () => {
  let originalFetch: typeof globalThis.fetch;
  let requests: {
    url: string;
    method: string;
    headers: Record<string, string>;
    body: any;
  }[] = [];
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
    mockResponses.clear();

    // Reset store and configure default memory storage
    configure({
      storage: undefined, // default to memory
      on2faRequired: undefined,
      onCredentialsRequired: undefined,
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
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => {
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

      requests.push({ url: urlStr, method, headers, body: parsedBody });

      // Match mock responses
      let matchedHandler = null;
      for (const [pattern, handler] of mockResponses.entries()) {
        if (urlStr.includes(pattern)) {
          matchedHandler = handler;
          break;
        }
      }

      if (matchedHandler) {
        const {
          status,
          headers: resHeaders,
          body,
        } = matchedHandler({ url: urlStr, method, headers, body: parsedBody });
        return new Response(JSON.stringify(body), {
          status,
          headers: new Headers({
            'Content-Type': 'application/json',
            ...resHeaders,
          }),
        });
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
  });

  const mockRawAccount = {
    idLogin: 12345,
    id: 98765,
    uid: 'session_uid',
    identifiant: 'testuser',
    typeCompte: 'E',
    prenom: 'John',
    nom: 'Doe',
    email: 'john.doe@example.com',
    nomEtablissement: 'Ecole Test',
    main: true,
    accesstoken: 'mocked_access_token',
    photo: 'https://example.com/photo.jpg',
    profile: {
      sexe: 'M',
      photoUrl: 'https://example.com/photo.jpg',
    },
    modules: [{ code: 'NOTES', enable: 1, badge: 0, params: {} }],
  };

  it('performs a standard successful login', async () => {
    // 1. Mock GTK token retrieval
    mockResponses.set('/login.awp?gtk=1', () => ({
      status: 200,
      headers: { 'set-cookie': 'GTK=mocked_gtk_value; Path=/' },
      body: { code: 200, token: '', message: '', data: {} },
    }));

    // 2. Mock main login
    mockResponses.set('/login.awp?v=', (req) => {
      expect(req.headers['X-GTK']).toBe('mocked_gtk_value');
      expect(req.body.identifiant).toBe('testuser');
      expect(req.body.motdepasse).toBe('testpass');
      return {
        status: 200,
        headers: { 'X-Token': 'mocked_session_token' },
        body: {
          code: 200,
          token: 'mocked_session_token',
          message: '',
          data: {
            accounts: [mockRawAccount],
          },
        },
      };
    });

    const result = await login('testuser', 'testpass');

    expect(result.user.firstName).toBe('John');
    expect(result.user.lastName).toBe('Doe');
    expect(result.token).toBe('mocked_session_token');
    expect(getAccount()?.id).toBe(98765);
    expect(getLastTokenRefresh()).toBeDefined();

    // Verify requests sent
    expect(requests.length).toBe(2);
    expect(requests[0].url).toContain('gtk=1');
    expect(requests[1].url).toContain('login.awp?v=');
  });

  it('handles 2FA challenge flow successfully', async () => {
    // 1. Mock GTK
    mockResponses.set('/login.awp?gtk=1', () => ({
      status: 200,
      headers: { 'set-cookie': 'GTK=mocked_gtk_value; Path=/' },
      body: { code: 200, token: '', message: '', data: {} },
    }));

    // 2. Mock dynamic login: first returns 250, second with cn/cv returns 200
    mockResponses.set('/login.awp?v=', (req) => {
      if (
        req.body &&
        req.body.cn === 'mocked_cn' &&
        req.body.cv === 'mocked_cv'
      ) {
        return {
          status: 200,
          headers: { 'X-Token': 'final_session_token' },
          body: {
            code: 200,
            token: 'final_session_token',
            message: '',
            data: {
              accounts: [mockRawAccount],
            },
          },
        };
      }
      return {
        status: 200,
        headers: { '2fa-token': 't1', 'x-token': 'x1' },
        body: { code: 250, token: '', message: '2FA required', data: {} },
      };
    });

    // 3. Mock 2FA challenge get
    mockResponses.set('/connexion/doubleauth.awp?verbe=get', () => ({
      status: 200,
      headers: { '2fa-token': 't2', 'x-token': 'x2' },
      body: {
        code: 200,
        token: '',
        message: '',
        data: {
          question: encodeBase64('What is your favorite color?'),
          propositions: [
            encodeBase64('Blue'),
            encodeBase64('Red'),
            encodeBase64('Green'),
          ],
        },
      },
    }));

    // 4. Mock 2FA challenge post
    mockResponses.set('/connexion/doubleauth.awp?verbe=post', () => ({
      status: 200,
      headers: { '2fa-token': 't3', 'x-token': 'x3' },
      body: {
        code: 200,
        token: '',
        message: '',
        data: {
          cn: 'mocked_cn',
          cv: 'mocked_cv',
        },
      },
    }));

    // We pass an on2faRequired handler
    const on2faRequired = mock((question, choices) => {
      expect(question).toBe('What is your favorite color?');
      expect(choices).toEqual(['Blue', 'Red', 'Green']);
      return 1; // choose Red (index 1)
    });

    const result = await login('testuser', 'testpass', { on2faRequired });

    expect(on2faRequired).toHaveBeenCalled();
    expect(result.token).toBe('final_session_token');
    expect(result.user.firstName).toBe('John');
  });

  it('fails login on bad credentials', async () => {
    mockResponses.set('/login.awp?gtk=1', () => ({
      status: 200,
      headers: { 'set-cookie': 'GTK=mocked_gtk_value; Path=/' },
      body: { code: 200, token: '', message: '', data: {} },
    }));

    mockResponses.set('/login.awp?v=', () => ({
      status: 200,
      body: {
        code: 505,
        message: 'Mot de passe invalide',
        data: {},
      },
    }));

    expect(login('testuser', 'badpass')).rejects.toThrow();
  });

  it('handles logout successfully', async () => {
    // 1. Mock GTK token retrieval
    mockResponses.set('/login.awp?gtk=1', () => ({
      status: 200,
      headers: { 'set-cookie': 'GTK=mocked_gtk_value; Path=/' },
      body: { code: 200, token: '', message: '', data: {} },
    }));

    // 2. Mock main login
    mockResponses.set('/login.awp?v=', () => ({
      status: 200,
      headers: { 'X-Token': 'mocked_session_token' },
      body: {
        code: 200,
        token: 'mocked_session_token',
        message: '',
        data: {
          accounts: [mockRawAccount],
        },
      },
    }));

    await login('testuser', 'testpass');
    expect(getAccount()).toBeDefined();

    await logout();
    expect(getAccount()).toBeUndefined();
  });
});
