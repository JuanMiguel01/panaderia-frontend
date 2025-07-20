// src/components/Dashboard/Dashboard.jsx

import React, { useState, useMemo } from 'react';
import { AddBatchForm } from './AddBatchForm';
import { BatchCard } from './BatchCard';
import { UserManagement } from './UserManagement'; // Asumiendo que está aquí
import { StockCard } from './StockCard'; // Importar
import { InventoryManagement } from './InventoryManagement'; // Importar

// Un pequeño componente para las secciones expandibles
function CollapsibleSection({ title, children }) {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <div className="bg-amber-50/50 rounded-xl p-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left text-lg font-bold text-amber-800 flex justify-between items-center"
      >
        {title}
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function Dashboard({
  user,
  batches,
  onLogout,
  handleCreateBatch,
  handleDeleteBatch,
  handleCreateSale,
  handleUpdateSale,
  handleDeleteSale,
  getPermissions,
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const permissions = getPermissions();

  // Estados para los filtros
  const [saleFilters, setSaleFilters] = useState({ paid: 'all', delivered: 'all' });

  // Agrupar lotes por fecha
  const batchesByDate = useMemo(() => {
    return batches.reduce((acc, batch) => {
      const date = new Date(batch.date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(batch);
      return acc;
    }, {});
  }, [batches]);

  // Calcular el dinero pendiente de recoger
  const moneyToCollect = useMemo(() => {
    return batches.reduce((total, batch) => {
      const batchTotal = batch.sales.reduce((sum, sale) => {
        if (!sale.isPaid && !sale.isGift) {
          return sum + sale.quantitySold * batch.price;
        }
        return sum;
      }, 0);
      return total + batchTotal;
    }, 0);
  }, [batches]);

  // Filtrar las ventas dentro de cada lote
  const filteredBatches = useMemo(() => {
    if (saleFilters.paid === 'all' && saleFilters.delivered === 'all') {
      return batchesByDate;
    }
    const filtered = {};
    for (const date in batchesByDate) {
      const dayBatches = batchesByDate[date]
        .map(batch => {
          const filteredSales = batch.sales.filter(sale => {
    const paidMatch =
      saleFilters.paid === 'all' ||
      (saleFilters.paid === 'paid' && sale.isPaid) ||
      (saleFilters.paid === 'not_paid' && !sale.isPaid);

    const deliveredMatch =
      saleFilters.delivered === 'all' ||
      (saleFilters.delivered === 'delivered' && sale.isDelivered) ||
      (saleFilters.delivered === 'not_delivered' && !sale.isDelivered);

    // ✅ NUEVA LÓGICA:
    // Esta condición asegura que si el filtro es 'not_paid',
    // la venta no puede ser un regalo (sale.isGift debe ser falso).
    // En cualquier otro caso ('all' o 'paid'), esta condición no afecta.
    const giftMatch = saleFilters.paid !== 'not_paid' || !sale.isGift;

    return paidMatch && deliveredMatch && giftMatch;
});
          // Solo devolvemos el lote si tiene ventas que coinciden con el filtro
          return { ...batch, sales: filteredSales };
        })
        .filter(batch => batch.sales.length > 0);

      if (dayBatches.length > 0) {
        filtered[date] = dayBatches;
      }
    }
    return filtered;
  }, [batchesByDate, saleFilters]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4 sm:p-8">
      {/* ✅ MEJORA: Contenedor para limitar el ancho y centrar el contenido en pantallas grandes */}
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-amber-900">Panadería Digital</h1>
          <div>
            <span className="mr-4 text-gray-700">Hola, {user.email}!</span>
            <button onClick={onLogout} className="btn btn-secondary">Cerrar Sesión</button>
          </div>
        </header>

        {/* Pestañas de Navegación */}
        <div className="mb-6 border-b-2 border-amber-200">
          <nav className="-mb-0.5 flex space-x-6">
            <button onClick={() => setActiveTab('dashboard')} className={`tab-button ${activeTab === 'dashboard' && 'tab-active'}`}>
              📦 Ventas Diarias
            </button>
            <button onClick={() => setActiveTab('stock')} className={`tab-button ${activeTab === 'stock' && 'tab-active'}`}>
              📊 Tarjeta de Estiba
            </button>
            {permissions.isAdmin && (
              <button onClick={() => setActiveTab('inventory')} className={`tab-button ${activeTab === 'inventory' && 'tab-active'}`}>
                🌾 Inventario Insumos
              </button>
            )}
            {permissions.isAdmin && (
              <button onClick={() => setActiveTab('users')} className={`tab-button ${activeTab === 'users' && 'tab-active'}`}>
                👥 Gestión de Usuarios
              </button>
            )}
          </nav>
        </div>
        
        {/* Contenido de las pestañas */}
        <main>
          {activeTab === 'dashboard' && (
            <>
              {/* Resumen Financiero y Filtros */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/80 p-6 rounded-xl shadow-md">
                  <h3 className="font-bold text-lg text-red-700">💰 Dinero por Recoger</h3>
                  <p className="text-4xl font-extrabold text-red-600">${moneyToCollect.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 mt-1">Suma de todas las ventas no pagadas y no regaladas.</p>
                </div>
                <div className="bg-white/80 p-6 rounded-xl shadow-md">
                  <h3 className="font-bold text-lg text-blue-700">🔍 Filtrar Ventas</h3>
                  <div className="flex space-x-4 mt-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado de Pago</label>
                      <select value={saleFilters.paid} onChange={e => setSaleFilters({...saleFilters, paid: e.target.value})} className="input-field mt-1">
                        <option value="all">Todos</option>
                        <option value="paid">Pagado</option>
                        <option value="not_paid">No Pagado</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado de Entrega</label>
                      <select value={saleFilters.delivered} onChange={e => setSaleFilters({...saleFilters, delivered: e.target.value})} className="input-field mt-1">
                        <option value="all">Todos</option>
                        <option value="delivered">Entregado</option>
                        <option value="not_delivered">No Entregado</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {permissions.canManageStock && <AddBatchForm onCreateBatch={handleCreateBatch} />}

              <div className="space-y-6">
                {Object.keys(filteredBatches).length === 0 ? (
                  <div className="text-center py-12 bg-white/50 rounded-lg">
                    <p className="text-gray-600 text-xl">No hay lotes que coincidan con los filtros actuales.</p>
                  </div>
                ) : (
                  Object.entries(filteredBatches).map(([date, dateBatches]) => (
                    <CollapsibleSection key={date} title={date}>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {dateBatches.map(batch => (
                          <BatchCard
                            key={batch.id}
                            batch={batch}
                            user={user}
                            onCreateSale={handleCreateSale}
                            onUpdateSale={handleUpdateSale}
                            onDeleteSale={handleDeleteSale}
                            onDeleteBatch={handleDeleteBatch}
                            // Pasamos los permisos específicos
                            canManageSales={permissions.canManageSales}
                            canDeleteSales={permissions.canDeleteSales}
                            canDeleteBatches={permissions.canDeleteBatches}
                            isAdmin={permissions.isAdmin} 
                          />
                        ))}
                      </div>
                    </CollapsibleSection>
                  ))
                )}
              </div>
            </>
          )}

          {/* Contenido de la pestaña de Tarjeta de Estiba */}
          {activeTab === 'stock' && (
            <StockCard batches={batches} />
          )}

          {/* Contenido de la pestaña de Inventario de Insumos */}
          {activeTab === 'inventory' && permissions.isAdmin && (
            <InventoryManagement onLogout={onLogout} />
          )}

          {/* Contenido de la pestaña de Gestión de Usuarios */}
          {activeTab === 'users' && permissions.isAdmin && (
            <UserManagement onLogout={onLogout} />
          )}
        </main>
      </div>
    </div>
  );
}