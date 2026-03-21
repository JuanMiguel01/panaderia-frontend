// src/components/Dashboard/AddBatchForm.jsx
import React, { useState } from 'react';

export function AddBatchForm({ onCreateBatch }) {
  const [breadType, setBreadType] = useState('');
  const [quantityMade, setQuantityMade] = useState('');
  const [price, setPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const PRESETS = ['Baguette', 'Pan de Campo', 'Croissant', 'Pan de Molde', 'Focaccia', 'Ciabatta'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!breadType || !quantityMade || !price) return;
    setIsLoading(true);
    try {
      await onCreateBatch({ breadType, quantityMade: Number(quantityMade), price: Number(price) });
      setBreadType('');
      setQuantityMade('');
      setPrice('');
      setIsExpanded(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full mb-5 flex items-center justify-center gap-3 py-4 border-2 border-dashed border-amber-300 rounded-2xl text-amber-600 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 transition-all group"
      >
        <div className="w-8 h-8 rounded-full bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
          </svg>
        </div>
        <span className="font-semibold">Añadir nuevo lote de pan</span>
      </button>
    );
  }

  return (
    <div className="mb-5 bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 border-b border-amber-100 flex items-center justify-between">
        <h3 className="font-bold text-amber-900 flex items-center gap-2">
          <span>🍞</span> Nuevo Lote de Pan
        </h3>
        <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div className="p-5">
        {/* Presets */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2 font-medium">Tipos frecuentes:</p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(p => (
              <button
                key={p} type="button"
                onClick={() => setBreadType(p)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  breadType === p
                    ? 'border-amber-500 bg-amber-500 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-amber-300 hover:bg-amber-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de pan *</label>
            <input
              type="text" value={breadType} onChange={e => setBreadType(e.target.value)} required
              placeholder="Ej: Barra Rústica"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad *</label>
            <input
              type="number" value={quantityMade} onChange={e => setQuantityMade(e.target.value)} min="1" required
              placeholder="Ej: 50"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-gray-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Precio unitario *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number" value={price} onChange={e => setPrice(e.target.value)} min="0" step="0.01" required
                placeholder="0.00"
                className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-gray-50"
              />
            </div>
          </div>
          <div className="sm:col-span-3 flex gap-3 pt-1">
            <button
              type="submit" disabled={isLoading}
              className="flex-1 sm:flex-none sm:w-48 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                </svg>
              )}
              {isLoading ? 'Creando...' : 'Crear Lote'}
            </button>
            {quantityMade && price && (
              <div className="flex items-center text-sm text-gray-500">
                Total posible: <strong className="ml-1 text-emerald-600">${(Number(quantityMade) * Number(price)).toFixed(2)}</strong>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}