"use client";
import { useState } from "react";
import { Satellite } from "@/types/SatelliteEndpointResponse";
import SatelliteMap from "@/components/map";
import SatelliteInfo from "@/components/satellite-info";

export default function Page() {
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(null);
  return (
    <>
      <div className="flex h-screen relative space-between">
        <div className="z-10 flex align-center justify-center">
          <SatelliteInfo 
            selectedSat={selectedSatellite}
            setSelectedSat={setSelectedSatellite}
          />
        </div>
        
        <div className="absolute inset-0 z-0">
          <SatelliteMap 
            selectedSat={selectedSatellite}
            setSelectedSat={setSelectedSatellite}
          />
        </div>
        
      </div>
    </>
  );
}
