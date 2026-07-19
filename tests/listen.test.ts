// © 2026 typeof (Scolup) | Licensed under AGPL 3.
import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { startPolling, stopPolling, on, off, configure, clearSession } from '../src/index';
import { setAccount, setToken } from '../src/core/store';

describe('Listen Module (Polling & Events)', () => {
  let originalFetch: typeof globalThis.fetch;
  let requests: string[] = [];

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
    modules: [],
  };

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    requests = [];
    setAccount(mockAccount);
    setToken('test_token');
    configure({ maxRetries: 0 });
  });

  afterEach(async () => {
    globalThis.fetch = originalFetch;
    stopPolling();
    await clearSession();
  });

  it('polls APIs immediately and emits events on new items', async () => {
    let callCount = 0;

    globalThis.fetch = async (input, init) => {
      const urlStr = input.toString();
      requests.push(urlStr);

      if (urlStr.includes('notes.awp')) {
        return new Response(
          JSON.stringify({
            code: 200,
            message: '',
            data: {
              grades: [
                {
                  id: callCount === 0 ? 10 : 11, 
                  valeur: '15',
                },
              ],
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      } else if (urlStr.includes('messages.awp')) {
        return new Response(
          JSON.stringify({
            code: 200,
            message: '',
            data: {
              messages: {
                received: [
                  {
                    id: 20,
                    subject: 'Hello',
                  },
                ],
              },
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      } else if (urlStr.includes('cahierdetexte.awp')) {
        return new Response(
          JSON.stringify({
            code: 200,
            message: '',
            data: {},
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      } else if (urlStr.includes('timeline.awp')) {
        return new Response(
          JSON.stringify({
            code: 200,
            message: '',
            data: [
              {
                id: 30,
                typeElement: 'INFO',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }

      return new Response(JSON.stringify({ code: 404 }), { status: 404 });
    };

    const newGradeCallback = mock((data) => {
      expect(data.id).toBe(10);
    });

    const newMessageCallback = mock((data) => {
      expect(data.id).toBe(20);
    });

    const newTimelineCallback = mock((data) => {
      expect(data.id).toBe(30);
    });

    const removeGradeListener = on('newGrade', newGradeCallback);
    const removeMessageListener = on('newMessage', newMessageCallback);
    const removeTimelineListener = on('newTimelineEntry', newTimelineCallback);

    startPolling({ interval: 5000 });

    
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(requests.some((url) => url.includes('notes.awp'))).toBe(true);
    expect(requests.some((url) => url.includes('messages.awp'))).toBe(true);
    expect(requests.some((url) => url.includes('timeline.awp'))).toBe(true);

    expect(newGradeCallback).toHaveBeenCalled();
    expect(newMessageCallback).toHaveBeenCalled();
    expect(newTimelineCallback).toHaveBeenCalled();

    
    removeGradeListener();
    removeMessageListener();
    removeTimelineListener();
  });

  it('emits pollingError event when a poll task fails', async () => {
    globalThis.fetch = async () => {
      return new Response(JSON.stringify({ code: 500, message: 'Server error' }), { status: 500 });
    };

    const errorCallback = mock((err) => {
      expect(err).toBeDefined();
    });

    on('pollingError', errorCallback);

    startPolling({ interval: 5000 });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(errorCallback).toHaveBeenCalled();
  });
});
// © 2026 typeof (Scolup) | Licensed under AGPL 3.
