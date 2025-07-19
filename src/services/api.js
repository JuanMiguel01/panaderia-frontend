// src/services/api.js

const API_URL = 'https://panaderia-backend-uy2k.onrender.com';

/**
 * Función genérica para realizar llamadas fetch a la API.
 * Maneja la autenticación y los errores comunes.
 */
async function _fetch(endpoint, options = {}, onAuthError) {
  options.headers = { 'Content-Type': 'application/json', ...options.headers };
  const currentToken = localStorage.getItem('jwt_token');
  if (currentToken) {
    options.headers['Authorization'] = `Bearer ${currentToken}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, options);
  
  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && onAuthError) {
      onAuthError();
    }
    const data = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(data.message || `Error ${response.status}`);
  }
  return response.status === 204 ? null : response.json();
}

// Exportamos un objeto con todos los métodos de la API.
export const api = {
    login: (email, password) => _fetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email, password) => _fetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
    getBatches: (onAuthError) => _fetch('/api/batches', {}, onAuthError),
    createBatch: (data, onAuthError) => _fetch('/api/batches', { method: 'POST', body: JSON.stringify(data) }, onAuthError),
    deleteBatch: (batchId, onAuthError) => _fetch(`/api/batches/${batchId}`, { method: 'DELETE' }, onAuthError),
    createSale: (batchId, data, onAuthError) => _fetch(`/api/batches/${batchId}/sales`, { method: 'POST', body: JSON.stringify(data) }, onAuthError),
    updateSale: (batchId, saleId, data, onAuthError) => _fetch(`/api/batches/${batchId}/sales/${saleId}`, { method: 'PATCH', body: JSON.stringify(data) }, onAuthError),
    deleteSale: (batchId, saleId, onAuthError) => _fetch(`/api/batches/${batchId}/sales/${saleId}`, { method: 'DELETE' }, onAuthError),
    
    // Nuevos métodos para gestión de usuarios
    getPendingUsers: (onAuthError) => _fetch('/api/users/pending', {}, onAuthError),
    approveUser: (userId, onAuthError) => _fetch(`/api/users/${userId}/approve`, { method: 'PATCH' }, onAuthError),
    
    getActiveUsers: (onAuthError) => _fetch('/api/users/active', {}, onAuthError),
    deleteUser: (userId, onAuthError) => _fetch(`/api/users/${userId}`, { method: 'DELETE' }, onAuthError),
    updateUser: (userId, data, onAuthError) => _fetch(`/api/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }, onAuthError),
    createUser: (data, onAuthError) => _fetch('/api/users', { method: 'POST', body: JSON.stringify(data) }, onAuthError),
};