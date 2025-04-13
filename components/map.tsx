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
const EARTH_RADIUS = 10;
const SATELLITE_POINT_SIZE = 0.15;
const ALTITUDE_SCALE_FACTOR = 0.000001;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function pointToLatLon(point) {
  const radius = EARTH_RADIUS; // use your sphere radius
  const x = point.x;
  const y = point.y;
  const z = point.z;

  const lat = Math.asin(y / radius) * (180 / Math.PI);
  const lon = (Math.atan2(z, x) * (180 / Math.PI));

  return { lat, lon };
}


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
  console.log("cock");
  console.log(x);
  console.log(y);
  console.log(z);
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
    console.log("timp");
    console.log(pos);
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
  const {camera, scene, gl} = useThree();
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(
    null,
  );
  console.log("death is coming");
  console.log(satellites);
  let currPoint = [];
  let xVal = 0;
  let yVal = 0;
  let zVal = 0;
  let prevPointMesh = null;
  let isShiftDown = false;
  const satellitesRef = useRef<Satellite[]>([]);
  let linesRef = useRef<Satellite[]>([]);
  let lineArr = null;

  // Fetch satellite data
  useEffect(() => {
    console.log("chick");
    const fetchSatellites = async () => {
      try {
        const response = await fetch("/api/data");
        const data: SatelliteEndpointResponse = await response.json();
        console.log(data.satellites.features);
        setSatellites(data.satellites.features);
        console.log("chimp");
        console.log(satellites);
        console.log("Loaded satellites:", data.satellites.features.length);
      } catch (error) {
        console.error("Error fetching satellite data:", error);
      }
    }; 

    fetchSatellites();
  }, []);
  useEffect(() => {
    satellitesRef.current = satellites;
  }, [satellites]);
  
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Calculate mouse position in normalized device coordinates (-1 to +1) for both components

      window.addEventListener('keydown', (event) => {
        if (event.key === 'Shift') isShiftDown = true;
      });
      
      window.addEventListener('keyup', (event) => {
          if (event.key === 'Shift') isShiftDown = false;
      });
      
      // Use it anytime:
      if (isShiftDown) {
        console.log('Shift is down');
        if(typeof prevPointMesh != null) {
          scene.remove(prevPointMesh);
        }
      console.log("gock");
      console.log(satellitesRef.current);
        
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      if (!earthRef.current) return;

      const intersects = raycaster.intersectObject(earthRef.current);
      console.log("sholck");
      console.log(intersects);
      if (intersects.length > 0) {
        console.log("Earth clicked at:", intersects[0].point);
        const point = intersects[0].point;
        console.log(pointToLatLon(point))
        console.log(point["x"])
        xVal = point["x"]
        yVal = point["y"]
        zVal = point["z"]
        // Example: Convert point back to spherical coordinates if needed
        const spherical = new THREE.Spherical().setFromVector3(point);
        const lat = 90 - (spherical.phi * 180) / Math.PI;
        const lng = ((spherical.theta * 180) / Math.PI);

        console.log(`Latitude: ${lat}, Longitude: ${lng}`);
        currPoint = [lat, lng];
        texture.colorSpace = THREE.SRGBColorSpace;
        const pointGeometry = new THREE.SphereGeometry(0.75, 32, 34); // small radius
        const pointMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);

        // Example: place at latitude 40°, longitude -74° (New York City!)
        console.log("chum");
        console.log(xVal);
        console.log(yVal);
        const pointPosition = new THREE.Vector3(xVal,yVal,zVal)
        pointMesh.position.copy(pointPosition);

        scene.add(pointMesh);
        prevPointMesh = pointMesh;
        let minDistance = null;
        let minSatillite = null;
        satellitesRef.current.forEach((satellite) => {
          // Code to execute for each element
          const [lng, lat, alt] = satellite.geometry.coordinates;

          // Calculate radius based on Earth radius plus scaled altitude
          // This ensures accurate representation of satellite altitude
          const radius = EARTH_RADIUS + alt * ALTITUDE_SCALE_FACTOR;

          const pos = latLngToVector3(lat, lng, radius);

          console.log(satellite.geometry.coordinates);
          console.log(satellite.geometry.coordinates[0]);
          const points = [];
          points.push(new THREE.Vector3(xVal, yVal, zVal));    // Start at origin
          points.push(pos); // End at (10, 10, 10)
          let totalSatDistance = (Math.pow(Math.abs(xVal - pos["x"]),2)) + (Math.pow(Math.abs(yVal - pos["y"]),2)) + (Math.pow(Math.abs(zVal - pos["z"]),2));
          //console.log(pos["x"]);
          console.log("slop");
          console.log(totalSatDistance);
          if(minDistance == null || totalSatDistance < minDistance) {
            
            minDistance = totalSatDistance;
            minSatillite = satellite;
            console.log("timp");
            console.log(totalSatDistance);
          }

          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({ color: 0xff0000 , linewidth: 1});
          const line = new THREE.Line(geometry, material);

          scene.add(line);
          if(lineArr == null) {
            lineArr = [line];
          } else {
            lineArr.push(line);
          }
          linesRef.current = lineArr;
          //scene.remove(line);


        });
        console.log("fwock");
        console.log(minSatillite);
        console.log(linesRef);
        
        const [long, latt, alti] = minSatillite.geometry.coordinates;

        const radius = EARTH_RADIUS + alti * ALTITUDE_SCALE_FACTOR;

        const pos = latLngToVector3(latt, long, radius);
        console.log("blip");
        console.log(xVal);
        console.log(yVal);
        console.log(zVal);
        console.log(minSatillite.geometry.coordinates);
        console.log(minSatillite.geometry.coordinates[0]);
        const points = [];
        points.push(new THREE.Vector3(xVal, yVal, zVal));    // Start at origin
        points.push(pos); // End at (10, 10, 10)
        console.log("shlub");
        console.log(points[0]);
        console.log(points[1]);


        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color: 0x00ff00});
        const line = new THREE.Line(geometry, material);

        scene.add(line);
        lineArr.push(line);
        
        linesRef.current = lineArr;

      }
      }
    };

    gl.domElement.addEventListener("click", handleClick);
    
    window.addEventListener('keydown', (event) => {
      console.log('Key down:', event.key);
      console.log("tor");
      console.log(linesRef.current);
      if(event.key == "r") { 
        linesRef.current.forEach((line) => {
          scene.remove(line);
        });
      }
    });

    return () => {
      gl.domElement.removeEventListener("click", handleClick);
    };
  }, [camera, gl, scene]);

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
    console.log("black")
  };
  console.log("hmm");
  console.log(satellites);
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
    camera.position.set(0, 0, 5);
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = 70;
      camera.updateProjectionMatrix();
    }
  }, [camera]);

  return null;
}

function satelliteLines(){

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
