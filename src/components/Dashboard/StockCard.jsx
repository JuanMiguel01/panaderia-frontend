// src/components/Dashboard/StockCard.jsx
import React, { useState, useEffect } from 'react';
import { formatDate } from '../../utils/formatters';

export function StockCard({ user, batches, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date().toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [filter, setFilter] = useState('all'); // all, sold, remaining

  // Filtrar batches por fecha
  const filteredBatches = batches.filter(batch => {
    const batchDate = new Date(batch.date).toISOString().split('T')[0];
    return batchDate >= dateRange.from && batchDate <= dateRange.to;
  });

  // Calcular totales
  const totals = filteredBatches.reduce((acc, batch) => {
    const totalSold = batch.sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
    const remaining = batch.quantityMade - totalSold;
    const revenue = batch.sales.reduce((sum, sale) => sum + (sale.quantitySold * batch.price), 0);
    
    acc.made += batch.quantityMade;
    acc.sold += totalSold;
    acc.remaining += remaining;
    acc.revenue += revenue;
    
    return acc;
  }, { made: 0, sold: 0, remaining: 0, revenue: 0 });

  // Filtrar datos según el filtro seleccionado
  const finalFilteredData = filteredBatches.filter(batch => {
    const totalSold = batch.sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
    const remaining = batch.quantityMade - totalSold;
    
    if (filter === 'sold') return totalSold > 0;
    if (filter === 'remaining') return remaining > 0;
    return true;
  });

  // Exportar a CSV
  const exportData = () => {
    const csvData = finalFilteredData.map(batch => {
      const totalSold = batch.sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
      const remaining = batch.quantityMade - totalSold;
      const revenue = batch.sales.reduce((sum, sale) => sum + (sale.quantitySold * batch.price), 0);
      
      return {
        Fecha: formatDate(batch.date),
        'Tipo de Pan': batch.breadType,
        'Cantidad Hecha': batch.quantityMade,
        'Precio Unitario': `$${batch.price}`,
        'Cantidad Vendida': totalSold,
        'Cantidad Restante': remaining,
        'Ingresos': `$${revenue}`,
        'Creado Por': batch.createdBy
      };
    });

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tarjeta_estiba_${dateRange.from}_${dateRange.to}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Función para imprimir
  const printReport = () => {
    const printContent = document.getElementById('stock-report-content');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Tarjeta de Estiba - ${dateRange.from} al ${dateRange.to}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .totals { display: flex; justify-content: space-around; margin: 20px 0; }
            .total-box { text-align: center; padding: 10px; border: 1px solid #ddd; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h1 className="text-3xl font-bold text-gray-800">📊 Tarjeta de Estiba</h1>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            {/* Filtros de fecha */}
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Filtros de tipo */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos los lotes</option>
              <option value="sold">Solo vendidos</option>
              <option value="remaining">Con inventario</option>
            </select>
            
            {/* Botones de acción */}
            <div className="flex space-x-2 no-print">
              <button
                onClick={exportData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>📥</span>
                <span>Exportar CSV</span>
              </button>
              
              <button
                onClick={printReport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>🖨️</span>
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido del reporte */}
      <div id="stock-report-content">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold">Tarjeta de Estiba</h2>
          <p className="text-gray-600">Período: {formatDate(dateRange.from)} - {formatDate(dateRange.to)}</p>
        </div>

        {/* Resumen de totales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <h3 className="text-sm font-medium text-blue-600">Total Producido</h3>
            <p className="text-3xl font-bold text-blue-800">{totals.made}</p>
            <p className="text-sm text-blue-600">unidades</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <h3 className="text-sm font-medium text-green-600">Total Vendido</h3>
            <p className="text-3xl font-bold text-green-800">{totals.sold}</p>
            <p className="text-sm text-green-600">unidades</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg text-center">
            <h3 className="text-sm font-medium text-orange-600">Total Restante</h3>
            <p className="text-3xl font-bold text-orange-800">{totals.remaining}</p>
            <p className="text-sm text-orange-600">unidades</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg text-center">
            <h3 className="text-sm font-medium text-purple-600">Ingresos Totales</h3>
            <p className="text-3xl font-bold text-purple-800">${totals.revenue}</p>
            <p className="text-sm text-purple-600">pesos</p>
          </div>
        </div>

        {/* Tabla de datos */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {finalFilteredData.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl">📋</span>
              <p className="text-gray-600 text-xl mt-4">No hay datos para mostrar</p>
              <p className="text-gray-500 mt-2">Ajusta los filtros de fecha o crea algunos lotes</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Pan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad Hecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Precio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vendido
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Restante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingresos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creado Por
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {finalFilteredData.map(batch => {
                    const totalSold = batch.sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
                    const remaining = batch.quantityMade - totalSold;
                    const revenue = batch.sales.reduce((sum, sale) => sum + (sale.quantitySold * batch.price), 0);
                    
                    return (
                      <tr key={batch.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(batch.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {batch.breadType}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {batch.quantityMade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${batch.price}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            totalSold > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {totalSold}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            remaining > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {remaining}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${revenue}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {batch.createdBy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}