// src/components/Dashboard/DeudaManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { useToast } from '../Toast';
import { useConfirm } from '../ConfirmModal';

function fmt(n) { return Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

const today = () => new Date().toISOString().split('T')[0];

const EMPTY_FORM = { tipo: 'cobrar', concepto: '', persona: '', monto: '', date: today(), notes: '' };

export function DeudaManagement({ onLogout }) {
  const [debts,       setDebts]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [filterPaid,  setFilterPaid]  = useState('pending');
  const [filterTipo,  setFilterTipo]  = useState('all');
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const load = async () => {
    setLoading(true);
    try { setDebts(await api.getDeudas(onLogout)); }
    catch { toast.error('Error al cargar deudas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.concepto.trim()) { toast.warning('El concepto es requerido'); return; }
    if (!form.monto || isNaN(Number(form.monto)) || Number(form.monto) <= 0) { toast.warning('El monto debe ser mayor a 0'); return; }
    setSaving(true);
    try {
      const d = await api.createDeuda(form, onLogout);
      setDebts(prev => [d, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      toast.success('Deuda registrada');
    } catch (err) { toast.error(err.message || 'Error al crear deuda'); }
    finally { setSaving(false); }
  };

  const togglePaid = async (debt) => {
    try {
      const updated = await api.updateDeuda(debt.id, { is_paid: !debt.is_paid }, onLogout);
      setDebts(prev => prev.map(d => d.id === updated.id ? updated : d));
      toast.success(updated.is_paid ? 'Marcada como pagada' : 'Marcada como pendiente');
    } catch { toast.error('Error al actualizar'); }
  };

  const handleDelete = async (debt) => {
    const ok = await confirm({ title: `Eliminar "${debt.concepto}"`, message: 'Se eliminará permanentemente.', confirmText: 'Eliminar', icon: '💸' });
    if (!ok) return;
    try {
      await api.deleteDeuda(debt.id, onLogout);
      setDebts(prev => prev.filter(d => d.id !== debt.id));
      toast.success('Deuda eliminada');
    } catch { toast.error('Error al eliminar'); }
  };

  const filtered = useMemo(() => debts.filter(d => {
    if (filterPaid === 'pending' && d.is_paid)  return false;
    if (filterPaid === 'paid'    && !d.is_paid) return false;
    if (filterTipo !== 'all' && d.tipo !== filterTipo) return false;
    return true;
  }), [debts, filterPaid, filterTipo]);

  const totals = useMemo(() => {
    const pending = debts.filter(d => !d.is_paid);
    return {
      cobrar: pending.filter(d => d.tipo === 'cobrar').reduce((s, d) => s + Number(d.monto), 0),
      pagar:  pending.filter(d => d.tipo === 'pagar' ).reduce((s, d) => s + Number(d.monto), 0),
    };
  }, [debts]);

  return (
    <>
      {ConfirmDialog}
      <div className="space-y-5 animate-fadeInUp">

        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>💸 Deudas</h2>
            <p className="text-sm text-gray-500 mt-0.5">Cuentas por cobrar y por pagar</p>
          </div>
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
            <svg className={`w-4 h-4 transition-transform ${showForm ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            {showForm ? 'Cancelar' : 'Nueva Deuda'}
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">Por Cobrar</p>
            <p className="text-2xl font-extrabold text-emerald-700">${fmt(totals.cobrar)}</p>
            <p className="text-xs text-emerald-500 mt-0.5">Nos deben</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">Por Pagar</p>
            <p className="text-2xl font-extrabold text-red-700">${fmt(totals.pagar)}</p>
            <p className="text-xs text-red-400 mt-0.5">Debemos</p>
          </div>
        </div>

        {/* New debt form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4">Nueva deuda</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              {/* Tipo */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm font-semibold">
                {[['cobrar','💰 Por Cobrar'],['pagar','💸 Por Pagar']].map(([v,lbl]) => (
                  <button key={v} type="button"
                    onClick={() => setForm(f => ({ ...f, tipo: v }))}
                    className={`flex-1 py-2.5 transition-colors ${form.tipo === v ? (v === 'cobrar' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white') : 'text-gray-500 hover:bg-gray-50'}`}>
                    {lbl}
                  </button>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Concepto *</label>
                  <input type="text" value={form.concepto} onChange={e => setForm(f => ({ ...f, concepto: e.target.value }))} required
                    placeholder="Ej: Venta fiada a Mercado Don Juan"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Persona / Entidad</label>
                  <input type="text" value={form.persona} onChange={e => setForm(f => ({ ...f, persona: e.target.value }))}
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Monto *</label>
                  <input type="number" min="0" step="0.01" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} required
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Fecha</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"/>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Notas</label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Detalles adicionales…"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"/>
              </div>
              <button type="submit" disabled={saving}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                {saving ? 'Guardando…' : 'Registrar Deuda'}
              </button>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {[['pending','Pendientes'],['paid','Pagadas'],['all','Todas']].map(([v,lbl]) => (
            <button key={v} onClick={() => setFilterPaid(v)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filterPaid === v ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {lbl}
            </button>
          ))}
          <div className="w-px bg-gray-200 mx-1"/>
          {[['all','Todos'],['cobrar','Por Cobrar'],['pagar','Por Pagar']].map(([v,lbl]) => (
            <button key={v} onClick={() => setFilterTipo(v)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${filterTipo === v ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {lbl}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"/></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="text-4xl mb-2">💸</div>
            <p className="text-gray-500">No hay deudas para mostrar</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {filtered.map(debt => (
                <div key={debt.id} className={`flex items-center gap-3 p-4 transition-colors hover:bg-gray-50/60 ${debt.is_paid ? 'opacity-50' : ''}`}>
                  {/* Tipo badge */}
                  <div className={`flex-shrink-0 w-2 h-10 rounded-full ${debt.tipo === 'cobrar' ? 'bg-emerald-400' : 'bg-red-400'}`}/>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${debt.tipo === 'cobrar' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {debt.tipo === 'cobrar' ? 'Cobrar' : 'Pagar'}
                      </span>
                      <span className="font-semibold text-gray-900 truncate">{debt.concepto}</span>
                      {debt.persona && <span className="text-xs text-gray-400">{debt.persona}</span>}
                      {debt.is_paid && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Pagada</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400">{debt.date}</span>
                      {debt.notes && <span className="text-xs text-gray-400 truncate">{debt.notes}</span>}
                    </div>
                  </div>

                  {/* Monto */}
                  <span className={`font-bold text-base flex-shrink-0 ${debt.tipo === 'cobrar' ? 'text-emerald-600' : 'text-red-600'}`}>
                    ${fmt(debt.monto)}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => togglePaid(debt)} title={debt.is_paid ? 'Marcar pendiente' : 'Marcar pagada'}
                      className={`p-1.5 rounded-lg text-xs transition-colors ${debt.is_paid ? 'bg-gray-100 text-gray-400 hover:bg-gray-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}>
                      {debt.is_paid ? '↩' : '✓'}
                    </button>
                    <button onClick={() => handleDelete(debt)}
                      className="p-1.5 rounded-lg text-xs bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
