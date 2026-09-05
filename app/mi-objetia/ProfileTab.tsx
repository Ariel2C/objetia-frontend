"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../components/AuthContext';
import { getApiUrl, getGoogleMapsApiKey } from '../../lib/config';
import { ShieldCheck, MapPin, Loader2, Save, Pencil, X, Trash2, Plus, Check, Navigation, AlertCircle, ArrowRight, ArrowLeft, Tag } from 'lucide-react';

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

const matchProvince = (googleProvince: string): string => {
  if (!googleProvince) return "";
  const normGoogle = googleProvince.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (
    normGoogle.includes("caba") ||
    normGoogle.includes("ciudad autonoma") ||
    normGoogle.includes("capital federal") ||
    normGoogle.includes("buenos aires capital")
  ) {
    return "Ciudad Autónoma de Buenos Aires (CABA)";
  }
  const matched = PROVINCIAS_ARGENTINA.find((p) => {
    const pNorm = p.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normGoogle.includes(pNorm) || pNorm.includes(normGoogle);
  });
  return matched || googleProvince;
};

export interface UserAddress {
  id: number;
  user_id: number;
  title?: string;
  street: string;
  number: string;
  floor_dept?: string;
  postal_code?: string;
  city: string;
  province: string;
  is_default: boolean;
  lat?: number | null;
  lng?: number | null;
  created_at?: string;
  updated_at?: string;
}

interface ProfileTabProps {
  onSavingChange?: (saving: boolean) => void;
}

