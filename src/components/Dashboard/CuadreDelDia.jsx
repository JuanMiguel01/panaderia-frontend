// src/components/Dashboard/CuadreDelDia.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';

const GASTO_COLS = [
  { key: 'generales', label: 'Gastos Generales' },
  { key: 'jm',       label: 'Gastos JM' },
  { key: 'michel',   label: 'Gastos Michel' },
  { key: 'nadiel',   label: 'Gastos Nadiel' },
];

const EMPTY_ROW = () => ({ concepto: '', monto: '' });
const DEFAULT_GASTOS = () => Object.fromEntries(GASTO_COLS.map(c => [c.key, [EMPTY_ROW()]]));

function numVal(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
function fmt(n)    { return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function loadFromStorage(date) {
  try { const r = localStorage.getItem(`cuadre_${date}`); return r ? JSON.parse(r) : null; }
  catch { return null; }
}

function saveToStorage(date, data) {
  try { localStorage.setItem(`cuadre_${date}`, JSON.stringify(data)); } catch {}
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ label, value, color }) {
  const colors = {
    green:  'bg-emerald-50 border-emerald-100 text-emerald-600 font-emerald-700',
    red:    'bg-red-50 border-red-100 text-red-600 font-red-700',
    blue:   'bg-blue-50 border-blue-100 text-blue-600 font-blue-700',
    orange: 'bg-orange-50 border-orange-100 text-orange-600 font-orange-700',
  };
  const c = colors[color] || colors.blue;
  return (
    <div className={`border rounded-2xl p-5 text-center ${c.split(' ').slice(0, 2).join(' ')}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${c.split(' ')[2]}`}>{label}</p>
      <p className={`text-2xl font-extrabold ${c.split(' ')[3]}`}>{value}</p>
    </div>
  );
}

function GastoColumn({ col, rows, total, onAdd, onRemove, onUpdate }) {
  return (
    <div className="border border-gray-100 rounded-xl p-3 flex flex-col">
      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{col.label}</h4>
      <div className="space-y-1.5 flex-1">
        {rows.map((row, idx) => (
          <div key={idx} className="flex gap-1 items-center">
            <input
              type="text"
              placeholder="Concepto"
              value={row.concepto}
              onChange={e => onUpdate(idx, 'concepto', e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400 min-w-0"
            />
            <input
              type="number"
              min="0"
              placeholder="0"
              value={row.monto}
              onChange={e => onUpdate(idx, 'monto', e.target.value)}
              className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <button
              onClick={() => onRemove(idx)}
              className="text-gray-300 hover:text-red-400 transition-colors text-base leading-none flex-shrink-0"
              title="Eliminar fila"
            >×</button>
          </div>
        ))}
      </div>
      <button
        onClick={onAdd}
        className="mt-2 text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 self-start"
      >
        + Agregar
      </button>
      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-400">Subtotal</span>
        <span className="text-xs font-bold text-gray-700">${fmt(total)}</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CuadreDelDia({ batches }) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [gastos,    setGastos]    = useState(DEFAULT_GASTOS);
  const [overrides, setOverrides] = useState({});

  // Load persisted data when date changes
  useEffect(() => {
    const saved = loadFromStorage(selectedDate);
    if (saved) {
      setGastos(saved.gastos ?? DEFAULT_GASTOS());
      setOverrides(saved.overrides ?? {});
    } else {
      setGastos(DEFAULT_GASTOS());
      setOverrides({});
    }
  }, [selectedDate]);

  const persist = useCallback((g, ov) => {
    saveToStorage(selectedDate, { gastos: g, overrides: ov });
  }, [selectedDate]);

  // ─── Product table data ────────────────────────────────────────────────────
  const productRows = useMemo(() => {
    const dayBatches = batches.filter(b => {
      const raw = new Date(b.date);
      const utc = new Date(raw.getTime() + raw.getTimezoneOffset() * 60000);
      return utc.toISOString().split('T')[0] === selectedDate;
    });

    const groups = {};
    for (const b of dayBatches) {
      if (!groups[b.breadType]) {
        groups[b.breadType] = { breadType: b.breadType, entrada: 0, venta: 0, price: Number(b.price) || 0 };
      }
      groups[b.breadType].entrada += b.quantityMade;
      groups[b.breadType].venta   += b.sales.reduce((s, sale) => s + sale.quantitySold, 0);
    }

    return Object.values(groups).map(g => {
      const ov      = overrides[g.breadType] || {};
      const inicio  = numVal(ov.inicio ?? 0);
      const retorno = numVal(ov.retorno ?? 0);
      const total   = inicio + g.entrada;
      const merma   = Math.max(0, total - g.venta - retorno);
      const importe = g.venta * g.price;
      return { ...g, inicio, retorno, total, merma, importe };
    });
  }, [batches, selectedDate, overrides]);

  const totalImporte = useMemo(() => productRows.reduce((s, r) => s + r.importe, 0), [productRows]);
  const totalVenta   = useMemo(() => productRows.reduce((s, r) => s + r.venta,   0), [productRows]);

  // ─── Gasto totals ──────────────────────────────────────────────────────────
  const gastoTotals = useMemo(() => {
    const result = {};
    for (const col of GASTO_COLS) {
      result[col.key] = (gastos[col.key] || []).reduce((s, row) => s + numVal(row.monto), 0);
    }
    result.total = GASTO_COLS.reduce((s, col) => s + result[col.key], 0);
    return result;
  }, [gastos]);

  const utilidadNeta = totalImporte - gastoTotals.total;

  // ─── Gasto handlers ────────────────────────────────────────────────────────
  const addRow = colKey => {
    const next = { ...gastos, [colKey]: [...(gastos[colKey] || []), EMPTY_ROW()] };
    setGastos(next); persist(next, overrides);
  };

  const removeRow = (colKey, idx) => {
    const rows = (gastos[colKey] || []).filter((_, i) => i !== idx);
    const next = { ...gastos, [colKey]: rows.length ? rows : [EMPTY_ROW()] };
    setGastos(next); persist(next, overrides);
  };

  const updateRow = (colKey, idx, field, value) => {
    const rows = [...(gastos[colKey] || [])];
    rows[idx] = { ...rows[idx], [field]: value };
    const next = { ...gastos, [colKey]: rows };
    setGastos(next); persist(next, overrides);
  };

  const updateOverride = (breadType, field, value) => {
    const next = { ...overrides, [breadType]: { ...(overrides[breadType] || {}), [field]: value } };
    setOverrides(next); persist(gastos, next);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fadeInUp">

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>
              📋 Cuadre del Día
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Ventas cargadas automáticamente · Gastos e inventario inicial editables · Se guarda por fecha
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <label className="text-gray-500 font-medium whitespace-nowrap">Fecha:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Product table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Productos</h3>
            <p className="text-xs text-gray-400 mt-0.5">Inicio y Retorno son editables; el resto se calcula automáticamente</p>
          </div>
          {productRows.length > 0 && (
            <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
              {productRows.length} tipo{productRows.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Producto', 'Inicio ✏', 'Entrada', 'Total', 'Merma', 'Retorno ✏', 'Venta', 'Precio Venta', 'Importe'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-gray-400">
                    <div className="text-3xl mb-2">🍞</div>
                    No hay ventas registradas para esta fecha
                  </td>
                </tr>
              ) : (
                <>
                  {productRows.map(row => (
                    <tr key={row.breadType} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{row.breadType}</td>

                      {/* Inicio — editable */}
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          value={overrides[row.breadType]?.inicio ?? ''}
                          placeholder="0"
                          onChange={e => updateOverride(row.breadType, 'inicio', e.target.value)}
                          className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </td>

                      <td className="px-4 py-3 text-center text-gray-700">{row.entrada}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-800">{row.total}</td>

                      {/* Merma — calculada */}
                      <td className="px-4 py-3 text-center">
                        <span className={row.merma > 0 ? 'text-orange-600 font-semibold' : 'text-gray-300'}>{row.merma}</span>
                      </td>

                      {/* Retorno — editable */}
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          value={overrides[row.breadType]?.retorno ?? ''}
                          placeholder="0"
                          onChange={e => updateOverride(row.breadType, 'retorno', e.target.value)}
                          className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-center text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">{row.venta}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">${fmt(row.price)}</td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">${fmt(row.importe)}</td>
                    </tr>
                  ))}

                  {/* Total row */}
                  <tr className="bg-amber-50 border-t-2 border-amber-200 font-bold text-sm">
                    <td className="px-4 py-3 text-gray-800">TOTAL</td>
                    <td colSpan={5} />
                    <td className="px-4 py-3 text-center text-gray-800">{totalVenta}</td>
                    <td />
                    <td className="px-4 py-3 text-right text-amber-700">${fmt(totalImporte)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expense section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800">Gastos</h3>
          <p className="text-xs text-gray-400 mt-0.5">Los gastos se guardan automáticamente para esta fecha</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {GASTO_COLS.map(col => (
            <GastoColumn
              key={col.key}
              col={col}
              rows={gastos[col.key] || []}
              total={gastoTotals[col.key]}
              onAdd={() => addRow(col.key)}
              onRemove={idx => removeRow(col.key, idx)}
              onUpdate={(idx, field, val) => updateRow(col.key, idx, field, val)}
            />
          ))}
        </div>

        {/* Gastos subtotals summary */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {GASTO_COLS.map(col => (
            <div key={col.key} className="text-center">
              <p className="text-xs text-gray-400">{col.label}</p>
              <p className="text-sm font-bold text-gray-700">${fmt(gastoTotals[col.key])}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center">
          <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Total Importe</p>
          <p className="text-2xl font-extrabold text-emerald-700">${fmt(totalImporte)}</p>
          <p className="text-xs text-emerald-500 mt-1">{totalVenta} unidades vendidas</p>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-center">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Total Gastos</p>
          <p className="text-2xl font-extrabold text-red-700">${fmt(gastoTotals.total)}</p>
          <p className="text-xs text-red-400 mt-1">
            {GASTO_COLS.map(c => `${c.label.split(' ')[1]}: $${fmt(gastoTotals[c.key])}`).join(' · ')}
          </p>
        </div>
        <div className={`border rounded-2xl p-5 text-center ${utilidadNeta >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${utilidadNeta >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            Utilidad Neta
          </p>
          <p className={`text-2xl font-extrabold ${utilidadNeta >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            ${fmt(utilidadNeta)}
          </p>
          <p className={`text-xs mt-1 ${utilidadNeta >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
            {utilidadNeta >= 0 ? 'Ganancia del día' : 'Pérdida del día'}
          </p>
        </div>
      </div>
    </div>
  );
}
