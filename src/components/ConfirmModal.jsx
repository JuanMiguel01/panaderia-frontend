// src/components/ConfirmModal.jsx
import React, { useEffect } from 'react';

export function ConfirmModal({ isOpen, onConfirm, onCancel, title, message, confirmText = 'Confirmar', confirmClass = 'bg-red-600 hover:bg-red-700', icon }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full transform animate-modal-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-2xl">
            {icon || '⚠️'}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-white font-medium text-sm transition-colors ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook de conveniencia para usar el modal
import { useState, useCallback } from 'react';

export function useConfirm() {
  const [state, setState] = useState({ isOpen: false, resolve: null, config: {} });

  const confirm = useCallback((config) => {
    return new Promise(resolve => {
      setState({ isOpen: true, resolve, config });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState(s => ({ ...s, isOpen: false }));
  }, [state]);

  const handleCancel = useCallback(() => {
    state.resolve?.(false);
    setState(s => ({ ...s, isOpen: false }));
  }, [state]);

  const ConfirmDialog = (
    <ConfirmModal
      isOpen={state.isOpen}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      {...state.config}
    />
  );

  return { confirm, ConfirmDialog };
}