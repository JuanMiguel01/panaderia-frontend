// src/components/Dashboard/BatchCard.jsx
import React from 'react';
import { AddSaleForm } from './AddSaleForm';

export function BatchCard({ 
  batch, 
  user,
  onCreateSale, 
  onUpdateSale, 
  onDeleteSale, 
  onDeleteBatch,
  canDeleteSale,
  isAdmin
}) {
  const totalSold = batch.sales.reduce((sum, sale) => sum + sale.quantitySold, 0);
  const remaining = batch.quantityMade - totalSold;
  const totalRevenue = batch.sales.reduce((sum, sale) => sum + (sale.quantitySold * batch.price), 0);

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
      {/* Header del lote */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-brown-700">{batch.breadType}</h3>
          <p className="text-sm text-brown-600">Por: {batch.createdBy}</p>
        </div>
        
        {/* Botón eliminar lote - solo admins */}
        {isAdmin && (
          <button
            onClick={() => onDeleteBatch(batch.id)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar lote"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Estadísticas del lote */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-brown-50 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-brown-600">Cantidad</p>
          <p className="font-bold text-brown-800">{batch.quantityMade}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-brown-600">Precio</p>
          <p className="font-bold text-brown-800">${batch.price}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-brown-600">Restante</p>
          <p className={`font-bold ${remaining === 0 ? 'text-red-600' : 'text-green-600'}`}>
            {remaining}
          </p>
        </div>
      </div>

      {/* Resumen de ingresos */}
      <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
        <p className="text-sm text-gray-600">Total vendido: {totalSold} unidades</p>
        <p className="text-lg font-bold text-green-700">Ingresos: ${totalRevenue}</p>
      </div>

      {/* Lista de ventas */}
      <div className="space-y-2 mb-4">
        <h4 className="font-semibold text-brown-700 border-b pb-2">
          Ventas ({batch.sales.length})
        </h4>
        
        {batch.sales.length === 0 ? (
          <p className="text-gray-500 text-sm italic py-2">No hay ventas registradas</p>
        ) : (
          batch.sales.map(sale => (
            <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <p className="font-medium text-gray-800">{sale.personName}</p>
                <p className="text-sm text-gray-600">
                  {sale.quantitySold} unidades × ${batch.price} = ${sale.quantitySold * batch.price}
                </p>
              </div>
              
              {/* Checkboxes de estado */}
              <div className="flex items-center space-x-4">
                {/* Checkbox Pagado - admins pueden cambiar, usuarios solo ver */}
                <label className={`flex items-center space-x-2 ${isAdmin ? 'cursor-pointer' : 'cursor-default'}`}>
                  <input
                    type="checkbox"
                    checked={sale.isPaid}
                    onChange={isAdmin ? (e) => onUpdateSale(batch.id, sale.id, { isPaid: e.target.checked }) : undefined}
                    readOnly={!isAdmin}
                    className={`w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 ${
                      !isAdmin ? 'pointer-events-none' : ''
                    }`}
                  />
                  <span className={`text-sm ${isAdmin ? 'text-gray-700' : 'text-gray-600'}`}>
                    💰 Pagado
                  </span>
                </label>
                
                {/* Checkbox Entregado - todos pueden cambiar */}
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sale.isDelivered}
                    onChange={(e) => onUpdateSale(batch.id, sale.id, { isDelivered: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">📦 Entregado</span>
                </label>
                
                {/* Botón eliminar venta - solo admins */}
                {canDeleteSale && canDeleteSale(user) && (
                  <button
                    onClick={() => onDeleteSale(batch.id, sale.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Eliminar venta"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Formulario para añadir nueva venta */}
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