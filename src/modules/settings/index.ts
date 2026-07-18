// © 2026 typeof (Scolup) | Licensed under AGPL 3.0
import { edFetch } from '../../core/fetch';
import { requireCurrentAccount } from '../../core/request';
import type { AccountSettings } from '../../types';

export async function getSettings(
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<AccountSettings> {
  const account = requireCurrentAccount();
  const endpoint = `/logins/${account.loginId}.awp?v=7.14.3&verbe=get`;
  return edFetch<AccountSettings>(endpoint, {
    method: 'POST',
    body: {},
    ...options,
  });
}

export async function updateSettings(
  data: {
    email?: string;
    portable?: string;
    questionSecrete?: string;
    reponse?: string;
    nouveauMotDePasse?: string;
    identifiant?: string;
  },
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<AccountSettings> {
  const account = requireCurrentAccount();
  const payload: Record<string, string> = {
    identifiant: account.identifiant,
    ...data,
  };
  if (data.nouveauMotDePasse) {
    payload.confirmationMotDePasse = data.nouveauMotDePasse;
  }
  const endpoint = `/logins/${account.loginId}.awp?v=7.14.3&verbe=put`;
  return edFetch<AccountSettings>(endpoint, {
    method: 'POST',
    body: payload,
    ...options,
  });
}

export async function updateAccessibility(
  enabled: boolean,
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<{ success: boolean }> {
  const account = requireCurrentAccount();

  return edFetch<{ success: boolean }>(
    `/parametreIndividuel.awp?v=7.14.3&verbe=put`,
    {
      method: 'POST',
      body: {
        path: `Préférences/Elèves/accessibiliteVisuelle/${account.id}`,
        value: enabled ? '1' : '0',
      },
      ...options,
    },
  );
}
