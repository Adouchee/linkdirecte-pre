import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { getDocuments, configure, clearSession } from '../src/index';
import { setAccount, setToken } from '../src/core/store';

describe('Documents Module', () => {
  let originalFetch: typeof globalThis.fetch;
  let lastRequest: { url: string; method: string; body: any } | null = null;

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
    modules: [{ code: 'DOCUMENTS', enable: true, badge: 0, params: {} }],
  };

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    lastRequest = null;
    setAccount(mockAccount);
    setToken('test_token');
    configure({ maxRetries: 0 });
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    await clearSession();
  });

  it('fetches documents and transforms fields correctly', async () => {
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
            factures: [
              {
                id: 101,
                libelle: 'Invoice Oct',
                taille: 1542,
              },
            ],
            administratifs: [
              {
                id: 202,
                libelle: 'Rules.pdf',
                signatureDemandee: '1',
              },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };

    const result = await getDocuments();

    expect(lastRequest).toBeDefined();
    expect(lastRequest!.url).toContain('/elevesDocuments.awp');
    expect(lastRequest!.method).toBe('POST');

    expect(result.factures).toBeDefined();
    expect(result.factures[0].id).toBe(101);
    expect(result.factures[0].label).toBe('Invoice Oct');
    expect(result.factures[0].size).toBe(1542);

    expect(result.administratives).toBeDefined();
    expect(result.administratives![0].id).toBe(202);
    expect(result.administratives![0].label).toBe('Rules.pdf');
    expect(result.administratives![0].signatureRequired).toBe('1');
  });
});
