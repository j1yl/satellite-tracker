"use client";
import SatelliteMap from "@/components/map";
import SatelliteInfo from "@/components/satellite-info";

export default function Page() {
  return (
    <>
      <div className="flex h-screen relative space-between">
        <div className="z-10 flex align-center justify-center">
          <SatelliteInfo />
        </div>
        
        <div className="absolute inset-0 z-0">
          <SatelliteMap />
        </div>
        
      </div>
    </>
  );
}
