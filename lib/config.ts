// Configuración centralizada. En producción definir en .env / variables del hosting:
//   NEXT_PUBLIC_API_URL=https://api.tudominio.com
//   NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxx
//   NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

export const getApiUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");

  // Fallback solo para desarrollo local
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
    // Para probar desde el celular en la red local
    return `http://${hostname}:8000`;
  }
  // Fallback para SSR en desarrollo
  return "http://127.0.0.1:8000";
};

export const getMercadoPagoPublicKey = (): string => {
  return process.env.NEXT_PUBLIC_MP_PUBLIC_KEY || "TEST-fac53aa8-1b94-4cfa-9ca0-ab003f6628ef";
};

export const getGoogleClientId = (): string => {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "1065116989777-17ck4sqpppqshagt9h7kg91uu91jd51u.apps.googleusercontent.com";
};
