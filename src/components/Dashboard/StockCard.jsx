// src/components/Dashboard/StockCard.jsx
import React, { useState } from 'react';

const formatDate = (dateString) => new Date(dateString).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

export function StockCard({ batches }) {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // Por defecto, el último mes
    to: new Date().toISOString().split('T')[0]
  });

  const filteredBatches = batches.filter(batch => {
    const batchDate = new Date(batch.date).toISOString().split('T')[0];
    return batchDate >= dateRange.from && batchDate <= dateRange.to;
  });

  const totals = filteredBatches.reduce((acc, batch) => {
    const totalSold = batch.sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
    const revenue = batch.sales.reduce((sum, sale) => {
        if (sale.isGift) return sum;
        return sum + (sale.quantitySold * (batch.price || 0));
    }, 0);
    
    acc.made += batch.quantityMade;
    acc.sold += totalSold;
    acc.revenue += revenue;
    
    return acc;
  }, { made: 0, sold: 0, revenue: 0 });

  const remainingTotal = totals.made - totals.sold;

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h2 className="text-2xl font-bold text-gray-800">📈 Reporte de Producción y Venta</h2>
          <div className="flex items-center space-x-4">
            <label>Desde:</label>
            <input type="date" value={dateRange.from} onChange={(e) => setDateRange({...dateRange, from: e.target.value})} className="input-field"/>
            <label>Hasta:</label>
            <input type="date" value={dateRange.to} onChange={(e) => setDateRange({...dateRange, to: e.target.value})} className="input-field"/>
          </div>
        </div>
      </div>

      {/* Resumen de totales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-100 p-6 rounded-xl text-center shadow-lg transition-transform hover:scale-105">
            <h3 className="text-lg font-semibold text-blue-800">Total Producido</h3>
            <p className="text-5xl font-extrabold text-blue-900">{totals.made}</p>
            <p className="text-sm text-blue-700">unidades</p>
        </div>
        <div className="bg-green-100 p-6 rounded-xl text-center shadow-lg transition-transform hover:scale-105">
            <h3 className="text-lg font-semibold text-green-800">Total Vendido</h3>
            <p className="text-5xl font-extrabold text-green-900">{totals.sold}</p>
            <p className="text-sm text-green-700">unidades</p>
        </div>
        <div className="bg-orange-100 p-6 rounded-xl text-center shadow-lg transition-transform hover:scale-105">
            <h3 className="text-lg font-semibold text-orange-800">Pan por Vender</h3>
            <p className="text-5xl font-extrabold text-orange-900">{remainingTotal}</p>
            <p className="text-sm text-orange-700">unidades</p>
        </div>
        <div className="bg-purple-100 p-6 rounded-xl text-center shadow-lg transition-transform hover:scale-105">
            <h3 className="text-lg font-semibold text-purple-800">Ingresos Totales</h3>
            <p className="text-5xl font-extrabold text-purple-900">${totals.revenue.toFixed(2)}</p>
            <p className="text-sm text-purple-700">(no incluye regalos)</p>
        </div>
      </div>

      {/* ✅ MEJORA: Se envuelve la tabla en un div con overflow-x-auto para responsividad */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Pan</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hecho</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Vendido</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Por Vender</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ingresos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creado Por</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBatches.map(batch => {
                const totalSold = batch.sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
                const remaining = batch.quantityMade - totalSold;
                // ✅ CORRECCIÓN: Usar (batch.price || 0) aquí también
                const revenue = batch.sales.reduce((sum, sale) => {
                    if (sale.isGift) return sum;
                    return sum + (sale.quantitySold * (batch.price || 0));
                }, 0);
                
                return (
                  <tr key={batch.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(batch.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{batch.breadType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{batch.quantityMade}</td>
                    {/* ✅ CORRECCIÓN: Usar (batch.price || 0) para mostrar el precio */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${(batch.price || 0).toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">{totalSold}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${remaining > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-500'}`}>
                        {remaining}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">${revenue.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{batch.createdBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredBatches.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl">📋</span>
            <p className="text-gray-600 text-xl mt-4">No hay datos para mostrar</p>
            <p className="text-gray-500 mt-2">Ajusta los filtros de fecha o crea algunos lotes.</p>
          </div>
        )}
      </div>
    </div>
  );
}