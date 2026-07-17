import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { getClassLife, configure, clearSession } from '../src/index';
import { setAccount, setToken } from '../src/core/store';

describe('Class Life Module', () => {
  let originalFetch: typeof globalThis.fetch;
  let lastRequest: { url: string; method: string; body: any } | null = null;

  const mockAccountWithClass = {
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
      classe: {
        id: 42,
        code: '3A',
        label: '3ème A',
      },
    },
    modules: [],
  };

  const mockAccountWithoutClass = {
    ...mockAccountWithClass,
    profile: {
      ...mockAccountWithClass.profile,
      classe: undefined,
    },
  };

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    lastRequest = null;
    setToken('test_token');
    configure({ maxRetries: 0 });
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    await clearSession();
  });

  it('fetches class life and transforms correctly', async () => {
    setAccount(mockAccountWithClass);

    globalThis.fetch = async (input, init) => {
      const urlStr = input.toString();
      const method = init?.method || 'GET';
      let parsedBody: any = undefined;
      if (init?.body) {
        const bodyStr = init.body.toString();
        if (bodyStr.startsWith('data=')) {
          parsedBody = JSON.parse(decodeURIComponent(bodyStr.substring(5)));
        } else {
          parsedBody = bodyStr;
        }
      }
      lastRequest = { url: urlStr, method, body: parsedBody };

      return new Response(
        JSON.stringify({
          code: 200,
          message: '',
          data: {
            students: [
              {
                id: 101,
                prenom: 'Alice',
                nom: 'Smith',
              },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const result = await getClassLife();

    expect(lastRequest).toBeDefined();
    expect(lastRequest!.url).toContain('/Classes/42/viedelaclasse.awp');
    expect(lastRequest!.method).toBe('POST');
    expect(lastRequest!.body).toEqual({});

    expect(result.students).toBeDefined();
    expect(result.students[0].firstName).toBe('Alice');
    expect(result.students[0].lastName).toBe('Smith');
  });

  it('throws error when active account has no class assigned', async () => {
    setAccount(mockAccountWithoutClass);

    expect(getClassLife()).rejects.toThrow('Active account does not have a class assigned.');
  });
});
