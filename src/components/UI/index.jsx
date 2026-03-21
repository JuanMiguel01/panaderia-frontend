// src/components/UI/index.jsx
import React from 'react';

export function StatCard({ icon, label, value, subtitle, color = 'amber' }) {
  const colors = {
    amber:  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-100',   iconBg: 'bg-amber-100'  },
    green:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', iconBg: 'bg-emerald-100'},
    red:    { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-100',     iconBg: 'bg-red-100'    },
    blue:   { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-100',    iconBg: 'bg-blue-100'   },
    purple: { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-100',  iconBg: 'bg-purple-100' },
    gray:   { bg: 'bg-gray-50',    text: 'text-gray-700',    border: 'border-gray-100',    iconBg: 'bg-gray-100'   },
  };
  const c = colors[color] || colors.amber;

  return (
    <div className={`${c.bg} ${c.border} border rounded-2xl p-5 hover:shadow-md transition-all duration-200`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`${c.iconBg} w-10 h-10 rounded-xl flex items-center justify-center text-xl`}>
          {icon}
        </div>
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      {subtitle && <p className={`text-xs mt-1 ${c.text} opacity-70`}>{subtitle}</p>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      {description && <p className="text-sm text-gray-400 max-w-xs mb-6">{description}</p>}
      {action && action}
    </div>
  );
}

export function Badge({ children, color = 'gray' }) {
  const colors = {
    gray:   'bg-gray-100 text-gray-600',
    green:  'bg-emerald-100 text-emerald-700',
    red:    'bg-red-100 text-red-700',
    amber:  'bg-amber-100 text-amber-700',
    blue:   'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${colors[color] || colors.gray}`}>
      {children}
    </span>
  );
}

export function ProgressBar({ value, max, color = 'amber' }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colors = {
    amber: 'bg-amber-500',
    green: 'bg-emerald-500',
    red:   'bg-red-500',
    blue:  'bg-blue-500',
  };
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className={`${colors[color] || colors.amber} h-2 rounded-full transition-all duration-500`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}