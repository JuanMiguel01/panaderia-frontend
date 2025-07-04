// src/components/Dashboard/BatchCard.jsx
import React, { useMemo } from 'react';
import { TrashIcon } from '../icons';
import { StatCard } from '../common/StatCard';
import { SalesList } from './SalesList';
import { AddSaleForm } from './AddSaleForm';
import { formatCurrency } from '../../utils/formatters';

export function BatchCard({ batch, onDeleteBatch, onCreateSale, onUpdateSale, onDeleteSale }) {
  console.log('BatchCard props:', { onCreateSale, onUpdateSale, onDeleteSale, onDeleteBatch });
  console.log('onCreateSale type:', typeof onCreateSale);
  const { id, breadType, quantityMade, price, sales = [], createdBy } = batch;

  // Usamos useMemo para evitar recalcular en cada render
  const stats = useMemo(() => {
    const totalSold = sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
    const remaining = quantityMade - totalSold;
    const paidRevenue = sales
      .filter(s => s.isPaid)
      .reduce((sum, s) => sum + (s.quantitySold * price), 0);
    const pendingRevenue = sales
      .filter(s => !s.isPaid)
      .reduce((sum, s) => sum + (s.quantitySold * price), 0);
    
    return { totalSold, remaining, paidRevenue, pendingRevenue, totalRevenue: paidRevenue + pendingRevenue };
  }, [sales, quantityMade, price]);

  return (
    <article className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Header de la tarjeta */}
      <header className="p-5 border-b border-cream-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-brown-800">{breadType}</h3>
            <p className="text-lg font-semibold text-accent-600">{formatCurrency(price)} / ud.</p>
            <p className="text-xs text-brown-400 mt-1">Creado por: {createdBy || 'N/A'}</p>
          </div>
          <button 
            onClick={() => onDeleteBatch(id)} 
            className="p-2 rounded-full text-brown-500 hover:bg-red-100 hover:text-red-600 transition-colors"
            aria-label={`Eliminar lote de ${breadType}`}
          >
            <TrashIcon />
          </button>
        </div>
        
        {/* Estadísticas principales */}
        <div className="grid grid-cols-3 gap-3 text-center mb-4">
          <StatCard label="Hecho" value={quantityMade} color="text-brown-800" />
          <StatCard label="Vendido" value={stats.totalSold} color="text-green-600" />
          <StatCard label="Restante" value={stats.remaining} color="text-orange-500" />
        </div>

        {/* Resumen de ingresos */}
        <div className="bg-cream-100 p-3 rounded-lg grid grid-cols-3 gap-2 text-center">
            <StatCard label="Cobrado" value={formatCurrency(stats.paidRevenue)} color="text-green-700" size="base" />
            <StatCard label="Pendiente" value={formatCurrency(stats.pendingRevenue)} color="text-amber-600" size="base" />
            <StatCard label="Total" value={formatCurrency(stats.totalRevenue)} color="text-blue-700" size="base" />
        </div>
      </header>

      {/* Lista de ventas */}
      <div className="p-5 flex-grow">
        <SalesList 
          sales={sales} 
          batchId={id} 
          onUpdateSale={onUpdateSale}
          onDeleteSale={onDeleteSale}
        />
      </div>
      
      {/* Formulario para añadir venta */}
      <footer className="p-5 border-t border-cream-200 bg-cream-100 mt-auto">
        <AddSaleForm 
          batchId={id}
          remaining={stats.remaining}
          onCreateSale={onCreateSale}
        />
      </footer>
    </article>
  );
}