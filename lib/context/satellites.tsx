"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { SatelliteEndpointResponse, Satellite } from "@/types";

const SATELLITES_API_URL = "/api/satellites";
const TRAJECTORY_CACHE_TIME = 30 * 60 * 1000; // 30 minutes

const CACHE_TIME = 5 * 60 * 1000;
let cachedData: SatelliteEndpointResponse | null = null;
let lastFetchTime: number = 0;
const trajectoryCache: Record<number, { data: any; timestamp: number }> = {};

interface SatellitesContextType {
  satellites: Satellite[];
  selectedSatellite: Satellite | null;
  setSelectedSatellite: (satellite: Satellite | null) => void;
  isLoading: boolean;
  error: Error | null;
  refreshSatellites: () => Promise<void>;
  trajectoryData: Record<number, any>;
  fetchTrajectory: (satelliteId: number) => Promise<any>;
  isTrajectoryLoading: boolean;
  trajectoryError: Error | null;
  overpassData: Record<string, any>;
  fetchOverpass: (satelliteId: number) => Promise<any>;
  isOverpassLoading: boolean;
  overpassError: Error | null;
}

const SatellitesContext = createContext<SatellitesContextType>({
  satellites: [],
  selectedSatellite: null,
  setSelectedSatellite: () => {},
  isLoading: false,
  error: null,
  refreshSatellites: async () => {},
  trajectoryData: {},
  fetchTrajectory: async () => ({}),
  isTrajectoryLoading: false,
  trajectoryError: null,
  overpassData: {},
  fetchOverpass: async () => ({}),
  isOverpassLoading: false,
  overpassError: null,
});

export const useSatellites = () => useContext(SatellitesContext);

function validateSatelliteName(name: string): boolean {
  const validPattern =
    /^(Sentinel-[12][AB]|Landsat-[89]|COSMO-SkyMed-[1-4]|SCATSat-[1-9])$/;
  const isValid = validPattern.test(name);
  if (!isValid) {
    console.warn(
      `Invalid satellite name format: ${name}. Expected format: Sentinel-1A, Sentinel-2B, Landsat-8, COSMO-SkyMed-1, SCATSat-1, etc.`,
    );
  }
  return true;
}

export function SatellitesProvider({ children }: { children: ReactNode }) {
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [trajectoryData, setTrajectoryData] = useState<Record<number, any>>({});
  const [isTrajectoryLoading, setIsTrajectoryLoading] =
    useState<boolean>(false);
  const [trajectoryError, setTrajectoryError] = useState<Error | null>(null);
  const [overpassData, setOverpassData] = useState<Record<string, any>>({});
  const [isOverpassLoading, setIsOverpassLoading] = useState<boolean>(false);
  const [overpassError, setOverpassError] = useState<Error | null>(null);

  const fetchSatellites = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getSatellites();
      setSatellites(data.satellites.features);
      console.log("Loaded satellites:", data.satellites.features.length);
    } catch (error) {
      console.error("Error fetching satellite data:", error);
      setError(
        error instanceof Error ? error : new Error("Unknown error occurred"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrajectory = async (satelliteId: number) => {
    const cachedTrajectory = trajectoryCache[satelliteId];
    if (
      cachedTrajectory &&
      Date.now() - cachedTrajectory.timestamp < TRAJECTORY_CACHE_TIME
    ) {
      console.log(`Using cached trajectory for satellite ${satelliteId}`);
      setTrajectoryData((prev) => ({
        ...prev,
        [satelliteId]: cachedTrajectory.data,
      }));
      return cachedTrajectory.data;
    }

    setIsTrajectoryLoading(true);
    setTrajectoryError(null);

    try {
      console.log(`Fetching trajectory for satellite ${satelliteId}`);
      const response = await fetch(`/api/satellites/path?id=${satelliteId}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to fetch trajectory: ${response.status} ${response.statusText}`,
          errorText,
        );
        throw new Error(`Failed to fetch trajectory: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(
        `Received trajectory data for satellite ${satelliteId}:`,
        data,
      );

      if (
        !data.trajectory ||
        !Array.isArray(data.trajectory) ||
        data.trajectory.length === 0
      ) {
        console.warn(
          `No trajectory data in response for satellite ${satelliteId}:`,
          data,
        );
        throw new Error("No trajectory data available");
      }

      trajectoryCache[satelliteId] = {
        data: data.trajectory,
        timestamp: Date.now(),
      };

      setTrajectoryData((prev) => ({
        ...prev,
        [satelliteId]: data.trajectory,
      }));

      return data.trajectory;
    } catch (error) {
      console.error(
        `Error fetching trajectory for satellite ${satelliteId}:`,
        error,
      );
      setTrajectoryError(
        error instanceof Error ? error : new Error("Unknown error occurred"),
      );
      throw error;
    } finally {
      setIsTrajectoryLoading(false);
    }
  };

  const fetchOverpass = useCallback(
    async (satelliteId: number) => {
      if (!satelliteId) return;

      try {
        setIsOverpassLoading(true);
        setOverpassError(null);

        const satellite = satellites.find((s) => s.id === satelliteId);
        if (!satellite) {
          throw new Error(`Satellite with ID ${satelliteId} not found`);
        }

        const satelliteName = satellite.properties.name;
        if (!satelliteName) {
          throw new Error(`No name found for satellite ${satelliteId}`);
        }

        if (!validateSatelliteName(satelliteName)) {
          throw new Error(`Invalid satellite name format: ${satelliteName}`);
        }

        console.log("Fetching overpass for satellite:", satelliteName);

        const response = await fetch(
          `/api/satellites/overpass?id=${satelliteId}&satellite_name=${encodeURIComponent(satelliteName)}`,
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Overpass API error response:", errorData);

          let errorMessage = `Failed to fetch overpass data: ${response.status} ${response.statusText}`;
          if (errorData.details) {
            errorMessage += `\nDetails: ${errorData.details}`;
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("Received overpass data:", data);

        setOverpassData((prev) => ({
          ...prev,
          [satelliteId]: data,
        }));
      } catch (error) {
        console.error("Error fetching overpass:", error);
        setOverpassError(
          error instanceof Error
            ? error
            : new Error("Failed to fetch overpass data"),
        );
      } finally {
        setIsOverpassLoading(false);
      }
    },
    [satellites],
  );

  useEffect(() => {
    fetchSatellites();
  }, []);

  useEffect(() => {
    if (selectedSatellite) {
      fetchTrajectory(selectedSatellite.id).catch(() => {});

      fetchOverpass(selectedSatellite.id).catch(() => {});
    }
  }, [selectedSatellite, fetchOverpass]);

  const contextValue: SatellitesContextType = {
    satellites,
    selectedSatellite,
    setSelectedSatellite,
    isLoading,
    error,
    refreshSatellites: fetchSatellites,
    trajectoryData,
    fetchTrajectory,
    isTrajectoryLoading,
    trajectoryError,
    overpassData,
    fetchOverpass,
    isOverpassLoading,
    overpassError,
  };

  return (
    <SatellitesContext.Provider value={contextValue}>
      {children}
    </SatellitesContext.Provider>
  );
}

export async function getSatellites(): Promise<SatelliteEndpointResponse> {
  if (cachedData && Date.now() - lastFetchTime < CACHE_TIME) {
    return cachedData;
  }

  try {
    const response = await fetch(SATELLITES_API_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch satellites: ${response.statusText}`);
    }

    const data: SatelliteEndpointResponse = await response.json();

    cachedData = data;
    lastFetchTime = Date.now();

    return data;
  } catch (error) {
    console.error("Error fetching satellites:", error);
    throw error;
  }
}
