// src/hooks/useApi.js
import { useState, useCallback } from 'react';
import { api } from '../services/api';

export const useApi = (handleLogout) => {
  const [error, setError] = useState(null);

  const createApiHandler = useCallback((apiMethod) => async (...args) => {
    try {
      setError(null);
      await apiMethod(...args, handleLogout);
    } catch (err) {
      setError(err.message || "Ocurrió un error en la operación.");
      // Re-throw para que el componente que llama pueda manejarlo si es necesario
      throw err;
    }
  }, [handleLogout]);
  
  // ... (código anterior de useApi)

  return {
    error,
    setError,
    getBatches: createApiHandler(api.getBatches),
    handleCreateBatch: createApiHandler(api.createBatch),
    handleDeleteBatch: createApiHandler(api.deleteBatch),
    handleCreateSale: createApiHandler(api.createSale),
    handleUpdateSale: createApiHandler(api.updateSale),
    // ¡NUEVA FUNCIÓN!
    handleDeleteSale: createApiHandler(api.deleteSale),
  };
};