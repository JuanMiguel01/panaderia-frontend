// src/components/Dashboard/Dashboard.jsx
import React, { useMemo, useState } from 'react';
import { AddBatchForm } from './AddBatchForm';
import { BatchCard } from './BatchCard';
import { Header } from './Header';
import { UserManagement } from './UserManagement';
import { StockCard } from './StockCard'; // ✅ NUEVO: Importar StockCard
import { formatDate } from '../../utils/formatters';
import { AddSaleForm } from './AddSaleForm'; 

export function Dashboard({ 
  user, 
  batches, 
  onLogout, 
  handleCreateBatch,
  handleDeleteBatch, 
  handleCreateSale, 
  handleUpdateSale,
  handleDeleteSale,
  canDeleteSale
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
  
  // ✅ NUEVO: Verificar si el usuario puede ver la tarjeta de estiba
  const canViewStockCard = user?.role === 'admin' || user?.permissions?.canViewStockCard;

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-7xl mx-auto">
        {/* ✅ MODIFICADO: Navegación por pestañas con nueva opción */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-2 mb-8">
          <div className="flex space-x-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('batches')}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
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
            
            {/* ✅ NUEVO: Pestaña de Tarjeta de Estiba */}
            {canViewStockCard && (
              <button
                onClick={() => setActiveTab('stockcard')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'stockcard'
                    ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-md'
                    : 'text-brown-700 hover:bg-brown-100'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>📊</span>
                  <span>Tarjeta de Estiba</span>
                </div>
              </button>
            )}
            
            {/* Pestaña de usuarios solo para administradores */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
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
            )}
          </div>
        </div>

        {/* ✅ MODIFICADO: Contenido según la pestaña activa */}
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
                        user={user}
                        onCreateSale={handleCreateSale}
                        onUpdateSale={handleUpdateSale}
                        onDeleteSale={handleDeleteSale}
                        onDeleteBatch={handleDeleteBatch}
                        canDeleteSale={canDeleteSale}
                        isAdmin={isAdmin}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </>
        ) : activeTab === 'stockcard' ? (
          // ✅ NUEVO: Pestaña de Tarjeta de Estiba
          <StockCard 
            user={user} 
            batches={batches} 
            onLogout={onLogout} 
          />
        ) : (
          // Pestaña de usuarios (solo para administradores)
          <UserManagement onLogout={onLogout} />
        )}
      </main>
    </div>
  );
}