import { NextRequest, NextResponse } from "next/server";
import { SAT_ENDPOINT } from "@/lib/constants";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: "Satellite ID is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${SAT_ENDPOINT}${id}/trajectory/?api_key=${process.env.APIKEY}`);
    
    if (!response.ok) {
      console.error(`Trajectory API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch trajectory: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Log the response data for debugging
    console.log(`Trajectory data for satellite ${id}:`, data);

    // Extract coordinates from GeoJSON format
    let trajectory = [];
    
    if (data.type === "Feature" && data.geometry && data.geometry.type === "LineString") {
      // GeoJSON format
      trajectory = data.geometry.coordinates;
    } else if (Array.isArray(data)) {
      // Array format
      trajectory = data;
    } else if (data.trajectory) {
      // Object with trajectory property
      trajectory = data.trajectory;
    }

    // Log the extracted trajectory
    console.log(`Extracted trajectory for satellite ${id}:`, trajectory);

    return NextResponse.json({
      trajectory
    });
  } catch (error) {
    console.error("Error fetching trajectory:", error);
    return NextResponse.json(
      { error: "Failed to fetch trajectory data" },
      { status: 500 }
    );
  }
}