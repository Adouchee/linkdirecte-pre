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
  private hydrationPromises = new Map<StorageAdapter, Promise<void>>();
  private saveMutex = Promise.resolve();
  private activeFlushPromise: Promise<void> | null = null;

  constructor() {
    this.load();
  }

  private get activeStorage(): StorageAdapter | undefined {
    return this.storage || getConfig().storage;
  }

  private async load(): Promise<void> {
    const storage = this.activeStorage;
    if (!storage) return;

    if (!this.hydrationPromises.has(storage)) {
      const hydrationPromise = this.performLoad(storage);
      this.hydrationPromises.set(storage, hydrationPromise);
    }

    await this.hydrationPromises.get(storage);
  }

  private async performLoad(storage: StorageAdapter): Promise<void> {
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

    this.saveMutex = this.saveMutex.then(async () => {
      const snapshot = JSON.stringify(this.queue);
      await storage.set('ed_offline_queue', snapshot);
    });

    await this.saveMutex;
  }

  async push(endpoint: string, options: Record<string, unknown>): Promise<void> {
    await this.load();

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
    await this.load();

    if (this.isFlushing) {
      return this.activeFlushPromise || Promise.resolve();
    }

    if (this.queue.length === 0) return;

    this.isFlushing = true;
    this.activeFlushPromise = this.performFlush();

    try {
      await this.activeFlushPromise;
    } finally {
      this.activeFlushPromise = null;
    }
  }

  private async performFlush(): Promise<void> {
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
