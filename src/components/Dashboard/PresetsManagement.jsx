// src/components/Dashboard/PresetsManagement.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../Toast';
import { useConfirm } from '../ConfirmModal';

const EMOJI_OPTIONS = [
  '🍞','🥖','🥐','🫓','🥨','🧁','🎂','🍰','🥧','🍩',
  '🍪','🌭','🍔','🍕','🥪','🌮','🌯','🥙','🧆','🫔',
  '🥞','🧇','🥓','🥩','🍗','🍖','🌽','🥕','🫑','🥑',
  '🫐','🍓','🍇','🍎','🍋','🍊','🥐','🫙','🍱','🥫',
];

export function PresetsManagement({ onLogout }) {
  const [presets, setPresets]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [showForm, setShowForm]             = useState(false);
  const [editingId, setEditingId]           = useState(null);
  const [form, setForm]                     = useState({ name: '', price: '', emoji: '🍞' });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const load = async () => {
    try {
      const data = await api.getPresets(onLogout);
      setPresets(data);
    } catch {
      toast.error('Error al cargar los tipos de pan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())               return toast.warning('Ingresa un nombre.');
    if (!form.price || Number(form.price) <= 0) return toast.warning('Ingresa un precio válido.');
    setSubmitting(true);
    try {
      if (editingId) {
        await api.updatePreset(editingId, form, onLogout);
        toast.success('Tipo de pan actualizado ✓');
      } else {
        await api.createPreset(form, onLogout);
        toast.success('Tipo de pan creado ✓');
      }
      resetForm();
      await load();
    } catch (err) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (preset) => {
    setEditingId(preset.id);
    setForm({ name: preset.name, price: String(preset.price), emoji: preset.emoji });
    setShowForm(true);
    setShowEmojiPicker(false);
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: `Eliminar "${name}"`,
      message: 'Se quitará del formulario de registro. Los lotes existentes no se verán afectados.',
      confirmText: 'Eliminar',
      icon: '🗑️',
    });
    if (!ok) return;
    try {
      await api.deletePreset(id, onLogout);
      await load();
      toast.success('Tipo de pan eliminado');
    } catch { toast.error('Error al eliminar'); }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: '', price: '', emoji: '🍞' });
    setShowEmojiPicker(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <>
      {ConfirmDialog}
      <div className="space-y-5">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display',serif" }}>
              🥖 Tipos de Pan
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {presets.length} tipos · Se muestran en el formulario de registro de lotes
            </p>
          </div>
          <button
            onClick={() => { if (showForm && !editingId) { resetForm(); } else { setShowForm(true); setEditingId(null); setForm({ name:'', price:'', emoji:'🍞' }); } }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <svg className={`w-4 h-4 transition-transform ${showForm && !editingId ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showForm && !editingId ? 'Cancelar' : 'Nuevo Tipo'}
          </button>
        </div>

        {/* ── Form ─────────────────────────────────────────── */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5 animate-fadeInUp">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">{form.emoji}</span>
              {editingId ? 'Editar tipo de pan' : 'Nuevo tipo de pan'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Emoji selector */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-2">Emoji del pan</label>
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(p => !p)}
                    className={`w-14 h-14 text-3xl border-2 rounded-xl transition-all flex items-center justify-center bg-amber-50 hover:bg-amber-100 ${showEmojiPicker ? 'border-amber-500 ring-2 ring-amber-300' : 'border-amber-200'}`}
                  >
                    {form.emoji}
                  </button>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Emoji seleccionado: <strong>{form.emoji}</strong></p>
                    <button type="button" onClick={() => setShowEmojiPicker(p => !p)} className="text-xs text-amber-600 underline hover:text-amber-700">
                      {showEmojiPicker ? 'Cerrar selector' : 'Cambiar emoji'}
                    </button>
                  </div>
                </div>

                {showEmojiPicker && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-xs text-gray-400 mb-2 font-medium">Seleccioná un emoji:</p>
                    <div className="grid grid-cols-10 sm:grid-cols-14 gap-1">
                      {EMOJI_OPTIONS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => { setForm(f => ({ ...f, emoji })); setShowEmojiPicker(false); }}
                          className={`w-9 h-9 text-xl rounded-xl transition-all flex items-center justify-center hover:bg-amber-100 hover:scale-110 ${
                            form.emoji === emoji ? 'bg-amber-200 ring-2 ring-amber-400 scale-110' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Name + Price */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Nombre del pan *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ej: Pan Bola"
                    required maxLength={100}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Precio unitario *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="0.00"
                      required min="0.01" step="0.01"
                      className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
                <div className="w-12 h-14 border-2 border-amber-200 rounded-xl bg-white flex flex-col items-center justify-center p-1">
                  <span className="text-xl">{form.emoji}</span>
                  <span className="text-[9px] text-gray-500 font-bold leading-tight text-center">{form.name || 'Nombre'}</span>
                  <span className="text-[9px] text-gray-400">${form.price || '0'}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-800">Vista previa</p>
                  <p className="text-xs text-amber-600">Así aparecerá en el formulario</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
                >
                  {submitting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {editingId ? '✓ Guardar cambios' : '✓ Crear tipo de pan'}
                </button>
                <button type="button" onClick={resetForm} className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Preset grid ──────────────────────────────────── */}
        {presets.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="text-5xl mb-3">🥖</div>
            <p className="text-gray-600 font-semibold mb-1">No hay tipos de pan configurados</p>
            <p className="text-gray-400 text-sm">Creá el primero con el botón de arriba</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {presets.map(preset => (
              <div
                key={preset.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:border-amber-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {preset.emoji}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{preset.name}</p>
                      <p className="text-base font-extrabold text-amber-600">${Number(preset.price).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEdit(preset)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(preset.id, preset.name)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}