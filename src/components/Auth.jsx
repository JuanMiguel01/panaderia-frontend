// src/components/Auth.jsx
import React, { useState } from 'react';

export function Auth({ onLogin, onRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e, action) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email || !password) {
      setError("Por favor, introduce email y contraseña.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (action === 'login') {
        await onLogin(email, password);
      } else {
        const result = await onRegister(email, password);
        setMessage(result.message || "¡Registro exitoso! Ahora puedes iniciar sesión.");
        setPassword('');
      }
    } catch (err) {
      setError(err.message || "Ha ocurrido un error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg transform transition-all hover:shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-brown-800 mb-2">🥖 Panadería Ventas 🥖</h1>
        <p className="text-center text-brown-600 mb-8">Inicia sesión o regístrate para continuar</p>
        
        {error && <div className="text-sm mb-4 text-center text-red-600 bg-red-100 p-3 rounded-lg">{error}</div>}
        {message && <div className="text-sm mb-4 text-center text-green-600 bg-green-100 p-3 rounded-lg">{message}</div>}

        <form>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-brown-700 mb-1">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field" />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-sm font-medium text-brown-700 mb-1">Contraseña</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="input-field" />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={(e) => handleSubmit(e, 'login')} disabled={isSubmitting} className="btn btn-primary w-full">{isSubmitting ? 'Iniciando...' : 'Iniciar Sesión'}</button>
            <button onClick={(e) => handleSubmit(e, 'register')} disabled={isSubmitting} className="btn btn-secondary w-full">{isSubmitting ? 'Registrando...' : 'Registrarse'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
