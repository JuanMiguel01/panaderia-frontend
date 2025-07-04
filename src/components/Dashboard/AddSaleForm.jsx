// src/components/Dashboard/AddSaleForm.jsx
import React, { useState } from 'react';

export function AddSaleForm({ batchId, remaining, onCreateSale }) {
  const [personName, setPersonName] = useState('');
  const [quantity, setQuantity] = useState('1');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!personName || !quantity || Number(quantity) > remaining) return;
    
    onCreateSale(batchId, { 
      personName, 
      quantitySold: Number(quantity) 
    });

    setPersonName('');
    setQuantity('1');
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
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
    </form>
  );
}