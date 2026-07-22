// © 2026 typeof (Scolup) | Licensed under AGPL 3.
import { getConfig } from './store';
import { edFetch } from './fetch';
import { randomUUID } from './env';
import type { StorageAdapter } from '../types';

interface QueuedMutation {
  id: string;
  endpoint: string;
  options: Record<string, unknown>;
  timestamp: number;
}

export class OfflineQueue {
  private queue: QueuedMutation[] = [];
  private storage?: StorageAdapter;

  constructor() {
    this.storage = getConfig().storage;
    this.load();
  }

  private async load(): Promise<void> {
    if (!this.storage) return;

    try {
      const saved = await this.storage.get('ed_offline_queue');
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch {
      this.queue = [];
    }
  }

  private async save(): Promise<void> {
    if (!this.storage) return;
    await this.storage.set('ed_offline_queue', JSON.stringify(this.queue));
  }

  async push(endpoint: string, options: Record<string, unknown>): Promise<void> {
    const mutation: QueuedMutation = {
      id: randomUUID(),
      endpoint,
      options,
      timestamp: Date.now(),
    };
    this.queue.push(mutation);
    await this.save();
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const remainingQueue: QueuedMutation[] = [];

    for (const mutation of this.queue) {
      try {
        await edFetch(mutation.endpoint, {
          ...mutation.options,
          skipQueue: true,
        });
      } catch {
        remainingQueue.push(mutation);
      }
    }

    this.queue = remainingQueue;
    await this.save();
  }

  getQueue(): QueuedMutation[] {
    return this.queue;
  }
}

export const offlineQueue = new OfflineQueue();
// © 2026 typeof (Scolup) | Licensed under AGPL 3.
