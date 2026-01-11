import { offlineStorage, syncQueue, metadata, ConflictItem } from './offlineDb';
import { studentApi, groupApi, sessionApi, paymentApi, noteApi } from './api';
import type { Student, Group, Session, Payment } from '../types';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'conflict';

let syncStatus: SyncStatus = 'idle';
let syncListeners: ((status: SyncStatus, pendingCount: number) => void)[] = [];
let conflictListeners: ((conflicts: ConflictItem[]) => void)[] = [];
let pendingConflicts: ConflictItem[] = [];

export const getSyncStatus = () => syncStatus;

export const addSyncListener = (listener: (status: SyncStatus, pendingCount: number) => void) => {
  syncListeners.push(listener);
  return () => {
    syncListeners = syncListeners.filter((l) => l !== listener);
  };
};

const notifyListeners = async () => {
  const count = await syncQueue.count();
  syncListeners.forEach((listener) => listener(syncStatus, count));
};

// Check if online
export const isOnline = () => navigator.onLine;

// Download all data from server to local storage
export const downloadAllData = async (): Promise<void> => {
  if (!isOnline()) return;

  try {
    // Fetch all data from server
    const [studentsRes, groupsRes, sessionsRes, paymentsRes] = await Promise.all([
      studentApi.getAll(),
      groupApi.getAll(),
      sessionApi.getAll(),
      paymentApi.getAll(),
    ]);

    // Save to local storage
    if (studentsRes.success && studentsRes.data) {
      await offlineStorage.clear('students');
      await offlineStorage.saveAll('students', studentsRes.data);
    }

    if (groupsRes.success && groupsRes.data) {
      await offlineStorage.clear('groups');
      await offlineStorage.saveAll('groups', groupsRes.data);
    }

    if (sessionsRes.success && sessionsRes.data) {
      await offlineStorage.clear('sessions');
      await offlineStorage.saveAll('sessions', sessionsRes.data);
    }

    if (paymentsRes.success && paymentsRes.data) {
      await offlineStorage.clear('payments');
      await offlineStorage.saveAll('payments', paymentsRes.data);
    }

    await metadata.set('lastSync', Date.now());
    console.log('Data downloaded successfully');
  } catch (error) {
    console.error('Error downloading data:', error);
    throw error;
  }
};

// Process sync queue - upload pending changes to server
export const processSyncQueue = async (): Promise<void> => {
  if (!isOnline() || syncStatus === 'syncing') return;

  syncStatus = 'syncing';
  await notifyListeners();

  try {
    const pendingItems = await syncQueue.getAll();

    for (const item of pendingItems) {
      if (item.retries >= 3) {
        // Skip items that have failed too many times
        console.warn('Skipping sync item after 3 retries:', item);
        continue;
      }

      try {
        await processQueueItem(item);
        await syncQueue.remove(item.id);
      } catch (error) {
        console.error('Error processing sync item:', error);
        await syncQueue.updateRetries(item.id);
      }
    }

    // After syncing, download fresh data
    await downloadAllData();

    syncStatus = 'idle';
  } catch (error) {
    console.error('Sync error:', error);
    syncStatus = 'error';
  }

  await notifyListeners();
};

const processQueueItem = async (item: {
  type: 'create' | 'update' | 'delete';
  entity: 'students' | 'groups' | 'sessions' | 'payments';
  data: Record<string, unknown>;
}): Promise<void> => {
  const { type, entity, data } = item;

  switch (entity) {
    case 'students':
      if (type === 'create') {
        await studentApi.create(data as Partial<Student>);
      } else if (type === 'update') {
        await studentApi.update(data._id as string, data as Partial<Student>);
      } else if (type === 'delete') {
        await studentApi.delete(data._id as string);
      }
      break;

    case 'groups':
      if (type === 'create') {
        await groupApi.create(data as Partial<Group>);
      } else if (type === 'update') {
        await groupApi.update(data._id as string, data as Partial<Group>);
      } else if (type === 'delete') {
        await groupApi.delete(data._id as string);
      }
      break;

    case 'sessions':
      if (type === 'create') {
        await sessionApi.create(data as Partial<Session>);
      } else if (type === 'update') {
        await sessionApi.update(data._id as string, data as Partial<Session>);
      } else if (type === 'delete') {
        await sessionApi.delete(data._id as string);
      }
      break;

    case 'payments':
      if (type === 'create') {
        await paymentApi.create(data as Partial<Payment>);
      } else if (type === 'update') {
        await paymentApi.update(data._id as string, data as Partial<Payment>);
      } else if (type === 'delete') {
        await paymentApi.delete(data._id as string);
      }
      break;
  }
};

