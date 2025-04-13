"use client";

import React, { useMemo, useEffect } from "react";
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

export default function SatelliteTrajectory() {
  const {
    selectedSatellite,
    trajectoryData,
    isTrajectoryLoading,
    trajectoryError,
  } = useSatellites();

  useEffect(() => {
    if (selectedSatellite) {
      console.log("Selected satellite:", selectedSatellite);
      console.log(
        "Trajectory data available:",
        !!trajectoryData[selectedSatellite.id],
      );
      console.log("Trajectory data:", trajectoryData[selectedSatellite.id]);
      console.log("Trajectory loading:", isTrajectoryLoading);
      console.log("Trajectory error:", trajectoryError);
    }
  }, [selectedSatellite, trajectoryData, isTrajectoryLoading, trajectoryError]);

  const trajectoryPoints = useMemo(() => {
    if (!selectedSatellite || !trajectoryData[selectedSatellite.id]) {
      console.log(
        "No trajectory data available for satellite:",
        selectedSatellite?.id,
      );
      return [];
    }

    const trajectory = trajectoryData[selectedSatellite.id];

    if (!Array.isArray(trajectory) || trajectory.length === 0) {
      console.warn("Invalid trajectory data format:", trajectory);
      return [];
    }

    console.log("Processing trajectory with", trajectory.length, "points");

    return trajectory.map((point) => {
      let lng, lat, alt;

      // Handle different point formats
      if (Array.isArray(point) && point.length >= 3) {
        [lng, lat, alt] = point;
      } else if (
        typeof point === "object" &&
        point !== null &&
        "coordinates" in point &&
        Array.isArray(point.coordinates) &&
        point.coordinates.length >= 3
      ) {
        [lng, lat, alt] = point.coordinates;
      } else if (
        typeof point === "object" &&
        point !== null &&
        "lng" in point &&
        "lat" in point
      ) {
        lng = point.lng;
        lat = point.lat;
        alt = "alt" in point ? point.alt : 0;
      } else {
        console.warn("Unknown trajectory point format:", point);
        lng = 0;
        lat = 0;
        alt = 0;
      }

      const radius = EARTH_RADIUS + (alt || 0) * ALTITUDE_SCALE_FACTOR;

      return latLngToVector3(lat, lng, radius);
    });
  }, [selectedSatellite, trajectoryData]);

  if (!selectedSatellite || isTrajectoryLoading) {
    return null;
  }

  if (trajectoryError) {
    console.error("Trajectory error:", trajectoryError);
    return null;
  }

  if (trajectoryPoints.length === 0) {
    console.warn("No trajectory points generated");
    return null;
  }

  console.log("Rendering trajectory with", trajectoryPoints.length, "points");

  return (
    <group>
      {trajectoryPoints.length > 1 && (
        <>
          <Line
            points={trajectoryPoints}
            color="#4a90e2"
            lineWidth={2}
            opacity={0.6}
            dashed={false}
          />

          {trajectoryPoints.map((point, index) => {
            if (index % 10 === 0 && index < trajectoryPoints.length - 1) {
              const nextPoint = trajectoryPoints[index + 1];
              const direction = new THREE.Vector3()
                .subVectors(nextPoint, point)
                .normalize();
              const arrowPosition = point
                .clone()
                .add(direction.multiplyScalar(0.2));

              return (
                <group key={`direction-${index}`}>
                  <mesh position={arrowPosition}>
                    <coneGeometry args={[0.05, 0.1, 4]} />
                    <meshBasicMaterial
                      color="#4a90e2"
                      opacity={0.8}
                      transparent
                    />
                  </mesh>
                </group>
              );
            }
            return null;
          })}

          <Html
            position={[
              trajectoryPoints[0].x * 1.1,
              trajectoryPoints[0].y * 1.1,
              trajectoryPoints[0].z * 1.1,
            ]}
          >
            <div
              style={{
                background: "rgba(74, 144, 226, 0.8)",
                padding: "2px 5px",
                borderRadius: "3px",
                color: "white",
                fontSize: "10px",
                whiteSpace: "nowrap",
              }}
            >
              Start
            </div>
          </Html>
          <Html
            position={[
              trajectoryPoints[trajectoryPoints.length - 1].x * 1.1,
              trajectoryPoints[trajectoryPoints.length - 1].y * 1.1,
              trajectoryPoints[trajectoryPoints.length - 1].z * 1.1,
            ]}
          >
            <div
              style={{
                background: "rgba(74, 144, 226, 0.8)",
                padding: "2px 5px",
                borderRadius: "3px",
                color: "white",
                fontSize: "10px",
                whiteSpace: "nowrap",
              }}
            >
              End
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
