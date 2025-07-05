// src/components/Dashboard/Dashboard.jsx
import React, { useMemo, useState } from 'react';
import { AddBatchForm } from './AddBatchForm';
import { BatchCard } from './BatchCard';
import { Header } from './Header';
import { UserManagement } from './UserManagement';
import { formatDate } from '../../utils/formatters';

export function Dashboard({ 
  user, 
  batches, 
  onLogout, 
  handleCreateBatch,
  handleDeleteBatch, 
  handleCreateSale, 
  handleUpdateSale,
  handleDeleteSale,
  canDeleteSale // ✅ NUEVO: Recibir función de permisos
}) {
  const [activeTab, setActiveTab] = useState('batches');
  
  const batchesGroupedByDay = useMemo(() => {
    return batches.reduce((acc, batch) => {
      const dateKey = new Date(batch.date).toISOString().split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(batch);
      return acc;
    }, {});
  }, [batches]);

  const sortedDates = useMemo(() => 
    Object.keys(batchesGroupedByDay).sort((a, b) => new Date(b) - new Date(a)),
    [batchesGroupedByDay]
  );

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-7xl mx-auto">
        {/* Navegación por pestañas solo para administradores */}
        {isAdmin && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-2 mb-8">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('batches')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'batches'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                    : 'text-brown-700 hover:bg-brown-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>🍞</span>
                  <span>Lotes de Pan</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'text-brown-700 hover:bg-brown-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>👥</span>
                  <span>Usuarios</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Contenido según la pestaña activa */}
        {activeTab === 'batches' ? (
          <>
            <AddBatchForm onCreateBatch={handleCreateBatch} />

            {batches.length === 0 ? (
              <div className="text-center py-20 px-6 bg-white/80 rounded-2xl shadow-md backdrop-blur-sm">
                <span className="text-6xl" role="img" aria-label="pan">🍞</span>
                <p className="text-brown-600 text-2xl mt-4 font-semibold">Aún no hay lotes de pan.</p>
                <p className="text-brown-500 mt-2">¡Añade uno para empezar a registrar tus ventas!</p>
              </div>
            ) : (
              sortedDates.map(dateKey => (
                <section key={dateKey} className="mb-12">
                  <h2 className="text-2xl font-bold text-brown-700 mb-4 pb-2 border-b-2 border-accent-200">
                    {formatDate(dateKey)}
                  </h2>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {batchesGroupedByDay[dateKey].map(batch => (
                      <BatchCard 
                        key={batch.id} 
                        batch={batch} 
                        user={user} // ✅ NUEVO: Pasar usuario
                        onCreateSale={handleCreateSale}
                        onUpdateSale={handleUpdateSale}
                        onDeleteSale={handleDeleteSale}
                        onDeleteBatch={handleDeleteBatch}
                        canDeleteSale={canDeleteSale} // ✅ NUEVO: Pasar función de permisos
                        isAdmin={isAdmin} // ✅ NUEVO: Pasar estado de admin
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </>
        ) : (
          // Pestaña de usuarios (solo para administradores)
          <UserManagement onLogout={onLogout} />
        )}
      </main>
    </div>
  );
}