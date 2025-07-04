// src/utils/formatters.js

/**
 * Formatea un número como moneda en Euros.
 * @param {number} amount - La cantidad a formatear.
 * @returns {string} - La cantidad formateada.
 */
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR' 
  }).format(amount);
};

/**
 * Formatea una fecha ISO a un formato legible en español.
 * @param {string} isoString - La fecha en formato ISO.
 * @returns {string} - La fecha formateada.
 */
export const formatDate = (isoString) => {
  if (!isoString) return 'Sin fecha';
  return new Date(isoString).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
};