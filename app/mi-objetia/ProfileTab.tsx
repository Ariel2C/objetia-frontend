"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthContext';
import { getApiUrl } from '../../lib/config';
import { ShieldCheck, MapPin, Loader2, Save, Pencil, X } from 'lucide-react';

interface ProfileTabProps {
  onSavingChange?: (saving: boolean) => void;
}

export default function ProfileTab({ onSavingChange }: ProfileTabProps) {
  const { usuario, token, login } = useAuth();
  
  const [fullName, setFullName] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [floorDept, setFloorDept] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  
  const [editandoDireccion, setEditandoDireccion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Cargar datos actuales del usuario al montar o al cambiar usuario
  useEffect(() => {
    if (usuario) {
      setFullName(usuario.full_name || "");
      const u = usuario as any;
      setStreet(u.street || "");
      setNumber(u.number || "");
      setFloorDept(u.floor_dept || "");
      setPostalCode(u.postal_code || "");
      setCity(u.city || "");
      setProvince(u.province || "");
    }
  }, [usuario]);

  const tieneDireccion = Boolean(
    street.trim() || number.trim() || city.trim() || province.trim()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    onSavingChange?.(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch(`${getApiUrl()}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('vamaar_token') || token}`
        },
        body: JSON.stringify({
          full_name: fullName,
          street: street,
          number: number,
          floor_dept: floorDept,
          postal_code: postalCode.toUpperCase().trim(),
          city: city,
          province: province
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Error al actualizar el perfil.");

      login(localStorage.getItem('vamaar_token') || token || "", data);
      setSuccessMsg("¡Perfil y dirección de envío guardados con éxito!");
      setEditandoDireccion(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al intentar actualizar tus datos.");
    } finally {
      setLoading(false);
      onSavingChange?.(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in select-none w-full">
      {successMsg && (
        <div className="p-3.5 bg-[#e6f4ea] border border-[#ceead6] text-[#137333] rounded-xl text-xs font-semibold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#137333]" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
          ⚠️ {errorMsg}
        </div>
      )}

      <form id="perfil-form" onSubmit={handleSubmit} className="space-y-6 w-full">
        {/* Información Personal */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs w-full">
          <h4 className="text-sm font-semibold text-[#202124] border-b border-[#f1f3f4] pb-3">
            Información Personal
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">Nombre Completo *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] bg-[#f8f9fa] focus:bg-white transition"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">Correo Electrónico (No editable)</label>
              <input
                type="email"
                disabled
                value={usuario?.email || ""}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0]/60 bg-[#f1f3f4] text-[#5f6368] font-medium cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Dirección de Envío */}
        <div className="bg-white border border-[#dadce0] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs w-full">
          <div className="flex items-center justify-between border-b border-[#f1f3f4] pb-3">
            <h4 className="text-sm font-semibold text-[#202124] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#1a73e8]" /> Dirección de Entrega Predeterminada
            </h4>

            {!editandoDireccion && (
              <button
                type="button"
                onClick={() => setEditandoDireccion(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#d2e3fc] border border-[#d2e3fc] transition cursor-pointer"
                title="Editar dirección"
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>{tieneDireccion ? "Editar" : "Agregar dirección"}</span>
              </button>
            )}
          </div>

          {!editandoDireccion ? (
            <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#dadce0]/80 flex items-center justify-between gap-4">
              {tieneDireccion ? (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#202124]">
                    {street} {number} {floorDept && <span className="text-[#5f6368] font-normal">({floorDept})</span>}
                  </p>
                  <p className="text-xs text-[#5f6368]">
                    {[city, province].filter(Boolean).join(', ')} {postalCode && <span className="font-mono font-medium">· CP {postalCode}</span>}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[#5f6368] italic">
                  No tienes una dirección de entrega configurada aún. Haz clic en "Agregar dirección" para definir tu domicilio de envío.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">Calle</label>
                  <input
                    type="text"
                    placeholder="Av. Colón"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] bg-[#f8f9fa] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">Número</label>
                  <input
                    type="text"
                    placeholder="1234"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] bg-[#f8f9fa] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">Piso / Depto</label>
                  <input
                    type="text"
                    placeholder="2° B"
                    value={floorDept}
                    onChange={(e) => setFloorDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] bg-[#f8f9fa] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">Código Postal</label>
                  <input
                    type="text"
                    placeholder="X5000"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] bg-[#f8f9fa] focus:bg-white transition font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">Ciudad / Localidad</label>
                  <input
                    type="text"
                    placeholder="Córdoba"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] bg-[#f8f9fa] focus:bg-white transition"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">Provincia</label>
                  <input
                    type="text"
                    placeholder="Córdoba"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] bg-[#f8f9fa] focus:bg-white transition"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setEditandoDireccion(false)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-xl transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" /> Ocultar edición
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
