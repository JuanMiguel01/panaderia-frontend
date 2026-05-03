// src/components/Dashboard/CuadreDelDia.jsx
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useToast } from '../Toast';

const PARTNERS = [
  { key: 'jm',     label: 'JM' },
  { key: 'michel', label: 'Michel' },
  { key: 'nadiel', label: 'Nadiel' },
];

const GASTO_CATS = [
  { key: 'generales', label: 'Gastos Generales', hint: 'Operativos del negocio (salarios, guardia, etc.). Restan de la utilidad bruta.' },
  { key: 'jm',        label: 'Gastos JM',        hint: 'Gastos personales de JM. Restan de su parte individual.' },
  { key: 'michel',    label: 'Gastos Michel',     hint: 'Gastos personales de Michel. Restan de su parte individual.' },
  { key: 'nadiel',    label: 'Gastos Nadiel',     hint: 'Gastos personales de Nadiel. Restan de su parte individual.' },
  { key: 'fondo',     label: 'Gastos del Fondo',  hint: 'Compras de insumos u otros gastos de caja. Restan del Fondo General pero NO afectan la utilidad.' },
];

function numV(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
function fmt(n)  { return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtQ(n) { return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

// ─── CSV / Excel export ───────────────────────────────────────────────────────

function exportToCSV({ date, productRows, totalVentas, inventoryItems, costoInsumos,
                       gastosMap, utilidadBruta, utilidadNeta, parteBase,
                       partnerCalc, fondos }) {
  const row  = (...cells) => cells.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',');
  const sep  = () => '';
  const lines = [];

  lines.push(row(`CUADRE DEL DÍA — ${date}`));
  lines.push(sep());

  // ── Productos ──
  lines.push(row('PRODUCTOS'));
  lines.push(row('Producto','Inicio','Entrada','Total','Merma','Retorno','Venta','Precio Venta','Importe'));
  for (const r of productRows) {
    lines.push(row(r.breadType, 0, r.entrada, r.total, r.merma, 0, r.venta, r.price, r.importe));
  }
  lines.push(row('','','','','','','Total Importe',''  , totalVentas));
  lines.push(sep());

  // ── Almacén ──
  lines.push(row('ALMACÉN'));
  lines.push(row('Insumo','Inicio','Entrada','Total','Salida','Final','Precio Costo','Costo Salida'));
  for (const i of inventoryItems) {
    lines.push(row(i.name, fmtQ(i.inicio), fmtQ(i.entrada),
      fmtQ(numV(i.inicio)+numV(i.entrada)), fmtQ(i.salida), fmtQ(i.final_qty),
      numV(i.unit_cost) > 0 ? fmt(i.unit_cost) : 0, numV(i.costo_salida) > 0 ? fmt(i.costo_salida) : 0));
  }
  lines.push(row('','','','','','','Total Costo Insumos', fmt(costoInsumos)));
  lines.push(sep());

  // ── Gastos ──
  lines.push(row('GASTOS', 'Generales', 'JM', 'Michel', 'Nadiel', 'Fondo'));
  lines.push(row('Total',
    fmt(gastosMap.generales), fmt(gastosMap.jm),
    fmt(gastosMap.michel),    fmt(gastosMap.nadiel), fmt(gastosMap.fondo || 0)));
  lines.push(sep());

  // ── Resultado ──
  lines.push(row('RESULTADO'));
  lines.push(row('Total Ventas','Costo Insumos','Utilidad Bruta','Gastos Generales','Utilidad Neta'));
  lines.push(row(fmt(totalVentas), fmt(costoInsumos), fmt(utilidadBruta), fmt(gastosMap.generales), fmt(utilidadNeta)));
  lines.push(sep());

  // ── Distribución ──
  lines.push(row('DISTRIBUCIÓN DE UTILIDADES'));
  lines.push(row('Socio','Parte Base (UN÷3)','Gastos Individuales','Utilidad Final'));
  for (const p of partnerCalc) {
    lines.push(row(p.label, fmt(parteBase), fmt(p.gastosInd), fmt(p.utilidadFinal)));
  }
  lines.push(sep());

  // ── Fondos ──
  lines.push(row('FONDOS ACUMULADOS'));
  lines.push(row('Fondo','Saldo'));
  const indFondos = fondos.filter(f => f.persona !== 'general');
  const genFondo  = fondos.find(f => f.persona === 'general');
  for (const f of indFondos) lines.push(row(f.persona.toUpperCase(), fmt(f.saldo)));
  if (genFondo) lines.push(row('GENERAL (Caja)', fmt(genFondo.saldo)));

  const csv = '﻿' + lines.join('\n'); // BOM for Excel UTF-8
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `cuadre_${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Fondo inicial setup ──────────────────────────────────────────────────────

function FondoSetup({ fondos, onAjustar }) {
  const [open,   setOpen]   = useState(false);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const FONDOS_LABELS = [
    { key: 'jm',      label: 'Fondo JM',      hint: 'Utilidades acumuladas de JM' },
    { key: 'michel',  label: 'Fondo Michel',   hint: 'Utilidades acumuladas de Michel' },
    { key: 'nadiel',  label: 'Fondo Nadiel',   hint: 'Utilidades acumuladas de Nadiel' },
    { key: 'general', label: 'Fondo General',  hint: 'Saldo de caja del negocio' },
  ];

  useEffect(() => {
    if (fondos.length) {
      const init = {};
      for (const f of fondos) init[f.persona] = String(numV(f.saldo));
      setValues(init);
    }
  }, [fondos]);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const { key } of FONDOS_LABELS) {
        if (values[key] !== undefined) await onAjustar(key, Number(values[key]));
      }
      toast.success('Fondos actualizados');
      setOpen(false);
    } catch { toast.error('Error al guardar fondos'); }
    finally { setSaving(false); }
  };

  return (
    <div className="border border-indigo-100 rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3 bg-indigo-50 hover:bg-indigo-100 transition-colors text-left">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-indigo-700">⚙️ Configurar saldos iniciales</span>
          <span className="text-xs text-indigo-400">— Úsalo una sola vez para establecer la base</span>
        </div>
        <span className={`text-indigo-400 text-xs transition-transform ${open ? '' : '-rotate-90'}`}>▼</span>
      </button>

      {open && (
        <div className="bg-white px-5 py-4 space-y-3">
          <p className="text-xs text-gray-500 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            ⚠️ Esto <strong>reemplaza</strong> el saldo actual. Úsalo solo para configurar el valor inicial o para corregir un error.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {FONDOS_LABELS.map(({ key, label, hint }) => (
              <div key={key}>
                <label className="text-xs font-medium text-gray-600 block mb-1">{label}</label>
                <input type="number" step="0.01"
                  value={values[key] ?? ''}
                  onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400"/>
                <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>
              </div>
            ))}
          </div>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
            {saving ? 'Guardando…' : 'Guardar saldos'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Gastos section ───────────────────────────────────────────────────────────

function GastosSection({ date, gastos, loading, onAdd, onDelete }) {
  const [drafts, setDrafts] = useState(
    Object.fromEntries(GASTO_CATS.map(c => [c.key, { concepto: '', monto: '' }]))
  );

  const totals = useMemo(() => {
    const t = {};
    for (const c of GASTO_CATS)
      t[c.key] = gastos.filter(g => g.category === c.key).reduce((s, g) => s + numV(g.monto), 0);
    return t;
  }, [gastos]);

  const handleAdd = async (cat) => {
    const d = drafts[cat];
    if (!d.monto || isNaN(Number(d.monto)) || Number(d.monto) <= 0) return;
    await onAdd({ date, category: cat, concepto: d.concepto, monto: Number(d.monto) });
    setDrafts(prev => ({ ...prev, [cat]: { concepto: '', monto: '' } }));
  };

  if (loading) return <div className="h-16 flex items-center justify-center text-gray-400 text-sm">Cargando…</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
      {GASTO_CATS.map(cat => {
        const rows  = gastos.filter(g => g.category === cat.key);
        const draft = drafts[cat.key];
        const isFondo = cat.key === 'fondo';
        return (
          <div key={cat.key} className={`border rounded-xl p-3 flex flex-col ${isFondo ? 'border-gray-200 bg-gray-50' : 'border-gray-100'}`}>
            <div className="flex items-start gap-1 mb-2">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex-1">{cat.label}</h4>
              {isFondo && <span className="text-[9px] bg-gray-200 text-gray-500 px-1 rounded font-medium">No afecta utilidad</span>}
            </div>
            <p className="text-[9px] text-gray-400 mb-2 leading-tight">{cat.hint}</p>

            <div className="space-y-1 flex-1 mb-2">
              {rows.map(g => (
                <div key={g.id} className="flex items-center gap-1 group">
                  <span className="flex-1 text-xs text-gray-600 truncate">{g.concepto || '—'}</span>
                  <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">${fmt(g.monto)}</span>
                  <button onClick={() => onDelete(g.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-base leading-none">×</button>
                </div>
              ))}
              {rows.length === 0 && <p className="text-xs text-gray-300 italic">Sin gastos</p>}
            </div>

            <div className="space-y-1 pt-2 border-t border-gray-100">
              <input type="text" placeholder="Concepto" value={draft.concepto}
                onChange={e => setDrafts(p => ({ ...p, [cat.key]: { ...p[cat.key], concepto: e.target.value } }))}
                className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"/>
              <div className="flex gap-1">
                <input type="number" min="0" placeholder="Monto" value={draft.monto}
                  onChange={e => setDrafts(p => ({ ...p, [cat.key]: { ...p[cat.key], monto: e.target.value } }))}
                  onKeyDown={e => e.key === 'Enter' && handleAdd(cat.key)}
                  className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-400"/>
                <button onClick={() => handleAdd(cat.key)} disabled={!draft.monto}
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-30 text-white text-xs font-bold rounded-lg">+</button>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between">
              <span className="text-xs text-gray-400">Total</span>
              <span className="text-xs font-bold text-gray-700">${fmt(totals[cat.key])}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Almacén section ──────────────────────────────────────────────────────────

function AlmacenSection({ items, loading }) {
  const totalCosto   = useMemo(() => items.reduce((s, i) => s + numV(i.costo_salida), 0), [items]);
  const hasMovements = items.some(i => numV(i.entrada) > 0 || numV(i.salida) > 0);

  if (loading) return <div className="h-16 flex items-center justify-center text-gray-400 text-sm">Cargando…</div>;

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['Insumo','Ud.','Inicio','Entrada','Total','Salida','Final','Costo/Ud.','Costo Salida'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.length === 0
              ? <tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm">Sin insumos</td></tr>
              : items.map(item => {
                  const hasMov = numV(item.entrada) > 0 || numV(item.salida) > 0;
                  return (
                    <tr key={item.id} className={`transition-colors ${hasMov ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-3 py-2 font-medium text-gray-900">{item.name}</td>
                      <td className="px-3 py-2 text-gray-400 text-center text-xs">{item.unit}</td>
                      <td className="px-3 py-2 text-center text-gray-600">{fmtQ(item.inicio)}</td>
                      <td className="px-3 py-2 text-center">
                        {numV(item.entrada) > 0
                          ? <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">{fmtQ(item.entrada)}</span>
                          : <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center font-semibold text-gray-700">{fmtQ(numV(item.inicio)+numV(item.entrada))}</td>
                      <td className="px-3 py-2 text-center">
                        {numV(item.salida) > 0
                          ? <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">{fmtQ(item.salida)}</span>
                          : <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-3 py-2 text-center text-gray-700 font-medium">{fmtQ(item.final_qty)}</td>
                      <td className="px-3 py-2 text-right text-gray-500 text-xs">
                        {numV(item.unit_cost) > 0 ? `$${fmt(item.unit_cost)}` : <span className="text-gray-200">—</span>}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-red-600">
                        {numV(item.costo_salida) > 0 ? `$${fmt(item.costo_salida)}` : <span className="text-gray-200 font-normal">—</span>}
                      </td>
                    </tr>
                  );
                })}
            {items.length > 0 && (
              <tr className="bg-red-50 border-t-2 border-red-200 font-bold">
                <td colSpan={8} className="px-3 py-2 text-right text-red-700 text-sm">Total Costo Insumos</td>
                <td className="px-3 py-2 text-right text-red-700">${fmt(totalCosto)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {!hasMovements && items.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-2">
          Sin movimientos para esta fecha — registra consumos en la sección <strong>Insumos</strong>.
        </p>
      )}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CuadreDelDia({ batches, onLogout }) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate,   setSelectedDate]   = useState(today);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [gastos,         setGastos]         = useState([]);
  const [fondos,         setFondos]         = useState([]);
  const [loadingInv,     setLoadingInv]     = useState(false);
  const [loadingGastos,  setLoadingGastos]  = useState(false);
  const [loadingFondos,  setLoadingFondos]  = useState(false);
  const [cierreResult,   setCierreResult]   = useState(null);
  const [doingCierre,    setDoingCierre]    = useState(false);
  const toast = useToast();

  const loadInventory = useCallback(async () => {
    setLoadingInv(true);
    try { setInventoryItems(await api.getInventoryDaily(selectedDate, onLogout)); }
    catch { toast.error('Error al cargar almacén'); }
    finally { setLoadingInv(false); }
  }, [selectedDate]);

  const loadGastos = useCallback(async () => {
    setLoadingGastos(true);
    try { setGastos(await api.getGastos(selectedDate, onLogout)); }
    catch { toast.error('Error al cargar gastos'); }
    finally { setLoadingGastos(false); }
  }, [selectedDate]);

  const loadFondos = useCallback(async () => {
    setLoadingFondos(true);
    try { setFondos(await api.getFondos(onLogout)); }
    catch { toast.error('Error al cargar fondos'); }
    finally { setLoadingFondos(false); }
  }, []);

  useEffect(() => { setCierreResult(null); loadInventory(); loadGastos(); }, [selectedDate]);
  useEffect(() => { loadFondos(); }, []);

  const handleAddGasto = async (data) => {
    try { setGastos(prev => [...prev, await api.createGasto(data, onLogout)]); }
    catch (err) { toast.error(err.message || 'Error al guardar gasto'); }
  };

  const handleDeleteGasto = async (id) => {
    try { await api.deleteGasto(id, onLogout); setGastos(prev => prev.filter(g => g.id !== id)); }
    catch { toast.error('Error al eliminar gasto'); }
  };

  const handleAjustarFondo = async (persona, saldo) => {
    await api.ajustarFondo(persona, saldo, onLogout);
    await loadFondos();
  };

  const handleCierre = async () => {
    if (!window.confirm(`¿Procesar cierre del ${selectedDate}?\nLos fondos individuales y el fondo general se actualizarán.`)) return;
    setDoingCierre(true);
    try {
      const result = await api.cierreDiario(selectedDate, onLogout);
      setCierreResult(result);
      setFondos(result.fondos);
      toast.success('Cierre procesado');
    } catch (err) { toast.error(err.message || 'Error en el cierre'); }
    finally { setDoingCierre(false); }
  };

  // ── Product table ────────────────────────────────────────────────────────
  const productRows = useMemo(() => {
    const dayBatches = batches.filter(b => {
      const raw = new Date(b.date);
      const utc = new Date(raw.getTime() + raw.getTimezoneOffset() * 60000);
      return utc.toISOString().split('T')[0] === selectedDate;
    });
    const groups = {};
    for (const b of dayBatches) {
      if (!groups[b.breadType])
        groups[b.breadType] = { breadType: b.breadType, entrada: 0, venta: 0, price: Number(b.price) || 0 };
      groups[b.breadType].entrada += b.quantityMade;
      groups[b.breadType].venta   += b.sales.reduce((s, sale) => sale.isGift ? s : s + sale.quantitySold, 0);
    }
    return Object.values(groups).map(g => ({
      ...g, total: g.entrada,
      merma:   Math.max(0, g.entrada - g.venta),
      importe: g.venta * g.price,
    }));
  }, [batches, selectedDate]);

  const totalVentas  = useMemo(() => productRows.reduce((s, r) => s + r.importe, 0), [productRows]);
  const totalVendido = useMemo(() => productRows.reduce((s, r) => s + r.venta,   0), [productRows]);

  // ── P&L ─────────────────────────────────────────────────────────────────
  const costoInsumos = useMemo(() => inventoryItems.reduce((s, i) => s + numV(i.costo_salida), 0), [inventoryItems]);

  const gastosMap = useMemo(() => {
    const m = {};
    for (const c of GASTO_CATS)
      m[c.key] = gastos.filter(g => g.category === c.key).reduce((s, g) => s + numV(g.monto), 0);
    return m;
  }, [gastos]);

  const utilidadBruta = totalVentas - costoInsumos;
  const utilidadNeta  = utilidadBruta - gastosMap.generales;
  const parteBase     = utilidadNeta / 3;

  const partnerCalc = useMemo(() => PARTNERS.map(p => ({
    ...p,
    gastosInd:      gastosMap[p.key] || 0,
    utilidadFinal:  parteBase - (gastosMap[p.key] || 0),
  })), [parteBase, gastosMap]);

  // ── Fondos split ─────────────────────────────────────────────────────────
  const fondosInd = fondos.filter(f => f.persona !== 'general');
  const fondoGen  = fondos.find(f => f.persona === 'general');
  const sumaInd   = fondosInd.reduce((s, f) => s + numV(f.saldo), 0);

  const handleExport = () => exportToCSV({
    date: selectedDate, productRows, totalVentas, inventoryItems, costoInsumos,
    gastosMap, utilidadBruta, utilidadNeta, parteBase, partnerCalc, fondos,
  });

  return (
    <div className="space-y-6 animate-fadeInUp">

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily:"'Playfair Display',serif" }}>
                📋 Cuadre del Día
              </h2>
              <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">Solo Admin</span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Ventas automáticas · Almacén del inventario · Gastos guardados en servidor</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
            <button onClick={handleExport}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
              📊 Excel
            </button>
            <button onClick={handleCierre} disabled={doingCierre}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm whitespace-nowrap">
              {doingCierre ? '⏳…' : '✅ Cierre'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Productos ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Productos Vendidos</h3>
            <p className="text-xs text-gray-400 mt-0.5">Datos automáticos · Regalos excluidos</p>
          </div>
          {productRows.length > 0 && <span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">{productRows.length} tipos</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[580px] text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Producto','Entrada','Total','Merma','Venta','Precio','Importe'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productRows.length === 0
                ? <tr><td colSpan={7} className="text-center py-10 text-gray-400"><div className="text-3xl mb-1">🍞</div>Sin ventas</td></tr>
                : <>
                  {productRows.map(r => (
                    <tr key={r.breadType} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-gray-900">{r.breadType}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{r.entrada}</td>
                      <td className="px-3 py-2.5 text-center font-semibold">{r.total}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={r.merma > 0 ? 'text-orange-600 font-medium' : 'text-gray-300'}>{r.merma}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">{r.venta}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-gray-500">${fmt(r.price)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-emerald-600">${fmt(r.importe)}</td>
                    </tr>
                  ))}
                  <tr className="bg-emerald-50 border-t-2 border-emerald-200 font-bold">
                    <td className="px-3 py-2.5 text-gray-800">TOTAL</td>
                    <td colSpan={3}/>
                    <td className="px-3 py-2.5 text-center">{totalVendido}</td>
                    <td/>
                    <td className="px-3 py-2.5 text-right text-emerald-700">${fmt(totalVentas)}</td>
                  </tr>
                </>
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Almacén ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">Almacén — Movimientos del Día</h3>
            <p className="text-xs text-gray-400 mt-0.5">Compras y consumos registrados en Insumos para esta fecha</p>
          </div>
          {costoInsumos > 0 && <span className="text-xs bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-full">Costo: ${fmt(costoInsumos)}</span>}
        </div>
        <div className="p-5">
          <AlmacenSection items={inventoryItems} loading={loadingInv}/>
        </div>
      </div>

      {/* ── Gastos ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-1">Gastos</h3>
        <p className="text-xs text-gray-400 mb-4">Guardados en servidor · Click ×  para eliminar · Enter para agregar rápido</p>
        <GastosSection date={selectedDate} gastos={gastos} loading={loadingGastos}
          onAdd={handleAddGasto} onDelete={handleDeleteGasto}/>
      </div>

      {/* ── P&L ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Resultado del Día</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
          {[
            { l: 'Ventas',         v: totalVentas,          c: 'text-emerald-700 bg-emerald-50 border-emerald-100', sub: `${totalVendido} uds.` },
            { l: 'Costo Insumos',  v: costoInsumos,         c: 'text-red-700 bg-red-50 border-red-100',            sub: 'Consumo × precio prom.' },
            { l: 'Utilidad Bruta', v: utilidadBruta,        c: `${utilidadBruta>=0?'text-blue-700 bg-blue-50 border-blue-100':'text-orange-700 bg-orange-50 border-orange-100'}`, sub: 'Ventas − Insumos' },
            { l: 'G. Generales',   v: gastosMap.generales,  c: 'text-orange-700 bg-orange-50 border-orange-100',   sub: 'Salarios, guardia…' },
            { l: 'Utilidad Neta',  v: utilidadNeta,         c: `${utilidadNeta>=0?'text-indigo-700 bg-indigo-50 border-indigo-100':'text-red-700 bg-red-50 border-red-100'}`, sub: 'U.Bruta − G.Generales' },
          ].map(({ l, v, c, sub }) => (
            <div key={l} className={`border rounded-2xl p-3 ${c}`}>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">{l}</p>
              <p className="text-lg font-extrabold">${fmt(v)}</p>
              <p className="text-xs opacity-60 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Distribución ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-800 mb-1">Distribución de Utilidades</h3>
        <p className="text-xs text-gray-400 mb-4">Utilidad Neta ÷ 3 socios, luego se restan los gastos individuales de cada uno</p>
        <div className="grid md:grid-cols-3 gap-4">
          {partnerCalc.map(p => (
            <div key={p.key} className="border border-gray-100 rounded-xl p-4">
              <h4 className="font-bold text-gray-800 mb-3">{p.label}</h4>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Parte (UN÷3)</span>
                  <span className="font-medium text-gray-700">${fmt(parteBase)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Gastos propios</span>
                  <span className="font-medium text-red-600">−${fmt(p.gastosInd)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-100 font-bold">
                  <span className="text-gray-700">Utilidad Final</span>
                  <span className={p.utilidadFinal >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                    ${fmt(p.utilidadFinal)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fondos ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-800">Fondos</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Los <strong>fondos individuales</strong> acumulan las utilidades de cada socio.
            El <strong>Fondo General</strong> es la posición de caja del negocio (ventas − gastos del fondo).
            Son conceptos separados.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Fondos individuales */}
          <div className="border border-gray-100 rounded-xl p-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Fondos Individuales — Utilidades acumuladas</h4>
            <div className="space-y-2">
              {fondosInd.map(f => (
                <div key={f.persona} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 capitalize">{f.persona}</span>
                  <span className={`font-bold text-base ${numV(f.saldo) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${fmt(f.saldo)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400">Suma</span>
                <span className="text-sm font-bold text-gray-600">${fmt(sumaInd)}</span>
              </div>
            </div>
          </div>

          {/* Fondo general */}
          <div className="border border-indigo-100 bg-indigo-50/30 rounded-xl p-4">
            <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Fondo General — Caja del negocio</h4>
            <p className="text-[10px] text-indigo-400 mb-3">Se actualiza con: Fondo anterior + Ventas − Gastos del Fondo</p>
            {fondoGen
              ? <p className={`text-3xl font-extrabold ${numV(fondoGen.saldo) >= 0 ? 'text-indigo-700' : 'text-red-600'}`}>
                  ${fmt(fondoGen.saldo)}
                </p>
              : <p className="text-gray-400 text-sm">Sin datos</p>
            }
            {fondoGen && (
              <div className="mt-3 pt-3 border-t border-indigo-100">
                <div className="flex justify-between text-xs">
                  <span className="text-indigo-400">Diferencia con suma individual</span>
                  <span className={`font-bold ${Math.abs(numV(fondoGen.saldo) - sumaInd) < 1 ? 'text-emerald-600' : 'text-orange-500'}`}>
                    {Math.abs(numV(fondoGen.saldo) - sumaInd) < 1 ? '✓ Cuadra' : `$${fmt(Math.abs(numV(fondoGen.saldo) - sumaInd))} de diferencia`}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Setup inicial */}
        <FondoSetup fondos={fondos} onAjustar={handleAjustarFondo}/>
      </div>

      {/* ── Resultado del cierre ── */}
      {cierreResult && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-indigo-800">✅ Cierre procesado — {cierreResult.date}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              ['Ventas',       fmt(cierreResult.totalVentas)],
              ['C. Insumos',   fmt(cierreResult.totalCostoInsumos)],
              ['G. Generales', fmt(cierreResult.gastosGenerales)],
              ['Util. Neta',   fmt(cierreResult.utilidadNeta)],
            ].map(([l,v]) => (
              <div key={l} className="bg-white rounded-xl px-3 py-2 text-center border border-indigo-100">
                <p className="text-xs text-indigo-400">{l}</p>
                <p className="font-bold text-indigo-800">${v}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-3">
            {cierreResult.movements.map(m => (
              <div key={m.persona} className="bg-white rounded-xl px-3 py-2 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-600 uppercase">{m.persona}</p>
                <p className="text-xs text-gray-500">Parte ${fmt(m.parteBase)} · G.Ind ${fmt(m.gastosInd)}</p>
                <p className={`font-bold ${m.utilidadFinal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  Final: ${fmt(m.utilidadFinal)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
