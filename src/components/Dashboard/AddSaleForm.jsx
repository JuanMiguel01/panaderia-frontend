// src/components/Dashboard/AddSaleForm.jsx
import React, { useState, useRef, useEffect } from 'react';

export function AddSaleForm({ batchId, remaining, onCreateSale }) {
  const [personName, setPersonName] = useState('');
  const [quantity, setQuantity]     = useState('1');
  const [isGift, setIsGift]         = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [qtyError, setQtyError]     = useState('');
  const inputRef = useRef();

  useEffect(() => { inputRef.current?.focus(); }, []);

  const validateQty = (val) => {
    const n = Number(val);
    if (!val || isNaN(n) || n < 1) return 'La cantidad debe ser al menos 1.';
    if (!Number.isInteger(n))       return 'La cantidad debe ser un número entero.';
    if (n > remaining)              return `Solo quedan ${remaining} unidad${remaining !== 1 ? 'es' : ''} disponibles.`;
    return '';
  };

  const handleQtyChange = (val) => {
    setQuantity(val);
    setQtyError(validateQty(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateQty(quantity);
    if (error) { setQtyError(error); return; }
    if (!personName.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateSale(batchId, {
        personName: personName.trim(),
        quantitySold: Number(quantity),
        isGift,
      });
      setPersonName('');
      setQuantity('1');
      setIsGift(false);
      setQtyError('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = personName.trim() && !qtyError && quantity;

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
            onChange={e => handleQtyChange(e.target.value)}
            min="1"
            max={remaining}
            required
            className={`w-full px-3 py-2 text-sm border rounded-xl bg-white focus:outline-none focus:ring-2 pr-14 ${
              qtyError ? 'border-red-400 focus:ring-red-300' : 'border-gray-200 focus:ring-amber-400'
            }`}
          />
          <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold ${
            qtyError ? 'text-red-400' : 'text-gray-400'
          }`}>
            /{remaining}
          </span>
        </div>
      </div>

      {/* Error de cantidad */}
      {qtyError && (
        <div className="flex items-center gap-1.5 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {qtyError}
        </div>
      )}

      {/* Quick qty buttons */}
      {remaining >= 2 && !qtyError && (
        <div className="flex gap-1 flex-wrap">
          <span className="text-[10px] text-gray-400 self-center mr-1">Rápido:</span>
          {[1, 2, 5, 10].filter(n => n <= remaining).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => handleQtyChange(String(n))}
              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all ${
                Number(quantity) === n
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              ×{n}
            </button>
          ))}
          {remaining > 10 && (
            <button
              type="button"
              onClick={() => handleQtyChange(String(remaining))}
              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium transition-all ${
                Number(quantity) === remaining
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              Todo ({remaining})
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        {/* Gift toggle */}
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative">
            <input type="checkbox" checked={isGift} onChange={e => setIsGift(e.target.checked)} className="sr-only" />
            <div className={`w-9 h-5 rounded-full transition-colors ${isGift ? 'bg-purple-500' : 'bg-gray-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform m-0.5 ${isGift ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </div>
          <span className="text-xs text-gray-600 group-hover:text-gray-800">🎁 Regalo (sin cobro)</span>
        </label>

        {/* Preview + Submit */}
        <div className="flex items-center gap-2">
          {isValid && !isGift && (
            <span className="text-xs text-gray-400 hidden sm:block">
              — lote sin importe definido —
            </span>
          )}
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
            Registrar
          </button>
        </div>
      </div>
    </form>
  );
}