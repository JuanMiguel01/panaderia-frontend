// src/components/Dashboard/StockCard.jsx
import React, { useState, useMemo } from 'react';

const fmtDate = d => new Date(d).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });

// Simple bar chart
function MiniBarChart({ data }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div
            className="w-full bg-amber-500 rounded-t-sm transition-all"
            style={{ height: `${(d.value / max) * 56}px`, minHeight: '2px' }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[8px] text-gray-400 rotate-45 origin-left w-4 overflow-hidden">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function StockCard({ batches }) {
  const today = new Date().toISOString().split('T')[0];
  const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [dateFrom, setDateFrom] = useState(thirtyAgo);
  const [dateTo, setDateTo] = useState(today);
  const [sortBy, setSortBy] = useState('date_desc');

  const filtered = useMemo(() => {
    return batches.filter(b => {
      const d = new Date(b.date).toISOString().split('T')[0];
      return d >= dateFrom && d <= dateTo;
    });
  }, [batches, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date);
      if (sortBy === 'date_asc')  return new Date(a.date) - new Date(b.date);
      if (sortBy === 'revenue_desc') {
        const ra = a.sales.reduce((s, sale) => sale.isGift ? s : s + sale.quantitySold * Number(a.price), 0);
        const rb = b.sales.reduce((s, sale) => sale.isGift ? s : s + sale.quantitySold * Number(b.price), 0);
        return rb - ra;
      }
      return 0;
    });
  }, [filtered, sortBy]);

  const totals = useMemo(() => {
    return filtered.reduce((acc, b) => {
      const sold = b.sales.reduce((s, sale) => s + sale.quantitySold, 0);
      const rev  = b.sales.reduce((s, sale) => sale.isGift ? s : s + sale.quantitySold * (Number(b.price)||0), 0);
      const pend = b.sales.reduce((s, sale) => (!sale.isPaid && !sale.isGift) ? s + sale.quantitySold * (Number(b.price)||0) : s, 0);
      acc.made    += b.quantityMade;
      acc.sold    += sold;
      acc.revenue += rev;
      acc.pending += pend;
      return acc;
    }, { made: 0, sold: 0, revenue: 0, pending: 0 });
  }, [filtered]);

  // Last 7 days for mini chart
  const chartData = useMemo(() => {
    const days = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().split('T')[0];
      days[key] = { label: d.toLocaleDateString('es-ES', { weekday:'short' }), value: 0 };
    }
    for (const b of batches) {
      const key = new Date(b.date).toISOString().split('T')[0];
      if (days[key]) {
        days[key].value += b.sales.reduce((s, sale) =>
          sale.isGift ? s : s + sale.quantitySold * (Number(b.price)||0), 0);
      }
    }
    return Object.values(days);
  }, [batches]);

  const efficiency = totals.made > 0 ? Math.round((totals.sold / totals.made) * 100) : 0;

  const exportCSV = () => {
    const rows = [
      ['Fecha', 'Tipo de Pan', 'Producido', 'Precio', 'Vendido', 'Por Vender', 'Ingresos', 'Pendiente', 'Creado por'],
      ...sorted.map(b => {
        const sold = b.sales.reduce((s, x) => s + x.quantitySold, 0);
        const rev  = b.sales.reduce((s, x) => x.isGift ? s : s + x.quantitySold * (Number(b.price)||0), 0);
        const pend = b.sales.reduce((s, x) => (!x.isPaid && !x.isGift) ? s + x.quantitySold * (Number(b.price)||0) : s, 0);
        return [fmtDate(b.date), b.breadType, b.quantityMade, b.price, sold, b.quantityMade - sold, rev.toFixed(2), pend.toFixed(2), b.createdBy];
      })
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `reporte_${dateFrom}_${dateTo}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900" style={{fontFamily:"'Playfair Display',serif"}}>
              📊 Reporte de Producción y Ventas
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">Análisis detallado del rendimiento de tu panadería</p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Exportar CSV
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500 font-medium">Desde:</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500 font-medium">Hasta:</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="date_desc">Fecha ↓</option>
            <option value="date_asc">Fecha ↑</option>
            <option value="revenue_desc">Mayores ingresos</option>
          </select>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Producido', value: totals.made, unit: 'uds', color: 'blue' },
          { label: 'Total Vendido',   value: totals.sold, unit: 'uds', color: 'emerald' },
          { label: 'Sin Vender',      value: totals.made - totals.sold, unit: 'uds', color: 'orange' },
          { label: 'Ingresos',        value: `$${totals.revenue.toFixed(2)}`, color: 'purple' },
          { label: 'Pendiente',       value: `$${totals.pending.toFixed(2)}`, color: 'red' },
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-50 border border-${s.color}-100 rounded-2xl p-4 text-center`}>
            <p className={`text-2xl font-extrabold text-${s.color}-700`}>{s.value}</p>
            {s.unit && <p className={`text-xs text-${s.color}-500`}>{s.unit}</p>}
            <p className="text-xs text-gray-500 mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart + efficiency */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Ingresos últimos 7 días</h3>
          <MiniBarChart data={chartData} />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3"/>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f59e0b" strokeWidth="3"
                  strokeDasharray={`${efficiency} ${100 - efficiency}`} strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-extrabold text-amber-700">{efficiency}%</span>
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-700 mt-2">Tasa de Venta</p>
            <p className="text-xs text-gray-400">del total producido</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Fecha', 'Tipo de Pan', 'Hecho', 'Precio', 'Vendido', 'Por Vender', 'Ingresos', 'Pendiente', 'Operario'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-gray-400">
                    <div className="text-4xl mb-2">📋</div>
                    No hay datos para el rango seleccionado
                  </td>
                </tr>
              ) : sorted.map(batch => {
                const sold = batch.sales.reduce((s, x) => s + x.quantitySold, 0);
                const remaining = batch.quantityMade - sold;
                const rev  = batch.sales.reduce((s, x) => x.isGift ? s : s + x.quantitySold * (Number(batch.price)||0), 0);
                const pend = batch.sales.reduce((s, x) => (!x.isPaid && !x.isGift) ? s + x.quantitySold * (Number(batch.price)||0) : s, 0);
                return (
                  <tr key={batch.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{fmtDate(batch.date)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">{batch.breadType}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">{batch.quantityMade}</td>
                    <td className="px-4 py-3 text-sm text-center text-gray-600">${(Number(batch.price)||0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">{sold}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${remaining > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'}`}>
                        {remaining}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-right">${rev.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {pend > 0 ? <span className="font-bold text-red-500">${pend.toFixed(2)}</span> : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[120px] truncate">{batch.createdBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}