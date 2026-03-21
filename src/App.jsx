// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { api } from './services/api';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard/Dashboard';
import { ToastProvider, useToast } from './components/Toast';

const API_URL = 'https://panaderia-backend-uy2k.onrender.com';

function AppContent() {
  const [user, setUser]               = useState(null);
  const [token, setToken]             = useState(null);
  const [batches, setBatches]         = useState([]);
  const [socket, setSocket]           = useState(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [socketStatus, setSocketStatus] = useState('disconnected'); // 'connected' | 'reconnecting' | 'disconnected'
  const toast = useToast();

  const handleLogout = useCallback(() => {
    setSocket(currentSocket => {
      if (currentSocket) currentSocket.disconnect();
      return null;
    });
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

  const fetchBatches = useCallback(async () => {
    try {
      const fetchedBatches = await api.getBatches(handleLogout);
      setBatches(fetchedBatches);
    } catch {
      toast.error('Error al cargar los lotes.');
    }
  }, [handleLogout]);

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

  // Restore session on mount
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
  }, []);

  // Setup socket + fetch when authenticated
  useEffect(() => {
    if (!user || !token) return;
    fetchBatches();

    setSocketStatus('reconnecting');
    const newSocket = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    setSocket(newSocket);

    const refresh = async () => {
      try {
        const data = await api.getBatches(handleLogout);
        setBatches(data);
      } catch {}
    };

    // Connection state listeners
    newSocket.on('connect',         () => { console.log('📡 Socket conectado'); setSocketStatus('connected'); });
    newSocket.on('disconnect',      () => { console.log('📡 Socket desconectado'); setSocketStatus('disconnected'); });
    newSocket.on('reconnecting',    () => setSocketStatus('reconnecting'));
    newSocket.on('reconnect',       () => { setSocketStatus('connected'); refresh(); });
    newSocket.on('connect_error',   () => setSocketStatus('disconnected'));
    newSocket.on('reconnect_error', () => setSocketStatus('disconnected'));
    newSocket.on('reconnect_failed',() => setSocketStatus('disconnected'));

    // Data events
    newSocket.on('batch:created', refresh);
    newSocket.on('batch:deleted', refresh);
    newSocket.on('batch:updated', refresh);
    newSocket.on('sale:created',  refresh);
    newSocket.on('sale:updated',  refresh);
    newSocket.on('sale:deleted',  refresh);

    if (user?.role === 'admin') {
      newSocket.on('user:registered', (u) => {
        toast.info(`Nuevo usuario registrado: ${u.email}`, '👤 Nuevo registro');
      });
    }

    return () => {
      ['connect','disconnect','reconnecting','reconnect','connect_error','reconnect_error','reconnect_failed',
       'batch:created','batch:deleted','batch:updated','sale:created','sale:updated','sale:deleted','user:registered'
      ].forEach(e => newSocket.off(e));
      newSocket.disconnect();
      setSocketStatus('disconnected');
    };
  }, [user, token]);

  // CRUD handlers
  const handleCreateBatch = useCallback(async (data) => {
    try {
      await api.createBatch(data, handleLogout);
      toast.success('¡Lote creado correctamente!');
    } catch (err) {
      toast.error(err.message || 'Error al crear lote.');
      throw err;
    }
  }, [handleLogout]);

  const handleDeleteBatch = useCallback(async (batchId) => {
    try {
      await api.deleteBatch(batchId, handleLogout);
      toast.success('Lote eliminado.');
    } catch (err) {
      toast.error(err.message || 'Error al eliminar lote.');
    }
  }, [handleLogout]);

  const handleCreateSale = useCallback(async (batchId, data) => {
    try {
      await api.createSale(batchId, data, handleLogout);
      toast.success('Venta registrada.');
    } catch (err) {
      toast.error(err.message || 'Error al registrar venta.');
    }
  }, [handleLogout]);

  const handleUpdateSale = useCallback(async (batchId, saleId, data) => {
    try {
      await api.updateSale(batchId, saleId, data, handleLogout);
    } catch (err) {
      toast.error(err.message || 'Error al actualizar venta.');
    }
  }, [handleLogout]);

  const handleDeleteSale = useCallback(async (batchId, saleId) => {
    try {
      await api.deleteSale(batchId, saleId, handleLogout);
      toast.success('Venta eliminada.');
    } catch (err) {
      toast.error(err.message || 'Error al eliminar venta.');
    }
  }, [handleLogout]);

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
      socketStatus={socketStatus}
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