// Initialize sync - setup listeners for online/offline events
export const initSync = async (): Promise<void> => {
  // Initial data download if online
  if (isOnline()) {
    try {
      await downloadAllData();
    } catch (error) {
      console.log('Initial download failed, will use cached data');
    }
  }

  // Listen for online event
  window.addEventListener('online', async () => {
    console.log('Back online, starting sync...');
    await processSyncQueue();
  });

  // Listen for offline event
  window.addEventListener('offline', () => {
    console.log('Gone offline, data will be saved locally');
  });

  // Process any pending sync items
  if (isOnline()) {
    await processSyncQueue();
  }

  await notifyListeners();
};

// Get pending sync count
export const getPendingSyncCount = async (): Promise<number> => {
  return syncQueue.count();
};

// Force sync
export const forceSync = async (): Promise<void> => {
  if (!isOnline()) {
    throw new Error('Cannot sync while offline');
  }
  await processSyncQueue();
};

// Conflict management
export const addConflictListener = (listener: (conflicts: ConflictItem[]) => void) => {
  conflictListeners.push(listener);
  return () => {
    conflictListeners = conflictListeners.filter((l) => l !== listener);
  };
};

export const getConflicts = () => pendingConflicts;

export const clearConflicts = () => {
  pendingConflicts = [];
  conflictListeners.forEach(l => l([]));
};

