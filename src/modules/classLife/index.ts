import { edFetch } from '../../core/fetch';
import { requireCurrentAccount } from '../../core/request';
import { EdApiError } from '../../core/errors';

export interface ClassLifeResult {
  [key: string]: unknown;
}

export async function getClassLife(
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<ClassLifeResult> {
  const account = requireCurrentAccount();
  const classId = account.profile?.classe?.id;
  if (!classId) {
    throw new EdApiError(
      'Active account does not have a class assigned.',
      'NO_CLASS_ASSIGNED',
    );
  }

  const endpoint = `/Classes/${classId}/viedelaclasse.awp?v=7.14.3&verbe=get`;
  return edFetch<ClassLifeResult>(endpoint, {
    method: 'POST',
    body: {},
    ...options,
  });
}
