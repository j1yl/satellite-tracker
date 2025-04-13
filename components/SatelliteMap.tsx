"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useRef, Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useTexture, Html } from "@react-three/drei";
import * as THREE from "three";
import { Satellite } from "../types";
import { useSatellites } from "@/lib/context/satellites";
import SatelliteTrajectory from "./SatelliteTrajectory";
import SatelliteOverpass from "./SatelliteOverpass";
import SatelliteTimeline from "./SatelliteTimeline";

// Constants
const EARTH_RADIUS = 5;
const SATELLITE_POINT_SIZE = 0.05;
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
          color={hovered ? "rgb(255,0,255)" : "rgb(255,255,255)"}
        />
      </mesh>
    </group>
  );
}

// Loading component for satellites
function SatelliteLoadingState() {
  return (
    <Html position={[0, 0, 0]}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "20px",
          borderRadius: "5px",
          fontFamily: "monospace",
        }}
      >
        Loading satellites...
      </div>
    </Html>
  );
}

// Error component for satellites
function SatelliteErrorState({ error }: { error: Error }) {
  return (
    <Html position={[0, 0, 0]}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          padding: "20px",
          borderRadius: "5px",
          fontFamily: "monospace",
        }}
      >
        Error loading satellites: {error.message}
      </div>
    </Html>
  );
}

// Earth component
function Earth() {
  const earthRef = useRef<THREE.Mesh>(null!);
  const { satellites, setSelectedSatellite, error } = useSatellites();

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

  // Handle satellite click
  const handleSatelliteClick = (satellite: Satellite) => {
    setSelectedSatellite(satellite);
  };

  return (
    <group>
      <mesh ref={earthRef}>
        <primitive object={earthGeometry} />
        <meshStandardMaterial
          map={texture}
          roughness={0.7}
          metalness={0.1}
          emissive={new THREE.Color(0x112244)}
          emissiveIntensity={0.1}
        />
      </mesh>

      {satellites.map((satellite) => (
        <SatellitePoint
          key={satellite.id}
          satellite={satellite}
          onClick={handleSatelliteClick}
        />
      ))}

      {error && <SatelliteErrorState error={error} />}
    </group>
  );
}

// Camera setup component
function CameraSetup() {
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      enablePan={false}
      enableRotate={true}
      minDistance={7}
      maxDistance={20}
      minPolarAngle={0}
      maxPolarAngle={Math.PI}
    />
  );
}

export default function SatelliteMap() {
  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 45 }}
        style={{ background: "black" }}
      >
        <Suspense fallback={<SatelliteLoadingState />}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <Earth />
          <SatelliteTrajectory />
          <SatelliteOverpass />
          <CameraSetup />
        </Suspense>
      </Canvas>
      <SatelliteTimeline />
    </div>
  );
}
