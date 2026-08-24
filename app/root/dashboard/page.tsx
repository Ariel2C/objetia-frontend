"use client";
import React from 'react';
import RootTab from '../../mi-espacio/RootTab';

export default function RootDashboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0c] p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <RootTab />
      </div>
    </div>
  );
}