// Detect conflicts between local and server data
export const detectConflicts = async (): Promise<ConflictItem[]> => {
  if (!isOnline()) return [];

  const conflicts: ConflictItem[] = [];
  const lastSync = await metadata.get('lastSync') as number || 0;

  try {
    // Get local data
    const localStudents = await offlineStorage.getAll<Student>('students');
    const localGroups = await offlineStorage.getAll<Group>('groups');
    const localSessions = await offlineStorage.getAll<Session>('sessions');
    const localPayments = await offlineStorage.getAll<Payment>('payments');

    // Get server data
    const [serverStudents, serverGroups, serverSessions, serverPayments] = await Promise.all([
      studentApi.getAll(),
      groupApi.getAll(),
      sessionApi.getAll(),
      paymentApi.getAll(),
    ]);

    // Check students for conflicts
    if (serverStudents.success && serverStudents.data) {
      for (const serverItem of serverStudents.data) {
        const localItem = localStudents.find(l => l._id === serverItem._id);
        if (localItem) {
          const localUpdated = new Date(localItem.updatedAt || 0).getTime();
          const serverUpdated = new Date(serverItem.updatedAt || 0).getTime();

          // Conflict: both modified after last sync
          if (localUpdated > lastSync && serverUpdated > lastSync && localUpdated !== serverUpdated) {
            // Check if data is actually different
            if (JSON.stringify(localItem) !== JSON.stringify(serverItem)) {
              conflicts.push({
                id: serverItem._id,
                entity: 'students',
                localData: localItem as unknown as Record<string, unknown>,
                serverData: serverItem as unknown as Record<string, unknown>,
                localTimestamp: localUpdated,
                serverTimestamp: serverUpdated,
              });
            }
          }
        }
      }
    }

    // Check groups for conflicts
    if (serverGroups.success && serverGroups.data) {
      for (const serverItem of serverGroups.data) {
        const localItem = localGroups.find(l => l._id === serverItem._id);
        if (localItem) {
          const localUpdated = new Date(localItem.updatedAt || 0).getTime();
          const serverUpdated = new Date(serverItem.updatedAt || 0).getTime();

          if (localUpdated > lastSync && serverUpdated > lastSync && localUpdated !== serverUpdated) {
            if (JSON.stringify(localItem) !== JSON.stringify(serverItem)) {
              conflicts.push({
                id: serverItem._id,
                entity: 'groups',
                localData: localItem as unknown as Record<string, unknown>,
                serverData: serverItem as unknown as Record<string, unknown>,
                localTimestamp: localUpdated,
                serverTimestamp: serverUpdated,
              });
            }
          }
        }
      }
    }

    // Check sessions for conflicts
    if (serverSessions.success && serverSessions.data) {
      for (const serverItem of serverSessions.data) {
        const localItem = localSessions.find(l => l._id === serverItem._id);
        if (localItem) {
          const localUpdated = new Date(localItem.updatedAt || 0).getTime();
          const serverUpdated = new Date(serverItem.updatedAt || 0).getTime();

          if (localUpdated > lastSync && serverUpdated > lastSync && localUpdated !== serverUpdated) {
            if (JSON.stringify(localItem) !== JSON.stringify(serverItem)) {
              conflicts.push({
                id: serverItem._id,
                entity: 'sessions',
                localData: localItem as unknown as Record<string, unknown>,
                serverData: serverItem as unknown as Record<string, unknown>,
                localTimestamp: localUpdated,
                serverTimestamp: serverUpdated,
              });
            }
          }
        }
      }
    }

    // Check payments for conflicts
    if (serverPayments.success && serverPayments.data) {
      for (const serverItem of serverPayments.data) {
        const localItem = localPayments.find(l => l._id === serverItem._id);
        if (localItem) {
          const localUpdated = new Date(localItem.updatedAt || 0).getTime();
          const serverUpdated = new Date(serverItem.updatedAt || 0).getTime();

          if (localUpdated > lastSync && serverUpdated > lastSync && localUpdated !== serverUpdated) {
            if (JSON.stringify(localItem) !== JSON.stringify(serverItem)) {
              conflicts.push({
                id: serverItem._id,
                entity: 'payments',
                localData: localItem as unknown as Record<string, unknown>,
                serverData: serverItem as unknown as Record<string, unknown>,
                localTimestamp: localUpdated,
                serverTimestamp: serverUpdated,
              });
            }
          }
        }
      }
    }

    pendingConflicts = conflicts;
    conflictListeners.forEach(l => l(conflicts));

    if (conflicts.length > 0) {
      syncStatus = 'conflict';
      await notifyListeners();
    }

    return conflicts;
  } catch (error) {
    console.error('Error detecting conflicts:', error);
    return [];
  }
};

// Resolve a conflict by choosing local or server data
export const resolveConflict = async (
  conflictId: string,
  choice: 'local' | 'server'
): Promise<void> => {
  const conflict = pendingConflicts.find(c => c.id === conflictId);
  if (!conflict) return;

  try {
    if (choice === 'local') {
      // Upload local data to server
      switch (conflict.entity) {
        case 'students':
          await studentApi.update(conflict.id, conflict.localData as Partial<Student>);
          break;
        case 'groups':
          await groupApi.update(conflict.id, conflict.localData as Partial<Group>);
          break;
        case 'sessions':
          await sessionApi.update(conflict.id, conflict.localData as Partial<Session>);
          break;
        case 'payments':
          await paymentApi.update(conflict.id, conflict.localData as Partial<Payment>);
          break;
      }
    } else {
      // Update local with server data
      await offlineStorage.save(conflict.entity, conflict.serverData as never);
    }

    // Remove from pending conflicts
    pendingConflicts = pendingConflicts.filter(c => c.id !== conflictId);
    conflictListeners.forEach(l => l(pendingConflicts));

    // Update status if no more conflicts
    if (pendingConflicts.length === 0) {
      syncStatus = 'idle';
      await notifyListeners();
    }
  } catch (error) {
    console.error('Error resolving conflict:', error);
    throw error;
  }
};

