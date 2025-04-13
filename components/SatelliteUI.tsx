"use client";

import React from "react";
import { useSatellites } from "@/lib/context/satellites";
import Link from "next/link";

export default function SatelliteUI() {
  const {
    satellites,
    selectedSatellite,
    setSelectedSatellite,
    isLoading,
    error,
    refreshSatellites,
    isTrajectoryLoading,
    trajectoryError,
    trajectoryData,
    overpassData,
    isOverpassLoading,
    overpassError,
  } = useSatellites();

  const trajectoryPointCount = selectedSatellite
    ? trajectoryData[selectedSatellite.id]?.length || 0
    : 0;

  const overpassCount = selectedSatellite
    ? overpassData[selectedSatellite.id]?.overpasses?.length || 0
    : 0;

  return (
    <>
      {!selectedSatellite && (
        <div className="pointer-events-none fixed top-0 left-1/2 mt-2 -translate-x-1/2 bg-white px-1 text-black uppercase select-none">
          <div>Click any satellite (white point) to get started</div>
        </div>
      )}

      <div className="fixed top-0 left-0 z-10 m-2 border border-dashed border-white/30 p-2 px-4">
        <h1 className="text-sky-300">Satellite Tracker</h1>
        <br />

        {isLoading ? (
          <div>
            <p>Loading satellites...</p>
          </div>
        ) : error ? (
          <div>
            <p>Error: {error.message}</p>
            <button
              onClick={refreshSatellites}
              className="cursor-pointer uppercase"
            >
              [ Retry ]
            </button>
          </div>
        ) : (
          <>
            <div>
              <p>Loaded satellites: {satellites.length}</p>
            </div>
            <br />

            <div>
              <p>
                Selected satellite:{" "}
                {selectedSatellite?.properties.name || "None"}
              </p>
              {isTrajectoryLoading ? (
                <p>Loading trajectory...</p>
              ) : trajectoryError ? (
                <p>Error loading trajectory: {trajectoryError.message}</p>
              ) : (
                <p>Trajectory points: {trajectoryPointCount}</p>
              )}

              {selectedSatellite && (
                <>
                  {isOverpassLoading ? (
                    <p>Loading overpass data...</p>
                  ) : overpassError ? (
                    <p>Error loading overpass: {overpassError.message}</p>
                  ) : (
                    <p>Overpass points: {overpassCount}</p>
                  )}
                </>
              )}
            </div>

            {selectedSatellite && (
              <div className="mt-4">
                <p className="text-white">Satellite Details:</p>
                <div>
                  <p>NORAD ID: {selectedSatellite.properties.norad_id}</p>
                  <p>
                    Status:{" "}
                    {selectedSatellite.properties.open ? "Open" : "Closed"}
                  </p>
                  <p>
                    Latitude:{" "}
                    {selectedSatellite.geometry.coordinates[1].toFixed(2)}°
                  </p>
                  <p>
                    Longitude:{" "}
                    {selectedSatellite.geometry.coordinates[0].toFixed(2)}°
                  </p>
                  <p>
                    Altitude:{" "}
                    {selectedSatellite.geometry.coordinates[2].toFixed(2)} km
                  </p>
                  {selectedSatellite && (
                    <button
                      onClick={() => setSelectedSatellite(null)}
                      className="cursor-pointer text-red-500 uppercase"
                    >
                      [ Close ]
                    </button>
                  )}
                </div>
              </div>
            )}
            <br />
            <p className="text-white/75">Legend:</p>
            <div className="grid grid-cols-1">
              <div className="grid grid-cols-1">
                <div className="flex items-center">
                  <div className="mr-2 h-0.5 w-3 bg-[#4a90e2]"></div>
                  <span className="text-white/75">Satellite Trajectory</span>
                </div>
                <div className="flex items-center">
                  <div className="mr-2 h-0.5 w-3 bg-[#9F2B68]"></div>
                  <span className="text-white/75">Overpass Path</span>
                </div>
                <div className="flex items-center">
                  <div className="mr-2 h-0.5 w-3 bg-[#00ff00]"></div>
                  <span className="text-white/75">Visibility Footprint</span>
                </div>
                <div className="flex items-center">
                  <div className="mr-2 h-0.5 w-3 bg-[#ff00ff]"></div>
                  <span className="text-white/75">Sensor Footprint</span>
                </div>
                <div className="flex items-center">
                  <div className="mr-2 h-3 w-3 rounded-full bg-[#00ffff]"></div>
                  <span className="text-white/75">Start Point</span>
                </div>
                <div className="flex items-center">
                  <div className="mr-2 h-3 w-3 rounded-full bg-[#ffff00]"></div>
                  <span className="text-white/75">End Point</span>
                </div>
              </div>
            </div>
            <br />
            <div>
              Data from{" "}
              <Link
                href="https://api.spectator.earth/"
                target="_blank"
                className="text-sky-300"
              >
                Spectator.Earth
              </Link>
            </div>
          </>
        )}
      </div>
      <div className="fixed bottom-0 left-0 z-10 m-2 border border-dashed border-white/30 p-2 px-4">
        <p className="text-white/75">
          Built @ FullyHacks 2025 |{" "}
          <a
            href="https://github.com/j1yl/satellite-tracker"
            className="text-sky-300"
          >
            Source Code
          </a>
        </p>
        <p className="text-white">
          Built by{" "}
          <a href="https://github.com/j1yl" className="text-sky-300">
            Joe
          </a>
          ,
          <a href="https://github.com/nategries1" className="text-sky-300">
            Nate
          </a>
          ,
          <a
            href="https://github.com/pythonrogrammer2"
            className="text-sky-300"
          >
            Braedon
          </a>
        </p>
        <Link
          href="https://www.webverry.com"
          target="_blank"
          className="text-red-500"
        >
          Hire me @ Webverry
        </Link>
      </div>
    </>
  );
}
