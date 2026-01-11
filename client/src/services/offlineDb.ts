import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Student, Group, Session, Payment, Note } from '../types';

interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'students' | 'groups' | 'sessions' | 'payments';
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
}

// Conflict item for resolution
export interface ConflictItem {
  id: string;
  entity: 'students' | 'groups' | 'sessions' | 'payments';
  localData: Record<string, unknown>;
  serverData: Record<string, unknown>;
  localTimestamp: number;
  serverTimestamp: number;
}

interface OfflineDBSchema extends DBSchema {
  students: {
    key: string;
    value: Student;
    indexes: { 'by-name': string };
  };
  groups: {
    key: string;
    value: Group;
    indexes: { 'by-name': string };
  };
  sessions: {
    key: string;
    value: Session;
    indexes: { 'by-date': string };
  };
  payments: {
    key: string;
    value: Payment;
    indexes: { 'by-date': string };
  };
  notes: {
    key: string;
    value: Note;
    indexes: { 'by-date': string };
  };
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { 'by-timestamp': number };
  };
  metadata: {
    key: string;
    value: { key: string; value: unknown; updatedAt: number };
  };
}

const DB_NAME = 'qlhp-offline-db';
const DB_VERSION = 2; // Upgraded to add notes store

let dbInstance: IDBPDatabase<OfflineDBSchema> | null = null;

export const initOfflineDb = async (): Promise<IDBPDatabase<OfflineDBSchema>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Students store
      if (!db.objectStoreNames.contains('students')) {
        const studentStore = db.createObjectStore('students', { keyPath: '_id' });
        studentStore.createIndex('by-name', 'name');
      }

      // Groups store
      if (!db.objectStoreNames.contains('groups')) {
        const groupStore = db.createObjectStore('groups', { keyPath: '_id' });
        groupStore.createIndex('by-name', 'name');
      }

      // Sessions store
      if (!db.objectStoreNames.contains('sessions')) {
        const sessionStore = db.createObjectStore('sessions', { keyPath: '_id' });
        sessionStore.createIndex('by-date', 'date');
      }

      // Payments store
      if (!db.objectStoreNames.contains('payments')) {
        const paymentStore = db.createObjectStore('payments', { keyPath: '_id' });
        paymentStore.createIndex('by-date', 'paymentDate');
      }

      // Notes store
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: '_id' });
        noteStore.createIndex('by-date', 'date');
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        syncStore.createIndex('by-timestamp', 'timestamp');
      }

      // Metadata store (for last sync time, etc.)
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
};

export const getDb = async () => {
  if (!dbInstance) {
    await initOfflineDb();
  }
  return dbInstance!;
};

type StoreName = 'students' | 'groups' | 'sessions' | 'payments' | 'notes';

// Generic CRUD operations for offline storage
export const offlineStorage = {
  // Get all items from a store
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await getDb();
    return db.getAll(storeName) as Promise<T[]>;
  },

  // Get single item by ID
  async getById<T>(storeName: StoreName, id: string): Promise<T | undefined> {
    const db = await getDb();
    return db.get(storeName, id) as Promise<T | undefined>;
  },

  // Save item (create or update)
  async save<T extends { _id: string }>(
    storeName: StoreName,
    item: T
  ): Promise<void> {
    const db = await getDb();
    await db.put(storeName, item as never);
  },

  // Save multiple items
  async saveAll<T extends { _id: string }>(
    storeName: StoreName,
    items: T[]
  ): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(storeName, 'readwrite');
    await Promise.all([
      ...items.map((item) => tx.store.put(item as never)),
      tx.done,
    ]);
  },

  // Delete item
  async delete(storeName: StoreName, id: string): Promise<void> {
    const db = await getDb();
    await db.delete(storeName, id);
  },

  // Clear all items in a store
  async clear(storeName: StoreName): Promise<void> {
    const db = await getDb();
    await db.clear(storeName);
  },
};

