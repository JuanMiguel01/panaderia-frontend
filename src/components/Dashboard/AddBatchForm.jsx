// src/components/Dashboard/AddBatchForm.jsx
import React, { useState } from 'react';

const BREAD_TYPES = [
  'Barra Rústica', 'Pan de Centeno', 'Baguette', 'Pan Integral',
  'Pan de Molde', 'Croissant', 'Pan de Leña', 'Pan de Maíz',
];

const todayISO = () => new Date().toISOString().split('T')[0];

export function AddBatchForm({ onCreateBatch }) {
  const [breadType, setBreadType] = useState('');
  const [customType, setCustomType] = useState('');
  const [quantityMade, setQuantityMade] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(todayISO());
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalType = breadType === '__custom__' ? customType.trim() : breadType;
    if (!finalType || !quantityMade || !price || !date) return;

    setIsLoading(true);
    try {
      await onCreateBatch({
        breadType: finalType,
        quantityMade: Number(quantityMade),
        price: Number(price),
        date,
      });
      setBreadType('');
      setCustomType('');
      setQuantityMade('');
      setPrice('');
      setDate(todayISO());
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isToday = date === todayISO();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-primary w-full py-3.5 text-base group"
      >
        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Registrar Nuevo Lote de Pan
      </button>
    );
  }

  return (
    <div className="card card-body animate-fadeInUp">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-xl">🍞</div>
          <div>
            <h2 className="font-semibold text-gray-900">Nuevo Lote de Pan</h2>
            <p className="text-xs text-gray-500">Completa los datos del lote</p>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="btn btn-ghost btn-icon text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fila 1: Tipo de pan y Fecha */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo de pan */}
          <div>
            <label className="input-label">Tipo de Pan</label>
            <select
              value={breadType}
              onChange={e => setBreadType(e.target.value)}
              required
              className="input-field"
            >
              <option value="">Selecciona un tipo...</option>
              {BREAD_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
              <option value="__custom__">✏️ Otro (escribir)</option>
            </select>
            {breadType === '__custom__' && (
              <input
                type="text"
                value={customType}
                onChange={e => setCustomType(e.target.value)}
                placeholder="Nombre del tipo de pan"
                className="input-field mt-2"
                required
                autoFocus
              />
            )}
          </div>

          {/* Fecha del lote */}
          <div>
            <label className="input-label flex items-center gap-2">
              Fecha del Lote
              {!isToday && (
                <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  ≠ Hoy
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                max={todayISO()}
                className="input-field"
              />
            </div>
            {!isToday && (
              <button
                type="button"
                onClick={() => setDate(todayISO())}
                className="text-xs text-amber-600 hover:text-amber-700 mt-1 underline"
              >
                Usar fecha de hoy
              </button>
            )}
          </div>
        </div>

        {/* Fila 2: Cantidad y Precio */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label">Cantidad producida</label>
            <div className="relative">
              <input
                type="number"
                value={quantityMade}
                onChange={e => setQuantityMade(e.target.value)}
                min="1"
                max="9999"
                required
                className="input-field pr-12"
                placeholder="0"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
                uds.
              </span>
            </div>
          </div>

          <div>
            <label className="input-label">Precio por unidad</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">
                $
              </span>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                min="0.01"
                step="0.01"
                required
                className="input-field pl-7"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Preview */}
        {quantityMade && price && date && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <span className="text-amber-600 text-sm">💰</span>
            <p className="text-sm text-amber-800">
              <strong>{Number(quantityMade)} uds.</strong> ×{' '}
              <strong>${Number(price).toFixed(2)}</strong> ={' '}
              <strong>${(Number(quantityMade) * Number(price)).toFixed(2)}</strong> potencial
            </p>
            {!isToday && (
              <>
                <span className="text-amber-300">·</span>
                <p className="text-sm text-amber-700">
                  📅 {new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary flex-1">
            Cancelar
          </button>
          <button type="submit" disabled={isLoading} className="btn btn-primary flex-1">
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>+ Añadir Lote</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}