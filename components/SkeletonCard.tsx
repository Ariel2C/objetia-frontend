// app/components/SkeletonCard.tsx
import React from 'react';

export default function SkeletonCard() {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden p-4 bg-white space-y-4">
      <div className="aspect-square skeleton-shimmer rounded-xl w-full" />
      <div className="h-4 skeleton-shimmer rounded w-1/3" />
      <div className="h-4 skeleton-shimmer rounded w-3/4" />
      <div className="flex justify-between items-center pt-4">
        <div className="h-6 skeleton-shimmer rounded w-1/4" />
        <div className="h-10 skeleton-shimmer rounded-xl w-10" />
      </div>
    </div>
  );
}
