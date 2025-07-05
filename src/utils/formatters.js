
// src/utils/formatters.js

/**
 * Formatea una fecha para mostrar en la interfaz
 * @param {string|Date} date - La fecha a formatear
 * @returns {string} - La fecha formateada
 */
export function formatDate(date) {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  // Verificar que la fecha es válida
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  // Opciones para el formato de fecha en español
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  };
  
  try {
    return dateObj.toLocaleDateString('es-ES', options);
  } catch (error) {
    // Fallback si hay error con la localización
    return dateObj.toLocaleDateString();
  }
}

/**
 * Formatea una fecha y hora para mostrar en la interfaz
 * @param {string|Date} date - La fecha a formatear
 * @returns {string} - La fecha y hora formateada
 */
export function formatDateTime(date) {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  // Verificar que la fecha es válida
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  // Opciones para el formato de fecha y hora en español
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  try {
    return dateObj.toLocaleDateString('es-ES', options);
  } catch (error) {
    // Fallback si hay error con la localización
    return dateObj.toLocaleString();
  }
}

/**
 * Formatea un número como moneda
 * @param {number} amount - El monto a formatear
 * @param {string} currency - La moneda (por defecto 'ARS' para pesos argentinos)
 * @returns {string} - El monto formateado
 */
export function formatCurrency(amount, currency = 'ARS') {
  if (typeof amount !== 'number') {
    return '$0';
  }
  
  try {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback simple
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * Formatea un número con separadores de miles
 * @param {number} number - El número a formatear
 * @returns {string} - El número formateado
 */
export function formatNumber(number) {
  if (typeof number !== 'number') {
    return '0';
  }
  
  try {
    return new Intl.NumberFormat('es-AR').format(number);
  } catch (error) {
    // Fallback simple
    return number.toString();
  }
}

/**
 * Convierte una fecha a formato YYYY-MM-DD para inputs de tipo date
 * @param {string|Date} date - La fecha a convertir
 * @returns {string} - La fecha en formato YYYY-MM-DD
 */
export function toDateInputFormat(date) {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  // Verificar que la fecha es válida
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  // Obtener año, mes y día
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Calcula los días entre dos fechas
 * @param {string|Date} startDate - Fecha de inicio
 * @param {string|Date} endDate - Fecha de fin
 * @returns {number} - Número de días entre las fechas
 */
export function daysBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 0;
  }
  
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}