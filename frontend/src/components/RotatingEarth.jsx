import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

function OrbitPath({ radius }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius]);
    }
    return pts;
  }, [radius]);

  return <Line points={points} color="#6b7280" transparent opacity={0.25} lineWidth={1} />;
}

function Sun() {
  const ref = useRef();
  useFrame((state, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05;
  });
  return (
    <group>
      <Sphere ref={ref} args={[1.3, 64, 64]}>
        <meshBasicMaterial color="#ff7a1a" />
      </Sphere>
      <Sphere args={[1.6, 32, 32]}>
        <meshBasicMaterial color="#ff9d3d" transparent opacity={0.25} side={THREE.BackSide} />
      </Sphere>
      <Sphere args={[2.0, 32, 32]}>
        <meshBasicMaterial color="#ffb85c" transparent opacity={0.1} side={THREE.BackSide} />
      </Sphere>
      <pointLight color="#ffb366" intensity={3} distance={40} decay={1.5} />
    </group>
  );
}

function OrbitingPlanet({ orbitRadius, size, color, speed, startAngle, hasRing, tilt = 0 }) {
  const groupRef = useRef();
  const spinRef = useRef();
  const ringRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * speed;
    }
    if (spinRef.current) {
      spinRef.current.rotation.y += delta * 0.6;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, startAngle, 0]}>
      <group position={[orbitRadius, 0, 0]} rotation={[0, 0, tilt]}>
        <Sphere ref={spinRef} args={[size, 48, 48]}>
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.2} />
        </Sphere>
        <Sphere args={[size * 1.2, 24, 24]}>
          <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.BackSide} />
        </Sphere>
        {hasRing && (
          <mesh ref={ringRef} rotation={[Math.PI / 2.3, 0, 0]}>
            <ringGeometry args={[size * 1.6, size * 2.3, 64]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>
    </group>
  );
}

function RotatingEarth() {
  const planets = [
    { orbitRadius: 3.2, size: 0.35, color: '#38bdf8', speed: 0.35, startAngle: 0.4 },
    { orbitRadius: 4.6, size: 0.45, color: '#f97316', speed: 0.26, startAngle: 2.1 },
    { orbitRadius: 6.2, size: 0.55, color: '#a855f7', speed: 0.19, startAngle: 4.0, hasRing: true, tilt: 0.5 },
    { orbitRadius: 7.8, size: 0.4, color: '#22d3ee', speed: 0.15, startAngle: 1.2 },
    { orbitRadius: 9.4, size: 0.6, color: '#3b82f6', speed: 0.11, startAngle: 5.2 },
    { orbitRadius: 11, size: 0.3, color: '#14b8a6', speed: 0.09, startAngle: 3.3 },
  ];

  return (
    <group rotation={[0.35, 0, 0]}>
      <Sun />
      {planets.map((p, i) => (
        <group key={i}>
          <OrbitPath radius={p.orbitRadius} />
          <OrbitingPlanet {...p} />
        </group>
      ))}
    </group>
  );
}

export default RotatingEarth;
