// src/components/Dashboard/Dashboard.jsx
import React, { useState, useMemo } from 'react';
import { AddBatchForm } from './AddBatchForm';
import { BatchCard } from './BatchCard';
import { UserManagement } from './UserManagement';
import { StockCard } from './StockCard';
import { InventoryManagement } from './InventoryManagement';
import { StatCard, EmptyState, Badge } from '../UI/index';
import { DashboardSkeleton } from '../UI/SkeletonLoader';

const TABS = [
  { id: 'dashboard', label: 'Ventas',   icon: '📦' },
  { id: 'stock',     label: 'Estiba',   icon: '📊' },
  { id: 'inventory', label: 'Insumos',  icon: '🌾', adminOnly: true },
  { id: 'users',     label: 'Usuarios', icon: '👥', adminOnly: true },
];

export function Dashboard({
  user,
  batches,
  isLoadingBatches,
  onLogout,
  handleCreateBatch,
  handleDeleteBatch,
  handleCreateSale,
  handleUpdateSale,
  handleDeleteSale,
  getPermissions,
}) {
  const [activeTab, setActiveTab]   = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [saleFilters, setSaleFilters] = useState({ paid: 'all', delivered: 'all' });
  const permissions = getPermissions();

  // ─── Estadísticas globales ──────────────────────────────
  const stats = useMemo(() => {
    const totalMade     = batches.reduce((s, b) => s + b.quantityMade, 0);
    const totalSold     = batches.reduce((s, b) => s + b.sales.reduce((ss, sale) => ss + sale.quantitySold, 0), 0);
    const totalRevenue  = batches.reduce((s, b) => s + b.sales.reduce((ss, sale) =>
      sale.isGift ? ss : ss + sale.quantitySold * (Number(b.price) || 0), 0), 0);
    const pendingAmount = batches.reduce((s, b) => s + b.sales.reduce((ss, sale) =>
      (!sale.isPaid && !sale.isGift) ? ss + sale.quantitySold * (Number(b.price) || 0) : ss, 0), 0);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayBatches = batches.filter(b => {
      const d = new Date(b.date).toISOString().split('T')[0];
      return d === todayStr;
    });

    return { totalMade, totalSold, totalRevenue, pendingAmount, todayBatches: todayBatches.length };
  }, [batches]);

  // ─── Filtrado + agrupado por fecha ──────────────────────
  const filteredAndGrouped = useMemo(() => {
    const hasPaidFilter      = saleFilters.paid !== 'all';
    const hasDeliveredFilter = saleFilters.delivered !== 'all';
    const hasSearch          = searchQuery.trim().length > 0;
    const hasAnyFilter       = hasPaidFilter || hasDeliveredFilter || hasSearch;

    // 1. Ordenar batches de más reciente a más antiguo
    const sorted = [...batches].sort((a, b) => {
      const dateCompare = new Date(b.date) - new Date(a.date);
      if (dateCompare !== 0) return dateCompare;
      return b.id - a.id; // Mismo día: el creado después va primero
    });

    // 2. Aplicar filtros por ventas
    const filtered = sorted.map(batch => {
      const q = searchQuery.trim().toLowerCase();

      // Filtrar ventas dentro del lote
      const filteredSales = batch.sales.filter(sale => {
        // Filtro de búsqueda: nombre de cliente o tipo de pan
        if (hasSearch) {
          const matchesName = sale.personName.toLowerCase().includes(q);
          const matchesBread = batch.breadType.toLowerCase().includes(q);
          if (!matchesName && !matchesBread) return false;
        }

        // Filtro pagado
        if (saleFilters.paid === 'paid' && !sale.isPaid) return false;
        if (saleFilters.paid === 'not_paid' && (sale.isPaid || sale.isGift)) return false;

        // Filtro entregado
        if (saleFilters.delivered === 'delivered' && !sale.isDelivered) return false;
        if (saleFilters.delivered === 'not_delivered' && sale.isDelivered) return false;

        return true;
      });

      // Si hay filtros de ventas y el lote no tiene ventas que coincidan → excluir lote
      // EXCEPCIÓN: si la búsqueda coincide con el tipo de pan, mantener el lote (con sus ventas)
      if (hasAnyFilter && filteredSales.length === 0) {
        // Solo incluir el lote vacío si la búsqueda coincide con el tipo de pan
        // y NO hay filtros de pago/entrega activos
        const breadMatchesSearch = hasSearch && batch.breadType.toLowerCase().includes(searchQuery.trim().toLowerCase());
        if (!breadMatchesSearch || hasPaidFilter || hasDeliveredFilter) {
          return null; // excluir
        }
      }

      return { ...batch, sales: hasAnyFilter ? filteredSales : batch.sales };
    }).filter(Boolean); // quitar nulos

    // 3. Agrupar por fecha (formato legible)
    const grouped = {};
    for (const batch of filtered) {
      // Usamos la fecha en UTC para evitar desfases de zona horaria
      const rawDate  = new Date(batch.date);
      const utcDate  = new Date(rawDate.getTime() + rawDate.getTimezoneOffset() * 60000);
      const dateKey  = utcDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year:    'numeric',
        month:   'long',
        day:     'numeric',
      });

      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(batch);
    }

    return grouped;
  }, [batches, searchQuery, saleFilters]);

  const hasFilters = saleFilters.paid !== 'all' || saleFilters.delivered !== 'all' || searchQuery.trim();
  const visibleTabs = TABS.filter(t => !t.adminOnly || permissions.isAdmin);
  const totalCards  = Object.values(filteredAndGrouped).reduce((s, arr) => s + arr.length, 0);

  const clearFilters = () => {
    setSearchQuery('');
    setSaleFilters({ paid: 'all', delivered: 'all' });
  };

  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center text-base">🍞</div>
              <span className="font-display font-semibold text-gray-900 hidden sm:block">Panadería Digital</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl">
                <div className="w-6 h-6 rounded-full bg-amber-200 flex items-center justify-center text-xs font-bold text-amber-800">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-gray-700 max-w-32 truncate">{user.email}</span>
                <Badge color={user.role === 'admin' ? 'amber' : user.role === 'manager' ? 'blue' : 'gray'}>
                  {user.role}
                </Badge>
              </div>
              <button onClick={onLogout} className="btn btn-secondary btn-sm">Salir</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-1 overflow-x-auto scrollbar-hide">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-button flex items-center gap-1.5 ${activeTab === tab.id ? 'tab-active' : ''}`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* ─── Dashboard Tab ──────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeInUp">

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard icon="🍞" label="Lotes hoy"      value={stats.todayBatches}                        color="amber" />
              <StatCard icon="📈" label="Total vendido"  value={stats.totalSold}
                subtitle={`de ${stats.totalMade} producidos`}                                               color="green" />
              <StatCard icon="💰" label="Ingresos"       value={`$${stats.totalRevenue.toFixed(2)}`}       color="blue" />
              <StatCard icon="⏳" label="Por cobrar"     value={`$${stats.pendingAmount.toFixed(2)}`}
                color={stats.pendingAmount > 0 ? 'red' : 'green'} />
            </div>

            {/* Barra de filtros */}
            <div className="card card-body py-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Búsqueda */}
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                  <input
                    type="text"
                    placeholder="Buscar cliente o tipo de pan..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="input-field pl-9 pr-8"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                    >✕</button>
                  )}
                </div>

                {/* Filtro pago */}
                <select
                  value={saleFilters.paid}
                  onChange={e => setSaleFilters(f => ({ ...f, paid: e.target.value }))}
                  className={`input-field text-sm ${saleFilters.paid !== 'all' ? 'border-amber-400 ring-1 ring-amber-300' : ''}`}
                  style={{ minWidth: '155px' }}
                >
                  <option value="all">💳 Pago: Todos</option>
                  <option value="paid">✓ Solo Pagados</option>
                  <option value="not_paid">✗ Solo No Pagados</option>
                </select>

                {/* Filtro entrega */}
                <select
                  value={saleFilters.delivered}
                  onChange={e => setSaleFilters(f => ({ ...f, delivered: e.target.value }))}
                  className={`input-field text-sm ${saleFilters.delivered !== 'all' ? 'border-amber-400 ring-1 ring-amber-300' : ''}`}
                  style={{ minWidth: '165px' }}
                >
                  <option value="all">📦 Entrega: Todos</option>
                  <option value="delivered">✓ Solo Entregados</option>
                  <option value="not_delivered">✗ Solo No Entregados</option>
                </select>

                {hasFilters && (
                  <button onClick={clearFilters} className="btn btn-secondary btn-sm whitespace-nowrap">
                    ✕ Limpiar filtros
                  </button>
                )}
              </div>

              {/* Indicador de resultados cuando hay filtros */}
              {hasFilters && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-gray-500">
                    {totalCards === 0
                      ? 'Sin resultados'
                      : `${totalCards} lote${totalCards !== 1 ? 's' : ''} · ${Object.values(filteredAndGrouped).flat().reduce((s, b) => s + b.sales.length, 0)} venta${Object.values(filteredAndGrouped).flat().reduce((s, b) => s + b.sales.length, 0) !== 1 ? 's' : ''}`
                    }
                  </span>
                  {saleFilters.paid !== 'all' && (
                    <span className="badge bg-amber-100 text-amber-700">
                      {saleFilters.paid === 'paid' ? 'Pagados' : 'No pagados'}
                    </span>
                  )}
                  {saleFilters.delivered !== 'all' && (
                    <span className="badge bg-blue-100 text-blue-700">
                      {saleFilters.delivered === 'delivered' ? 'Entregados' : 'No entregados'}
                    </span>
                  )}
                  {searchQuery && (
                    <span className="badge bg-purple-100 text-purple-700">
                      "{searchQuery}"
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Formulario nuevo lote */}
            {permissions.canManageStock && (
              <AddBatchForm onCreateBatch={handleCreateBatch} />
            )}

            {/* Lista de lotes agrupados por fecha */}
            {isLoadingBatches ? (
              <DashboardSkeleton />
            ) : Object.keys(filteredAndGrouped).length === 0 ? (
              <EmptyState
                icon={hasFilters ? '🔍' : '🍞'}
                title={hasFilters ? 'Sin resultados para estos filtros' : 'No hay lotes registrados'}
                description={
                  hasFilters
                    ? 'Intenta cambiar o limpiar los filtros aplicados.'
                    : 'Crea el primer lote de pan del día usando el botón de arriba.'
                }
                action={hasFilters && (
                  <button onClick={clearFilters} className="btn btn-secondary">
                    Limpiar filtros
                  </button>
                )}
              />
            ) : (
              <div className="space-y-8">
                {Object.entries(filteredAndGrouped).map(([date, dayBatches]) => (
                  <DaySection
                    key={date}
                    date={date}
                    batches={dayBatches}
                    permissions={permissions}
                    handleCreateSale={handleCreateSale}
                    handleUpdateSale={handleUpdateSale}
                    handleDeleteSale={handleDeleteSale}
                    handleDeleteBatch={handleDeleteBatch}
                    onLogout={onLogout}
                    hasFilters={hasFilters}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stock'     && <StockCard batches={batches} />}
        {activeTab === 'inventory' && permissions.isAdmin && <InventoryManagement onLogout={onLogout} />}
        {activeTab === 'users'     && permissions.isAdmin && <UserManagement onLogout={onLogout} />}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────
//  Sección de un día
// ──────────────────────────────────────────────────────────
function DaySection({ date, batches, permissions, handleCreateSale, handleUpdateSale, handleDeleteSale, handleDeleteBatch, onLogout, hasFilters }) {
  const [isOpen, setIsOpen] = useState(true);

  // Calcular si esta fecha es hoy
  const todayStr = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const isToday = date.toLowerCase() === todayStr.toLowerCase();

  const daySold    = batches.reduce((s, b) => s + b.sales.reduce((ss, sale) => ss + sale.quantitySold, 0), 0);
  const dayRevenue = batches.reduce((s, b) => s + b.sales.reduce((ss, sale) =>
    sale.isGift ? ss : ss + sale.quantitySold * (Number(b.price) || 0), 0), 0);
  const dayPending = batches.reduce((s, b) => s + b.sales.reduce((ss, sale) =>
    (!sale.isPaid && !sale.isGift) ? ss + sale.quantitySold * (Number(b.price) || 0) : ss, 0), 0);

  return (
    <div>
      {/* Header del día */}
      <button
        onClick={() => setIsOpen(p => !p)}
        className="flex items-center justify-between w-full mb-3 group text-left"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="font-display font-semibold text-gray-800 capitalize">
            {date}
          </h2>
          {isToday && <Badge color="amber">Hoy</Badge>}
          <Badge color="gray">{batches.length} lote{batches.length !== 1 ? 's' : ''}</Badge>
          {daySold > 0     && <Badge color="green">{daySold} ud. vendidas</Badge>}
          {dayRevenue > 0  && <Badge color="blue">${dayRevenue.toFixed(2)}</Badge>}
          {dayPending > 0  && <Badge color="red">Debe ${dayPending.toFixed(2)}</Badge>}
        </div>
        <span className={`text-gray-400 text-xs flex-shrink-0 ml-2 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`}>▼</span>
      </button>

      {isOpen && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {batches.map(batch => (
            <BatchCard
              key={batch.id}
              batch={batch}
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
        </div>
      )}
    </div>
  );
}