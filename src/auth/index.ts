import {
  getConfig,
  getAccount,
  getToken,
  getTwofaToken,
  setToken,
  setTwofaToken,
  setAccount,
  persistSession,
  loadSession,
  clearSession,
} from '../core/store';
import {
  buildApiUrl,
  buildRequestBody,
  buildHeaders,
  sendRequest,
  parseJsonResponse,
} from '../core/http';
import { EdAuthError } from '../core/errors';
import { assertNonEmptyString } from '../core/validate';
import { randomUUID } from '../core/env';
import { LoginResult, LoginSuccess, LoginChallenge, Account } from '../types';
import { transform } from '../core/transform';
import { startTokenKeepalive, stopTokenKeepalive } from '../core/health';

export interface LoginOptions {
  rememberMe?: boolean;
  on2faRequired?: (
    question: string,
    choices: string[],
  ) => number | string | Promise<number | string>;
}

export interface LoginUnifiedOptions extends LoginOptions {
  identifiant?: string;
  username?: string;
  identifier?: string;
  motdepasse?: string;
  password?: string;
}

export async function login(
  identifiantOrParams: string | LoginUnifiedOptions,
  motdepasse?: string,
  options: LoginOptions = {},
): Promise<LoginResult> {
  let identifiant = '';
  let finalPassword = '';
  let finalOptions = options;

  if (typeof identifiantOrParams === 'object' && identifiantOrParams !== null) {
    identifiant =
      identifiantOrParams.identifiant ||
      identifiantOrParams.username ||
      identifiantOrParams.identifier ||
      '';
    finalPassword =
      identifiantOrParams.motdepasse || identifiantOrParams.password || '';
    const {
      identifiant: _,
      username: __,
      identifier: ___,
      motdepasse: ____,
      password: _____,
      ...rest
    } = identifiantOrParams;
    finalOptions = rest;
  } else {
    identifiant = identifiantOrParams;
    finalPassword = motdepasse || '';
  }

  assertNonEmptyString(identifiant, 'identifiant');
  assertNonEmptyString(finalPassword, 'motdepasse');

  const gtk = await fetchGtkToken();

  let uuid: string;
  if (finalOptions.rememberMe) {
    const storage = getConfig().storage;
    const storedUuid = await storage?.get(`ed_uuid_${identifiant}`);
    if (storedUuid) {
      uuid = storedUuid;
    } else {
      uuid = randomUUID();
      await storage?.set(`ed_uuid_${identifiant}`, uuid);
    }
  } else {
    uuid = randomUUID();
  }

  const {
    data: initialResult,
    twofaToken,
    xToken,
  } = await sendAuthRequest(
    '/login.awp?v=7.14.3',
    {
      isReLogin: false,
      identifiant,
      motdepasse: finalPassword,
      sesouvenirdemoi: finalOptions.rememberMe ?? false,
      uuid,
      fa: [],
    },
    gtk,
  );

  if (initialResult.code === 250) {
    return handleTwoFactor(
      identifiant,
      finalPassword,
      uuid,
      finalOptions,
      gtk,
      twofaToken,
      xToken,
    );
  }

  if (xToken) setToken(xToken);
  if (twofaToken) setTwofaToken(twofaToken);

  const result = await handleLoginSuccess(
    initialResult,
    identifiant,
    uuid,
    finalOptions,
  );
  await persistSession();
  startTokenKeepalive();
  return result;
}

async function sendAuthRequest(
  endpoint: string,
  body: Record<string, unknown>,
  gtk: string,
  twofaToken?: string,
  xToken?: string,
): Promise<{ data: any; twofaToken: string; xToken: string }> {
  const urlObj = buildApiUrl(endpoint);

  const headers: Record<string, string> = {
    ...buildHeaders({ skipAuth: true, useGtk: gtk }),
  };

  if (twofaToken) headers['2FA-Token'] = twofaToken;
  if (xToken) headers['X-Token'] = xToken;

  const response = await sendRequest({
    url: urlObj.toString(),
    method: 'POST',
    headers,
    body: buildRequestBody(endpoint, body),
  });

  const data = await parseJsonResponse(response);

  return {
    data,
    twofaToken: response.headers.get('2fa-token') || '',
    xToken: response.headers.get('x-token') || '',
  };
}

async function fetchGtkToken(): Promise<string> {
  const urlObj = buildApiUrl('/login.awp?gtk=1&v=7.14.3');

  const response = await sendRequest({
    url: urlObj.toString(),
    method: 'GET',
    headers: buildHeaders({ skipAuth: true }),
  });

  const cookies = response.headers.get('set-cookie') || '';
  const match = cookies.match(/GTK=([^;]+)/);
  return match ? match[1] : '';
}

function decodeBase64(input: string): string {
  const binary = atob(input);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder('utf-8').decode(bytes);
}

