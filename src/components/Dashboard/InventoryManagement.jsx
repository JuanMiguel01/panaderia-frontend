// src/components/Dashboard/InventoryManagement.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../Toast';
import { useConfirm } from '../ConfirmModal';

const fmtDateTime = d => new Date(d).toLocaleDateString('es-ES', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });

function HistoryModal({ item, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    api.getInventoryLogs(item.id).then(data => { setLogs(data); setLoading(false); })
      .catch(() => { toast.error('Error al cargar historial'); setLoading(false); });
  }, [item.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900">{item.name}</h3>
            <p className="text-xs text-gray-500">Historial de cambios</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"/></div>
          ) : logs.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No hay registros de historial</p>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className={`flex items-center gap-3 p-3 rounded-xl ${log.change_amount > 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${log.change_amount > 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
                    {log.change_amount > 0 ? '+' : '−'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm ${log.change_amount > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                        {log.change_amount > 0 ? '+' : ''}{log.change_amount} {item.unit}
                      </span>
                      <span className="text-xs text-gray-400">{fmtDateTime(log.created_at)}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {log.user_email} · {log.quantity_before} → {log.quantity_after} {item.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function InventoryManagement({ onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ name:'', quantity:'', unit:'' });
  const [updateAmounts, setUpdateAmounts] = useState({});
  const [updateCosts,   setUpdateCosts]   = useState({});
  const [updateTypes,   setUpdateTypes]   = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [search, setSearch] = useState('');
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const UNIT_PRESETS = ['kg', 'g', 'l', 'ml', 'uds', 'bolsas', 'piezas'];

  const load = async () => {
    try {
      const data = await api.getInventory(onLogout);
      setItems(data);
    } catch { toast.error('Error al cargar el inventario'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createInventoryItem(newItem, onLogout);
      setNewItem({ name:'', quantity:'', unit:'' });
      setShowForm(false);
      await load();
      toast.success('Insumo creado');
    } catch (err) { toast.error(err.message || 'Error al crear'); }
  };

  const handleUpdate = async (id) => {
    const type   = updateTypes[id] || 'compra';
    const amount = Number(updateAmounts[id]);
    const cost   = updateCosts[id] !== undefined ? Number(updateCosts[id]) : undefined;
    if (!updateAmounts[id] || isNaN(amount) || amount === 0) { toast.warning('Ingresa una cantidad válida'); return; }
    if (type === 'compra' && (cost === undefined || isNaN(cost) || cost < 0)) { toast.warning('Ingresa el costo unitario de la compra'); return; }
    const change = type === 'compra' ? Math.abs(amount) : -Math.abs(amount);
    const unitCost = type === 'compra' ? cost : undefined;
    try {
      await api.updateInventoryItem(id, change, unitCost, onLogout);
      setUpdateAmounts(a => ({...a, [id]: ''}));
      setUpdateCosts(a  => ({...a, [id]: ''}));
      await load();
      toast.success(type === 'compra' ? `Entrada: +${Math.abs(change)} (costo $${cost}/u)` : `Consumo: -${Math.abs(change)}`);
    } catch (err) { toast.error(err.message || 'Error al actualizar'); }
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({ title:`Eliminar "${name}"`, message:'Se eliminará el insumo y todo su historial.', confirmText:'Eliminar', icon:'🌾' });
    if (!ok) return;
    try { await api.deleteInventoryItem(id, onLogout); await load(); toast.success('Insumo eliminado'); }
    catch { toast.error('Error al eliminar'); }
  };

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"/>
    </div>
  );

  return (
    <>
      {ConfirmDialog}
      {selectedItem && <HistoryModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
      <div className="space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900" style={{fontFamily:"'Playfair Display',serif"}}>🌾 Inventario de Insumos</h2>
            <p className="text-sm text-gray-500 mt-0.5">{items.length} insumos registrados</p>
          </div>
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
            <svg className={`w-4 h-4 transition-transform ${showForm ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            {showForm ? 'Cancelar' : 'Añadir Insumo'}
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4">Nuevo insumo</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xs font-medium text-gray-500 block mb-1">Nombre *</label>
                  <input type="text" value={newItem.name} onChange={e => setNewItem(n=>({...n,name:e.target.value}))} required
                    placeholder="Ej: Harina 000"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Cantidad inicial *</label>
                  <input type="number" value={newItem.quantity} onChange={e => setNewItem(n=>({...n,quantity:e.target.value}))} required
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Unidad *</label>
                  <div className="flex gap-2">
                    <input type="text" value={newItem.unit} onChange={e => setNewItem(n=>({...n,unit:e.target.value}))} required
                      placeholder="kg"
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {UNIT_PRESETS.map(u => (
                      <button key={u} type="button" onClick={() => setNewItem(n=>({...n,unit:u}))}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-all ${newItem.unit===u ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 text-gray-500 hover:border-amber-300'}`}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors">
                Crear Insumo
              </button>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
          </svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar insumo..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"/>
        </div>

        {/* Items grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="text-4xl mb-2">🌾</div>
            <p className="text-gray-500">No se encontraron insumos</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(item => {
              const type    = updateTypes[item.id]   || 'compra';
              const amount  = updateAmounts[item.id] || '';
              const cost    = updateCosts[item.id]   || '';
              const delta   = amount ? (type === 'compra' ? Math.abs(Number(amount)) : -Math.abs(Number(amount))) : null;
              const preview = delta !== null ? Number(item.quantity) + delta : null;
              const isLow   = item.quantity < 10;
              return (
                <div key={item.id} className={`bg-white rounded-2xl border shadow-sm p-4 transition-all ${isLow ? 'border-red-200' : 'border-gray-100 hover:border-amber-200'}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900">{item.name}</h4>
                      {isLow && <span className="text-[10px] text-red-600 font-semibold bg-red-50 px-1.5 py-0.5 rounded-full">Stock bajo</span>}
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-gray-900">{Number(item.quantity).toFixed(2)}</span>
                      <span className="text-sm text-gray-400 ml-1">{item.unit}</span>
                    </div>
                  </div>

                  {/* Costo promedio */}
                  <p className="text-xs text-gray-400 mb-3">
                    Costo promedio: <strong className="text-gray-600">
                      {Number(item.unit_cost) > 0 ? `$${Number(item.unit_cost).toFixed(2)}/${item.unit}` : '—'}
                    </strong>
                  </p>

                  {/* Type toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-2 text-xs font-semibold">
                    {[['compra','🟢 Compra'],['consumo','🔴 Consumo']].map(([v,lbl]) => (
                      <button key={v} type="button"
                        onClick={() => setUpdateTypes(t => ({...t, [item.id]: v}))}
                        className={`flex-1 py-1.5 transition-colors ${type===v ? (v==='compra'?'bg-emerald-500 text-white':'bg-red-500 text-white') : 'text-gray-500 hover:bg-gray-50'}`}>
                        {lbl}
                      </button>
                    ))}
                  </div>

                  {/* Amount input */}
                  <div className="flex gap-2 mb-1">
                    <input type="number" min="0" placeholder="Cantidad"
                      value={amount}
                      onChange={e => setUpdateAmounts(a => ({...a, [item.id]: e.target.value}))}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                    <button onClick={() => handleUpdate(item.id)} disabled={!amount}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors">
                      OK
                    </button>
                  </div>

                  {/* Cost input (only for purchase) */}
                  {type === 'compra' && (
                    <input type="number" min="0" placeholder="Costo unitario ($)"
                      value={cost}
                      onChange={e => setUpdateCosts(c => ({...c, [item.id]: e.target.value}))}
                      className="w-full px-3 py-1.5 text-sm border border-emerald-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 mb-1"/>
                  )}

                  {preview !== null && (
                    <p className="text-xs text-center text-gray-500 mb-2">
                      Resultado: <strong className={preview < 0 ? 'text-red-600' : 'text-emerald-600'}>{Number(preview).toFixed(2)} {item.unit}</strong>
                    </p>
                  )}

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setSelectedItem(item)} className="flex-1 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                      📋 Historial
                    </button>
                    <button onClick={() => handleDelete(item.id, item.name)} className="py-1.5 px-3 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}