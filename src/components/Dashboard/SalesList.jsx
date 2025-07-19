// src/components/Dashboard/SalesList.jsx
import React from 'react';

import { CheckCircleIcon, XCircleIcon, TrashIcon } from '../icons';

const SaleRow = ({ sale, batchId, onUpdateSale, onDeleteSale }) => {
    
  const toggleStatus = (field, value) => {
    onUpdateSale(batchId, sale.id, { [field]: !value });
  };

  return (
    <tr className="bg-white border-b border-cream-200 hover:bg-cream-100 transition-colors">
      <td className="px-4 py-2 font-medium text-brown-900 whitespace-nowrap">{sale.personName}</td>
      <td className="px-2 py-2 text-center font-semibold">{sale.quantitySold}</td>
      <td className="px-2 py-2 text-center">
        <button onClick={() => toggleStatus('isPaid', sale.isPaid)} className="transition-transform transform hover:scale-125" aria-label="Cambiar estado de pago">
          {sale.isPaid ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <XCircleIcon className="w-5 h-5 text-brown-400" />}
        </button>
      </td>
      <td className="px-2 py-2 text-center">
        <button onClick={() => toggleStatus('isDelivered', sale.isDelivered)} className="transition-transform transform hover:scale-125" aria-label="Cambiar estado de entrega">
          {sale.isDelivered ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <XCircleIcon className="w-5 h-5 text-brown-400" />}
        </button>
      </td>
      <td className="px-2 py-2 text-center">
        <button onClick={() => onDeleteSale(batchId, sale.id)} className="text-red-400 hover:text-red-600 transition-colors transform hover:scale-125" aria-label="Eliminar venta">
            <TrashIcon className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};

export const SalesList = ({ sales, batchId, onUpdateSale, onDeleteSale }) => {
  return (
    <>
      <h4 className="font-semibold mb-3 text-brown-700">Registros de Ventas</h4>
      <div className="overflow-y-auto max-h-60 pr-2">
        <table className="w-full text-sm text-left text-brown-600">
          <thead className="text-xs text-brown-700 uppercase bg-cream-100 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-4 py-2 rounded-l-lg">Nombre</th>
              <th scope="col" className="px-2 py-2 text-center">Cant.</th>
              <th scope="col" className="px-2 py-2 text-center">Pagado</th>
              <th scope="col" className="px-2 py-2 text-center">Entregado</th>
              <th scope="col" className="px-2 py-2 text-center rounded-r-lg"></th>
            </tr>
          </thead>
          <tbody>
            {sales.length > 0 ? (
              sales.map(sale => (
                <SaleRow key={sale.id} sale={sale} batchId={batchId} onUpdateSale={onUpdateSale} onDeleteSale={onDeleteSale} />
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-brown-400 py-6">
                  Aún no hay ventas para este lote.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};