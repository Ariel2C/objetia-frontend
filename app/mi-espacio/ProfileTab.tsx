"use client";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthContext';
import { getApiUrl } from '../../lib/config';
import { ShieldCheck, MapPin, Loader2, Save } from 'lucide-react';

export default function ProfileTab() {
  const { usuario, token, login } = useAuth();
  
  const [fullName, setFullName] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [floorDept, setFloorDept] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
    } catch (err: any) {
      setErrorMsg(err.message || "Error al intentar actualizar tus datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in select-none max-w-2xl">
      <div>
        <h3 className="text-base font-semibold leading-7 text-slate-900">Perfil</h3>
        <p className="text-xs text-slate-500">Configuración de información personal y dirección de entrega.</p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-bold">
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h4 className="text-base font-semibold leading-7 text-slate-900 border-b border-slate-100 pb-2">Información Personal</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Correo Electrónico (No editable)</label>
              <input
                type="email"
                disabled
                value={usuario?.email || ""}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-400 font-medium cursor-not-allowed"
              />
            </div>

            {usuario?.role && usuario.role !== "client" && (
              <div className="md:col-span-2 space-y-1">
                <span className="text-sm font-medium text-slate-700 block">Rol de Sistema</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100 uppercase">
                  {usuario.role}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dirección de Envío */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
          <h4 className="text-base font-semibold leading-7 text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <MapPin className="h-5 w-5 text-slate-700" /> Dirección de Envío Predeterminada
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700 block mb-1">Calle</label>
              <input
                type="text"
                placeholder="Av. Colón"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Número</label>
              <input
                type="text"
                placeholder="1234"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Piso/Departamento</label>
              <input
                type="text"
                placeholder="2° B"
                value={floorDept}
                onChange={(e) => setFloorDept(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Código Postal</label>
              <input
                type="text"
                placeholder="X5000"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Ciudad / Localidad</label>
              <input
                type="text"
                placeholder="Córdoba"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition"
              />
            </div>
            <div className="md:col-span-3">
              <label className="text-sm font-medium text-slate-700 block mb-1">Provincia</label>
              <input
                type="text"
                placeholder="Córdoba"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-slate-800 bg-white transition"
              />
            </div>
          </div>
        </div>

        {/* Botón de Guardado */}
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto px-6 py-2.5 bg-[#4F46E5] hover:bg-[#4F46E5]/90 text-white font-semibold rounded-lg text-sm transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm active:scale-98"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Guardar Cambios
            </>
          )}
        </button>
      </form>
    </div>
  );
}
