"use client";
import React from 'react';

interface FormattedPriceProps {
  price: number;
  showCents?: boolean;
  className?: string;
}

export default function FormattedPrice({ price, showCents = true, className = "" }: FormattedPriceProps) {
  const safePrice = typeof price === 'number' ? price : 0;
  
  // Separar parte entera y centavos
  const parts = safePrice.toFixed(2).split('.');
  const integerPart = parseInt(parts[0], 10).toLocaleString('es-AR');
  const centsPart = parts[1];

  if (!showCents) {
    return <span className={className}>${integerPart}</span>;
  }

  return (
    <span className={`inline-flex items-baseline ${className}`}>
      <span>${integerPart}</span>
      <span className="text-[0.62em] font-black relative -top-[0.45em] ml-0.5 leading-none select-none">
        {centsPart}
      </span>
    </span>
  );
}
