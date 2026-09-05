import { NextRequest, NextResponse } from "next/server";
import { getGoogleMapsApiKey } from "@/lib/config";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("place_id");

  if (!placeId) {
    return NextResponse.json({ error: "place_id is required" }, { status: 400 });
  }

  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "Google Maps API key not configured" }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=address_components,formatted_address,geometry&language=es&key=${apiKey}`;

    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch place details" }, { status: 502 });
    }

    const data = await res.json();
    if (data.status !== "OK" || !data.result) {
      return NextResponse.json({ error: data.error_message || data.status }, { status: 400 });
    }

    const result = data.result;
    const comps = result.address_components || [];

    let street = "";
    let number = "";
    let city = "";
    let province = "";
    let postalCode = "";

    for (const c of comps) {
      const types = c.types || [];
      if (types.includes("route")) street = c.long_name;
      else if (types.includes("street_number")) number = c.long_name;
      else if (types.includes("locality")) city = c.long_name;
      else if (types.includes("sublocality") || types.includes("sublocality_level_1")) {
        if (!city) city = c.long_name;
      } else if (types.includes("administrative_area_level_2")) {
        if (!city) city = c.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        province = c.long_name;
      } else if (types.includes("postal_code") || types.includes("postal_code_prefix")) {
        postalCode = c.long_name;
      }
    }

    // Fallback de CP por regex si no vino
    if (!postalCode && result.formatted_address) {
      const matches = result.formatted_address.match(/\b([A-Z]?\d{4}[A-Z]{0,3})\b/g);
      if (matches) {
        for (const m of matches) {
          if (m !== number && m !== "0000") {
            postalCode = m;
            break;
          }
        }
      }
    }

    const lat = result.geometry?.location?.lat ?? null;
    const lng = result.geometry?.location?.lng ?? null;

    return NextResponse.json({
      street,
      number,
      city,
      province,
      postal_code: postalCode,
      lat,
      lng,
      formatted_address: result.formatted_address
    });
  } catch (err: any) {
    console.error("Error in place details:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
