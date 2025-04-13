"use client";

import React, { useState, useEffect } from "react";
import { useSatellites } from "@/lib/context/satellites";

// Define an interface for the overpass data
interface OverpassData {
  id?: string;
  date: string;
  geometry: {
    coordinates: [number, number, number];
  };
}

export default function SatelliteTimeline() {
  const {
    selectedSatellite,
    overpassData,
    isOverpassLoading,
    overpassError,
    fetchOverpass,
  } = useSatellites();

  const [timeRange, setTimeRange] = useState(30);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (selectedSatellite) {
      setIsInitialLoading(true);
      fetchOverpass(selectedSatellite.id)
        .catch(() => {})
        .finally(() => {
          setTimeout(() => {
            setIsInitialLoading(false);
          }, 300);
        });
    } else {
      setIsInitialLoading(false);
    }
  }, [selectedSatellite, timeRange, fetchOverpass]);

  if (isInitialLoading || isOverpassLoading) {
    return (
      <div className="absolute top-0 right-0 z-10 m-2 h-[calc(100vh-1rem)] overflow-y-auto border border-dashed border-white/30 p-2 px-4">
        <h3 className="text-sky-300">Satellite Overpass Timeline</h3>
        <div className="flex h-40 flex-col items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-sky-300"></div>
          <p className="mt-2 text-white/75">Loading overpass data...</p>
        </div>
      </div>
    );
  }

  if (!selectedSatellite) {
    return null;
  }

  if (overpassError) {
    return (
      <div className="absolute top-0 right-0 z-10 m-2 h-[calc(100vh-1rem)] overflow-y-auto border border-dashed border-white/30 p-2 px-4">
        <h3 className="text-sky-300">Satellite Overpass Timeline</h3>
        <div className="mt-2 text-red-400">
          <p>Error loading overpass data: {overpassError.message}</p>
        </div>
      </div>
    );
  }

  const data = overpassData[selectedSatellite.id];

  if (!data || !data.overpasses || data.overpasses.length === 0) {
    return (
      <div className="absolute top-0 right-0 z-10 m-2 h-[calc(100vh-1rem)] overflow-y-auto border border-dashed border-white/30 p-2 px-4">
        <h3 className="text-sky-300">Satellite Overpass Timeline</h3>
        <p className="mt-2 text-white/75">
          No overpass data available for this satellite
        </p>
        <div className="time-range-selector mt-2">
          <label className="text-white/75">Time Range: </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="border border-white bg-white px-2 text-black"
          >
            <option value={1} className="text-black uppercase">
              1 day
            </option>
            <option value={3} className="text-black uppercase">
              3 days
            </option>
            <option value={7} className="text-black uppercase">
              7 days
            </option>
            <option value={14} className="text-black uppercase">
              14 days
            </option>
            <option value={30} className="text-black uppercase">
              30 days
            </option>
          </select>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="absolute top-0 right-0 z-10 m-2 h-[calc(100vh-1rem)] overflow-y-auto border border-dashed border-white/30 p-2 px-4">
      <h3 className="text-sky-300">Satellite Overpass Timeline</h3>
      <br />
      <p className="text-white">
        Frequency: {data.frequency.toFixed(2)} overpasses per day
      </p>

      <div className="time-range-selector">
        <label className="text-white/75">Time Range: </label>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value))}
          className="border border-white bg-white px-2 text-black"
        >
          <option value={1} className="text-black uppercase">
            1 day
          </option>
          <option value={3} className="text-black uppercase">
            3 days
          </option>
          <option value={7} className="text-black uppercase">
            7 days
          </option>
          <option value={14} className="text-black uppercase">
            14 days
          </option>
          <option value={30} className="text-black uppercase">
            30 days
          </option>
        </select>
      </div>

      <div className="overpass-list mt-2">
        {data.overpasses.map((overpass: OverpassData, index: number) => (
          <div
            key={overpass.id || index}
            className="overpass-item border-b border-white/20 py-2"
          >
            <div className="text-white/90">{formatDate(overpass.date)}</div>
            <div className="text-white/75">
              Altitude: {(overpass.geometry.coordinates[2] / 1000).toFixed(2)}{" "}
              km
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
