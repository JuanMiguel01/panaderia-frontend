// src/components/Dashboard/BatchCard.jsx

import React, { useState } from 'react';
import { AddSaleForm } from './AddSaleForm';
import { api } from '../../services/api';

export function BatchCard({
  batch,
  user,
  onCreateSale,
  onUpdateSale,
  onDeleteSale,
  onDeleteBatch,
  // Props de permisos
  canManageSales,
  canDeleteSales,
  canDeleteBatches,
  isAdmin, // Recibimos si es admin directamente
  onLogout
}) {
  const [isEditingDate, setIsEditingDate] = useState(false);
  // Aseguramos que la fecha inicial esté en formato YYYY-MM-DD
  const [newDate, setNewDate] = useState(batch.date ? new Date(batch.date).toISOString().split('T')[0] : '');

  // ✅ CORRECCIÓN: Usar (Number(batch.price) || 0) para asegurar que el precio es un número.
  const totalRevenue = batch.sales.reduce((sum, sale) => {
    if (sale.isGift) return sum;
    return sum + (sale.quantitySold * (Number(batch.price) || 0));
  }, 0);

  // ✅ CORRECCIÓN: Aplicar también aquí.
  const batchPendingAmount = batch.sales.reduce((sum, sale) => {
    if (!sale.isPaid && !sale.isGift) {
      return sum + (sale.quantitySold * (Number(batch.price) || 0));
    }
    return sum;
  }, 0);

  const totalSold = batch.sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
  const remaining = batch.quantityMade - totalSold;


   // ✅ Lógica para manejar el cambio de fecha
   const handleDateChange = async (e) => {
    e.preventDefault();
    try {
      await api.updateBatchDate(batch.id, newDate, onLogout);
      setIsEditingDate(false);
      // La actualización se reflejará por el evento de socket, no es necesario recargar aquí.
    } catch (error) {
      console.error("Error al actualizar la fecha:", error);
      alert("No se pudo actualizar la fecha.");
    }
  };
  
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-brown-700">{batch.breadType}</h3>
            {isEditingDate ? (
            <form onSubmit={handleDateChange} className="flex items-center space-x-2 mt-1">
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="input-field !py-1"
              />
              <button type="submit" className="btn btn-primary !py-1">OK</button>
              <button type="button" onClick={() => setIsEditingDate(false)} className="btn btn-secondary !py-1">X</button>
            </form>
          ) : (
            <div className="flex items-center space-x-2">
                <p className="text-sm text-brown-600">
                    {new Date(batch.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                {/* ✅ Botón para iniciar la edición de fecha, solo para admins */}
                {isAdmin && (
                    <button
                    onClick={() => setIsEditingDate(true)}
                    className="p-1 text-blue-500 hover:bg-blue-100 rounded-full transition-colors"
                    title="Editar fecha del lote"
                    >
                    ✏️
                    </button>
                )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
            {canDeleteBatches && (
                <button
                    onClick={() => onDeleteBatch(batch.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar lote"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            )}
        </div>
      </div>

      {/* ⭐ CÓDIGO RESTAURADO: Estadísticas del lote */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-brown-50 rounded-lg text-center">
        <div>
          <p className="text-sm font-medium text-gray-600">Producido</p>
          <p className="text-2xl font-bold text-brown-800">{batch.quantityMade}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Vendido</p>
          <p className="text-2xl font-bold text-green-700">{totalSold}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600">Falta</p>
          <p className="text-2xl font-bold text-orange-600">{remaining}</p>
        </div>
      </div>

      {/* ✅ MODIFICADO: Resumen de ingresos y pendientes */}
      <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg space-y-1">
        <p className="text-sm text-gray-600">Total vendido: {totalSold} unidades</p>
        <p className="text-lg font-bold text-green-700">Ingresos: ${totalRevenue.toFixed(2)}</p>
        {/* ✅ NUEVO: Mostrar el pendiente de cobro por lote */}
        {batchPendingAmount > 0 && (
          <p className="text-sm font-bold text-red-600">
            Pendiente en este lote: ${batchPendingAmount.toFixed(2)}
          </p>
        )}
      </div>

      {/* ✅ MODIFICADO: Lista de ventas con resaltado y detalle de cobro */}
      <div className="space-y-2 mb-4">
        <h4 className="font-semibold text-brown-700 border-b pb-2">
          Ventas ({batch.sales.length})
        </h4>

        {batch.sales.length === 0 ? (
          <p className="text-gray-500 text-sm italic py-2">No hay ventas registradas</p>
        ) : (
          batch.sales.map(sale => {
            const isUnpaid = !sale.isPaid && !sale.isGift;
            // ✅ CORRECCIÓN APLICADA AQUÍ: Asegurarse de que batch.price sea un número
            const saleAmount = sale.quantitySold * (Number(batch.price) || 0);

            return (
              // ✅ MODIFICADO: Añadimos clase condicional para resaltar
              <div key={sale.id} className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isUnpaid ? 'bg-red-50 border border-red-200' : 'bg-gray-50 hover:bg-gray-100'}`}>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-800">{sale.personName}</p>
                      {sale.isGift && (
                          <span className="px-2 py-0.5 text-xs font-semibold text-purple-800 bg-purple-100 rounded-full">Regalo 🎁</span>
                      )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {sale.quantitySold} unidades
                    {/* Aquí .toFixed() es seguro porque saleAmount ya es un número */}
                    {!sale.isGift && ` × $${(Number(batch.price) || 0).toFixed(2)} = $${saleAmount.toFixed(2)}`}
                  </p>
                  {/* ✅ NUEVO: Mostrar lo que falta por cobrar en la venta */}
                  {isUnpaid && (
                    <p className="text-xs font-semibold text-red-700 pt-1">
                      Falta por cobrar: ${saleAmount.toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Checkboxes y botones (sin cambios en su lógica) */}
                <div className="flex items-center space-x-4">
                  <label className={`flex items-center space-x-2 ${canManageSales ? 'cursor-pointer' : 'cursor-default'}`}>
                    <input type="checkbox" checked={sale.isPaid} onChange={canManageSales ? (e) => onUpdateSale(batch.id, sale.id, { isPaid: e.target.checked }) : undefined} readOnly={!canManageSales} className={`w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 ${!canManageSales ? 'pointer-events-none' : ''}`}/>
                    <span className={`text-sm ${canManageSales ? 'text-gray-700' : 'text-gray-600'}`}>💰 Pagado</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={sale.isDelivered} onChange={(e) => onUpdateSale(batch.id, sale.id, { isDelivered: e.target.checked })} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                    <span className="text-sm text-gray-700">📦 Entregado</span>
                  </label>
                  {canDeleteSales && (
                    <button onClick={() => onDeleteSale(batch.id, sale.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors" title="Eliminar venta">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Formulario para añadir nueva venta (sin cambios) */}
      <div className="border-t pt-4">
        <h5 className="text-sm font-medium text-brown-700 mb-3">Añadir nueva venta</h5>
        <AddSaleForm
          batchId={batch.id}
          remaining={remaining}
          onCreateSale={onCreateSale}
        />
      </div>
    </div>
  );
}