// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { api, isNetworkError } from './services/api';
import { offlineQueue } from './services/offlineQueue';
import { offlineStorage } from './services/offlineStorage';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ToastProvider, useToast } from './components/Toast';

const API_URL = 'https://panaderia-backend-uy2k.onrender.com';

function genId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function AppContent() {
  const [user, setUser]               = useState(null);
  const [token, setToken]             = useState(null);
  const [batches, setBatches]         = useState([]);
  const [presets, setPresets]         = useState([]);
  const [isLoading, setIsLoading]     = useState(true);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [pendingOps, setPendingOps]   = useState(0);
  const [isSyncing, setIsSyncing]     = useState(false);

  const isOnline    = useOnlineStatus();
  const toast       = useToast();
  const syncingRef  = useRef(false);
  const userRef     = useRef(null);

  useEffect(() => { userRef.current = user; }, [user]);

  // ── Auth ────────────────────────────────────────────────────
  const handleLogout = useCallback(() => {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_info');
    setToken(null);
    setUser(null);
    setBatches([]);
    setSocketStatus('disconnected');
  }, []);

  const handleLogin = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('jwt_token', data.token);
    localStorage.setItem('user_info', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    toast.success('¡Bienvenido de vuelta!', `Hola, ${data.user.email}`);
  };

  const handleRegister = (email, password) => api.register(email, password);

  // ── Queue helpers ───────────────────────────────────────────
  const refreshPendingCount = useCallback(() => {
    setPendingOps(offlineQueue.size());
  }, []);

  // ── Load data ───────────────────────────────────────────────
  const loadData = useCallback(async () => {
    // 1. Mostrar caché inmediatamente (fast path)
    const cached = offlineStorage.getSnapshot();
    if (cached?.batches?.length) setBatches(cached.batches);
    if (cached?.presets?.length) setPresets(cached.presets);

    if (!isOnline) return;

    try {
      const since = offlineStorage.getSyncedAt();
      if (since && cached?.batches?.length) {
        // Delta: solo lo nuevo desde el último sync
        const changes = await api.getChanges(since, handleLogout);
        if (changes.batches?.length > 0) {
          setBatches(prev => {
            const map = new Map(prev.map(b => [b.id, b]));
            for (const b of changes.batches) map.set(b.id, b);
            const merged = [...map.values()].sort(
              (a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id
            );
            offlineStorage.updateBatches(merged);
            return merged;
          });
        }
        if (changes.presets?.length) setPresets(changes.presets);
        offlineStorage.saveSnapshot({
          ...(offlineStorage.getSnapshot() || {}),
          syncedAt: changes.syncedAt,
          presets: changes.presets?.length ? changes.presets : cached?.presets,
        });
      } else {
        // Snapshot completo
        const snapshot = await api.getSnapshot(handleLogout);
        setBatches(snapshot.batches || []);
        if (snapshot.presets?.length) setPresets(snapshot.presets);
        offlineStorage.saveSnapshot(snapshot);
      }
    } catch {
      if (!cached?.batches?.length) {
        toast.error('Sin conexión y sin datos en caché.');
      }
    }
  }, [isOnline, handleLogout]);

  // ── Sync queue ──────────────────────────────────────────────
  const flushQueue = useCallback(async () => {
    const queue = offlineQueue.get();
    if (!queue.length || syncingRef.current || !isOnline) return;

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const { results } = await api.syncOperations(queue, handleLogout);

      let ok = 0, fail = 0;
      for (const r of results) {
        if (r.status === 'success' || r.status === 'already_synced') {
          offlineQueue.remove(r.clientId);
          ok++;
        } else {
          fail++;
        }
      }

      refreshPendingCount();

      if (ok > 0) {
        toast.success(`${ok} operación${ok > 1 ? 'es' : ''} sincronizada${ok > 1 ? 's' : ''}.`);
        // Refrescar estado desde servidor con snapshot fresco
        const snapshot = await api.getSnapshot(handleLogout);
        setBatches(snapshot.batches || []);
        offlineStorage.saveSnapshot(snapshot);
      }
      if (fail > 0) {
        toast.error(`${fail} operación${fail > 1 ? 'es fallaron' : ' falló'} al sincronizar.`);
      }
    } catch {
      toast.error('Error al sincronizar. Se reintentará al reconectar.');
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [isOnline, handleLogout, refreshPendingCount]);

  // ── Permisos ────────────────────────────────────────────────
  const getPermissions = useCallback(() => {
    if (!user) return {
      canViewStockCard: false, canManageStock: false,
      canViewAllSales: false,  canDeleteSales: false,
      canManageSales: false,   canDeleteBatches: false,
      isManagerOrAdmin: false, isAdmin: false,
    };
    const { role, permissions: p = {} } = user;
    const isAdmin   = role === 'admin';
    const isManager = role === 'manager';
    return {
      canViewStockCard: p.canViewStockCard || isAdmin || isManager,
      canManageStock:   p.canManageStock   || isAdmin || isManager,
      canViewAllSales:  p.canViewAllSales  || isAdmin || isManager,
      canDeleteSales:   p.canDeleteSales   || isAdmin,
      canManageSales:   p.canDeleteSales   || isAdmin || isManager,
      canDeleteBatches: isAdmin,
      isManagerOrAdmin: isAdmin || isManager,
      isAdmin,
    };
  }, [user]);

  // ── Restaurar sesión ────────────────────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem('jwt_token');
    const savedUser  = localStorage.getItem('user_info');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch { handleLogout(); }
    }
    setIsLoading(false);
    refreshPendingCount();
  }, []);

  // ── Cargar datos al autenticar ──────────────────────────────
  useEffect(() => {
    if (!user || !token) return;
    loadData();
  }, [user, token]);

  // ── Al recuperar conexión: sincronizar primero, luego refrescar
  useEffect(() => {
    if (!isOnline || !user || !token) return;
    const queue = offlineQueue.get();
    if (queue.length > 0) {
      flushQueue();
    } else {
      loadData();
    }
  }, [isOnline]);

  // ── Socket.IO ───────────────────────────────────────────────
  useEffect(() => {
    if (!user || !token) return;

    setSocketStatus('reconnecting');
    const sock = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    const refresh = async () => {
      try {
        const since = offlineStorage.getSyncedAt();
        if (since) {
          const changes = await api.getChanges(since, handleLogout);
          if (changes.batches?.length > 0) {
            setBatches(prev => {
              const map = new Map(prev.map(b => [b.id, b]));
              for (const b of changes.batches) map.set(b.id, b);
              return [...map.values()].sort(
                (a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id
              );
            });
            offlineStorage.saveSnapshot({
              ...(offlineStorage.getSnapshot() || {}),
              syncedAt: changes.syncedAt,
            });
          }
        } else {
          const snapshot = await api.getSnapshot(handleLogout);
          setBatches(snapshot.batches || []);
          offlineStorage.saveSnapshot(snapshot);
        }
      } catch {}
    };

    sock.on('connect',          () => setSocketStatus('connected'));
    sock.on('disconnect',       () => setSocketStatus('disconnected'));
    sock.on('reconnecting',     () => setSocketStatus('reconnecting'));
    sock.on('reconnect',        () => { setSocketStatus('connected'); refresh(); });
    sock.on('connect_error',    () => setSocketStatus('disconnected'));
    sock.on('reconnect_error',  () => setSocketStatus('disconnected'));
    sock.on('reconnect_failed', () => setSocketStatus('disconnected'));

    sock.on('batch:created',  refresh);
    sock.on('batch:deleted',  refresh);
    sock.on('batch:updated',  refresh);
    sock.on('sale:created',   refresh);
    sock.on('sale:updated',   refresh);
    sock.on('sale:deleted',   refresh);
    sock.on('sync:completed', refresh);

    if (user?.role === 'admin') {
      sock.on('user:registered', (u) => {
        toast.info(`Nuevo usuario registrado: ${u.email}`, '👤 Nuevo registro');
      });
    }

    return () => {
      ['connect','disconnect','reconnecting','reconnect','connect_error','reconnect_error','reconnect_failed',
       'batch:created','batch:deleted','batch:updated','sale:created','sale:updated','sale:deleted',
       'sync:completed','user:registered',
      ].forEach(e => sock.off(e));
      sock.disconnect();
      setSocketStatus('disconnected');
    };
  }, [user, token]);

  // ── CRUD: crear lote ────────────────────────────────────────
  const handleCreateBatch = useCallback(async (data) => {
    const saveBatchOffline = () => {
      const clientId  = genId();
      const tempBatch = {
        id: clientId, breadType: data.breadType, quantityMade: data.quantityMade,
        price: data.price, date: data.date || new Date().toISOString().split('T')[0],
        createdBy: userRef.current?.email, sales: [], _offline: true,
      };
      setBatches(prev => { const next = [tempBatch, ...prev]; offlineStorage.updateBatches(next); return next; });
      offlineQueue.add({ id: clientId, type: 'batch:create', payload: data, timestamp: new Date().toISOString() });
      refreshPendingCount();
      toast.info('Sin conexión — lote guardado para sincronizar.');
    };

    if (!isOnline) { saveBatchOffline(); return; }
    try {
      await api.createBatch(data, handleLogout);
      toast.success('¡Lote creado correctamente!');
    } catch (err) {
      if (isNetworkError(err)) { saveBatchOffline(); }
      else { toast.error(err.message || 'Error al crear lote.'); throw err; }
    }
  }, [isOnline, handleLogout, refreshPendingCount]);

  // ── CRUD: eliminar lote ─────────────────────────────────────
  const handleDeleteBatch = useCallback(async (batchId) => {
    const deleteBatchOffline = () => {
      const isTemp = typeof batchId === 'string' && batchId.includes('-');
      if (isTemp) { offlineQueue.remove(batchId); }
      else { offlineQueue.add({ id: genId(), type: 'batch:delete', payload: { batchId }, timestamp: new Date().toISOString() }); }
      setBatches(prev => { const next = prev.filter(b => b.id !== batchId); offlineStorage.updateBatches(next); return next; });
      refreshPendingCount();
      toast.info('Sin conexión — eliminación guardada para sincronizar.');
    };

    if (!isOnline) { deleteBatchOffline(); return; }
    try {
      await api.deleteBatch(batchId, handleLogout);
      toast.success('Lote eliminado.');
    } catch (err) {
      if (isNetworkError(err)) { deleteBatchOffline(); }
      else { toast.error(err.message || 'Error al eliminar lote.'); }
    }
  }, [isOnline, handleLogout, refreshPendingCount]);

  // ── CRUD: crear venta ───────────────────────────────────────
  const handleCreateSale = useCallback(async (batchId, data) => {
    const saveSaleOffline = () => {
      const saleId   = genId();
      const tempSale = {
        id: saleId, personName: data.personName, quantitySold: data.quantitySold,
        isPaid: false, isDelivered: false, isGift: data.isGift || false,
        createdAt: new Date().toISOString(), _offline: true,
      };
      setBatches(prev => {
        const next = prev.map(b => b.id === batchId ? { ...b, sales: [...b.sales, tempSale] } : b);
        offlineStorage.updateBatches(next);
        return next;
      });
      offlineQueue.add({ id: saleId, type: 'sale:create', payload: { batchId, ...data }, timestamp: new Date().toISOString() });
      refreshPendingCount();
      toast.info('Sin conexión — venta guardada para sincronizar.');
    };

    if (!isOnline) { saveSaleOffline(); return; }
    try {
      await api.createSale(batchId, data, handleLogout);
      toast.success('Venta registrada.');
    } catch (err) {
      if (isNetworkError(err)) { saveSaleOffline(); }
      else { toast.error(err.message || 'Error al registrar venta.'); }
    }
  }, [isOnline, handleLogout, refreshPendingCount]);

  // ── CRUD: actualizar venta ──────────────────────────────────
  const handleUpdateSale = useCallback(async (batchId, saleId, data) => {
    const updateSaleOffline = () => {
      setBatches(prev => {
        const next = prev.map(b =>
          b.id === batchId ? { ...b, sales: b.sales.map(s => s.id === saleId ? { ...s, ...data } : s) } : b
        );
        offlineStorage.updateBatches(next);
        return next;
      });
      const isTemp = typeof saleId === 'string' && saleId.includes('-');
      if (!isTemp) {
        offlineQueue.add({ id: genId(), type: 'sale:update', payload: { saleId, batchId, ...data }, timestamp: new Date().toISOString() });
        refreshPendingCount();
      }
    };

    if (!isOnline) { updateSaleOffline(); return; }
    try {
      await api.updateSale(batchId, saleId, data, handleLogout);
    } catch (err) {
      if (isNetworkError(err)) { updateSaleOffline(); }
      else { toast.error(err.message || 'Error al actualizar venta.'); }
    }
  }, [isOnline, handleLogout, refreshPendingCount]);

  // ── CRUD: eliminar venta ────────────────────────────────────
  const handleDeleteSale = useCallback(async (batchId, saleId) => {
    const deleteSaleOffline = () => {
      const isTemp = typeof saleId === 'string' && saleId.includes('-');
      if (isTemp) { offlineQueue.remove(saleId); }
      else { offlineQueue.add({ id: genId(), type: 'sale:delete', payload: { saleId, batchId }, timestamp: new Date().toISOString() }); }
      setBatches(prev => {
        const next = prev.map(b => b.id === batchId ? { ...b, sales: b.sales.filter(s => s.id !== saleId) } : b);
        offlineStorage.updateBatches(next);
        return next;
      });
      refreshPendingCount();
      toast.info('Sin conexión — eliminación guardada para sincronizar.');
    };

    if (!isOnline) { deleteSaleOffline(); return; }
    try {
      await api.deleteSale(batchId, saleId, handleLogout);
      toast.success('Venta eliminada.');
    } catch (err) {
      if (isNetworkError(err)) { deleteSaleOffline(); }
      else { toast.error(err.message || 'Error al eliminar venta.'); }
    }
  }, [isOnline, handleLogout, refreshPendingCount]);

  // ── Render ──────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a0f00] to-[#2d1a00]">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🥖</div>
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden mx-auto">
            <div className="h-full bg-amber-500 rounded-full animate-loading-bar"/>
          </div>
          <p className="text-amber-300/60 mt-3 text-sm">Cargando panadería...</p>
        </div>
      </div>
    );
  }

  return !user ? (
    <Auth onLogin={handleLogin} onRegister={handleRegister} />
  ) : (
    <Dashboard
      user={user}
      batches={batches}
      presets={presets}
      socketStatus={socketStatus}
      isOnline={isOnline}
      pendingOps={pendingOps}
      isSyncing={isSyncing}
      onSync={flushQueue}
      onLogout={handleLogout}
      handleCreateBatch={handleCreateBatch}
      handleDeleteBatch={handleDeleteBatch}
      handleCreateSale={handleCreateSale}
      handleUpdateSale={handleUpdateSale}
      handleDeleteSale={handleDeleteSale}
      getPermissions={getPermissions}
    />
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
