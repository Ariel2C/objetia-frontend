import { NextRequest, NextResponse } from "next/server";
import { getGoogleMapsApiKey } from "@/lib/config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const address = searchParams.get("address");

  if ((!lat || !lng) && !address) {
    return NextResponse.json({ error: "lat/lng or address is required" }, { status: 400 });
  }

  const apiKey = getGoogleMapsApiKey();

  // 1. Google Geocoding API
  if (apiKey) {
    try {
      let geoUrl = "";
      if (lat && lng) {
        geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(lat)},${encodeURIComponent(lng)}&language=es&key=${apiKey}`;
      } else if (address) {
        geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address.trim())}&components=country:ar&language=es&key=${apiKey}`;
      }

      if (geoUrl) {
        const res = await fetch(geoUrl, { next: { revalidate: 86400 } });
        if (res.ok) {
          const data = await res.json();
          const results = data.results || [];

          let postalCode = "";
          let city = "";
          let province = "";

          for (const r of results) {
            for (const c of (r.address_components || [])) {
              const types = c.types || [];
              if (!postalCode && (types.includes("postal_code") || types.includes("postal_code_prefix"))) {
                postalCode = c.long_name;
              }
              if (!city && (types.includes("locality") || types.includes("sublocality") || types.includes("administrative_area_level_2"))) {
                city = c.long_name;
              }
              if (!province && types.includes("administrative_area_level_1")) {
                province = c.long_name;
              }
            }
          }

          // Fallback por regex en formatted_address si el componente específico no vino
          if (!postalCode) {
            for (const r of results) {
              const m = (r.formatted_address || "").match(/\b([A-Z]?\d{4}[A-Z]{0,3})\b/);
              if (m && m[1] !== "0000") {
                postalCode = m[1];
                break;
              }
            }
          }

          if (postalCode || city || province) {
            return NextResponse.json({
              postal_code: postalCode,
              city,
              province,
              source: "google"
            });
          }
        }
      }
    } catch (err) {
      console.warn("Aviso en consulta de CP Google:", err);
    }
  }

  // 2. Respaldo OpenStreetMap Nominatim
  try {
    let nomUrl = "";
    if (lat && lng) {
      nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`;
    } else if (address) {
      nomUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ar&limit=1&q=${encodeURIComponent(address.trim())}`;
    }

    if (nomUrl) {
      const resNom = await fetch(nomUrl, {
        headers: { "User-Agent": "ObjetiaStudioApp/1.0" }
      });
      if (resNom.ok) {
        const nomData = await resNom.json();
        const item = Array.isArray(nomData) ? nomData[0] : nomData;
        const addr = item?.address || {};
        const postalCode = addr.postcode ? addr.postcode.trim() : "";
        const city = addr.city || addr.town || addr.village || "";
        const province = addr.state || "";

        return NextResponse.json({
          postal_code: postalCode,
          city,
          province,
          source: "nominatim"
        });
      }
    }
  } catch (err) {
    console.warn("Aviso en consulta de CP Nominatim:", err);
  }

  return NextResponse.json({ postal_code: "", city: "", province: "" });
}
