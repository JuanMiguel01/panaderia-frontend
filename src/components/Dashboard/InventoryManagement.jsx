// src/components/Dashboard/InventoryManagement.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

// Función auxiliar para formatear la fecha
const formatLogDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('es-ES', options);
};

// Un componente simple para el modal de historial
const HistoryModal = ({ logs, itemName, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
      <h3 className="text-xl font-bold mb-4">Historial de: {itemName}</h3>
      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cambio</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Antes</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad Después</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-4 text-center text-gray-500">No hay registros de historial para este insumo.</td>
              </tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td className="px-4 py-2 whitespace-nowrap">{formatLogDate(log.created_at)}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{log.user_email}</td>
                  <td className={`px-4 py-2 whitespace-nowrap text-right font-semibold ${log.change_amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {log.change_amount > 0 ? `+${log.change_amount}` : log.change_amount}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">{log.quantity_before}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-right">{log.quantity_after}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button onClick={onClose} className="btn btn-secondary mt-4">Cerrar</button>
    </div>
  </div>
);

export function InventoryManagement({ onLogout }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: '' });
  const [updateAmount, setUpdateAmount] = useState({});
  
  // ✅ Nuevos estados para el historial
  const [historyLogs, setHistoryLogs] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

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
    // Reemplazamos window.confirm con un modal de confirmación si es necesario en una app real
    if (window.confirm('¿Estás seguro de que quieres eliminar este insumo? Esto eliminará también su historial.')) {
      try {
        await api.deleteInventoryItem(itemId, onLogout);
        loadInventory();
      } catch (err) {
        setError('Error al eliminar el insumo.');
      }
    }
  };

  // ✅ Función para ver el historial de un insumo
  const viewHistory = async (item) => {
    try {
      setHistoryLogs([]); // Limpiar logs anteriores
      setSelectedItem(item); // Establecer el ítem seleccionado para mostrar el modal
      const logs = await api.getInventoryLogs(item.id, onLogout);
      setHistoryLogs(logs);
    } catch (err) {
      setError('No se pudo cargar el historial.');
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

      {/* ✅ Renderizar el modal de historial si hay un selectedItem */}
      {selectedItem && (
        <HistoryModal 
          logs={historyLogs} 
          itemName={selectedItem.name}
          onClose={() => setSelectedItem(null)} // Cerrar el modal al hacer clic en el botón de cerrar
        />
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
                  {/* ✅ Botón para ver el historial */}
                  <button onClick={() => viewHistory(item)} className="text-blue-500 hover:underline mr-4">Ver Historial</button>
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