// src/components/Dashboard/InventoryManagement.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

export function InventoryManagement({ onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: '' });
  const [updateAmount, setUpdateAmount] = useState({});

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await api.getInventory(onLogout);
      setItems(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar el inventario.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      await api.createInventoryItem(newItem, onLogout);
      setShowAddForm(false);
      setNewItem({ name: '', quantity: '', unit: '' });
      loadInventory();
    } catch (err) {
      setError(err.message || 'Error al crear el insumo.');
    }
  };

  const handleUpdateItem = async (itemId, change) => {
    if (!change || isNaN(change)) return;
    try {
      await api.updateInventoryItem(itemId, change, onLogout);
      setUpdateAmount({ ...updateAmount, [itemId]: '' });
      loadInventory();
    } catch (err) {
      setError('Error al actualizar el insumo.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este insumo?')) {
      try {
        await api.deleteInventoryItem(itemId, onLogout);
        loadInventory();
      } catch (err) {
        setError('Error al eliminar el insumo.');
      }
    }
  };

  if (loading) return <div>Cargando inventario...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">📦 Gestión de Insumos</h2>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
          {showAddForm ? 'Cancelar' : '➕ Añadir Insumo'}
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleCreateItem} className="flex items-end space-x-4">
            <div className="flex-grow">
              <label>Nombre del Insumo</label>
              <input type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label>Cantidad Inicial</label>
              <input type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="input-field" required />
            </div>
            <div>
              <label>Unidad (kg, l, ud.)</label>
              <input type="text" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="input-field" required />
            </div>
            <button type="submit" className="btn btn-secondary">Crear</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="th-cell text-left">Insumo</th>
              <th className="th-cell">Cantidad Actual</th>
              <th className="th-cell text-left">Actualizar Stock</th>
              <th className="th-cell">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map(item => (
              <tr key={item.id}>
                <td className="td-cell font-bold">{item.name}</td>
                <td className="td-cell text-center text-2xl font-mono">{item.quantity} <span className="text-sm">{item.unit}</span></td>
                <td className="td-cell">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number" 
                      placeholder="Ej: -5 ó 20"
                      value={updateAmount[item.id] || ''}
                      onChange={e => setUpdateAmount({...updateAmount, [item.id]: e.target.value})}
                      className="input-field w-32"
                    />
                    <button onClick={() => handleUpdateItem(item.id, updateAmount[item.id])} className="btn btn-primary !py-1">Actualizar</button>
                  </div>
                </td>
                <td className="td-cell text-center">
                  <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}