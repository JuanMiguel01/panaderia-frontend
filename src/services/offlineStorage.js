// src/services/offlineStorage.js
// Cache del snapshot del servidor en localStorage para trabajar sin conexión.

const SNAPSHOT_KEY  = 'panaderia_snapshot';
const SYNCED_AT_KEY = 'panaderia_synced_at';

export const offlineStorage = {
  saveSnapshot(snapshot) {
    try {
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot));
      if (snapshot.syncedAt) {
        localStorage.setItem(SYNCED_AT_KEY, snapshot.syncedAt);
      }
    } catch (e) {
      console.warn('No se pudo guardar el snapshot:', e);
    }
  },

  getSnapshot() {
    try {
      const raw = localStorage.getItem(SNAPSHOT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getSyncedAt() {
    return localStorage.getItem(SYNCED_AT_KEY) || null;
  },

  updateBatches(batches) {
    const snapshot = this.getSnapshot();
    if (!snapshot) return;
    this.saveSnapshot({ ...snapshot, batches });
  },

  clear() {
    localStorage.removeItem(SNAPSHOT_KEY);
    localStorage.removeItem(SYNCED_AT_KEY);
  },
};
