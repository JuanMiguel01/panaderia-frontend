// src/components/Dashboard/Dashboard.jsx
import React, { useState, useMemo } from 'react';
import { AddBatchForm } from './AddBatchForm';
import { BatchCard } from './BatchCard';
import { UserManagement } from './UserManagement';
import { StockCard } from './StockCard';
import { InventoryManagement } from './InventoryManagement';
import { useToast } from '../Toast';

// ---- Stat card ----
function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 border ${color.bg} ${color.border}`}>
      <div className={`absolute right-3 top-3 text-3xl opacity-20`}>{icon}</div>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${color.label}`}>{label}</p>
      <p className={`text-3xl font-extrabold ${color.value}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${color.sub}`}>{sub}</p>}
    </div>
  );
}

// ---- Collapsible section ----
function DateSection({ date, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-amber-100 overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 transition-colors"
      >
        <span className="font-semibold text-amber-900 capitalize text-sm">{date}</span>
        <svg
          className={`w-4 h-4 text-amber-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
        </svg>
      </button>
      {open && (
        <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// ---- Nav item ----
function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150
        ${active
          ? 'bg-amber-600 text-white shadow-md shadow-amber-200'
          : 'text-gray-600 hover:bg-amber-50 hover:text-amber-800'}
      `}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
      {badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

export function Dashboard({
  user, batches, onLogout,
  handleCreateBatch, handleDeleteBatch,
  handleCreateSale, handleUpdateSale, handleDeleteSale,
  getPermissions,
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [saleFilters, setSaleFilters] = useState({ paid: 'all', delivered: 'all' });
  const permissions = getPermissions();
  const toast = useToast();

  // --- Stats ---
  const stats = useMemo(() => {
    let totalMade = 0, totalSold = 0, totalRevenue = 0, totalPending = 0, totalGifts = 0;
    for (const batch of batches) {
      totalMade += batch.quantityMade;
      for (const sale of batch.sales) {
        totalSold += sale.quantitySold;
        if (sale.isGift) { totalGifts += sale.quantitySold; continue; }
        const amount = sale.quantitySold * (Number(batch.price) || 0);
        totalRevenue += amount;
        if (!sale.isPaid) totalPending += amount;
      }
    }
    return { totalMade, totalSold, totalRevenue, totalPending, totalGifts, remaining: totalMade - totalSold };
  }, [batches]);

  // --- Group by date ---
  const batchesByDate = useMemo(() => {
    return batches.reduce((acc, batch) => {
      const date = new Date(batch.date).toLocaleDateString('es-ES', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
      });
      if (!acc[date]) acc[date] = [];
      acc[date].push(batch);
      return acc;
    }, {});
  }, [batches]);

  // --- Filter batches ---
  const filteredBatches = useMemo(() => {
    const result = {};
    for (const [date, dayBatches] of Object.entries(batchesByDate)) {
      const filtered = dayBatches.map(batch => {
        let sales = batch.sales;
        // Search filter
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          sales = sales.filter(s =>
            s.personName.toLowerCase().includes(q) ||
            batch.breadType.toLowerCase().includes(q)
          );
        }
        // Paid/delivered filter
        sales = sales.filter(sale => {
          const paidOk = saleFilters.paid === 'all' ||
            (saleFilters.paid === 'paid' && sale.isPaid) ||
            (saleFilters.paid === 'not_paid' && !sale.isPaid && !sale.isGift);
          const delOk = saleFilters.delivered === 'all' ||
            (saleFilters.delivered === 'delivered' && sale.isDelivered) ||
            (saleFilters.delivered === 'not_delivered' && !sale.isDelivered);
          return paidOk && delOk;
        });
        return { ...batch, sales };
      }).filter(b => !searchQuery || b.sales.length > 0);

      if (filtered.length > 0) result[date] = filtered;
    }
    return result;
  }, [batchesByDate, searchQuery, saleFilters]);

  const totalDays = Object.keys(batchesByDate).length;

  return (
    <div className="min-h-screen bg-[#faf7f2] font-sans">
      {/* Top header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥖</span>
            <span className="font-extrabold text-amber-900 text-xl" style={{fontFamily:"'Playfair Display',serif"}}>
              Panadería Digital
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-gray-700">{user.email}</span>
              <span className="text-[10px] text-amber-600 font-medium uppercase tracking-wider">{user.role}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/>
              </svg>
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Nav tabs */}
        <nav className="flex flex-wrap gap-2 mb-6">
          <NavItem icon="📦" label="Ventas Diarias" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon="📊" label="Estadísticas" active={activeTab === 'stock'} onClick={() => setActiveTab('stock')} />
          {permissions.isAdmin && (
            <NavItem icon="🌾" label="Inventario" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
          )}
          {permissions.isAdmin && (
            <NavItem icon="👥" label="Usuarios" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
          )}
        </nav>

        {/* Dashboard tab */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <StatCard
                icon="🍞" label="Por Cobrar" value={`$${stats.totalPending.toFixed(2)}`}
                sub={`${batches.reduce((n,b) => n + b.sales.filter(s=>!s.isPaid&&!s.isGift).length, 0)} ventas pendientes`}
                color={{ bg:'bg-red-50', border:'border-red-100', label:'text-red-500', value:'text-red-700', sub:'text-red-400' }}
              />
              <StatCard
                icon="💰" label="Ingresos Totales" value={`$${stats.totalRevenue.toFixed(2)}`}
                sub={`De ${totalDays} días de trabajo`}
                color={{ bg:'bg-emerald-50', border:'border-emerald-100', label:'text-emerald-500', value:'text-emerald-700', sub:'text-emerald-400' }}
              />
              <StatCard
                icon="📦" label="Unidades Vendidas" value={stats.totalSold}
                sub={`${stats.remaining} sin vender`}
                color={{ bg:'bg-blue-50', border:'border-blue-100', label:'text-blue-500', value:'text-blue-700', sub:'text-blue-400' }}
              />
              <StatCard
                icon="🎁" label="Regalados" value={stats.totalGifts}
                sub="Unidades sin cobro"
                color={{ bg:'bg-purple-50', border:'border-purple-100', label:'text-purple-500', value:'text-purple-700', sub:'text-purple-400' }}
              />
            </div>

            {/* Add batch form */}
            {permissions.canManageStock && (
              <AddBatchForm onCreateBatch={handleCreateBatch} />
            )}

            {/* Filter row */}
            <div className="flex flex-wrap gap-3 mb-5 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
                </svg>
                <input
                  type="text"
                  placeholder="Buscar cliente o tipo de pan..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <select
                value={saleFilters.paid}
                onChange={e => setSaleFilters(f => ({...f, paid: e.target.value}))}
                className="py-2 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">Todos los pagos</option>
                <option value="paid">Pagado ✅</option>
                <option value="not_paid">Pendiente 🔴</option>
              </select>
              <select
                value={saleFilters.delivered}
                onChange={e => setSaleFilters(f => ({...f, delivered: e.target.value}))}
                className="py-2 px-3 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="all">Todas las entregas</option>
                <option value="delivered">Entregado 📦</option>
                <option value="not_delivered">Sin entregar ⏳</option>
              </select>
              {(searchQuery || saleFilters.paid !== 'all' || saleFilters.delivered !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setSaleFilters({paid:'all',delivered:'all'}); }}
                  className="text-sm text-amber-600 hover:text-amber-800 underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* Batches */}
            {Object.keys(filteredBatches).length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="text-6xl mb-3">🔍</div>
                <p className="text-gray-500 font-medium">No hay lotes que coincidan</p>
                <p className="text-gray-400 text-sm mt-1">Prueba a cambiar los filtros</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(filteredBatches).map(([date, dayBatches]) => (
                  <DateSection key={date} date={date}>
                    {dayBatches.map(batch => (
                      <BatchCard
                        key={batch.id}
                        batch={batch}
                        user={user}
                        onCreateSale={handleCreateSale}
                        onUpdateSale={handleUpdateSale}
                        onDeleteSale={handleDeleteSale}
                        onDeleteBatch={handleDeleteBatch}
                        canManageSales={permissions.canManageSales}
                        canDeleteSales={permissions.canDeleteSales}
                        canDeleteBatches={permissions.canDeleteBatches}
                        isAdmin={permissions.isAdmin}
                        onLogout={onLogout}
                      />
                    ))}
                  </DateSection>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'stock' && <StockCard batches={batches} />}
        {activeTab === 'inventory' && permissions.isAdmin && <InventoryManagement onLogout={onLogout} />}
        {activeTab === 'users' && permissions.isAdmin && <UserManagement onLogout={onLogout} />}
      </div>
    </div>
  );
}