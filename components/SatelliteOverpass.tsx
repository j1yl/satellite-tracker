"use client";

import React, { useMemo } from "react";
import { useSatellites } from "@/lib/context/satellites";
import * as THREE from "three";
import { Line, Html } from "@react-three/drei";

const EARTH_RADIUS = 5;
const ALTITUDE_SCALE_FACTOR = 0.000001;

function latLngToVector3(
  lat: number,
  lng: number,
  radius: number,
): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

function geoJsonToVector3Points(
  coordinates: number[][],
  radius: number = EARTH_RADIUS,
): THREE.Vector3[] {
  return coordinates.map((coord) => {
    const [lng, lat] = coord;
    return latLngToVector3(lat, lng, radius);
  });
}

// Define interfaces for the overpass data
interface OverpassGeometry {
  coordinates: [number, number, number];
}

interface OverpassVisibilityFootprint {
  coordinates: number[][][];
}

interface OverpassFootprintFeature {
  geometry: {
    coordinates: number[][][];
  };
}

interface OverpassFootprints {
  features: OverpassFootprintFeature[];
}

interface Overpass {
  geometry: OverpassGeometry;
  visibility_footprint?: OverpassVisibilityFootprint;
  footprints?: OverpassFootprints;
  date?: string;
}

interface OverpassData {
  overpasses: Overpass[];
  frequency: number;
}

export default function SatelliteOverpass() {
  const { selectedSatellite, overpassData, isOverpassLoading, overpassError } =
    useSatellites();

  const {
    overpassPoints,
    visibilityFootprints,
    sensorFootprints,
    overpassDates,
  } = useMemo(() => {
    if (!selectedSatellite || !overpassData[selectedSatellite.id]) {
      console.log(
        "No overpass data available for satellite:",
        selectedSatellite?.id,
      );
      return {
        overpassPoints: [],
        visibilityFootprints: [],
        sensorFootprints: [],
        overpassDates: [],
      };
    }

    const data = overpassData[selectedSatellite.id] as OverpassData;

    if (
      !data.overpasses ||
      !Array.isArray(data.overpasses) ||
      data.overpasses.length === 0
    ) {
      console.warn("Invalid overpass data format:", data);
      return {
        overpassPoints: [],
        visibilityFootprints: [],
        sensorFootprints: [],
        overpassDates: [],
      };
    }

    console.log(
      "Processing overpass data with",
      data.overpasses.length,
      "overpasses",
    );

    const points = data.overpasses
      .map((overpass) => {
        if (overpass.geometry && overpass.geometry.coordinates) {
          const [lng, lat, alt] = overpass.geometry.coordinates;
          const radius = EARTH_RADIUS + (alt || 0) * ALTITUDE_SCALE_FACTOR;
          return latLngToVector3(lat, lng, radius);
        }
        return null;
      })
      .filter(Boolean) as THREE.Vector3[];

    const dates = data.overpasses
      .map((overpass) => overpass.date || "")
      .filter(Boolean);

    const vFootprints = data.overpasses
      .map((overpass) => {
        if (
          overpass.visibility_footprint &&
          overpass.visibility_footprint.coordinates &&
          Array.isArray(overpass.visibility_footprint.coordinates)
        ) {
          const coordinates = overpass.visibility_footprint.coordinates[0];
          return geoJsonToVector3Points(coordinates);
        }
        return null;
      })
      .filter(Boolean) as THREE.Vector3[][];

    const sFootprints = data.overpasses
      .map((overpass) => {
        if (
          overpass.footprints &&
          overpass.footprints.features &&
          Array.isArray(overpass.footprints.features)
        ) {
          return overpass.footprints.features
            .map((feature) => {
              if (
                feature.geometry &&
                feature.geometry.coordinates &&
                Array.isArray(feature.geometry.coordinates)
              ) {
                const coordinates = feature.geometry.coordinates[0];
                return geoJsonToVector3Points(coordinates);
              }
              return null;
            })
            .filter(Boolean);
        }
        return null;
      })
      .filter(Boolean) as THREE.Vector3[][][];

    return {
      overpassPoints: points,
      visibilityFootprints: vFootprints,
      sensorFootprints: sFootprints,
      overpassDates: dates,
    };
  }, [selectedSatellite, overpassData]);

  if (!selectedSatellite || isOverpassLoading) {
    return null;
  }

  if (overpassError) {
    console.error("Overpass error:", overpassError);

    return (
      <group>
        <Html position={[0, 0, 0]}>
          <div
            style={{
              background: "rgba(255, 0, 0, 0.2)",
              padding: "10px",
              borderRadius: "5px",
              maxWidth: "300px",
              color: "white",
              fontSize: "12px",
            }}
          >
            Error loading overpass data: {overpassError.message}
          </div>
        </Html>
      </group>
    );
  }

  if (overpassPoints.length === 0) {
    console.warn("No overpass points generated");
    return null;
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <group>
      {/* Render overpass points with labels */}
      {overpassPoints.map((point, index) => {
        const isFirst = index === 0;
        const isLast = index === overpassPoints.length - 1;
        const date = overpassDates[index]
          ? formatDate(overpassDates[index])
          : `Pass ${index + 1}`;

        return (
          <group key={`overpass-${index}`}>
            {/* Main point */}
            <mesh position={point}>
              <sphereGeometry args={[0.03, 32, 32]} />
              <meshBasicMaterial
                color={isFirst ? "#00ffff" : isLast ? "#ffff00" : "#ff9900"}
              />
            </mesh>

            {/* Glow effect */}
            <mesh position={point}>
              <sphereGeometry args={[0.1, 32, 32]} />
              <meshBasicMaterial
                color={isFirst ? "#00ffff" : isLast ? "#ffff00" : "#ff9900"}
                transparent
                opacity={0.3}
              />
            </mesh>

            {/* Label */}
            <Html position={[point.x, point.y * 1.1, point.z]}>
              <div
                style={{
                  background: "rgba(0, 0, 0, 0.8)",
                  padding: "2px 4px",
                  color: "white",
                  fontSize: "10px",
                  whiteSpace: "nowrap",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                <div>
                  {isFirst ? "Start" : isLast ? "End" : `Pass ${index + 1}`}
                </div>
                {date && <div style={{ fontSize: "8px" }}>{date}</div>}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Render visibility footprints */}
      {visibilityFootprints.map((footprint, index) => (
        <group key={`visibility-${index}`}>
          <Line
            points={footprint}
            color="#ff9900"
            lineWidth={1.5}
            opacity={0.4}
            dashed={true}
          />
        </group>
      ))}

      {/* Render sensor footprints */}
      {sensorFootprints.map((footprintGroup, groupIndex) =>
        footprintGroup.map((footprint, index) => (
          <group key={`sensor-${groupIndex}-${index}`}>
            <Line
              points={footprint}
              color="#00ff00"
              lineWidth={1.5}
              opacity={0.5}
              dashed={true}
            />
          </group>
        )),
      )}
    </group>
  );
}
