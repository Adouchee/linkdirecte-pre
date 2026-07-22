// © 2026 typeof (Scolup) | Licensed under AGPL 3.
import { emitter } from './emitter';
import { getGrades } from '../grades';
import { getMessages } from '../messages';
import { getHomework } from '../homework';
import { getTimeline } from '../timeline';
import { safeSetInterval, safeClearInterval } from '../../core/env';

const DEFAULT_POLL_INTERVAL_MS = 60_000;

let pollingInterval: ReturnType<typeof setInterval> | undefined | null = null;
const snapshots: Record<string, unknown[]> = {};

export interface PollingConfig {
  interval?: number;
}

export function startPolling(config: PollingConfig = {}): void {
  if (pollingInterval) stopPolling();

  const interval = config.interval || DEFAULT_POLL_INTERVAL_MS;
  pollingInterval = safeSetInterval(poll, interval);
  poll();
}

export function stopPolling(): void {
  safeClearInterval(pollingInterval ?? undefined);
  pollingInterval = null;
}

export const on = emitter.on.bind(emitter);
export const off = emitter.off.bind(emitter);

async function poll(): Promise<void> {
  try {
    const [grades, messages, homework, timeline] = await Promise.all([
      getGrades(),
      getMessages(),
      getHomework(),
      getTimeline(),
    ]);

    checkDiff('newGrade', (grades as any).grades, 'id');
    checkDiff('newMessage', (messages as any).messages?.received, 'id');
    checkDiff('newTimelineEntry', timeline as any[], 'id');
  } catch (error) {
    emitter.emit('pollingError', error);
  }
}

function checkDiff(event: string, current: unknown[] | undefined, idKey: string): void {
  if (!current) return;

  const previous = snapshots[event] || [];
  const previousIds = new Set(previous.map((item: any) => item[idKey]));

  for (const item of current) {
    if (!previousIds.has((item as any)[idKey])) {
      emitter.emit(event, item);
    }
  }

  snapshots[event] = current;
}
// © 2026 typeof (Scolup) | Licensed under AGPL 3.
