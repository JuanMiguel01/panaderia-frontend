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
  { key: 'generales', label: 'Gastos Generales', color: 'orange' },
  { key: 'jm',        label: 'Gastos JM',        color: 'blue'   },
  { key: 'michel',    label: 'Gastos Michel',     color: 'purple' },
  { key: 'nadiel',    label: 'Gastos Nadiel',     color: 'pink'   },
  { key: 'fondo',     label: 'Gastos del Fondo',  color: 'gray'   },
];

function numV(v) { const n = parseFloat(v); return isNaN(n) ? 0 : n; }
function fmt(n)  { return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function fmtQ(n) { return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

// ─── Small reusable UI ────────────────────────────────────────────────────────

function SectionCard({ title, subtitle, children, badge }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
        {badge}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function KpiCard({ label, value, sub, color = 'blue' }) {
  const palette = {
    green:  'bg-emerald-50 border-emerald-100 text-emerald-600 val-emerald-700',
    red:    'bg-red-50 border-red-100 text-red-600 val-red-700',
    blue:   'bg-blue-50 border-blue-100 text-blue-600 val-blue-700',
    orange: 'bg-orange-50 border-orange-100 text-orange-600 val-orange-700',
    amber:  'bg-amber-50 border-amber-100 text-amber-600 val-amber-700',
    gray:   'bg-gray-50 border-gray-100 text-gray-500 val-gray-700',
  };
  const [bg, border, lbl] = (palette[color] || palette.blue).split(' ');
  return (
    <div className={`${bg} ${border} border rounded-2xl p-4 text-center`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${lbl}`}>{label}</p>
      <p className={`text-xl font-extrabold text-gray-800`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Gastos section (pulls from DB) ──────────────────────────────────────────

function GastosSection({ date, gastos, loading, onAdd, onDelete }) {
  const [drafts, setDrafts] = useState(
    Object.fromEntries(GASTO_CATS.map(c => [c.key, { concepto: '', monto: '' }]))
  );

  const totals = useMemo(() => {
    const t = {};
    for (const c of GASTO_CATS) {
      t[c.key] = gastos.filter(g => g.category === c.key).reduce((s, g) => s + numV(g.monto), 0);
    }
    t.all = GASTO_CATS.reduce((s, c) => s + t[c.key], 0);
    return t;
  }, [gastos]);

  const handleAdd = async (cat) => {
    const d = drafts[cat];
    if (!d.monto || isNaN(Number(d.monto)) || Number(d.monto) <= 0) return;
    await onAdd({ date, category: cat, concepto: d.concepto, monto: Number(d.monto) });
    setDrafts(prev => ({ ...prev, [cat]: { concepto: '', monto: '' } }));
  };

  if (loading) return <div className="h-20 flex items-center justify-center text-gray-400 text-sm">Cargando gastos…</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {GASTO_CATS.map(cat => {
        const rows = gastos.filter(g => g.category === cat.key);
        const draft = drafts[cat.key];
        return (
          <div key={cat.key} className="border border-gray-100 rounded-xl p-3 flex flex-col">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{cat.label}</h4>

            {/* Existing rows */}
            <div className="space-y-1 flex-1 mb-2">
              {rows.map(g => (
                <div key={g.id} className="flex items-center gap-1 group">
                  <span className="flex-1 text-xs text-gray-600 truncate" title={g.concepto}>{g.concepto || '—'}</span>
                  <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">${fmt(g.monto)}</span>
                  <button onClick={() => onDelete(g.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all text-base leading-none">×</button>
                </div>
              ))}
              {rows.length === 0 && <p className="text-xs text-gray-300 italic">Sin gastos</p>}
            </div>

            {/* Add row */}
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
                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-30 text-white text-xs font-bold rounded-lg transition-colors">+</button>
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
  const totalCosto = useMemo(() => items.reduce((s, i) => s + numV(i.costo_salida), 0), [items]);
  const hasMovements = items.some(i => numV(i.entrada) > 0 || numV(i.salida) > 0);

  if (loading) return <div className="h-20 flex items-center justify-center text-gray-400 text-sm">Cargando almacén…</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {['Insumo','Unidad','Inicio','Entrada','Total','Salida','Final','Costo Unit.','Costo Salida'].map(h => (
              <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.length === 0 ? (
            <tr><td colSpan={9} className="text-center py-10 text-gray-400 text-sm">No hay insumos registrados</td></tr>
          ) : items.map(item => {
            const hasMov = numV(item.entrada) > 0 || numV(item.salida) > 0;
            return (
              <tr key={item.id} className={`transition-colors ${hasMov ? 'bg-amber-50/40 hover:bg-amber-50/70' : 'hover:bg-gray-50/60'}`}>
                <td className="px-3 py-2.5 font-medium text-gray-900">{item.name}</td>
                <td className="px-3 py-2.5 text-gray-500 text-center">{item.unit}</td>
                <td className="px-3 py-2.5 text-center text-gray-600">{fmtQ(item.inicio)}</td>
                <td className="px-3 py-2.5 text-center">
                  {numV(item.entrada) > 0
                    ? <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">{fmtQ(item.entrada)}</span>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2.5 text-center font-semibold text-gray-700">{fmtQ(numV(item.inicio) + numV(item.entrada))}</td>
                <td className="px-3 py-2.5 text-center">
                  {numV(item.salida) > 0
                    ? <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">{fmtQ(item.salida)}</span>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2.5 text-center text-gray-700 font-medium">{fmtQ(item.final_qty)}</td>
                <td className="px-3 py-2.5 text-right text-gray-500">
                  {numV(item.unit_cost) > 0 ? `$${fmt(item.unit_cost)}` : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-red-600">
                  {numV(item.costo_salida) > 0 ? `$${fmt(item.costo_salida)}` : <span className="text-gray-300 font-normal">—</span>}
                </td>
              </tr>
            );
          })}
          {items.length > 0 && (
            <tr className="bg-red-50 border-t-2 border-red-200 font-bold">
              <td colSpan={8} className="px-3 py-2.5 text-right text-red-700">Costo Total de Insumos</td>
              <td className="px-3 py-2.5 text-right text-red-700">${fmt(totalCosto)}</td>
            </tr>
          )}
        </tbody>
      </table>
      {!hasMovements && items.length > 0 && (
        <p className="text-xs text-gray-400 text-center mt-2">
          Sin movimientos para esta fecha. Registra consumos en la sección Insumos.
        </p>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CuadreDelDia({ batches, onLogout }) {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [gastos,         setGastos]         = useState([]);
  const [fondos,         setFondos]         = useState([]);
  const [loadingInv,     setLoadingInv]     = useState(false);
  const [loadingGastos,  setLoadingGastos]  = useState(false);
  const [loadingFondos,  setLoadingFondos]  = useState(false);
  const [cierreResult,   setCierreResult]   = useState(null);
  const [doingCierre,    setDoingCierre]    = useState(false);
  const toast = useToast();

  // ── Fetch inventory daily ──────────────────────────────────────────────────
  const loadInventory = useCallback(async () => {
    setLoadingInv(true);
    try { setInventoryItems(await api.getInventoryDaily(selectedDate, onLogout)); }
    catch { toast.error('Error al cargar almacén'); }
    finally { setLoadingInv(false); }
  }, [selectedDate]);

  // ── Fetch gastos ───────────────────────────────────────────────────────────
  const loadGastos = useCallback(async () => {
    setLoadingGastos(true);
    try { setGastos(await api.getGastos(selectedDate, onLogout)); }
    catch { toast.error('Error al cargar gastos'); }
    finally { setLoadingGastos(false); }
  }, [selectedDate]);

  // ── Fetch fondos ───────────────────────────────────────────────────────────
  const loadFondos = useCallback(async () => {
    setLoadingFondos(true);
    try { setFondos(await api.getFondos(onLogout)); }
    catch { toast.error('Error al cargar fondos'); }
    finally { setLoadingFondos(false); }
  }, []);

  useEffect(() => {
    setCierreResult(null);
    loadInventory();
    loadGastos();
  }, [selectedDate]);

  useEffect(() => { loadFondos(); }, []);

  // ── Gastos handlers ────────────────────────────────────────────────────────
  const handleAddGasto = async (data) => {
    try {
      const g = await api.createGasto(data, onLogout);
      setGastos(prev => [...prev, g]);
    } catch (err) { toast.error(err.message || 'Error al guardar gasto'); }
  };

  const handleDeleteGasto = async (id) => {
    try {
      await api.deleteGasto(id, onLogout);
      setGastos(prev => prev.filter(g => g.id !== id));
    } catch { toast.error('Error al eliminar gasto'); }
  };

  // ── Cierre diario ──────────────────────────────────────────────────────────
  const handleCierre = async () => {
    if (!window.confirm(`¿Procesar cierre del ${selectedDate}? Los fondos de los socios se actualizarán.`)) return;
    setDoingCierre(true);
    try {
      const result = await api.cierreDiario(selectedDate, onLogout);
      setCierreResult(result);
      setFondos(result.fondos);
      toast.success('Cierre procesado correctamente');
    } catch (err) { toast.error(err.message || 'Error al procesar cierre'); }
    finally { setDoingCierre(false); }
  };

  // ── Product table (from batches prop) ─────────────────────────────────────
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
      ...g,
      total:   g.entrada,
      merma:   Math.max(0, g.entrada - g.venta),
      importe: g.venta * g.price,
    }));
  }, [batches, selectedDate]);

  const totalVentas  = useMemo(() => productRows.reduce((s, r) => s + r.importe, 0), [productRows]);
  const totalVendido = useMemo(() => productRows.reduce((s, r) => s + r.venta,   0), [productRows]);

  // ── Financial calculations ─────────────────────────────────────────────────
  const costoInsumos = useMemo(
    () => inventoryItems.reduce((s, i) => s + numV(i.costo_salida), 0),
    [inventoryItems]
  );

  const gastosMap = useMemo(() => {
    const m = {};
    for (const c of GASTO_CATS) m[c.key] = gastos.filter(g => g.category === c.key).reduce((s, g) => s + numV(g.monto), 0);
    m.total = GASTO_CATS.reduce((s, c) => s + m[c.key], 0);
    return m;
  }, [gastos]);

  const utilidadBruta = totalVentas - costoInsumos;
  const utilidadNeta  = utilidadBruta - gastosMap.generales;
  const parteBase     = utilidadNeta / 3;

  const partnerCalc = useMemo(() => PARTNERS.map(p => ({
    ...p,
    gastosInd:     gastosMap[p.key] || 0,
    utilidadFinal: parteBase - (gastosMap[p.key] || 0),
  })), [parteBase, gastosMap]);

  const fondoGeneral  = fondos.reduce((s, f) => s + numV(f.saldo), 0);
  const fondoTotal    = fondos.reduce((s, f) => s + numV(f.saldo), 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fadeInUp">

      {/* ── Header ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>
              📋 Cuadre del Día
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Ventas automáticas · Almacén del inventario · Gastos guardados en servidor
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-gray-500 font-medium whitespace-nowrap">Fecha:</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"/>
            </div>
            <button onClick={handleCierre} disabled={doingCierre}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm whitespace-nowrap">
              {doingCierre ? '⏳ Procesando…' : '✅ Cierre del Día'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Ventas (products) ── */}
      <SectionCard
        title="Productos Vendidos"
        subtitle="Datos de ventas cargados automáticamente · Regalos excluidos"
        badge={<span className="text-xs bg-amber-100 text-amber-700 font-semibold px-2.5 py-1 rounded-full">{productRows.length} tipo{productRows.length !== 1 ? 's' : ''}</span>}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Producto','Entrada','Total','Merma','Venta','Precio','Importe'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productRows.length === 0
                ? <tr><td colSpan={7} className="text-center py-10 text-gray-400"><div className="text-3xl mb-1">🍞</div>Sin ventas para esta fecha</td></tr>
                : <>
                  {productRows.map(r => (
                    <tr key={r.breadType} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-3 py-2.5 font-medium text-gray-900">{r.breadType}</td>
                      <td className="px-3 py-2.5 text-center text-gray-600">{r.entrada}</td>
                      <td className="px-3 py-2.5 text-center font-semibold text-gray-700">{r.total}</td>
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
                    <td className="px-3 py-2.5 text-center text-gray-700">{totalVendido}</td>
                    <td/>
                    <td className="px-3 py-2.5 text-right text-emerald-700">${fmt(totalVentas)}</td>
                  </tr>
                </>
              }
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Almacén ── */}
      <SectionCard
        title="Almacén — Movimientos del Día"
        subtitle="Entradas (compras) y consumos registrados en Insumos"
        badge={
          costoInsumos > 0
            ? <span className="text-xs bg-red-100 text-red-700 font-semibold px-2.5 py-1 rounded-full">Costo: ${fmt(costoInsumos)}</span>
            : null
        }
      >
        <AlmacenSection items={inventoryItems} loading={loadingInv}/>
      </SectionCard>

      {/* ── Gastos ── */}
      <SectionCard
        title="Gastos"
        subtitle="Guardados en el servidor · Haz clic en × para eliminar una fila"
      >
        <GastosSection
          date={selectedDate}
          gastos={gastos}
          loading={loadingGastos}
          onAdd={handleAddGasto}
          onDelete={handleDeleteGasto}
        />
      </SectionCard>

      {/* ── P&L Summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Total Ventas"      value={`$${fmt(totalVentas)}`}    sub={`${totalVendido} uds.`}      color="green"/>
        <KpiCard label="Costo Insumos"     value={`$${fmt(costoInsumos)}`}   sub="Consumo del día"             color="red"/>
        <KpiCard label="Utilidad Bruta"    value={`$${fmt(utilidadBruta)}`}  sub="Ventas − Insumos"            color={utilidadBruta >= 0 ? 'blue' : 'red'}/>
        <KpiCard label="Gastos Generales"  value={`$${fmt(gastosMap.generales)}`} sub="Operativos"             color="orange"/>
      </div>

      {/* ── Distribución ── */}
      <SectionCard title="Distribución de Utilidades" subtitle="Utilidad Neta ÷ 3 socios, menos gastos individuales">
        <div className="grid md:grid-cols-3 gap-4">
          {partnerCalc.map(p => (
            <div key={p.key} className="border border-gray-100 rounded-xl p-4 space-y-2">
              <h4 className="font-bold text-gray-800 text-base">{p.label}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Parte base (UN÷3)</span>
                  <span className="font-medium text-gray-700">${fmt(parteBase)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Gastos individuales</span>
                  <span className="font-medium text-red-600">−${fmt(p.gastosInd)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-gray-100 font-bold">
                  <span className="text-gray-700">Utilidad Final</span>
                  <span className={p.utilidadFinal >= 0 ? 'text-emerald-600' : 'text-red-600'}>${fmt(p.utilidadFinal)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-400">Utilidad Neta</p>
            <p className={`font-bold text-base ${utilidadNeta >= 0 ? 'text-blue-700' : 'text-red-600'}`}>${fmt(utilidadNeta)}</p>
            <p className="text-xs text-gray-400">Bruta − G.Generales</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Parte por socio</p>
            <p className={`font-bold text-base ${parteBase >= 0 ? 'text-blue-700' : 'text-red-600'}`}>${fmt(parteBase)}</p>
            <p className="text-xs text-gray-400">UN ÷ 3</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Gastos del Fondo</p>
            <p className="font-bold text-base text-gray-500">${fmt(gastosMap.fondo || 0)}</p>
            <p className="text-xs text-gray-400">No afectan utilidad</p>
          </div>
        </div>
      </SectionCard>

      {/* ── Fondos acumulados ── */}
      <SectionCard
        title="Fondos Acumulados"
        subtitle={loadingFondos ? 'Cargando…' : `Fondo general: $${fmt(fondoTotal)}`}
      >
        {fondos.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Sin datos de fondos</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {fondos.map(f => (
              <div key={f.persona} className="border border-gray-100 rounded-xl p-4 text-center">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 capitalize">{f.persona}</p>
                <p className={`text-2xl font-extrabold ${numV(f.saldo) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  ${fmt(f.saldo)}
                </p>
              </div>
            ))}
          </div>
        )}
        {/* Validación */}
        {fondos.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Suma fondos individuales</span>
            <span className="font-bold text-gray-800">${fmt(fondoGeneral)}</span>
          </div>
        )}
      </SectionCard>

      {/* ── Resultado del último cierre ── */}
      {cierreResult && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-3">
          <h3 className="font-bold text-indigo-800">✅ Cierre procesado — {cierreResult.date}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              ['Ventas',        fmt(cierreResult.totalVentas)],
              ['Costo Insumos', fmt(cierreResult.totalCostoInsumos)],
              ['G. Generales',  fmt(cierreResult.gastosGenerales)],
              ['Util. Neta',    fmt(cierreResult.utilidadNeta)],
            ].map(([l,v]) => (
              <div key={l} className="bg-white rounded-xl px-3 py-2 text-center border border-indigo-100">
                <p className="text-xs text-indigo-500">{l}</p>
                <p className="font-bold text-indigo-800">${v}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            {cierreResult.movements.map(m => (
              <div key={m.persona} className="bg-white rounded-xl px-3 py-2 border border-indigo-100">
                <p className="text-xs font-bold text-indigo-600 uppercase">{m.persona}</p>
                <p className="text-xs text-gray-500">Parte: ${fmt(m.parteBase)} · G.Ind: ${fmt(m.gastosInd)}</p>
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