// Resolve all conflicts with one choice
export const resolveAllConflicts = async (choice: 'local' | 'server'): Promise<void> => {
  const conflicts = [...pendingConflicts];
  for (const conflict of conflicts) {
    await resolveConflict(conflict.id, choice);
  }
};

// Download progress tracking
type DownloadProgress = {
  total: number;
  current: number;
  entity: string;
};

let downloadProgressListeners: ((progress: DownloadProgress) => void)[] = [];

export const addDownloadProgressListener = (listener: (progress: DownloadProgress) => void) => {
  downloadProgressListeners.push(listener);
  return () => {
    downloadProgressListeners = downloadProgressListeners.filter(l => l !== listener);
  };
};

// Download all data with progress
export const downloadAllDataWithProgress = async (): Promise<{ success: boolean; message: string }> => {
  if (!isOnline()) {
    return { success: false, message: 'Không có kết nối mạng' };
  }

  const notify = (progress: DownloadProgress) => {
    downloadProgressListeners.forEach(l => l(progress));
  };

  try {
    notify({ total: 5, current: 0, entity: 'Đang tải học sinh...' });

    // Fetch students
    const studentsRes = await studentApi.getAll();
    if (studentsRes.success && studentsRes.data) {
      await offlineStorage.clear('students');
      await offlineStorage.saveAll('students', studentsRes.data);
    }
    notify({ total: 5, current: 1, entity: 'Đang tải lớp học...' });

    // Fetch groups
    const groupsRes = await groupApi.getAll();
    if (groupsRes.success && groupsRes.data) {
      await offlineStorage.clear('groups');
      await offlineStorage.saveAll('groups', groupsRes.data);
    }
    notify({ total: 5, current: 2, entity: 'Đang tải buổi học...' });

    // Fetch sessions
    const sessionsRes = await sessionApi.getAll();
    if (sessionsRes.success && sessionsRes.data) {
      await offlineStorage.clear('sessions');
      await offlineStorage.saveAll('sessions', sessionsRes.data);
    }
    notify({ total: 5, current: 3, entity: 'Đang tải thanh toán...' });

    // Fetch payments
    const paymentsRes = await paymentApi.getAll();
    if (paymentsRes.success && paymentsRes.data) {
      await offlineStorage.clear('payments');
      await offlineStorage.saveAll('payments', paymentsRes.data);
    }
    notify({ total: 5, current: 4, entity: 'Đang tải ghi chú...' });

    // Fetch notes
    const notesRes = await noteApi.getAll();
    if (notesRes.success && notesRes.data) {
      await offlineStorage.clear('notes');
      await offlineStorage.saveAll('notes', notesRes.data);
    }
    notify({ total: 5, current: 5, entity: 'Hoàn tất!' });

    await metadata.set('lastSync', Date.now());
    await metadata.set('lastFullDownload', Date.now());

    const counts = {
      students: studentsRes.data?.length || 0,
      groups: groupsRes.data?.length || 0,
      sessions: sessionsRes.data?.length || 0,
      payments: paymentsRes.data?.length || 0,
      notes: notesRes.data?.length || 0,
    };

    return {
      success: true,
      message: `Đã tải: ${counts.students} học sinh, ${counts.groups} lớp, ${counts.sessions} buổi học, ${counts.payments} thanh toán, ${counts.notes} ghi chú`,
    };
  } catch (error) {
    console.error('Error downloading data:', error);
    return { success: false, message: 'Có lỗi khi tải dữ liệu' };
  }
};

// Get last download time
export const getLastDownloadTime = async (): Promise<number | null> => {
  const time = await metadata.get('lastFullDownload') as number;
  return time || null;
};

// Check if has offline data
export const hasOfflineData = async (): Promise<boolean> => {
  const students = await offlineStorage.getAll('students');
  return students.length > 0;
};
