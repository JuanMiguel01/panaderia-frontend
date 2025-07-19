// src/components/Dashboard/AddBatchForm.jsx

import React, { useState } from 'react';
import { PlusCircleIcon } from '../icons';

export function AddBatchForm({ onCreateBatch }) {
  const [breadType, setBreadType] = useState('');
  const [quantityMade, setQuantityMade] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!breadType || !quantityMade || !price) return;
    
    setIsLoading(true);
    try {
      await onCreateBatch({ 
        breadType, 
        quantityMade: Number(quantityMade), 
        price: Number(price) 
      });

      setBreadType('');
      setQuantityMade('');
      setPrice('');
    } catch (error) {
      console.error('Error al crear lote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg mb-8 border border-amber-100">
      <h2 className="text-xl font-semibold text-amber-800 mb-4 flex items-center gap-2">
        <span className="text-2xl">🍞</span>
        Añadir Nuevo Lote de Pan
      </h2>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-2">
          <label htmlFor="bread-type" className="block text-sm font-medium text-amber-700 mb-1">
            Tipo de Pan
          </label>
          <input 
            type="text" 
            id="bread-type" 
            value={breadType} 
            onChange={e => setBreadType(e.target.value)} 
            required 
            className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white/80"
            placeholder="Ej: Barra Rústica" 
          />
        </div>
        
        <div>
          <label htmlFor="quantity-made" className="block text-sm font-medium text-amber-700 mb-1">
            Cantidad
          </label>
          <input 
            type="number" 
            id="quantity-made" 
            value={quantityMade} 
            onChange={e => setQuantityMade(e.target.value)} 
            min="1" 
            required 
            className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white/80"
            placeholder="Ej: 50" 
          />
        </div>
        
        <div>
          <label htmlFor="bread-price" className="block text-sm font-medium text-amber-700 mb-1">
            Precio (€)
          </label>
          <input 
            type="number" 
            id="bread-price" 
            value={price} 
            onChange={e => setPrice(e.target.value)} 
            min="0" 
            step="0.01" 
            required 
            className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white/80"
            placeholder="Ej: 1.20" 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 w-full md:col-start-4"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Añadiendo...
            </>
          ) : (
            <>
              <PlusCircleIcon /> 
              Añadir Lote
            </>
          )}
        </button>
      </form>
    </div>
  );
}