// src/components/Dashboard/UserManagement.jsx
import React, { useState, useEffect } from 'react';

import { api } from '../../services/api';
export function UserManagement({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    role: 'employee',
    permissions: {
      canViewStockCard: false,
      canManageStock: false,
      canViewAllSales: false,
      canDeleteSales: false
    }
  });

  // Roles disponibles
  const roles = [
    { value: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-800' },
    { value: 'manager', label: 'Gerente', color: 'bg-blue-100 text-blue-800' },
    { value: 'employee', label: 'Empleado', color: 'bg-green-100 text-green-800' }
  ];

  // Cargar usuarios
  useEffect(() => {
    loadUsers();
    loadPendingUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.status === 401) {
        onLogout();
        return;
      }
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      
      const data = await response.json();
      setUsers(data);
      setError(null);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingUsers = async () => {
    try {
      const response = await fetch('/api/users/pending', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.status === 401) {
        onLogout();
        return;
      }
      
      if (!response.ok) {
        throw new Error('Error al cargar usuarios pendientes');
      }
      
      const data = await response.json();
      setPendingUsers(data);
    } catch (error) {
      console.error('Error loading pending users:', error);
      setError('Error al cargar usuarios pendientes');
    }
  };

  // Aprobar usuario pendiente
  const approveUser = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.status === 401) {
        onLogout();
        return;
      }
      
      if (!response.ok) {
        throw new Error('Error al aprobar usuario');
      }
      
      await loadUsers();
      await loadPendingUsers();
      setError(null);
    } catch (error) {
      console.error('Error approving user:', error);
      setError('Error al aprobar usuario');
    }
  };

  // Rechazar usuario pendiente
  const rejectUser = async (userId) => {
    try {
      const response = await fetch(`/api/users/${userId}/reject`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.status === 401) {
        onLogout();
        return;
      }
      
      if (!response.ok) {
        throw new Error('Error al rechazar usuario');
      }
      
      await loadPendingUsers();
      setError(null);
    } catch (error) {
      console.error('Error rejecting user:', error);
      setError('Error al rechazar usuario');
    }
  };

  // Eliminar usuario
  const deleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.status === 401) {
        onLogout();
        return;
      }
      
      if (!response.ok) {
        throw new Error('Error al eliminar usuario');
      }
      
      await loadUsers();
      setError(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error al eliminar usuario');
    }
  };

  // Actualizar rol y permisos
  const updateUser = async (userId, updates) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (response.status === 401) {
        onLogout();
        return;
      }
      
      if (!response.ok) {
        throw new Error('Error al actualizar usuario');
      }
      
      await loadUsers();
      setError(null);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Error al actualizar usuario');
    }
  };

  // Crear nuevo usuario
  const createUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });
      
      if (response.status === 401) {
        onLogout();
        return;
      }
      
      if (!response.ok) {
        throw new Error('Error al crear usuario');
      }
      
      setNewUser({
        username: '',
        email: '',
        role: 'employee',
        permissions: {
          canViewStockCard: false,
          canManageStock: false,
          canViewAllSales: false,
          canDeleteSales: false
        }
      });
      setShowAddUserForm(false);
      await loadUsers();
      setError(null);
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Error al crear usuario');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">👥 Gestión de Usuarios</h1>
          <button
            onClick={() => setShowAddUserForm(!showAddUserForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>{showAddUserForm ? '❌' : '➕'}</span>
            <span>{showAddUserForm ? 'Cancelar' : 'Agregar Usuario'}</span>
          </button>
        </div>
      </div>

      {/* Mostrar errores */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Formulario para agregar usuario */}
      {showAddUserForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <span>➕</span>
            <span>Agregar Nuevo Usuario</span>
          </h2>
          <form onSubmit={createUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permisos especiales
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newUser.permissions.canViewStockCard}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      permissions: {...newUser.permissions, canViewStockCard: e.target.checked}
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">📋 Ver tarjeta de estiba</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newUser.permissions.canManageStock}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      permissions: {...newUser.permissions, canManageStock: e.target.checked}
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">📦 Gestionar inventario</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newUser.permissions.canViewAllSales}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      permissions: {...newUser.permissions, canViewAllSales: e.target.checked}
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">💰 Ver todas las ventas</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newUser.permissions.canDeleteSales}
                    onChange={(e) => setNewUser({
                      ...newUser,
                      permissions: {...newUser.permissions, canDeleteSales: e.target.checked}
                    })}
                    className="rounded"
                  />
                  <span className="text-sm">🗑️ Eliminar ventas</span>
                </label>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>✅</span>
                <span>Crear Usuario</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAddUserForm(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors flex items-center space-x-2"
              >
                <span>❌</span>
                <span>Cancelar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Usuarios pendientes */}
      {pendingUsers.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
          <h2 className="text-xl font-semibold text-orange-800 mb-4 flex items-center space-x-2">
            <span>⏳</span>
            <span>Usuarios Pendientes de Aprobación ({pendingUsers.length})</span>
          </h2>
          <div className="space-y-3">
            {pendingUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 font-medium text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.username}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => approveUser(user.id)}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                  >
                    <span>✅</span>
                    <span>Aprobar</span>
                  </button>
                  <button
                    onClick={() => rejectUser(user.id)}
                    className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center space-x-1"
                  >
                    <span>❌</span>
                    <span>Rechazar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de usuarios activos */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <span>👥</span>
            <span>Usuarios Activos ({users.length})</span>
          </h2>
        </div>
        <div className="divide-y">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl">👥</span>
              <p className="text-gray-600 text-xl mt-4">No hay usuarios activos</p>
              <p className="text-gray-500 mt-2">Agrega usuarios para comenzar</p>
            </div>
          ) : (
            users.map(user => (
              <UserRow
                key={user.id}
                user={user}
                roles={roles}
                onUpdate={updateUser}
                onDelete={deleteUser}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Componente para cada fila de usuario
function UserRow({ user, roles, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    role: user.role,
    permissions: user.permissions || {
      canViewStockCard: false,
      canManageStock: false,
      canViewAllSales: false,
      canDeleteSales: false
    }
  });

  const currentRole = roles.find(r => r.value === user.role);

  const handleSave = () => {
    onUpdate(user.id, editData);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      role: user.role,
      permissions: user.permissions || {
        canViewStockCard: false,
        canManageStock: false,
        canViewAllSales: false,
        canDeleteSales: false
      }
    });
    setEditing(false);
  };

  const permissionNames = {
    canViewStockCard: '📋 Tarjeta de estiba',
    canManageStock: '📦 Gestionar inventario',
    canViewAllSales: '💰 Ver todas las ventas',
    canDeleteSales: '🗑️ Eliminar ventas'
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
              <span className="text-gray-600 font-medium">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{user.username}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${currentRole?.color}`}>
              {currentRole?.label}
            </span>
          </div>
          
          {editing ? (
            <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={editData.role}
                  onChange={(e) => setEditData({...editData, role: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permisos especiales
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editData.permissions.canViewStockCard}
                      onChange={(e) => setEditData({
                        ...editData,
                        permissions: {...editData.permissions, canViewStockCard: e.target.checked}
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">📋 Ver tarjeta de estiba</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editData.permissions.canManageStock}
                      onChange={(e) => setEditData({
                        ...editData,
                        permissions: {...editData.permissions, canManageStock: e.target.checked}
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">📦 Gestionar inventario</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editData.permissions.canViewAllSales}
                      onChange={(e) => setEditData({
                        ...editData,
                        permissions: {...editData.permissions, canViewAllSales: e.target.checked}
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">💰 Ver todas las ventas</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={editData.permissions.canDeleteSales}
                      onChange={(e) => setEditData({
                        ...editData,
                        permissions: {...editData.permissions, canDeleteSales: e.target.checked}
                      })}
                      className="rounded"
                    />
                    <span className="text-sm">🗑️ Eliminar ventas</span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Permisos:</span> {
                  Object.entries(user.permissions || {})
                    .filter(([key, value]) => value)
                    .map(([key]) => permissionNames[key])
                    .join(', ') || 'Sin permisos especiales'
                }
              </p>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
              >
                <span>✅</span>
                <span>Guardar</span>
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-400 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-500 transition-colors flex items-center space-x-1"
              >
                <span>❌</span>
                <span>Cancelar</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition-colors flex items-center space-x-1"
              >
                <span>✏️</span>
                <span>Editar</span>
              </button>
              <button
                onClick={() => onDelete(user.id)}
                className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700 transition-colors flex items-center space-x-1"
              >
                <span>🗑️</span>
                <span>Eliminar</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}