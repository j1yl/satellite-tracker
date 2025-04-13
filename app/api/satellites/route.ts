import { NextResponse } from "next/server";
import { SAT_ENDPOINT } from "@/lib/constants";
import { SatelliteEndpointResponse } from "@/types";

export async function GET() {
  const response = await fetch(SAT_ENDPOINT + "?api_key=" + process.env.APIKEY);
  const data = (await response.json()) as SatelliteEndpointResponse;

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    satellites: data,
  });
}
