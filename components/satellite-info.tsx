"use client";

import { useEffect, useState } from "react";
import { Satellite } from "@/types/SatelliteEndpointResponse";

export default function Home() {
    const [satellites, setSatellites] = useState<Satellite[]>([]);
    const [selectedSat, setSelectedSat] = useState<Satellite | null>(null);
    const [error, setError] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("/api/data");
                const data = await response.json();
                setSatellites(data.satellites.features);
                setError(false);
            } catch (err) {
                console.error("Error fetching satellite data:", err);
                setError(true);
            }
        };

        fetchData();
    }, []);

    return (
        <div className="text-white flex gap-8 mt-[10vh] mb-[10vh] p-4 mx-auto">
            {/* Sidebar with buttons */}
            <div className="bg-gray-800 p-4 rounded w-[15vw] min-w-[200px]">
                <h1 className="text-xl text-center font-bold mb-4">Satellites</h1>
                <div className="overflow-y-scroll max-h-[65vh]">
                    {error && (
                        <p className="text-red-500">
                            {"An error occurred"}
                        </p>
                    )}
                    <ul className="space-y-2">
                        {satellites.map((sat, index) => (
                            <li key={index}>
                                <button
                                    className="w-full text-left bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded transition"
                                    onClick={() => setSelectedSat(sat)}
                                >
                                    {sat.properties.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Satellite details */}
            <div className="bg-gray-900/60 bg-opacity-60 p-4 rounded flex-1">
                {selectedSat ? (
                    <>
                        <h2 className="text-lg font-semibold mb-2">
                            {selectedSat.properties.name}
                        </h2>
                        <pre className="text-sm whitespace-pre-wrap break-words">
                            {JSON.stringify(selectedSat.properties, null, 2)}
                        </pre>
                    </>
                ) : (
                    <p className="text-gray-400">Select a satellite to view details.</p>
                )}
            </div>
        </div>
    );
}

