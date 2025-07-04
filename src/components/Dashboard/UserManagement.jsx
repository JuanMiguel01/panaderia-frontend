// src/components/Dashboard/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export function UserManagement({ onLogout }) {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approvingUser, setApprovingUser] = useState(null);

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const users = await api.getPendingUsers(onLogout);
      setPendingUsers(users);
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      setApprovingUser(userId);
      await api.approveUser(userId, onLogout);
      // Actualizar la lista eliminando el usuario aprobado
      setPendingUsers(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      setError(err.message || 'Error al aprobar usuario');
    } finally {
      setApprovingUser(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mr-3"></div>
          <span className="text-brown-700">Cargando usuarios pendientes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-brown-800">Gestión de Usuarios</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {pendingUsers.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-brown-600 text-lg font-medium">No hay usuarios pendientes de aprobación</p>
          <p className="text-brown-500 text-sm mt-2">Todos los usuarios registrados han sido aprobados</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-brown-600 mb-4">
            <span className="font-semibold">{pendingUsers.length}</span> usuario{pendingUsers.length !== 1 ? 's' : ''} pendiente{pendingUsers.length !== 1 ? 's' : ''} de aprobación
          </p>

          <div className="grid gap-4">
            {pendingUsers.map(user => (
              <div key={user.id} className="bg-white/60 border border-brown-200 rounded-xl p-4 hover:bg-white/80 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-brown-800">{user.email}</p>
                        <p className="text-sm text-brown-600">Rol: {user.role}</p>
                      </div>
                    </div>
                    <p className="text-xs text-brown-500 ml-11">
                      Registrado: {formatDate(user.created_at)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleApproveUser(user.id)}
                    disabled={approvingUser === user.id}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {approvingUser === user.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Aprobando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Aprobar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}