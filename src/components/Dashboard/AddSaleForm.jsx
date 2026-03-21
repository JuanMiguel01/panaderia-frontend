// src/components/Dashboard/AddSaleForm.jsx
import React, { useState, useRef, useEffect } from 'react';

export function AddSaleForm({ batchId, remaining, onCreateSale }) {
  const [personName, setPersonName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isGift, setIsGift] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!personName || !quantity || Number(quantity) < 1 || Number(quantity) > remaining) return;
    setIsSubmitting(true);
    try {
      await onCreateSale(batchId, { personName, quantitySold: Number(quantity), isGift });
      setPersonName('');
      setQuantity('1');
      setIsGift(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Nombre del cliente"
          value={personName}
          onChange={e => setPersonName(e.target.value)}
          required
          className="sm:col-span-2 px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <div className="relative">
          <input
            type="number"
            placeholder="Cant."
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            min="1"
            max={remaining}
            required
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
            máx {remaining}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={isGift}
              onChange={e => setIsGift(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-9 h-5 rounded-full transition-colors ${isGift ? 'bg-purple-500' : 'bg-gray-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform m-0.5 ${isGift ? 'translate-x-4' : 'translate-x-0'}`}/>
            </div>
          </div>
          <span className="text-xs text-gray-600 group-hover:text-gray-800">🎁 Es un regalo (sin cobro)</span>
        </label>
        <button
          type="submit"
          disabled={isSubmitting || !personName}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5"
        >
          {isSubmitting ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
          )}
          Registrar
        </button>
      </div>
    </form>
  );
}