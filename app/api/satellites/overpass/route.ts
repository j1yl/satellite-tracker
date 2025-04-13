import { NextRequest, NextResponse } from "next/server";
import { OVERPASS_ENDPOINT } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const satelliteName = searchParams.get('satellite_name');
  const daysAfter = searchParams.get('days_after') || '7';
  const daysBefore = searchParams.get('days_before') || '0';
  
  // Default bounding box (can be overridden by the client)
  const defaultBbox = '19.59,49.90,20.33,50.21';
  const bbox = searchParams.get('bbox') || defaultBbox;

  if (!id || !satelliteName) {
    return NextResponse.json(
      { error: "Satellite ID and name are required" },
      { status: 400 }
    );
  }

  try {
    console.log(`Fetching overpass data for satellite ${id} (${satelliteName}) with bbox ${bbox}`);
    
    // Construct the API URL
    const apiUrl = `${OVERPASS_ENDPOINT}?bbox=${bbox}&days_after=${daysAfter}&days_before=${daysBefore}&satellites=${encodeURIComponent(satelliteName)}&api_key=${process.env.APIKEY}`;
    console.log(`API URL: ${apiUrl.replace(process.env.APIKEY || '', 'REDACTED')}`);
    
    // Use the satellite name in the request
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Overpass API error: ${response.status} ${response.statusText}`);
      console.error(`Error response: ${errorText}`);
      
      // Return a more detailed error message
      return NextResponse.json(
        { 
          error: `Failed to fetch overpass data: ${response.statusText}`,
          details: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Log the response data for debugging
    console.log(`Overpass data for satellite ${id} (${satelliteName}):`, data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching overpass data:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch overpass data",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 