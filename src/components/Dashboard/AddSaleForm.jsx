// src/components/Dashboard/AddSaleForm.jsx
import React, { useState } from 'react';

export function AddSaleForm({ batchId, remaining, onCreateSale }) {
  const [personName, setPersonName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isGift, setIsGift] = useState(false); // Nuevo estado para el regalo

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!personName || !quantity || Number(quantity) > remaining) return;
    
    onCreateSale(batchId, { 
      personName, 
      quantitySold: Number(quantity),
      isGift: isGift // Pasamos el nuevo estado
    });

    setPersonName('');
    setQuantity('1');
    setIsGift(false); // Reseteamos el estado
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
        <input 
          type="text" 
          placeholder="Nombre cliente" 
          value={personName} 
          onChange={e => setPersonName(e.target.value)} 
          required 
          className="input-field sm:col-span-2" 
          disabled={remaining === 0}
        />
        <input 
          type="number" 
          placeholder="Cant." 
          value={quantity} 
          onChange={e => setQuantity(e.target.value)} 
          min="1" 
          max={remaining} 
          required 
          className="input-field" 
          disabled={remaining === 0}
        />
        <button 
          type="submit" 
          className="btn btn-secondary !py-2 w-full sm:col-span-1" 
          disabled={remaining === 0}
        >
          Añadir Venta
        </button>
      </div>
      {/* Nuevo Checkbox para Regalo */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id={`gift-checkbox-${batchId}`}
          checked={isGift}
          onChange={(e) => setIsGift(e.target.checked)}
          disabled={remaining === 0}
          className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
        />
        <label htmlFor={`gift-checkbox-${batchId}`} className="ml-2 block text-sm text-gray-700">
          Marcar como regalo (no genera ingresos)
        </label>
      </div>
    </form>
  );
}