export default function ProfileTab({ onSavingChange }: ProfileTabProps) {
  const { usuario, token, login } = useAuth();
  
  const [fullName, setFullName] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Lista de direcciones del usuario
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Estado del formulario de dirección (Agregar / Editar)
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressFormStep, setAddressFormStep] = useState<1 | 2>(1);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [formTitle, setFormTitle] = useState("Mi casa");
  const [formStreet, setFormStreet] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formFloorDept, setFormFloorDept] = useState("");
  const [formPostalCode, setFormPostalCode] = useState("");
  const [formProvince, setFormProvince] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [formLat, setFormLat] = useState<number | null>(null);
  const [formLng, setFormLng] = useState<number | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");

  // Google Maps refs & script
  const streetInputRef = useRef<HTMLInputElement>(null);
  const streetWrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Estado del autocompletado interactivo
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [showPredictionsDropdown, setShowPredictionsDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

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
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=es&region=AR&loading=async`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleMapsLoaded(true);
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', () => setGoogleMapsLoaded(true));
    }
  }, []);

  // Cargar datos actuales del usuario al montar o al cambiar usuario
  useEffect(() => {
    if (usuario) {
      setFullName(usuario.full_name || "");
    }
  }, [usuario]);

  // Cargar direcciones desde la API
  const fetchAddresses = useCallback(async () => {
    const authToken = localStorage.getItem('vamaar_token') || token;
    if (!authToken) return;

    setLoadingAddresses(true);
    try {
      const res = await fetch(`${getApiUrl()}/auth/addresses`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn("Error al cargar direcciones:", err);
    } finally {
      setLoadingAddresses(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Geocodificación inversa para actualizar campos desde coordenadas
  const handleReverseGeocode = (lat: number, lng: number) => {
    setFormLat(lat);
    setFormLng(lng);

    const google = typeof window !== 'undefined' && (window as any).google;
    if (google?.maps?.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
        if (status === 'OK' && results && results[0]) {
          const compList = results[0].address_components || [];
          let pStreet = '';
          let pNumber = '';
          let pCity = '';
          let pProvince = '';
          let pCp = '';

          for (const c of compList) {
            const types = c.types || [];
            if (types.includes('route')) pStreet = c.long_name;
            else if (types.includes('street_number')) pNumber = c.long_name;
            else if (types.includes('locality')) pCity = c.long_name;
            else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
              if (!pCity) pCity = c.long_name;
            } else if (types.includes('administrative_area_level_2')) {
              if (!pCity) pCity = c.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              pProvince = c.long_name;
            } else if (types.includes('postal_code') || types.includes('postal_code_prefix')) {
              pCp = c.long_name;
            }
          }

          if (pStreet) setFormStreet(pStreet);
          if (pNumber) setFormNumber(pNumber);
          if (pCity) setFormCity(pCity);
          if (pCp) setFormPostalCode(pCp);
          if (pProvince) {
            const matched = matchProvince(pProvince);
            if (matched) setFormProvince(matched);
          }
        } else {
          fallbackNominatim(lat, lng);
        }
      });
    } else {
      fallbackNominatim(lat, lng);
    }
  };

  const fallbackNominatim = (lat: number, lng: number) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.address) {
          const a = data.address;
          if (a.road) setFormStreet(a.road);
          if (a.house_number) setFormNumber(a.house_number);
          if (a.city || a.town || a.village) setFormCity(a.city || a.town || a.village);
          if (a.postcode) setFormPostalCode(a.postcode.trim());
          if (a.state) {
            const matched = matchProvince(a.state);
            if (matched) setFormProvince(matched);
          }
        }
      })
      .catch(() => {});
  };

  // Cerrar el menú desplegable de sugerencias al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (streetWrapperRef.current && !streetWrapperRef.current.contains(e.target as Node)) {
        setShowPredictionsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Manejar cambios en el campo Calle y buscar sugerencias
  const handleStreetChange = (text: string) => {
    setFormStreet(text);
    setHighlightedIndex(-1);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (text.trim().length < 2) {
      setPredictions([]);
      setShowPredictionsDropdown(false);
      return;
    }

    setLoadingPredictions(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(text.trim())}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.predictions) && data.predictions.length > 0) {
            setPredictions(data.predictions);
            setShowPredictionsDropdown(true);
          } else {
            setPredictions([]);
            setShowPredictionsDropdown(false);
          }
        }
      } catch (err) {
        console.warn("Error consultando sugerencias de dirección:", err);
      } finally {
        setLoadingPredictions(false);
      }
    }, 200);
  };

  // Al seleccionar una sugerencia del autocompletado
  const handleSelectPrediction = async (prediction: any) => {
    setShowPredictionsDropdown(false);
    setPredictions([]);

    if (prediction.source === 'google' && prediction.id && !prediction.id.startsWith('nom_')) {
      try {
        const res = await fetch(`/api/places/details?place_id=${encodeURIComponent(prediction.id)}`);
        if (res.ok) {
          const details = await res.json();
          if (details.street) setFormStreet(details.street);
          else if (prediction.main_text) setFormStreet(prediction.main_text);

          if (details.number) setFormNumber(details.number);
          if (details.city) setFormCity(details.city);
          if (details.province) {
            const matched = matchProvince(details.province);
            if (matched) setFormProvince(matched);
          }
          if (details.postal_code) setFormPostalCode(details.postal_code);

          if (details.lat && details.lng) {
            setFormLat(details.lat);
            setFormLng(details.lng);
            if (mapInstanceRef.current && markerRef.current) {
              mapInstanceRef.current.setCenter({ lat: details.lat, lng: details.lng });
              mapInstanceRef.current.setZoom(17);
              markerRef.current.setPosition({ lat: details.lat, lng: details.lng });
            }
          }
          return;
        }
      } catch (err) {
        console.warn("Error obteniendo detalles del lugar:", err);
      }
    }

    // Respaldo Nominatim o genérico
    if (prediction.address) {
      const a = prediction.address;
      const road = a.road || prediction.main_text || "";
      if (road) setFormStreet(road);
      if (a.house_number) setFormNumber(a.house_number);
      if (a.city || a.town || a.village) setFormCity(a.city || a.town || a.village);
      if (a.state) {
        const matched = matchProvince(a.state);
        if (matched) setFormProvince(matched);
      }
      if (a.postcode) setFormPostalCode(a.postcode.trim());
    } else {
      if (prediction.main_text) setFormStreet(prediction.main_text);
    }

    if (prediction.lat && prediction.lng) {
      setFormLat(prediction.lat);
      setFormLng(prediction.lng);
      if (mapInstanceRef.current && markerRef.current) {
        mapInstanceRef.current.setCenter({ lat: prediction.lat, lng: prediction.lng });
        mapInstanceRef.current.setZoom(17);
        markerRef.current.setPosition({ lat: prediction.lat, lng: prediction.lng });
      }
    }
  };

  // Inicializar Google Map cuando se abre el formulario de dirección
  useEffect(() => {
    if (!showAddressForm || !googleMapsLoaded || !mapContainerRef.current) return;

    const google = (window as any).google;
    if (!google?.maps?.Map) return;

    const initialPos = {
      lat: formLat ?? -31.4167,
      lng: formLng ?? -64.1833
    };

    const map = new google.maps.Map(mapContainerRef.current, {
      center: initialPos,
      zoom: formLat && formLng ? 17 : 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      gestureHandling: 'greedy'
    });

    const marker = new google.maps.Marker({
      position: initialPos,
      map,
      draggable: true,
      animation: google.maps.Animation.DROP,
      title: "Arrastrá para marcar tu ubicación exacta"
    });

    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      if (pos) {
        const lat = pos.lat();
        const lng = pos.lng();
        handleReverseGeocode(lat, lng);
      }
    });

    map.addListener('click', (e: any) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        marker.setPosition({ lat, lng });
        handleReverseGeocode(lat, lng);
      }
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      if (mapInstanceRef.current && (window as any).google?.maps?.event?.clearInstanceListeners) {
        (window as any).google.maps.event.clearInstanceListeners(mapInstanceRef.current);
      }
    };
  }, [showAddressForm, googleMapsLoaded]);

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = localStorage.getItem('vamaar_token') || token;
    if (!authToken) return;

    setLoadingProfile(true);
    onSavingChange?.(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch(`${getApiUrl()}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          full_name: fullName
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al actualizar perfil");
      }

      const updatedUser = await res.json();
      login(authToken, updatedUser);
      setSuccessMsg("Información personal guardada con éxito");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al actualizar datos");
    } finally {
      setLoadingProfile(false);
      onSavingChange?.(false);
    }
  };

  const handleOpenCreateForm = () => {
    setEditingAddressId(null);
    setFormTitle("Mi casa");
    setFormStreet("");
    setFormNumber("");
    setFormFloorDept("");
    setFormPostalCode("");
    setFormProvince("");
    setFormCity("");
    setFormIsDefault(addresses.length === 0);
    setFormLat(null);
    setFormLng(null);
    setAddressError("");
    setAddressFormStep(1);
    setShowAddressForm(true);
  };

  const handleOpenEditForm = (addr: UserAddress) => {
    setEditingAddressId(addr.id);
    setFormTitle(addr.title || "Mi casa");
    setFormStreet(addr.street);
    setFormNumber(addr.number);
    setFormFloorDept(addr.floor_dept || "");
    setFormPostalCode(addr.postal_code || "");
    setFormProvince(addr.province);
    setFormCity(addr.city);
    setFormIsDefault(addr.is_default);
    setFormLat(addr.lat ?? null);
    setFormLng(addr.lng ?? null);
    setAddressError("");
    setAddressFormStep(1);
    setShowAddressForm(true);
  };

  const handleNextStep = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formStreet.trim() || !formNumber.trim() || !formCity.trim() || !formProvince.trim()) {
      setAddressError("Por favor completá los campos obligatorios: Calle, Número, Ciudad y Provincia antes de continuar.");
      return;
    }
    setAddressError("");
    setAddressFormStep(2);
  };

  const handlePostalCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cp = e.target.value;
    setFormPostalCode(cp);

    const cleanCp = cp.trim();
    if (cleanCp.length >= 4) {
      try {
        const res = await fetch(`https://api.zippopotam.us/ar/${cleanCp}`);
        if (res.ok) {
          const data = await res.json();
          if (data.places && data.places.length > 0) {
            const place = data.places[0];
            if (!formCity && place['place name']) {
              setFormCity(place['place name']);
            }
            if (!formProvince && place['state']) {
              const matched = matchProvince(place['state']);
              if (matched) setFormProvince(matched);
            }
          }
        }
      } catch {
        // Silencioso si falla servicio externo
      }
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    const authToken = localStorage.getItem('vamaar_token') || token;
    if (!authToken) return;

    if (!formStreet.trim() || !formNumber.trim() || !formCity.trim() || !formProvince.trim()) {
      setAddressError("Por favor completá todos los campos requeridos (Calle, Número, Ciudad, Provincia).");
      return;
    }

    setSavingAddress(true);
    setAddressError("");

    const payload = {
      title: formTitle.trim() || "Dirección",
      street: formStreet.trim(),
      number: formNumber.trim(),
      floor_dept: formFloorDept.trim() || null,
      postal_code: formPostalCode.trim() || null,
      city: formCity.trim(),
      province: formProvince.trim(),
      is_default: formIsDefault,
      lat: formLat,
      lng: formLng
    };

    try {
      const url = editingAddressId
        ? `${getApiUrl()}/auth/addresses/${editingAddressId}`
        : `${getApiUrl()}/auth/addresses`;
      const method = editingAddressId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al guardar la dirección");
      }

      await fetchAddresses();

      // Sincronizar perfil si es activa o la única
      if (formIsDefault || addresses.length === 0) {
        try {
          const profileRes = await fetch(`${getApiUrl()}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (profileRes.ok) {
            const updatedUser = await profileRes.json();
            login(authToken, updatedUser);
          }
        } catch {
          // ignore
        }
      }

      setShowAddressForm(false);
      setEditingAddressId(null);
      setSuccessMsg(editingAddressId ? "Dirección actualizada correctamente" : "Dirección agregada con éxito");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setAddressError(err.message || "Error al guardar la dirección");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    const confirmDelete = window.confirm("¿Estás seguro de que querés eliminar esta dirección?");
    if (!confirmDelete) return;

    const authToken = localStorage.getItem('vamaar_token') || token;
    if (!authToken) return;

    try {
      const res = await fetch(`${getApiUrl()}/auth/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al eliminar dirección");
      }

      await fetchAddresses();
      setSuccessMsg("Dirección eliminada correctamente");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al eliminar dirección");
      setTimeout(() => setErrorMsg(""), 4000);
    }
  };

  const handleSetDefault = async (id: number) => {
    const authToken = localStorage.getItem('vamaar_token') || token;
    if (!authToken) return;

    try {
      const res = await fetch(`${getApiUrl()}/auth/addresses/${id}/default`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Error al activar dirección");
      }

      await fetchAddresses();

      const profileRes = await fetch(`${getApiUrl()}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (profileRes.ok) {
        const updatedUser = await profileRes.json();
        login(authToken, updatedUser);
      }
      setSuccessMsg("Dirección seleccionada como activa para envíos");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al establecer dirección predeterminada");
      setTimeout(() => setErrorMsg(""), 4000);
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

      {/* Formulario de Información Personal */}
      <form id="perfil-form" onSubmit={handleSubmitProfile} className="space-y-6 w-full">
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
      </form>

      {/* Sección de Direcciones de Entrega */}
      <div className="bg-white border border-[#dadce0] rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs w-full">
        {/* Cabecera con título y botón Agregar */}
        <div className="flex items-center justify-between border-b border-[#f1f3f4] pb-3">
          <div className="space-y-0.5">
            <h4 className="text-sm font-semibold text-[#202124] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#1a73e8]" /> Direcciones de Entrega
            </h4>
            <p className="text-xs text-[#5f6368]">
              Tus domicilios guardados para recibir compras y envíos
            </p>
          </div>

          {!showAddressForm && (
            <button
              type="button"
              onClick={handleOpenCreateForm}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#1a73e8] bg-[#e8f0fe] hover:bg-[#d2e3fc] border border-[#d2e3fc] transition cursor-pointer active:scale-98 shadow-2xs"
              title="Agregar nueva dirección"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Agregar dirección</span>
            </button>
          )}
        </div>

        {/* 1. VISTA DE FORMULARIO DE DIRECCIÓN (PASO 1 Y PASO 2) */}
        {showAddressForm ? (
          <div className="space-y-5 animate-fade-in">
            {addressError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                {addressError}
              </div>
            )}

            {addressFormStep === 1 ? (
              /* PASO 1: Campos de Calle, Número, Ciudad, CP y Mapa Interactivo */
              <form onSubmit={editingAddressId ? handleSaveAddress : handleNextStep} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-fade-in">
                {/* COLUMNA IZQUIERDA: Campos de Dirección */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 relative" ref={streetWrapperRef}>
                      <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">
                        Calle *
                      </label>
                      <div className="relative">
                        <input
                          ref={streetInputRef}
                          type="text"
                          required
                          placeholder="Ej: Av. San Martín o buscá tu calle"
                          value={formStreet}
                          onChange={(e) => handleStreetChange(e.target.value)}
                          onFocus={() => {
                            if (predictions.length > 0) setShowPredictionsDropdown(true);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              setHighlightedIndex((prev) => Math.min(prev + 1, predictions.length - 1));
                            } else if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              setHighlightedIndex((prev) => Math.max(prev - 1, 0));
                            } else if (e.key === 'Enter') {
                              if (showPredictionsDropdown && highlightedIndex >= 0 && predictions[highlightedIndex]) {
                                e.preventDefault();
                                handleSelectPrediction(predictions[highlightedIndex]);
                              }
                            } else if (e.key === 'Escape') {
                              setShowPredictionsDropdown(false);
                            }
                          }}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] placeholder:text-[#9aa0a6] bg-[#f8f9fa] focus:bg-white transition"
                          autoComplete="off"
                        />
                        {loadingPredictions && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 text-[#1a73e8] animate-spin" />
                          </div>
                        )}
                      </div>

                      {/* Menú desplegable de sugerencias */}
                      {showPredictionsDropdown && predictions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#dadce0] rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                          {predictions.map((p, idx) => (
                            <button
                              key={p.id || idx}
                              type="button"
                              onClick={() => handleSelectPrediction(p)}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 transition border-b border-[#f1f3f4] last:border-0 cursor-pointer ${
                                highlightedIndex === idx ? "bg-[#e8f0fe] text-[#1a73e8]" : "hover:bg-[#f8f9fa] text-[#202124]"
                              }`}
                            >
                              <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${highlightedIndex === idx ? "text-[#1a73e8]" : "text-[#5f6368]"}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate text-[#202124]">{p.main_text}</p>
                                {p.secondary_text && (
                                  <p className="text-[11px] text-[#5f6368] truncate">{p.secondary_text}</p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">
                        Número *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: 1240"
                        value={formNumber}
                        onChange={(e) => setFormNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] placeholder:text-[#9aa0a6] bg-[#f8f9fa] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">
                        Piso / Depto <span className="text-[#80868b] font-normal">(Opcional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 2° B"
                        value={formFloorDept}
                        onChange={(e) => setFormFloorDept(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] placeholder:text-[#9aa0a6] bg-[#f8f9fa] focus:bg-white transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">
                        Código Postal
                      </label>
                      <input
                        type="text"
                        placeholder="Código postal"
                        value={formPostalCode}
                        onChange={handlePostalCodeChange}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] placeholder:text-[#9aa0a6] bg-[#f8f9fa] focus:bg-white transition font-mono font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">
                        Provincia *
                      </label>
                      <select
                        value={formProvince}
                        required
                        onChange={(e) => setFormProvince(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] bg-[#f8f9fa] focus:bg-white transition cursor-pointer"
                      >
                        <option value="">Seleccioná tu provincia...</option>
                        {PROVINCIAS_ARGENTINA.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#3c4043] block mb-1.5">
                        Ciudad / Localidad *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Córdoba Capital"
                        value={formCity}
                        onChange={(e) => setFormCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] placeholder:text-[#9aa0a6] bg-[#f8f9fa] focus:bg-white transition"
                      />
                    </div>
                  </div>

                  {/* Botones de acción: "Actualizar dirección" si está editando, o "Siguiente" si está agregando */}
                  <div className="flex items-center gap-2.5 pt-3">
                    {editingAddressId ? (
                      <button
                        type="submit"
                        disabled={savingAddress}
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-xl transition cursor-pointer disabled:opacity-60 shadow-xs active:scale-98"
                      >
                        {savingAddress ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Actualizando...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Actualizar dirección</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-xl transition cursor-pointer shadow-xs active:scale-98"
                      >
                        <span>Siguiente</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(false);
                        setEditingAddressId(null);
                        setAddressFormStep(1);
                      }}
                      className="px-3.5 py-2.5 text-xs font-medium text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-xl transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>

                {/* COLUMNA DERECHA: Mapa Interactivo con Pin Arrastrable */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#5f6368]">
                    <span className="font-semibold text-[#3c4043] flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-[#1a73e8]" />
                      Ubicación en el mapa
                    </span>
                    <span className="text-[11px] text-[#80868b]">
                      Arrastrá el pin para afinar el punto exacto
                    </span>
                  </div>

                  <div className="relative w-full h-[380px] rounded-2xl overflow-hidden border border-[#dadce0] bg-[#f8f9fa] shadow-2xs">
                    <div ref={mapContainerRef} className="w-full h-full" />

                    {!googleMapsLoaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#f8f9fa]/95 text-[#5f6368]">
                        <MapPin className="w-8 h-8 text-[#9aa0a6] mb-2 animate-bounce" />
                        <p className="text-xs font-medium text-[#202124]">Cargando mapa interactivo...</p>
                        <p className="text-[11px] text-[#80868b] mt-1 max-w-xs">
                          Podés completar los campos a la izquierda o buscar la calle directamente.
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-[#80868b] italic">
                    💡 Tip: Al mover el pin en el mapa o hacer clic en una calle, los campos de la izquierda se actualizan automáticamente.
                  </p>
                </div>
              </form>
            ) : (
              /* PASO 2: Etiqueta de la dirección y Guardado */
              <form onSubmit={handleSaveAddress} className="max-w-xl mx-auto space-y-5 animate-fade-in bg-white border border-[#dadce0] rounded-2xl p-5 sm:p-6 shadow-xs">
                {/* Resumen visual de la dirección ingresada */}
                <div className="bg-[#f8f9fa] border border-[#dadce0]/70 rounded-xl p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5f6368]">Dirección ingresada</p>
                    <p className="text-sm font-semibold text-[#202124] truncate">
                      {formStreet} {formNumber} {formFloorDept ? `(${formFloorDept})` : ''}
                    </p>
                    <p className="text-xs text-[#5f6368] truncate">
                      {[formCity, formProvince].filter(Boolean).join(', ')} {formPostalCode ? `· CP ${formPostalCode}` : ''}
                    </p>
                  </div>
                </div>

                {/* Campo para la Etiqueta */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-[#3c4043] flex items-center gap-1.5 mb-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#1a73e8]" />
                      Etiqueta de la dirección *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Mi casa, Oficina, Depto"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#dadce0] focus:outline-none focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20 text-[#202124] placeholder:text-[#9aa0a6] bg-[#f8f9fa] focus:bg-white transition font-medium"
                      autoFocus
                    />
                  </div>

                  {/* Sugerencias rápidas de etiquetas */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-[#5f6368]">Sugerencias:</span>
                    {["Mi casa", "Trabajo", "Depto", "Casa de campo", "Otro"].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setFormTitle(sug)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition cursor-pointer ${
                          formTitle === sug
                            ? "bg-[#e8f0fe] text-[#1a73e8] border-[#1a73e8] font-semibold"
                            : "bg-white text-[#5f6368] border-[#dadce0] hover:bg-[#f8f9fa]"
                        }`}
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checkbox para fijar como activa */}
                <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none border-t border-[#f1f3f4]">
                  <input
                    type="checkbox"
                    checked={formIsDefault}
                    onChange={(e) => setFormIsDefault(e.target.checked)}
                    className="w-4 h-4 text-[#1a73e8] rounded-md border-[#dadce0] focus:ring-[#1a73e8] cursor-pointer"
                  />
                  <span className="text-xs font-medium text-[#3c4043]">
                    Establecer como dirección activa para envíos
                  </span>
                </label>

                {/* Botones de acción del Paso 2 */}
                <div className="flex items-center gap-2.5 pt-3 border-t border-[#f1f3f4]">
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-xl transition cursor-pointer disabled:opacity-60 shadow-xs active:scale-98"
                  >
                    {savingAddress ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>{editingAddressId ? "Actualizar dirección" : "Guardar dirección"}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAddressFormStep(1)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-xl transition cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Atrás</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddressId(null);
                      setAddressFormStep(1);
                    }}
                    className="px-3.5 py-2.5 text-xs font-medium text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4] rounded-xl transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* 2. VISTA DE LISTA DE DIRECCIONES GUARDADAS */
          <div className="space-y-3">
            {loadingAddresses ? (
              <div className="p-8 text-center text-[#5f6368] flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#1a73e8]" />
                <span className="text-xs">Cargando tus direcciones...</span>
              </div>
            ) : addresses.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-[#dadce0] bg-[#f8f9fa] text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-[#e8f0fe] text-[#1a73e8] flex items-center justify-center mx-auto">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#202124]">No tenés direcciones guardadas aún</p>
                  <p className="text-xs text-[#5f6368] max-w-md mx-auto">
                    Agregá tu domicilio de entrega para recibir tus compras de manera rápida y sin volver a escribir tus datos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenCreateForm}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded-xl transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar mi primera dirección</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((addr) => {
                  const isActiva = addr.is_default;
                  return (
                    <div
                      key={addr.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isActiva
                          ? "bg-[#f8fafd] border-[#1a73e8]/40 shadow-xs"
                          : "bg-[#f8f9fa] border-[#dadce0]/80 hover:border-[#bdc1c6]"
                      }`}
                    >
                      {/* Lado izquierdo: Selector de activa + Datos de la dirección */}
                      <div className="flex items-start gap-3.5 flex-1">
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="mt-0.5 cursor-pointer focus:outline-none shrink-0"
                          title={isActiva ? "Dirección activa para envíos" : "Hacer clic para activar esta dirección"}
                        >
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                              isActiva
                                ? "border-[#1a73e8] bg-[#1a73e8]"
                                : "border-[#9aa0a6] bg-white hover:border-[#1a73e8]"
                            }`}
                          >
                            {isActiva && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[#202124]">
                              {addr.title || "Dirección de Entrega"}
                            </span>

                            {isActiva ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#1a73e8] bg-[#e8f0fe] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Activa para envíos
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetDefault(addr.id)}
                                className="text-[11px] font-medium text-[#1a73e8] hover:underline cursor-pointer"
                              >
                                Usar como principal
                              </button>
                            )}
                          </div>

                          <p className="text-xs font-medium text-[#3c4043]">
                            {addr.street} {addr.number}{' '}
                            {addr.floor_dept && (
                              <span className="text-[#5f6368] font-normal">({addr.floor_dept})</span>
                            )}
                          </p>

                          <p className="text-xs text-[#5f6368]">
                            {[addr.city, addr.province].filter(Boolean).join(', ')}{' '}
                            {addr.postal_code && (
                              <span className="font-mono font-medium">· CP {addr.postal_code}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Lado derecho: Iconos para Editar y Eliminar */}
                      <div className="flex items-center gap-1 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => handleOpenEditForm(addr)}
                          className="p-2 text-[#5f6368] hover:text-[#1a73e8] hover:bg-white rounded-xl border border-transparent hover:border-[#dadce0] transition cursor-pointer"
                          title="Editar dirección"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-2 text-[#5f6368] hover:text-[#d93025] hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition cursor-pointer"
                          title="Eliminar dirección"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
