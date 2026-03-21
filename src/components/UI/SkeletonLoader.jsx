// src/components/UI/SkeletonLoader.jsx
import React from 'react';

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

function BatchCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(i => (
          <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-2">
            <Skeleton className="h-3 w-16 mx-auto" />
            <Skeleton className="h-8 w-10 mx-auto" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Skeleton className="h-4 w-24" />
            <div className="flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1, 2, 3].map(i => <BatchCardSkeleton key={i} />)}
      </div>
    </div>
  );
}