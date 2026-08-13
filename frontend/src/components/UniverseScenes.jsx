import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import { makeRockyTexture, makeGasGiantTexture, makeSunTexture, makeRingTexture } from '../utils/planetTextures';

function OrbitPath({ radius }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
    }
    return pts;
  }, [radius]);
  return <Line points={points} color="#6b7280" transparent opacity={0.2} lineWidth={1} />;
}

function Sun({ size = 1.3 }) {
  const ref = useRef();
  const texture = useMemo(() => makeSunTexture(7), []);
  useFrame((state, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.06; });
  return (
    <group>
      <Sphere ref={ref} args={[size, 64, 64]}>
        <meshBasicMaterial map={texture} />
      </Sphere>
      <Sphere args={[size * 1.22, 32, 32]}>
        <meshBasicMaterial color="#ff9d3d" transparent opacity={0.22} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </Sphere>
      <Sphere args={[size * 1.55, 32, 32]}>
        <meshBasicMaterial color="#ffb85c" transparent opacity={0.09} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </Sphere>
      <pointLight color="#ffcb8a" intensity={4} distance={45} decay={1.4} />
    </group>
  );
}

function OrbitingPlanet({ orbitRadius, size, color, spotColor, speed, startAngle, hasRing, tilt = 0, gasGiant = false, bandColors, seed = 1 }) {
  const groupRef = useRef();
  const spinRef = useRef();
  const ringRef = useRef();
  const cloudRef = useRef();

  const surfaceTex = useMemo(() => {
    return gasGiant
      ? makeGasGiantTexture(color, bandColors || [color], seed)
      : makeRockyTexture(color, spotColor || '#000000', seed);
  }, [color, spotColor, gasGiant, seed]);

  const ringTex = useMemo(() => (hasRing ? makeRingTexture(color, seed + 10) : null), [hasRing, color, seed]);

  useFrame((state, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * speed;
    if (spinRef.current) spinRef.current.rotation.y += delta * 0.5;
    if (cloudRef.current) cloudRef.current.rotation.y += delta * 0.7;
    if (ringRef.current) ringRef.current.rotation.z += delta * 0.08;
  });

  return (
    <group ref={groupRef} rotation={[0, startAngle, 0]}>
      <group position={[orbitRadius, 0, 0]} rotation={[0, 0, tilt]}>
        <Sphere ref={spinRef} args={[size, 48, 48]}>
          <meshStandardMaterial map={surfaceTex} roughness={0.75} metalness={0.05} />
        </Sphere>
        {!gasGiant && (
          <Sphere ref={cloudRef} args={[size * 1.03, 32, 32]}>
            <meshStandardMaterial color="#ffffff" transparent opacity={0.08} roughness={1} />
          </Sphere>
        )}
        <Sphere args={[size * 1.18, 24, 24]}>
          <meshBasicMaterial color={color} transparent opacity={0.12} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
        </Sphere>
        {hasRing && (
          <mesh ref={ringRef} rotation={[Math.PI / 2.3, 0, 0]}>
            <ringGeometry args={[size * 1.6, size * 2.4, 128]} />
            <meshBasicMaterial map={ringTex} transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function AsteroidBelt({ radius = 8, count = 60 }) {
  const rocks = useMemo(() => Array.from({ length: count }, () => ({
    angle: Math.random() * Math.PI * 2,
    r: radius + (Math.random() - 0.5) * 1.4,
    y: (Math.random() - 0.5) * 0.5,
    size: 0.04 + Math.random() * 0.08,
  })), [radius, count]);
  const groupRef = useRef();
  useFrame((state, delta) => { if (groupRef.current) groupRef.current.rotation.y += delta * 0.025; });
  return (
    <group ref={groupRef}>
      {rocks.map((r, i) => (
        <mesh key={i} position={[Math.cos(r.angle) * r.r, r.y, Math.sin(r.angle) * r.r]}>
          <dodecahedronGeometry args={[r.size, 0]} />
          <meshStandardMaterial color="#8b8378" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

// ============ SCENE 1: Full Solar System ============
export function SolarSystemScene() {
  const planets = [
    { orbitRadius: 3.2, size: 0.35, color: '#3b82c4', spotColor: '#1e3a5f', speed: 0.35, startAngle: 0.4, seed: 11 },
    { orbitRadius: 4.6, size: 0.45, color: '#c2703d', spotColor: '#8b4513', speed: 0.26, startAngle: 2.1, seed: 22 },
    { orbitRadius: 6.2, size: 0.55, color: '#c9a876', spotColor: '#8b6f47', speed: 0.19, startAngle: 4.0, hasRing: true, tilt: 0.5, seed: 33 },
    { orbitRadius: 9.4, size: 0.6, color: '#c8823f', gasGiant: true, bandColors: ['#e0a868', '#a8672f', '#d9995c', '#8b5a2b'], speed: 0.11, startAngle: 5.2, seed: 44 },
    { orbitRadius: 11, size: 0.3, color: '#4a9c8f', spotColor: '#2d5f57', speed: 0.09, startAngle: 3.3, seed: 55 },
  ];
  return (
    <group rotation={[0.35, 0, 0]}>
      <Sun />
      <AsteroidBelt radius={7.6} count={50} />
      {planets.map((p, i) => (
        <group key={i}><OrbitPath radius={p.orbitRadius} /><OrbitingPlanet {...p} /></group>
      ))}
    </group>
  );
}

// ============ SCENE 2: Close-up Gas Giant ============
export function GasGiantScene() {
  const ref = useRef();
  const texture = useMemo(() => makeGasGiantTexture('#d97706', ['#fbbf24', '#d97706', '#f59e0b', '#b45309'], 99), []);
  useFrame((state, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.08; });
  return (
    <group rotation={[0.15, 0, 0.1]}>
      <pointLight position={[15, 8, 10]} intensity={2} color="#fff4e0" />
      <Sphere ref={ref} args={[3.2, 64, 64]} position={[2, 0, -2]}>
        <meshStandardMaterial map={texture} roughness={0.7} />
      </Sphere>
      <Sphere args={[3.85, 32, 32]} position={[2, 0, -2]}>
        <meshBasicMaterial color="#fbbf24" transparent opacity={0.18} blending={THREE.AdditiveBlending} />
      </Sphere>
      <mesh rotation={[Math.PI / 2.15, 0, 0.3]} position={[2, 0, -2]}>
        <ringGeometry args={[4.4, 6.2, 80]} />
        <meshBasicMaterial color="#fcd34d" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>
      <OrbitingPlanet orbitRadius={7.5} size={0.3} color="#94a3b8" spotColor="#475569" speed={0.4} startAngle={1} seed={66} />
    </group>
  );
}

// ============ SCENE 3: Nebula Deep Field ============
export function NebulaFieldScene() {
  const planets = [
    { orbitRadius: 5, size: 0.4, color: '#c2528a', spotColor: '#7a2955', speed: 0.15, startAngle: 1, seed: 77 },
    { orbitRadius: 9, size: 0.7, color: '#7c4fc4', spotColor: '#4b2e82', speed: 0.08, startAngle: 3, hasRing: true, tilt: 0.4, seed: 88 },
  ];
  return (
    <group rotation={[0.2, 0.4, 0]}>
      <pointLight position={[-10, 5, 5]} intensity={1.5} color="#c084fc" />
      {planets.map((p, i) => (
        <group key={i}><OrbitPath radius={p.orbitRadius} /><OrbitingPlanet {...p} /></group>
      ))}
    </group>
  );
}

// ============ SCENE 4: Twin Planet Flyby ============
export function TwinPlanetScene() {
  return (
    <group rotation={[0.1, 0.2, 0]}>
      <pointLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
      <OrbitingPlanet orbitRadius={2.5} size={1.4} color="#0e7fb0" gasGiant bandColors={['#38bdf8', '#0369a1', '#7dd3fc', '#075985']} speed={0.1} startAngle={0.5} seed={99} />
      <OrbitingPlanet orbitRadius={6} size={0.9} color="#b8412f" spotColor="#7a2418" speed={0.18} startAngle={2.8} seed={111} />
      <AsteroidBelt radius={4} count={30} />
    </group>
  );
}
