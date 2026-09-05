import { NextRequest, NextResponse } from "next/server";
import { getGoogleMapsApiKey } from "@/lib/config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get("input");

  if (!input || input.trim().length < 2) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = getGoogleMapsApiKey();

  // 1. Intentar con Google Places Autocomplete API
  if (apiKey) {
    try {
      const googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        input.trim()
      )}&components=country:ar&language=es&key=${apiKey}`;

      const res = await fetch(googleUrl, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "OK" && Array.isArray(data.predictions) && data.predictions.length > 0) {
          const predictions = data.predictions.map((p: any) => ({
            id: p.place_id,
            description: p.description,
            main_text: p.structured_formatting?.main_text || p.description,
            secondary_text: p.structured_formatting?.secondary_text || "",
            source: "google"
          }));
          return NextResponse.json({ predictions });
        }
      }
    } catch (err) {
      console.warn("Error consultando Google Places Autocomplete:", err);
    }
  }

  // 2. Respaldo: OpenStreetMap Nominatim (Argentina)
  try {
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=ar&addressdetails=1&limit=5&q=${encodeURIComponent(
      input.trim()
    )}`;
    const nomRes = await fetch(nominatimUrl, {
      headers: {
        "User-Agent": "ObjetiaStudioApp/1.0"
      }
    });

    if (nomRes.ok) {
      const items = await nomRes.json();
      if (Array.isArray(items)) {
        const predictions = items.map((item: any) => {
          const road = item.address?.road || item.name || "";
          const city = item.address?.city || item.address?.town || item.address?.village || "";
          const state = item.address?.state || "";
          return {
            id: `nom_${item.place_id}`,
            description: item.display_name,
            main_text: road || item.display_name.split(",")[0],
            secondary_text: [city, state, "Argentina"].filter(Boolean).join(", "),
            source: "nominatim",
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            address: item.address
          };
        });
        return NextResponse.json({ predictions });
      }
    }
  } catch (err) {
    console.warn("Error consultando Nominatim Autocomplete:", err);
  }

  return NextResponse.json({ predictions: [] });
}
