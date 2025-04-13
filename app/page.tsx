import SatelliteMap from "@/components/SatelliteMap";
import SatelliteUI from "@/components/SatelliteUI";
import { SatellitesProvider } from "@/lib/context/satellites";

export default function Home() {
  return (
    <SatellitesProvider>
      <div className="relative h-screen w-full">
        <SatelliteMap />
        <SatelliteUI />
      </div>
    </SatellitesProvider>
  );
}
