// © 2026 typeof (Scolup) | Licensed under AGPL 3.0
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
  private isFlushing = false;

  constructor() {
    this.load();
  }

  private get activeStorage(): StorageAdapter | undefined {
    return this.storage || getConfig().storage;
  }

  private async load(): Promise<void> {
    const storage = this.activeStorage;
    if (!storage) return;

    try {
      const saved = await storage.get('ed_offline_queue');
      if (saved) {
        this.queue = JSON.parse(saved);
      }
    } catch {
      this.queue = [];
    }
  }

  private async save(): Promise<void> {
    const storage = this.activeStorage;
    if (!storage) return;
    await storage.set('ed_offline_queue', JSON.stringify(this.queue));
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
    if (this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;

    try {
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
    } finally {
      this.isFlushing = false;
    }
  }

  getQueue(): QueuedMutation[] {
    return this.queue;
  }
}

export const offlineQueue = new OfflineQueue();
