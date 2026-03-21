// src/services/api.js

const API_URL = 'https://panaderia-backend-uy2k.onrender.com';

async function _fetch(endpoint, options = {}, onAuthError) {
  options.headers = { 'Content-Type': 'application/json', ...options.headers };
  const currentToken = localStorage.getItem('jwt_token');
  if (currentToken) options.headers['Authorization'] = `Bearer ${currentToken}`;

  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && onAuthError) onAuthError();
    const data = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(data.message || `Error ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

export const api = {
  // Auth
  login:    (email, password) => _fetch('/api/auth/login',    { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email, password) => _fetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),

  // Batches & Sales
  getBatches:      (onAuthError)                    => _fetch('/api/batches', {}, onAuthError),
  createBatch:     (data, onAuthError)              => _fetch('/api/batches', { method: 'POST', body: JSON.stringify(data) }, onAuthError),
  deleteBatch:     (batchId, onAuthError)           => _fetch(`/api/batches/${batchId}`, { method: 'DELETE' }, onAuthError),
  updateBatchDate: (batchId, date, onAuthError)     => _fetch(`/api/batches/${batchId}/date`, { method: 'PATCH', body: JSON.stringify({ date }) }, onAuthError),
  createSale:      (batchId, data, onAuthError)     => _fetch(`/api/batches/${batchId}/sales`, { method: 'POST', body: JSON.stringify(data) }, onAuthError),
  updateSale:      (batchId, saleId, data, onAuthError) => _fetch(`/api/batches/${batchId}/sales/${saleId}`, { method: 'PATCH', body: JSON.stringify(data) }, onAuthError),
  deleteSale:      (batchId, saleId, onAuthError)   => _fetch(`/api/batches/${batchId}/sales/${saleId}`, { method: 'DELETE' }, onAuthError),

  // Users
  getPendingUsers: (onAuthError)            => _fetch('/api/users/pending', {}, onAuthError),
  approveUser:     (userId, onAuthError)    => _fetch(`/api/users/${userId}/approve`, { method: 'PATCH' }, onAuthError),
  getActiveUsers:  (onAuthError)            => _fetch('/api/users/active', {}, onAuthError),
  deleteUser:      (userId, onAuthError)    => _fetch(`/api/users/${userId}`, { method: 'DELETE' }, onAuthError),
  updateUser:      (userId, data, onAuthError) => _fetch(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }, onAuthError),
  createUser:      (data, onAuthError)      => _fetch('/api/users', { method: 'POST', body: JSON.stringify(data) }, onAuthError),

  // Inventory
  getInventory:        (onAuthError)              => _fetch('/api/inventory', {}, onAuthError),
  createInventoryItem: (data, onAuthError)        => _fetch('/api/inventory', { method: 'POST', body: JSON.stringify(data) }, onAuthError),
  updateInventoryItem: (itemId, change, onAuthError) => _fetch(`/api/inventory/${itemId}`, { method: 'PATCH', body: JSON.stringify({ change }) }, onAuthError),
  deleteInventoryItem: (itemId, onAuthError)      => _fetch(`/api/inventory/${itemId}`, { method: 'DELETE' }, onAuthError),
  getInventoryLogs:    (itemId, onAuthError)      => _fetch(`/api/inventory/${itemId}/logs`, {}, onAuthError),

  // Bread Presets
  getPresets:    (onAuthError)            => _fetch('/api/presets', {}, onAuthError),
  createPreset:  (data, onAuthError)      => _fetch('/api/presets', { method: 'POST', body: JSON.stringify(data) }, onAuthError),
  updatePreset:  (id, data, onAuthError)  => _fetch(`/api/presets/${id}`, { method: 'PUT', body: JSON.stringify(data) }, onAuthError),
  deletePreset:  (id, onAuthError)        => _fetch(`/api/presets/${id}`, { method: 'DELETE' }, onAuthError),
};