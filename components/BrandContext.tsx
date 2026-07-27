"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface BrandConfig {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string;
}

const BrandContext = createContext<{ config: BrandConfig | null }>({ config: null });

export function BrandProvider({ 
  children, 
  initialConfig 
}: { 
  children: React.ReactNode; 
  initialConfig: BrandConfig; 
}) {
  const [config] = useState<BrandConfig>(initialConfig);

  useEffect(() => {
    if (config) {
      // Inyección dinámica de estilos en el root del DOM
      const root = document.documentElement;
      root.style.setProperty("--color-primary", config.primary_color);
      root.style.setProperty("--color-secondary", config.secondary_color);
      root.style.setProperty("--color-accent", config.accent_color);
    }
  }, [config]);

  return (
    <BrandContext.Provider value={{ config }}>
      {children}
    </BrandContext.Provider>
  );
}

export const useBrand = () => useContext(BrandContext);
