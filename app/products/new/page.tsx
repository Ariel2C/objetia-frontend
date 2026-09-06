// app/products/new/page.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../components/AuthContext";
import { useToast } from "../../../components/ToastContext";
import NewProductModal from "../../../components/NewProductModal";
import { Loader2 } from "lucide-react";

export default function NewProductPage() {
  const { usuario, cargando, tienePermiso } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (cargando || hasRedirected.current) return;

    if (!usuario) {
      hasRedirected.current = true;
      router.push("/auth?redirect=/products/new");
      return;
    }

    const canSell = 
      tienePermiso('sell_products') || 
      tienePermiso('publications') || 
      tienePermiso('sales') || 
      tienePermiso('full_access') || 
      ['root', 'admin', 'seller', 'cliente', 'client'].includes(usuario.role?.toLowerCase() || '');

    if (!canSell) {
      hasRedirected.current = true;
      toast.error("No tienes permiso para publicar o vender productos.");
      router.push("/mi-objetia");
    }
  }, [cargando, usuario, tienePermiso, router]);

  if (cargando || !usuario) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center">
      <NewProductModal
        isOpen={true}
        onClose={() => {
          router.push("/mi-objetia?tab=publications");
        }}
      />
    </div>
  );
}