async function handleTwoFactor(
  identifiant: string,
  motdepasse: string,
  uuid: string,
  options: LoginOptions,
  gtk: string,
  twofaToken: string,
  xToken: string,
): Promise<LoginChallenge | LoginSuccess> {
  const {
    data: challengeData,
    twofaToken: t3,
    xToken: x3,
  } = await sendAuthRequest(
    '/connexion/doubleauth.awp?verbe=get&v=7.14.3',
    {},
    gtk,
    twofaToken,
    xToken,
  );

  const question = decodeBase64(challengeData.data.question);
  const choices = challengeData.data.propositions.map(decodeBase64);

  const answer = async (
    choiceIndexOrText: number | string,
  ): Promise<LoginSuccess> => {
    let index = -1;
    if (typeof choiceIndexOrText === 'number') {
      index = choiceIndexOrText;
    } else {
      // Find case-sensitive match
      index = choices.indexOf(choiceIndexOrText);
      if (index === -1) {
        // Fallback to case-insensitive match
        const lowerChoice = choiceIndexOrText.toLowerCase();
        index = choices.findIndex(
          (c: string) => c.toLowerCase() === lowerChoice,
        );
      }
    }

    if (index === -1 || index >= challengeData.data.propositions.length) {
      throw new EdAuthError(
        `Invalid 2FA choice: "${choiceIndexOrText}". Must be a valid index (0 to ${choices.length - 1}) or one of the valid options: [${choices.join(', ')}].`,
        'INVALID_2FA_CHOICE',
      );
    }

    const selectedChoice = challengeData.data.propositions[index];

    const {
      data: validationData,
      twofaToken: t4,
      xToken: x4,
    } = await sendAuthRequest(
      '/connexion/doubleauth.awp?verbe=post&v=7.14.3',
      { choix: selectedChoice },
      gtk,
      t3,
      x3,
    );

    const { cn, cv } = validationData.data;

    const {
      data: finalResult,
      twofaToken: t5,
      xToken: x5,
    } = await sendAuthRequest(
      '/login.awp?v=7.14.3',
      {
        isReLogin: false,
        identifiant,
        motdepasse,
        sesouvenirdemoi: options.rememberMe ?? false,
        cn,
        cv,
        uuid,
        fa: [],
      },
      gtk,
      t4,
      x4,
    );

    if (x5) setToken(x5);
    if (t5) setTwofaToken(t5);

    const result = await handleLoginSuccess(
      finalResult,
      identifiant,
      uuid,
      options,
    );
    await persistSession();
    startTokenKeepalive();
    return result;
  };

  const on2fa = options.on2faRequired || getConfig().on2faRequired;
  if (on2fa) {
    const choiceIndex = await on2fa(question, choices);
    return answer(choiceIndex);
  }

  return {
    type: 'securityQuestion',
    question,
    choices,
    answer,
  };
}

async function handleLoginSuccess(
  result: any,
  identifiant: string,
  uuid: string,
  options: LoginOptions,
): Promise<LoginSuccess> {
  const transformed = transform(result.data);
  const accounts = transformed.accounts as Account[];
  const mainAccount = accounts.find((a) => a.main) || accounts[0];
  setAccount(mainAccount);

  if (options.rememberMe) {
    const storage = getConfig().storage;
    await storeAccessToken(mainAccount, uuid);
  }

  return {
    user: mainAccount,
    token: result.token || getToken() || '',
    sessionId: mainAccount.uid,
  };
}

async function storeAccessToken(
  account: Account,
  uuid?: string,
): Promise<void> {
  const storage = getConfig().storage;
  if (!storage) return;

  if (account.accessToken) {
    await storage.set(`ed_access_token_${account.id}`, account.accessToken);
    if (uuid) {
      await storage.set(`ed_uuid_${account.id}`, uuid);
    }
  }
}

export async function logout(): Promise<void> {
  stopTokenKeepalive();
  await clearSession();
}

export async function refreshToken(): Promise<string> {
  let account = getAccount();
  if (!account) {
    await loadSession();
    account = getAccount();
    if (!account) {
      throw new EdAuthError('No account found for refresh', 'NO_ACCOUNT');
    }
  }

  const config = getConfig();
  const storage = config.storage;
  const accessToken = await storage?.get(`ed_access_token_${account.id}`);
  const uuid = await storage?.get(`ed_uuid_${account.id}`);

  if (accessToken) {
    try {
      const gtk = await fetchGtkToken();

      const storedTwofaToken = getTwofaToken();
      const storedXToken = getToken();

      const {
        data,
        xToken: newXToken,
        twofaToken: newTwofaToken,
      } = await sendAuthRequest(
        '/login.awp?v=7.14.3',
        {
          identifiant: account.identifiant,
          isReLogin: true,
          motdepasse: '???',
          accesstoken: accessToken,
          typeCompte: account.accountType,
          uuid: uuid || '',
        },
        gtk,
        storedTwofaToken,
        storedXToken,
      );

      if (newXToken) setToken(newXToken);
      if (newTwofaToken) setTwofaToken(newTwofaToken);

      startTokenKeepalive();
      return newXToken || data.token || '';
    } catch (error) {
      config.onError?.(error, async () => {});
    }
  }

  if (config.onCredentialsRequired) {
    const { identifiant, motdepasse } = await config.onCredentialsRequired();
    const loginResult = await login(identifiant, motdepasse, {
      rememberMe: true,
    });

    if ('token' in loginResult) {
      return loginResult.token;
    }
  }

  throw new EdAuthError('Refresh failed', 'REFRESH_FAILED');
}
