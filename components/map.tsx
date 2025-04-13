"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useTexture, Html } from "@react-three/drei";
import * as THREE from "three";
import {
  Satellite,
  SatelliteEndpointResponse,
} from "../types/SatelliteEndpointResponse";

// Constants
const EARTH_RADIUS = 5;
const SATELLITE_POINT_SIZE = 0.1;
const ALTITUDE_SCALE_FACTOR = 0.000001;

function quadify(geometry: THREE.BufferGeometry, distance: number) {
  const pos = geometry.attributes.position;
  const quadAmount = pos.count / 6;
  const a1 = new THREE.Vector3(),
    b1 = new THREE.Vector3(),
    c1 = new THREE.Vector3(),
    a2 = new THREE.Vector3(),
    b2 = new THREE.Vector3(),
    c2 = new THREE.Vector3();
  const hSide = new THREE.Vector3(),
    vSide = new THREE.Vector3();

  for (let i = 0; i < quadAmount; i++) {
    a1.fromBufferAttribute(pos, i * 6 + 0);
    b1.fromBufferAttribute(pos, i * 6 + 1);
    c1.fromBufferAttribute(pos, i * 6 + 2);
    a2.fromBufferAttribute(pos, i * 6 + 3);
    b2.fromBufferAttribute(pos, i * 6 + 4);
    c2.fromBufferAttribute(pos, i * 6 + 5);

    vSide.subVectors(c1, a1).normalize();
    a1.addScaledVector(vSide, distance);
    c1.addScaledVector(vSide, -distance);
    c2.addScaledVector(vSide, -distance);

    vSide.subVectors(b2, a2).normalize();
    b1.addScaledVector(vSide, distance);
    a2.addScaledVector(vSide, distance);
    b2.addScaledVector(vSide, -distance);

    hSide.subVectors(b1, a1).normalize();
    a1.addScaledVector(hSide, distance);
    b1.addScaledVector(hSide, -distance);
    a2.addScaledVector(hSide, -distance);

    vSide.subVectors(c2, b2).normalize();
    b2.addScaledVector(vSide, distance);
    c2.addScaledVector(vSide, -distance);
    c1.addScaledVector(vSide, -distance);

    pos.setXYZ(i * 6 + 0, a1.x, a1.y, a1.z);
    pos.setXYZ(i * 6 + 1, b1.x, b1.y, b1.z);
    pos.setXYZ(i * 6 + 2, c1.x, c1.y, c1.z);
    pos.setXYZ(i * 6 + 3, a2.x, a2.y, a2.z);
    pos.setXYZ(i * 6 + 4, b2.x, b2.y, b2.z);
    pos.setXYZ(i * 6 + 5, c2.x, c2.y, c2.z);
  }
}

// Convert lat/lng to 3D coordinates on a sphere
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

// Satellite point component
function SatellitePoint({
  satellite,
  onClick,
}: {
  satellite: Satellite;
  onClick: (satellite: Satellite) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [position, setPosition] = useState<THREE.Vector3>(new THREE.Vector3());

  useEffect(() => {
    // Convert lat/lng to 3D position
    const [lng, lat, alt] = satellite.geometry.coordinates;

    // Calculate radius based on Earth radius plus scaled altitude
    // This ensures accurate representation of satellite altitude
    const radius = EARTH_RADIUS + alt * ALTITUDE_SCALE_FACTOR;

    const pos = latLngToVector3(lat, lng, radius);
    setPosition(pos);
  }, [satellite]);

  return (
    <group position={position}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onClick(satellite);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[SATELLITE_POINT_SIZE, 32, 32]} />
        <meshBasicMaterial
          color={hovered ? "rgb(255,0,0)" : "rgb(255,255,255)"}
        />
      </mesh>
    </group>
  );
}

// Earth component
function Earth() {
  const earthRef = useRef<THREE.Mesh>(null!);
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(
    null,
  );

  // Fetch satellite data
  useEffect(() => {
    const fetchSatellites = async () => {
      try {
        const response = await fetch("/api/data");
        const data: SatelliteEndpointResponse = await response.json();

        setSatellites(data.satellites.features);
        console.log("Loaded satellites:", data.satellites.features.length);
      } catch (error) {
        console.error("Error fetching satellite data:", error);
      }
    };

    fetchSatellites();
  }, []);

  // Create Earth geometry
  const earthGeometry = new THREE.SphereGeometry(
    EARTH_RADIUS,
    64,
    64,
    0,
    Math.PI * 2,
    THREE.MathUtils.degToRad(0),
    THREE.MathUtils.degToRad(180),
  ).toNonIndexed();

  // Apply quadify to the geometry
  quadify(earthGeometry, 0.0001);
  earthGeometry.computeVertexNormals();

  // Load Earth texture
  const texture = useTexture(
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg",
  );
  texture.colorSpace = THREE.SRGBColorSpace;

  // Handle satellite click
  const handleSatelliteClick = (satellite: Satellite) => {
    setSelectedSatellite(satellite);
  };

  return (
    <>
      <mesh
        ref={earthRef}
        geometry={earthGeometry}
        rotation={[-0.015, -Math.PI / 2, 0]}
      >
        <meshStandardMaterial
          color="#fff"
          map={texture}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Render satellite points */}
      {satellites.map((satellite) => (
        <SatellitePoint
          key={satellite.id}
          satellite={satellite}
          onClick={handleSatelliteClick}
        />
      ))}

      {/* Display satellite info when clicking on a satellite */}
      {selectedSatellite && (
        <Html position={[0, 0, 0]}>
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              padding: "10px",
              borderRadius: "5px",
              fontFamily: "monospace",
              maxWidth: "300px",
            }}
          >
            <div style={{ fontWeight: "bold", marginBottom: "5px" }}>
              Satellite Information
            </div>
            <div>Name: {selectedSatellite.properties.name}</div>
            <div>NORAD ID: {selectedSatellite.properties.norad_id}</div>
            <div>
              Status: {selectedSatellite.properties.open ? "Open" : "Closed"}
            </div>
            <div>
              Latitude: {selectedSatellite.geometry.coordinates[1].toFixed(2)}°
            </div>
            <div>
              Longitude: {selectedSatellite.geometry.coordinates[0].toFixed(2)}°
            </div>
            <div>
              Altitude: {selectedSatellite.geometry.coordinates[2].toFixed(2)}{" "}
              km
            </div>
            <button
              onClick={() => setSelectedSatellite(null)}
              style={{
                marginTop: "10px",
                background: "#333",
                color: "#fff",
                border: "none",
                padding: "5px 10px",
                borderRadius: "3px",
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </Html>
      )}
    </>
  );
}

// Camera setup component
function CameraSetup() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 30);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 70;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  return null;
}

// Main component
export default function SatelliteMap() {
  return (
    <div style={{ width: "100%", height: "100vh", background: "#000" }}>
      <Canvas>
        <CameraSetup />
        <ambientLight intensity={4} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          decay={0}
          intensity={Math.PI}
        />
        <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />
        {/* <gridHelper
          args={[15, 30, "#cc0", "#999"]}
          rotation={[0, -Math.PI, 0]}
        /> */}
        <Earth />
        <OrbitControls enablePan={false} maxDistance={30} minDistance={20} />
      </Canvas>
    </div>
  );
}
