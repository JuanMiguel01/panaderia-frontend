// src/components/Dashboard/AddBatchForm.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const todayISO = () => new Date().toISOString().split('T')[0];

const DEFAULT_PRESETS = [
  { id: 1,  name: 'Pan Bola',        price: 200, emoji: '🫓' },
  { id: 2,  name: 'Pan Perro',       price: 200, emoji: '🌭' },
  { id: 3,  name: 'Hamburguesa',     price: 285, emoji: '🍔' },
  { id: 4,  name: 'Tostadas',        price: 130, emoji: '🍞' },
  { id: 5,  name: 'Pan Bola 90g',    price: 350, emoji: '🫓' },
  { id: 6,  name: 'Base de Pizzas',  price: 290, emoji: '🍕' },
];

export function AddBatchForm({ onCreateBatch, onLogout }) {
  const [isOpen, setIsOpen]         = useState(false);
  const [date, setDate]             = useState(todayISO());
  const [quantities, setQuantities] = useState({});
  const [customRows, setCustomRows] = useState([]);
  const [isLoading, setIsLoading]   = useState(false);
  const [presets, setPresets]       = useState([]);
  const [presetsLoading, setPresetsLoading] = useState(false);

  // Load presets from API when form opens
  useEffect(() => {
    if (!isOpen) return;
    setPresetsLoading(true);
    api.getPresets(onLogout)
      .then(data => setPresets(data.length > 0 ? data : DEFAULT_PRESETS))
      .catch(() => setPresets(DEFAULT_PRESETS))
      .finally(() => setPresetsLoading(false));
  }, [isOpen]);

  // ── Qty helpers ───────────────────────────────────────
  const setQty = (id, val) => {
    setQuantities(prev => {
      if (val === '' || val === '0') {
        const copy = { ...prev }; delete copy[id]; return copy;
      }
      return { ...prev, [id]: val };
    });
  };

  // ── Custom rows ───────────────────────────────────────
  const addCustomRow    = () => setCustomRows(prev => [...prev, { tmpId: Date.now(), name: '', price: '', quantity: '' }]);
  const updateCustomRow = (tmpId, field, val) => setCustomRows(prev => prev.map(r => r.tmpId === tmpId ? { ...r, [field]: val } : r));
  const removeCustomRow = (tmpId) => setCustomRows(prev => prev.filter(r => r.tmpId !== tmpId));

  // ── Derived ───────────────────────────────────────────
  const selectedPresets = presets.filter(p => quantities[p.id] && Number(quantities[p.id]) > 0);
  const validCustom     = customRows.filter(r => r.name.trim() && Number(r.price) > 0 && Number(r.quantity) > 0);
  const totalBatches    = selectedPresets.length + validCustom.length;
  const totalUnits      = selectedPresets.reduce((s, p) => s + Number(quantities[p.id] || 0), 0)
                        + validCustom.reduce((s, r) => s + Number(r.quantity), 0);

  // ── Submit ────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalBatches === 0) return;
    setIsLoading(true);
    try {
      const all = [
        ...selectedPresets.map(p => ({ breadType: p.name, quantityMade: Number(quantities[p.id]), price: Number(p.price), date })),
        ...validCustom.map(r  => ({ breadType: r.name.trim(), quantityMade: Number(r.quantity), price: Number(r.price), date })),
      ];
      await Promise.all(all.map(b => onCreateBatch(b)));
      setQuantities({});
      setCustomRows([]);
      setDate(todayISO());
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuantities({});
    setCustomRows([]);
    setDate(todayISO());
  };

  // ── Closed state ──────────────────────────────────────
  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="btn btn-primary w-full py-3.5 text-base group">
        <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
        Registrar Lotes del Día
      </button>
    );
  }

  // ── Open form ─────────────────────────────────────────
  return (
    <div className="card animate-fadeInUp overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-amber-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-xl">🍞</div>
          <div>
            <h2 className="font-semibold text-gray-900">Registro Rápido de Lotes</h2>
            <p className="text-xs text-gray-500">Ingresá la cantidad producida de cada pan</p>
          </div>
        </div>
        <button onClick={handleClose} className="btn btn-ghost btn-icon text-gray-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-5 py-4 space-y-5">

          {/* Fecha */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">📅 Fecha:</label>
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)}
              max={todayISO()} className="input-field max-w-[180px]"
            />
            {date !== todayISO() && (
              <>
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-medium border border-amber-200">Fecha pasada</span>
                <button type="button" onClick={() => setDate(todayISO())} className="text-xs text-amber-600 underline hover:text-amber-700">Usar hoy</button>
              </>
            )}
          </div>

          {/* Grid de presets */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Seleccioná e ingresá cantidades
            </p>

            {presetsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border-2 border-gray-100 bg-gray-50 p-3 h-28" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {presets.map(preset => {
                  const qty    = quantities[preset.id] || '';
                  const active = qty && Number(qty) > 0;
                  return (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      qty={qty}
                      active={active}
                      onChange={val => setQty(preset.id, val)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom rows */}
          {customRows.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Otros panes</p>
              {customRows.map(row => (
                <div key={row.tmpId} className="grid grid-cols-[1fr,100px,90px,36px] gap-2 items-center">
                  <input
                    type="text" placeholder="Nombre del pan" value={row.name}
                    onChange={e => updateCustomRow(row.tmpId, 'name', e.target.value)}
                    className="input-field text-sm" maxLength={50}
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                    <input
                      type="number" placeholder="Precio" value={row.price}
                      onChange={e => updateCustomRow(row.tmpId, 'price', e.target.value)}
                      className="input-field pl-5 text-sm" min="0.01" step="0.01"
                    />
                  </div>
                  <input
                    type="number" placeholder="Cant." value={row.quantity}
                    onChange={e => updateCustomRow(row.tmpId, 'quantity', e.target.value)}
                    className="input-field text-sm text-center" min="1"
                  />
                  <button type="button" onClick={() => removeCustomRow(row.tmpId)}
                    className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button type="button" onClick={addCustomRow}
            className="btn btn-ghost btn-sm text-gray-400 border border-dashed border-gray-200 w-full hover:border-amber-300 hover:text-amber-600 transition-colors">
            + Otro tipo de pan
          </button>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/60">
          {totalBatches > 0 ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1.5">
                  {totalBatches} lote{totalBatches !== 1 ? 's' : ''} · {totalUnits} unidades en total
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedPresets.map(p => (
                    <span key={p.id} className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                      {p.emoji} {p.name} ×{quantities[p.id]}
                    </span>
                  ))}
                  {validCustom.map(r => (
                    <span key={r.tmpId} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">
                      ✏️ {r.name} ×{r.quantity}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button type="button" onClick={handleClose} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={isLoading} className="btn btn-primary">
                  {isLoading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
                  ) : (
                    <>✓ Guardar {totalBatches} lote{totalBatches !== 1 ? 's' : ''}</>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-1">
              Ingresá la cantidad de al menos un tipo de pan
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

// ── Preset card ───────────────────────────────────────────
function PresetCard({ preset, qty, active, onChange }) {
  const inputId = `qty-${preset.id}`;

  const focusInput = () => {
    const el = document.getElementById(inputId);
    if (el) { el.focus(); el.select(); }
  };

  return (
    <div
      onClick={focusInput}
      className={`relative rounded-xl border-2 p-3 transition-all duration-150 cursor-pointer select-none ${
        active ? 'border-amber-400 bg-amber-50 shadow-sm' : 'border-gray-100 bg-white hover:border-amber-200 hover:bg-amber-50/40'
      }`}
    >
      {active && (
        <div className="absolute top-2 right-2 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <span className="text-2xl block mb-1.5">{preset.emoji}</span>
      <p className="text-xs font-bold text-gray-800 leading-tight">{preset.name}</p>
      <p className="text-xs text-gray-400 mb-2">${Number(preset.price).toFixed(0)}</p>
      <input
        id={inputId}
        type="number" placeholder="0" value={qty} min="0" max="9999"
        onChange={e => onChange(e.target.value)}
        onClick={e => e.stopPropagation()}
        className={`w-full text-center text-sm font-bold rounded-lg px-2 py-1.5 border outline-none transition-all ${
          active
            ? 'border-amber-300 bg-white text-amber-700 focus:ring-2 focus:ring-amber-400'
            : 'border-gray-200 bg-gray-50 text-gray-600 focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-300'
        }`}
      />
    </div>
  );
}