// src/services/offlineQueue.js
// Persiste operaciones pendientes en localStorage para sincronizar cuando haya internet.

const QUEUE_KEY = 'panaderia_offline_queue';

export const offlineQueue = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  add(operation) {
    const queue = this.get();
    queue.push(operation);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  remove(clientId) {
    const queue = this.get().filter(op => op.id !== clientId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  clear() {
    localStorage.removeItem(QUEUE_KEY);
  },

  size() {
    return this.get().length;
  },
};
