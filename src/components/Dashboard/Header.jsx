// src/components/Dashboard/Header.jsx
import React from 'react';

export const Header = ({ user, onLogout }) => (
  <header className="max-w-7xl mx-auto mb-8">
    <div className="flex flex-col sm:flex-row justify-between items-center bg-white/70 backdrop-blur-sm p-4 rounded-2xl shadow-sm">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-brown-800">🥖 Gestión de Ventas</h1>
        <p className="text-brown-600 mt-1">Bienvenido, gestiona tus ventas en tiempo real.</p>
      </div>
      <div className="text-center sm:text-right mt-4 sm:mt-0">
        <p className="text-sm font-semibold text-brown-800">{user.email}</p>
        <p className="text-xs font-bold uppercase text-accent-600 tracking-wider">{user.role}</p>
        <button onClick={onLogout} className="text-sm text-red-500 hover:text-red-700 hover:underline mt-1 transition-colors">
          Cerrar Sesión
        </button>
      </div>
    </div>
  </header>
);