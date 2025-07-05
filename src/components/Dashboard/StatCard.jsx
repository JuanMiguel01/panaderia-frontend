// src/components/common/StatCard.jsx
import React from 'react';

export const StatCard = ({ label, value, color, size = 'lg' }) => (
  <div>
    <p className="text-xs text-brown-500">{label}</p>
    <p className={`font-bold ${size === 'lg' ? 'text-lg' : 'text-base'} ${color}`}>
      {value}
    </p>
  </div>
);