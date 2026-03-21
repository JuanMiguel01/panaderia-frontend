// src/components/Dashboard/BatchCard.jsx
import React, { useState } from 'react';
import { AddSaleForm } from './AddSaleForm';
import { api } from '../../services/api';
import { useConfirm } from '../ConfirmModal';
import { useToast } from '../Toast';

export function BatchCard({
  batch, user, onCreateSale, onUpdateSale, onDeleteSale,
  onDeleteBatch, canManageSales, canDeleteSales, canDeleteBatches, isAdmin, onLogout
}) {
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [newDate, setNewDate] = useState(
    batch.date ? new Date(batch.date).toISOString().split('T')[0] : ''
  );
  const [showSales, setShowSales] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const { confirm, ConfirmDialog } = useConfirm();
  const toast = useToast();

  const price = Number(batch.price) || 0;
  const totalSold = batch.sales.reduce((s, sale) => s + sale.quantitySold, 0);
  const remaining = batch.quantityMade - totalSold;
  const totalRevenue = batch.sales.reduce((s, sale) => sale.isGift ? s : s + sale.quantitySold * price, 0);
  const pendingAmount = batch.sales.reduce((s, sale) => (!sale.isPaid && !sale.isGift) ? s + sale.quantitySold * price : s, 0);
  const giftCount = batch.sales.filter(s => s.isGift).length;
  const soldPct = batch.quantityMade > 0 ? Math.round((totalSold / batch.quantityMade) * 100) : 0;

  const handleDeleteBatch = async () => {
    const ok = await confirm({
      title: 'Eliminar lote',
      message: `¿Seguro que deseas eliminar el lote de "${batch.breadType}"? Esto eliminará también todas sus ventas.`,
      confirmText: 'Sí, eliminar',
      icon: '🗑️',
    });
    if (ok) onDeleteBatch(batch.id);
  };

  const handleDeleteSale = async (batchId, saleId, personName) => {
    const ok = await confirm({
      title: 'Eliminar venta',
      message: `¿Eliminar la venta de ${personName}?`,
      confirmText: 'Eliminar',
      icon: '🗑️',
    });
    if (ok) onDeleteSale(batchId, saleId);
  };

  const handleDateChange = async (e) => {
    e.preventDefault();
    try {
      await api.updateBatchDate(batch.id, newDate, onLogout);
      setIsEditingDate(false);
      toast.success('Fecha actualizada');
    } catch {
      toast.error('No se pudo actualizar la fecha');
    }
  };

  return (
    <>
      {ConfirmDialog}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        {/* Card header */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 border-b border-amber-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-amber-900 text-lg truncate">{batch.breadType}</h3>
              {isEditingDate ? (
                <form onSubmit={handleDateChange} className="flex items-center gap-2 mt-1.5">
                  <input
                    type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                    className="text-sm border border-amber-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button type="submit" className="text-xs bg-amber-500 text-white px-2 py-1 rounded-lg hover:bg-amber-600">✓</button>
                  <button type="button" onClick={() => setIsEditingDate(false)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-200">✕</button>
                </form>
              ) : (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-amber-700/70">
                    {new Date(batch.date).toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })}
                  </span>
                  {isAdmin && (
                    <button onClick={() => setIsEditingDate(true)} className="text-amber-500 hover:text-amber-700 transition-colors" title="Editar fecha">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full">
                ${price.toFixed(2)}/u
              </span>
              {canDeleteBatches && (
                <button onClick={handleDeleteBatch} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar lote">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-amber-700/60 mb-1">
              <span>{totalSold} vendidos de {batch.quantityMade}</span>
              <span className="font-semibold text-amber-700">{soldPct}%</span>
            </div>
            <div className="h-2 bg-amber-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${soldPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="px-5 py-3 grid grid-cols-3 gap-3 border-b border-gray-50">
          <div className="text-center">
            <p className="text-lg font-extrabold text-gray-800">{remaining}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Disponibles</p>
          </div>
          <div className="text-center border-x border-gray-100">
            <p className="text-lg font-extrabold text-emerald-600">${totalRevenue.toFixed(0)}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Ingresos</p>
          </div>
          <div className="text-center">
            <p className={`text-lg font-extrabold ${pendingAmount > 0 ? 'text-red-500' : 'text-gray-400'}`}>
              ${pendingAmount.toFixed(0)}
            </p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Pendiente</p>
          </div>
        </div>

        {/* Sales list */}
        <div className="px-5 py-3">
          <button
            onClick={() => setShowSales(s => !s)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 mb-2"
          >
            <span className="flex items-center gap-2">
              Ventas
              <span className="bg-gray-100 text-gray-600 text-xs px-1.5 py-0.5 rounded-full font-normal">
                {batch.sales.length}
              </span>
              {giftCount > 0 && (
                <span className="bg-purple-100 text-purple-600 text-xs px-1.5 py-0.5 rounded-full font-normal">
                  {giftCount} 🎁
                </span>
              )}
            </span>
            <svg className={`w-4 h-4 transition-transform ${showSales ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          {showSales && (
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {batch.sales.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4 italic">Sin ventas aún</p>
              ) : (
                batch.sales.map(sale => {
                  const saleAmount = sale.quantitySold * price;
                  const isUnpaid = !sale.isPaid && !sale.isGift;
                  return (
                    <div
                      key={sale.id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors ${
                        isUnpaid ? 'bg-red-50 border border-red-100' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {sale.personName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm text-gray-800 truncate">{sale.personName}</span>
                          {sale.isGift && <span className="text-xs bg-purple-100 text-purple-600 px-1.5 rounded-full flex-shrink-0">🎁 Regalo</span>}
                          {isUnpaid && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded-full flex-shrink-0 font-semibold">DEBE</span>}
                        </div>
                        <p className="text-xs text-gray-500">
                          {sale.quantitySold} u{!sale.isGift && ` · $${saleAmount.toFixed(2)}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Paid toggle */}
                        <button
                          onClick={() => canManageSales ? onUpdateSale(batch.id, sale.id, { isPaid: !sale.isPaid }) : null}
                          disabled={!canManageSales || sale.isGift}
                          title="Cambiar estado de pago"
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                            sale.isPaid || sale.isGift
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                          } ${!canManageSales || sale.isGift ? 'opacity-50 cursor-default' : 'cursor-pointer hover:scale-110'}`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </button>
                        {/* Delivered toggle */}
                        <button
                          onClick={() => onUpdateSale(batch.id, sale.id, { isDelivered: !sale.isDelivered })}
                          title="Cambiar estado de entrega"
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer hover:scale-110 ${
                            sale.isDelivered ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                          }`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                          </svg>
                        </button>
                        {/* Delete */}
                        {canDeleteSales && (
                          <button
                            onClick={() => handleDeleteSale(batch.id, sale.id, sale.personName)}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all hover:scale-110"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Add sale section */}
        <div className="px-5 pb-4 border-t border-gray-50 pt-3">
          <button
            onClick={() => setShowAddForm(s => !s)}
            disabled={remaining === 0}
            className={`flex items-center gap-2 text-sm font-medium transition-colors mb-2 ${
              remaining === 0
                ? 'text-gray-300 cursor-default'
                : 'text-amber-600 hover:text-amber-800'
            }`}
          >
            <svg className={`w-4 h-4 transition-transform ${showAddForm ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            {remaining === 0 ? 'Lote agotado' : 'Añadir venta'}
          </button>
          {showAddForm && remaining > 0 && (
            <AddSaleForm batchId={batch.id} remaining={remaining} onCreateSale={onCreateSale} />
          )}
        </div>
      </div>
    </>
  );
}