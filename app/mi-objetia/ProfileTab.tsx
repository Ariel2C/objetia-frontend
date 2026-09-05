"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../components/AuthContext';
import { getApiUrl, getGoogleMapsApiKey } from '../../lib/config';
import { ShieldCheck, MapPin, Loader2, Save, Pencil, X } from 'lucide-react';

const PROVINCIAS_ARGENTINA = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires (CABA)",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán"
];

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

  const streetInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Cargar Google Places API si hay API key configurada
  useEffect(() => {
    const apiKey = getGoogleMapsApiKey();
    if (!apiKey || typeof window === 'undefined') return;

    if ((window as any).google?.maps?.places) {
      setGoogleMapsLoaded(true);
      return;
    }

    const scriptId = 'google-maps-places-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es&region=AR`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleMapsLoaded(true);
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setGoogleMapsLoaded(true));
    }
  }, []);

  // Inicializar Autocomplete cuando se edite la dirección y la API esté lista
  useEffect(() => {
    if (!editandoDireccion || !googleMapsLoaded || !streetInputRef.current) return;

    const google = (window as any).google;
    if (!google?.maps?.places?.Autocomplete) return;

    try {
      const autocomplete = new google.maps.places.Autocomplete(streetInputRef.current, {
        componentRestrictions: { country: 'ar' },
        fields: ['address_components', 'name', 'formatted_address', 'place_id', 'geometry'],
        types: ['address']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place || !place.address_components) return;

        let parsedStreet = '';
        let parsedNumber = '';
        let parsedCity = '';
        let parsedProvince = '';
        let parsedPostalCode = '';

        for (const comp of place.address_components) {
          const types: string[] = comp.types || [];
          if (types.includes('route')) {
            parsedStreet = comp.long_name;
          } else if (types.includes('street_number')) {
            parsedNumber = comp.long_name;
          } else if (types.includes('locality')) {
            parsedCity = comp.long_name;
          } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
            if (!parsedCity) parsedCity = comp.long_name;
          } else if (types.includes('administrative_area_level_2')) {
            if (!parsedCity) parsedCity = comp.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            parsedProvince = comp.long_name;
          } else if (types.includes('postal_code') || types.includes('postal_code_prefix')) {
            parsedPostalCode = comp.long_name;
          }
        }

        if (parsedStreet) setStreet(parsedStreet);
        if (parsedNumber) setNumber(parsedNumber);
        if (parsedCity) setCity(parsedCity);

        // 1. Intentar extraer CP de formatted_address si no vino en address_components
        if (!parsedPostalCode && place.formatted_address) {
          const matches = place.formatted_address.match(/\b([A-Z]?\d{4}[A-Z]{0,3})\b/g);
          if (matches) {
            for (const m of matches) {
              if (m !== parsedNumber && m !== '0000') {
                parsedPostalCode = m;
                break;
              }
            }
          }
        }

        if (parsedPostalCode) {
          setPostalCode(parsedPostalCode);
        }

        // 2. Si todavía no tenemos CP, extraer coordenadas para resolución exacta
        const lat = place.geometry?.location ? (typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat) : null;
        const lng = place.geometry?.location ? (typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng) : null;

        if (!parsedPostalCode) {
          // A) Intentar con Google Geocoder si está disponible
          if (google?.maps?.Geocoder && (place.place_id || (lat && lng))) {
            const geocoder = new google.maps.Geocoder();
            const req = place.place_id ? { placeId: place.place_id } : { location: { lat, lng } };
            geocoder.geocode(req, (results: any, status: string) => {
              if (status === 'OK' && results && results[0]?.address_components) {
                for (const c of results[0].address_components) {
                  if (c.types.includes('postal_code') || c.types.includes('postal_code_prefix')) {
                    setPostalCode(c.long_name);
                    return;
                  }
                }
              }
              // B) Si Google Geocoder no devolvió el CP, consultar Nominatim por coordenadas
              if (lat && lng) {
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                  .then((r) => r.json())
                  .then((data) => {
                    if (data?.address?.postcode) {
                      setPostalCode(data.address.postcode.trim());
                    }
                  })
                  .catch(() => {});
              }
            });
          } else if (lat && lng) {
            // Consulta directa a Nominatim reverse geocoding si no hay Google Geocoder
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
              .then((r) => r.json())
              .then((data) => {
                if (data?.address?.postcode) {
                  setPostalCode(data.address.postcode.trim());
                }
              })
              .catch(() => {});
          }
        }

        if (parsedProvince) {
          const normGoogle = parsedProvince.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          if (
            normGoogle.includes('caba') ||
            normGoogle.includes('ciudad autonoma') ||
            normGoogle.includes('capital federal') ||
            normGoogle.includes('buenos aires capital')
          ) {
            setProvince('Ciudad Autónoma de Buenos Aires (CABA)');
          } else {
            const matched = PROVINCIAS_ARGENTINA.find((p) => {
              const pNorm = p.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              return normGoogle.includes(pNorm) || pNorm.includes(normGoogle);
            });
            if (matched) {
              setProvince(matched);
            } else {
              setProvince(parsedProvince);
            }
          }
        }
      });

      autocompleteRef.current = autocomplete;
    } catch (err) {
      console.warn('Error inicializando Google Places Autocomplete:', err);
    }

    return () => {
      if (autocompleteRef.current && (window as any).google?.maps?.event?.clearInstanceListeners) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [editandoDireccion, googleMapsLoaded]);

  // Si el usuario escribe directamente el Código Postal (ej 5000), autocompletar provincia y ciudad
  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPostalCode(val);

    const clean = val.trim();
    if ((clean.length === 4 && /^\d{4}$/.test(clean)) || (clean.length === 8 && /^[A-Z]\d{4}[A-Z]{3}$/i.test(clean))) {
      const google = typeof window !== 'undefined' && (window as any).google;
      if (google?.maps?.Geocoder) {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          { address: `CP ${clean}, Argentina`, componentRestrictions: { country: 'ar' } },
          (results: any, status: string) => {
            if (status === 'OK' && results && results[0]?.address_components) {
              for (const comp of results[0].address_components) {
                const types = comp.types || [];
                if (types.includes('locality') || types.includes('sublocality') || types.includes('administrative_area_level_2')) {
                  setCity((prev) => prev || comp.long_name);
                }
                if (types.includes('administrative_area_level_1')) {
                  const pName = comp.long_name;
                  const matched = PROVINCIAS_ARGENTINA.find((p) =>
                    p.toLowerCase().includes(pName.toLowerCase()) || pName.toLowerCase().includes(p.toLowerCase())
                  );
                  if (matched) setProvince(matched);
                }
              }
            }
          }
        );
      }
    }
  };

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
                placeholder="Ingresá tu nombre y apellido"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] placeholder:text-[#9aa0a6] bg-[#f8f9fa] focus:bg-white transition"
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
                    ref={streetInputRef}
                    type="text"
                    placeholder="Ej: Av. San Martín 1240"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.preventDefault();
                    }}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] placeholder:text-[#9aa0a6] bg-[#f8f9fa] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">Número</label>
                  <input
                    type="text"
                    placeholder="Ej: 1240"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] placeholder:text-[#9aa0a6] bg-[#f8f9fa] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">Piso / Depto <span className="text-[#80868b] font-normal">(Opcional)</span></label>
                  <input
                    type="text"
                    placeholder="Ej: 2° B"
                    value={floorDept}
                    onChange={(e) => setFloorDept(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] placeholder:text-[#9aa0a6] bg-[#f8f9fa] focus:bg-white transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">Código Postal</label>
                  <input
                    type="text"
                    placeholder="Código postal"
                    value={postalCode}
                    onChange={handlePostalCodeChange}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] placeholder:text-[#9aa0a6] bg-[#f8f9fa] focus:bg-white transition font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">Provincia</label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] bg-[#f8f9fa] focus:bg-white transition cursor-pointer"
                  >
                    <option value="">Seleccioná tu provincia...</option>
                    {PROVINCIAS_ARGENTINA.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">Ciudad / Localidad</label>
                  <input
                    type="text"
                    placeholder="Ej: Córdoba Capital"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] placeholder:text-[#9aa0a6] bg-[#f8f9fa] focus:bg-white transition"
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
