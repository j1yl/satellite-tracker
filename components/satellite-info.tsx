"use client";

import { useEffect, useState } from "react";
import { Satellite } from "@/types/SatelliteEndpointResponse";

type Props = {
    selectedSat: Satellite | null;
    setSelectedSat: (sat: Satellite | null) => void;
};

export default function SatelliteInfo({
    selectedSat,
    setSelectedSat,
}: Props) {
    const [satellites, setSatellites] = useState<Satellite[]>([]);
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
        <div className="text-white flex gap-8 p-4 mx-auto">
            {/* Sidebar with buttons */}
            <div className="bg-gray-800 p-4 rounded w-[15vw] mt-[10vh] mb-[10vh]">
                <h1 className="text-xl text-center font-bold mb-4">Satellites</h1>
                <div className="overflow-y-scroll max-h-[65vh]">
                {error && (
                    <p className="text-red-500">An error occurred</p>
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
            {selectedSat && (
            <div className="bg-gray-900/60 p-4 rounded self-start mt-[10vh] mb-[10vh] relative">
                {/* Close Button */}
                <button
                    onClick={() => setSelectedSat(null)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-white text-lg"
                    aria-label="Close"
                >
                    ×
                </button>

                <h2 className="text-lg font-semibold mb-2">
                {selectedSat.properties.name}
                </h2>
                <pre className="text-sm whitespace-pre-wrap break-words">
                {JSON.stringify(selectedSat.properties, null, 2)}
                </pre>
            </div>
            )}
        </div>
    );
}

