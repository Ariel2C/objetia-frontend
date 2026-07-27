"use client";
import React, { useState, useEffect } from 'react';

export default function ErrorVisualizer() {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setErrorMsg(`${event.message} en ${event.filename}:${event.lineno}`);
    };
    window.addEventListener('error', handleError);
    
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reasonStr = event.reason instanceof Error ? event.reason.message : String(event.reason);
      setErrorMsg(`Rechazo de Promesa: ${reasonStr}`);
    };
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  if (!errorMsg) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-[9999] bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl shadow-xl text-xs font-mono overflow-auto max-h-[180px] leading-relaxed">
      <div className="flex justify-between items-start gap-3">
        <span className="font-extrabold">🚨 ERROR DETECTADO: {errorMsg}</span>
        <button 
          onClick={() => setErrorMsg(null)} 
          className="ml-auto font-black text-sm text-red-500 hover:text-red-700 cursor-pointer"
        >
          ×
        </button>
      </div>
    </div>
  );
}
