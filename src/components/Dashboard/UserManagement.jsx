// src/components/Dashboard/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api'; // ✅ AÑADIDO: Importar el servicio de API centralizado

export function UserManagement({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  
  // ✅ MODIFICADO: Ajustado el estado para el nuevo usuario para que coincida con el backend
  const [newUser, setNewUser] = useState({
    email: '',
    password: '', // El backend requiere una contraseña para crear usuarios
    role: 'employee',
    permissions: {
      canViewStockCard: false,
      canManageStock: false,
      canViewAllSales: false,
      canDeleteSales: false
    }
  });

  const roles = [
    { value: 'admin', label: 'Administrador', color: 'bg-red-100 text-red-800' },
    { value: 'manager', label: 'Gerente', color: 'bg-blue-100 text-blue-800' },
    { value: 'employee', label: 'Empleado', color: 'bg-green-100 text-green-800' }
  ];

  // ✅ MODIFICADO: Cargar datos usando useCallback para optimización
  const loadUsers = useCallback(async () => {
    try {
      // Usa el método correcto de la API que apunta a /api/users/active
      const data = await api.getActiveUsers(onLogout);
      setUsers(data);
      setError(null);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Error al cargar usuarios activos');
    }
  }, [onLogout]);

  const loadPendingUsers = useCallback(async () => {
    try {
      // Usa el método de la API para los usuarios pendientes
      const data = await api.getPendingUsers(onLogout);
      setPendingUsers(data);
    } catch (error) {
      console.error('Error loading pending users:', error);
      setError('Error al cargar usuarios pendientes');
    }
  }, [onLogout]);

  useEffect(() => {
    const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([loadUsers(), loadPendingUsers()]);
        setLoading(false);
    }
    fetchAllData();
  }, [loadUsers, loadPendingUsers]);

  // ✅ MODIFICADO: Todas las funciones usan ahora el servicio `api.js`
  const approveUser = async (userId) => {
    try {
      // El método de la API ya sabe qué endpoint y método (PATCH) usar
      await api.approveUser(userId, onLogout);
      await loadUsers();
      await loadPendingUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      setError('Error al aprobar usuario');
    }
  };
  
  const rejectUser = async (userId) => {
    try {
      // El backend no tiene un endpoint "reject", se usa "delete" para eliminarlo
      await api.deleteUser(userId, onLogout);
      await loadPendingUsers(); // Solo recargar la lista de pendientes
    } catch (error) {
      console.error('Error rejecting user:', error);
      setError('Error al rechazar usuario');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
    try {
      await api.deleteUser(userId, onLogout);
      await loadUsers(); // Solo recargar la lista de activos
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Error al eliminar usuario');
    }
  };
  
  const updateUser = async (userId, updates) => {
    try {
      await api.updateUser(userId, updates, onLogout);
      await loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Error al actualizar usuario');
    }
  };
  
  const createUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(newUser, onLogout);
      setNewUser({
        email: '',
        password: '',
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
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error.message || 'Error al crear usuario');
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

      {showAddUserForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <span>➕</span>
            <span>Agregar Nuevo Usuario</span>
          </h2>
          <form onSubmit={createUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ✅ MODIFICADO: Se pide email y contraseña, no username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permisos especiales</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newUser.permissions.canViewStockCard}
                    onChange={(e) => setNewUser({...newUser, permissions: {...newUser.permissions, canViewStockCard: e.target.checked}})}
                    className="rounded"
                  />
                  <span className="text-sm">📋 Ver tarjeta de estiba</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newUser.permissions.canManageStock}
                    onChange={(e) => setNewUser({...newUser, permissions: {...newUser.permissions, canManageStock: e.target.checked}})}
                    className="rounded"
                  />
                  <span className="text-sm">📦 Gestionar inventario</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newUser.permissions.canViewAllSales}
                    onChange={(e) => setNewUser({...newUser, permissions: {...newUser.permissions, canViewAllSales: e.target.checked}})}
                    className="rounded"
                  />
                  <span className="text-sm">💰 Ver todas las ventas</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newUser.permissions.canDeleteSales}
                    onChange={(e) => setNewUser({...newUser, permissions: {...newUser.permissions, canDeleteSales: e.target.checked}})}
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
                    {/* ✅ MODIFICADO: Mostrar inicial del email, ya que no hay username */}
                    <span className="text-gray-600 font-medium text-sm">{user.email.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    {/* El backend no devuelve 'username', usamos 'email' que sí está disponible */}
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => approveUser(user.id)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700">Aprobar</button>
                  <button onClick={() => rejectUser(user.id)} className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700">Rechazar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <span>👥</span>
            <span>Usuarios Activos ({users.length})</span>
          </h2>
        </div>
        <div className="divide-y">
          {users.length > 0 ? (
            users.map(user => (
              <UserRow key={user.id} user={user} roles={roles} onUpdate={updateUser} onDelete={deleteUser} />
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No hay usuarios activos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
    setEditing(false);
  }

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
              {/* ✅ MODIFICADO: Usar email en lugar de username */}
              <span className="text-gray-600 font-medium">{user.email.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              {/* ✅ MODIFICADO: Mostrar email */}
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${currentRole?.color}`}>
              {currentRole?.label}
            </span>
          </div>
          {/* El resto de la lógica de UserRow se mantiene igual */}
          {editing ? (
            <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={editData.role}
                  onChange={(e) => setEditData({...editData, role: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  {roles.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permisos especiales</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Object.keys(permissionNames).map(key => (
                         <label key={key} className="flex items-center space-x-2">
                         <input
                           type="checkbox"
                           checked={!!editData.permissions[key]}
                           onChange={(e) => setEditData({
                             ...editData,
                             permissions: {...editData.permissions, [key]: e.target.checked}
                           })}
                           className="rounded"
                         />
                         <span className="text-sm">{permissionNames[key]}</span>
                       </label>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Permisos:</span> {
                  Object.entries(user.permissions || {})
                    .filter(([, value]) => value)
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
              <button onClick={handleSave} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm">Guardar</button>
              <button onClick={handleCancel} className="bg-gray-400 text-white px-3 py-1 rounded-lg text-sm">Cancelar</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm">Editar</button>
              <button onClick={() => onDelete(user.id)} className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm">Eliminar</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}