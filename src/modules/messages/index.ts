import { edFetch } from '../../core/fetch';
import { requireCurrentAccount } from '../../core/request';
import {
  assertNonEmptyString,
  assertNonEmptyArray,
  assertPositiveNumber,
} from '../../core/validate';

export interface GetMessagesOptions {
  folderId?: number;
  withContent?: boolean;
  raw?: boolean;
  explain?: boolean;
}

export interface SendMessageData {
  subject: string;
  content: string;
  destinataires: unknown[];
}

export interface MessageEntry {
  id: number;
  subject: string;
  content?: string;
  fromName?: string;
  date: Date;
  isRead: boolean;
  isAnswered?: boolean;
  isTransferred?: boolean;
  canAnswer?: boolean;
  [key: string]: unknown;
}

export interface MessagesResult {
  messages?: {
    received?: MessageEntry[];
    sent?: MessageEntry[];
    drafts?: MessageEntry[];
  };
  [key: string]: unknown;
}

export async function getMessages(
  options: GetMessagesOptions = {},
): Promise<MessagesResult> {
  const account = requireCurrentAccount();
  const endpoint = `/eleves/${account.id}/messages.awp?v=7.14.3&verbe=get`;

  const result = await edFetch<MessagesResult>(endpoint, {
    method: 'POST',
    body: { anneeMessages: '' },
    ...options,
  });

  if (options.withContent && result.messages) {
    result.messages.received = await fetchMessageContents(
      result.messages.received || [],
      options,
    );
  }

  return result;
}

export async function getMessage(
  id: number,
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<MessageEntry> {
  assertPositiveNumber(id, 'message id');
  const account = requireCurrentAccount();
  const endpoint = `/eleves/${account.id}/messages/${id}.awp?v=7.14.3&verbe=get&mode=destinataire`;
  return edFetch<MessageEntry>(endpoint, {
    method: 'POST',
    body: { anneeMessages: '' },
    ...options,
  });
}

export async function sendMessage(
  data: SendMessageData,
  options: { raw?: boolean; explain?: boolean } = {},
): Promise<{ success: boolean }> {
  assertNonEmptyString(data.subject, 'subject');
  assertNonEmptyString(data.content, 'content');
  assertNonEmptyArray(data.destinataires, 'destinataires');

  const account = requireCurrentAccount();

  const endpoint = `/eleves/${account.id}/messages.awp?v=7.14.3&verbe=post`;
  return edFetch<{ success: boolean }>(endpoint, {
    method: 'POST',
    body: {
      message: {
        subject: data.subject,
        content: btoa(unescape(encodeURIComponent(data.content))),
        groupesDestinataires: [
          {
            destinataires: data.destinataires,
            selection: { type: 'P' },
          },
        ],
        from: { role: account.accountType, id: account.id, isRead: true },
      },
      anneeMessages: '',
    },
    ...options,
  });
}

async function fetchMessageContents(
  messages: any[],
  options: { raw?: boolean; explain?: boolean },
): Promise<any[]> {
  return Promise.all(
    messages.map(async (msg) => {
      try {
        const detail = (await getMessage(msg.id, {
          raw: options.raw,
          explain: options.explain,
        })) as any;
        return { ...msg, ...detail };
      } catch {
        return msg;
      }
    }),
  );
}
