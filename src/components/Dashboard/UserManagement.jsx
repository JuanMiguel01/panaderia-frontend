// src/components/Dashboard/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../Toast';
import { useConfirm } from '../ConfirmModal';

const ROLES = [
  { value: 'admin',    label: 'Administrador', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  { value: 'manager',  label: 'Gerente',        color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  { value: 'employee', label: 'Empleado',        color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
];

const PERMISSION_LABELS = {
  canViewStockCard: { icon: '📋', label: 'Ver estadísticas' },
  canManageStock:   { icon: '📦', label: 'Gestionar stock' },
  canViewAllSales:  { icon: '💰', label: 'Ver todas las ventas' },
  canDeleteSales:   { icon: '🗑️', label: 'Eliminar ventas' },
};

function RoleBadge({ role }) {
  const r = ROLES.find(x => x.value === role) || ROLES[2];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${r.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`}/>
      {r.label}
    </span>
  );
}

function Avatar({ email, size = 'md' }) {
  const s = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base';
  const colors = ['from-amber-400 to-amber-600','from-blue-400 to-blue-600','from-emerald-400 to-emerald-600',
                  'from-purple-400 to-purple-600','from-pink-400 to-pink-600','from-red-400 to-red-600'];
  const c = colors[email.charCodeAt(0) % colors.length];
  return (
    <div className={`${s} rounded-full bg-gradient-to-br ${c} flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {email.charAt(0).toUpperCase()}
    </div>
  );
}

function UserRow({ user, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    role: user.role,
    permissions: user.permissions || { canViewStockCard:false, canManageStock:false, canViewAllSales:false, canDeleteSales:false }
  });
  const { confirm, ConfirmDialog } = useConfirm();
  const toast = useToast();

  const handleSave = async () => {
    try {
      await onUpdate(user.id, editData);
      setEditing(false);
      toast.success('Usuario actualizado');
    } catch { toast.error('Error al actualizar'); }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Eliminar usuario',
      message: `¿Eliminar a ${user.email}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      icon: '👤',
    });
    if (ok) onDelete(user.id);
  };

  const activePerms = Object.entries(user.permissions || {}).filter(([,v]) => v).map(([k]) => PERMISSION_LABELS[k]?.label).filter(Boolean);

  return (
    <>
      {ConfirmDialog}
      <div className="p-4 hover:bg-gray-50/50 transition-colors">
        <div className="flex items-center gap-3">
          <Avatar email={user.email} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-gray-900 truncate">{user.email}</span>
              <RoleBadge role={user.role} />
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {activePerms.length > 0 ? activePerms.join(' · ') : 'Sin permisos especiales'}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)} className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
                  ✏️ Editar
                </button>
                <button onClick={handleDelete} className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors">
                  🗑️
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSave} className="px-3 py-1.5 text-xs font-medium bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg transition-colors">✓ Guardar</button>
                <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">✕</button>
              </>
            )}
          </div>
        </div>

        {editing && (
          <div className="mt-3 pt-3 border-t border-gray-100 ml-13 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Rol</label>
              <div className="flex flex-wrap gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.value} type="button"
                    onClick={() => setEditData(d => ({...d, role: r.value}))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      editData.role === r.value
                        ? `${r.color} ring-2 ring-offset-1 ring-amber-300`
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1.5">Permisos especiales</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(PERMISSION_LABELS).map(([key, { icon, label }]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={editData.permissions[key] || false}
                      onChange={e => setEditData(d => ({...d, permissions: {...d.permissions, [key]: e.target.checked}}))}
                      className="w-4 h-4 rounded accent-amber-500"
                    />
                    <span className="text-xs text-gray-600 group-hover:text-gray-800">{icon} {label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function UserManagement({ onLogout }) {
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState('active');
  const [newUser, setNewUser] = useState({
    email:'', password:'', role:'employee',
    permissions:{ canViewStockCard:false, canManageStock:false, canViewAllSales:false, canDeleteSales:false }
  });
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();

  const load = async () => {
    try {
      const [u, p] = await Promise.all([api.getActiveUsers(onLogout), api.getPendingUsers(onLogout)]);
      setUsers(u); setPending(p);
    } catch { toast.error('Error al cargar usuarios'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    try { await api.approveUser(id, onLogout); await load(); toast.success('Usuario aprobado'); }
    catch { toast.error('Error al aprobar'); }
  };
  const handleReject = async (id) => {
    const ok = await confirm({ title:'Rechazar usuario', message:'¿Rechazar y eliminar este usuario?', confirmText:'Rechazar', icon:'👤' });
    if (ok) { await api.deleteUser(id, onLogout); await load(); toast.success('Usuario rechazado'); }
  };
  const handleDelete = async (id) => {
    try { await api.deleteUser(id, onLogout); await load(); toast.success('Usuario eliminado'); }
    catch { toast.error('Error al eliminar'); }
  };
  const handleUpdate = async (id, data) => {
    await api.updateUser(id, data, onLogout); await load();
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(newUser, onLogout);
      setNewUser({ email:'', password:'', role:'employee', permissions:{ canViewStockCard:false, canManageStock:false, canViewAllSales:false, canDeleteSales:false } });
      setShowForm(false);
      await load();
      toast.success('Usuario creado');
    } catch (err) { toast.error(err.message || 'Error al crear usuario'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-gray-500 text-sm">Cargando usuarios...</p>
      </div>
    </div>
  );

  return (
    <>
      {ConfirmDialog}
      <div className="space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900" style={{fontFamily:"'Playfair Display',serif"}}>👥 Gestión de Usuarios</h2>
            <p className="text-sm text-gray-500 mt-0.5">{users.length} usuarios activos · {pending.length} pendientes</p>
          </div>
          <button onClick={() => setShowForm(s => !s)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
            <svg className={`w-4 h-4 transition-transform ${showForm ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
            </svg>
            {showForm ? 'Cancelar' : 'Nuevo Usuario'}
          </button>
        </div>

        {/* New user form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-800 mb-4">Crear nuevo usuario</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
                  <input type="email" value={newUser.email} onChange={e => setNewUser(u=>({...u,email:e.target.value}))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400" required/>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 block mb-1">Contraseña</label>
                  <input type="password" value={newUser.password} onChange={e => setNewUser(u=>({...u,password:e.target.value}))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400" required/>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Rol</label>
                <div className="flex gap-2">
                  {ROLES.map(r => (
                    <button key={r.value} type="button" onClick={() => setNewUser(u=>({...u,role:r.value}))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${newUser.role===r.value ? `${r.color} ring-2 ring-offset-1 ring-amber-300` : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1.5">Permisos</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(PERMISSION_LABELS).map(([key, {icon, label}]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newUser.permissions[key]} onChange={e => setNewUser(u=>({...u,permissions:{...u.permissions,[key]:e.target.checked}}))}
                        className="w-4 h-4 rounded accent-amber-500"/>
                      <span className="text-xs text-gray-600">{icon} {label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full sm:w-auto px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors">
                Crear Usuario
              </button>
            </form>
          </div>
        )}

        {/* Pending */}
        {pending.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-amber-200 flex items-center gap-2">
              <span className="text-sm font-bold text-amber-800">⏳ Pendientes de aprobación</span>
              <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">{pending.length}</span>
            </div>
            <div className="divide-y divide-amber-100">
              {pending.map(u => (
                <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                  <Avatar email={u.email} size="sm" />
                  <span className="flex-1 text-sm font-medium text-gray-800 truncate">{u.email}</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(u.id)} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors">✓ Aprobar</button>
                    <button onClick={() => handleReject(u.id)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors">✕ Rechazar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active users */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-700">Usuarios activos ({users.length})</h3>
          </div>
          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <div className="text-4xl mb-2">👥</div>
              <p>No hay usuarios activos</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map(u => (
                <UserRow key={u.id} user={u} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}