// Sync queue operations
export const syncQueue = {
  async add(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const db = await getDb();
    const id = `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queueItem: SyncQueueItem = {
      ...item,
      id,
      timestamp: Date.now(),
      retries: 0,
    };
    await db.put('syncQueue', queueItem);
    return id;
  },

  async getAll(): Promise<SyncQueueItem[]> {
    const db = await getDb();
    return db.getAllFromIndex('syncQueue', 'by-timestamp');
  },

  async remove(id: string): Promise<void> {
    const db = await getDb();
    await db.delete('syncQueue', id);
  },

  async updateRetries(id: string): Promise<void> {
    const db = await getDb();
    const item = await db.get('syncQueue', id);
    if (item) {
      item.retries += 1;
      await db.put('syncQueue', item);
    }
  },

  async clear(): Promise<void> {
    const db = await getDb();
    await db.clear('syncQueue');
  },

  async count(): Promise<number> {
    const db = await getDb();
    return db.count('syncQueue');
  },
};

// Metadata operations
export const metadata = {
  async get(key: string): Promise<unknown> {
    const db = await getDb();
    const item = await db.get('metadata', key);
    return item?.value;
  },

  async set(key: string, value: unknown): Promise<void> {
    const db = await getDb();
    await db.put('metadata', { key, value, updatedAt: Date.now() });
  },
};

// Backup/Restore operations
export interface BackupData {
  version: number;
  timestamp: string;
  students: Student[];
  groups: Group[];
  sessions: Session[];
  payments: Payment[];
}

export const backupRestore = {
  // Export all data from IndexedDB as backup
  async exportBackup(): Promise<BackupData> {
    const db = await getDb();

    const students = await db.getAll('students');
    const groups = await db.getAll('groups');
    const sessions = await db.getAll('sessions');
    const payments = await db.getAll('payments');

    return {
      version: DB_VERSION,
      timestamp: new Date().toISOString(),
      students,
      groups,
      sessions,
      payments,
    };
  },

  // Import backup data to IndexedDB
  async importBackup(data: BackupData): Promise<{ success: boolean; message: string }> {
    try {
      const db = await getDb();

      // Clear existing data
      await db.clear('students');
      await db.clear('groups');
      await db.clear('sessions');
      await db.clear('payments');

      // Import students
      if (data.students && data.students.length > 0) {
        const tx1 = db.transaction('students', 'readwrite');
        await Promise.all([
          ...data.students.map((item) => tx1.store.put(item)),
          tx1.done,
        ]);
      }

      // Import groups
      if (data.groups && data.groups.length > 0) {
        const tx2 = db.transaction('groups', 'readwrite');
        await Promise.all([
          ...data.groups.map((item) => tx2.store.put(item)),
          tx2.done,
        ]);
      }

      // Import sessions
      if (data.sessions && data.sessions.length > 0) {
        const tx3 = db.transaction('sessions', 'readwrite');
        await Promise.all([
          ...data.sessions.map((item) => tx3.store.put(item)),
          tx3.done,
        ]);
      }

      // Import payments
      if (data.payments && data.payments.length > 0) {
        const tx4 = db.transaction('payments', 'readwrite');
        await Promise.all([
          ...data.payments.map((item) => tx4.store.put(item)),
          tx4.done,
        ]);
      }

      return {
        success: true,
        message: `Đã khôi phục: ${data.students?.length || 0} học sinh, ${data.groups?.length || 0} lớp, ${data.sessions?.length || 0} buổi học, ${data.payments?.length || 0} thanh toán`
      };
    } catch (error) {
      console.error('Import backup error:', error);
      return { success: false, message: 'Có lỗi khi khôi phục dữ liệu' };
    }
  },

  // Download backup as JSON file
  downloadBackupFile(data: BackupData, filename?: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `backup-qlhp-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Read backup from uploaded file
  async readBackupFile(file: File): Promise<BackupData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (!data.version || !data.timestamp) {
            reject(new Error('File backup không hợp lệ'));
            return;
          }
          resolve(data as BackupData);
        } catch {
          reject(new Error('Không thể đọc file backup'));
        }
      };
      reader.onerror = () => reject(new Error('Lỗi đọc file'));
      reader.readAsText(file);
    });
  },
};
