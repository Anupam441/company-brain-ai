import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
function RotatingEarth() {
  const meshRef = useRef();
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.15;
      meshRef.current.rotation.x += delta * 0.02;
    }
  });
  return (
    <Sphere ref={meshRef} args={[2.2, 64, 64]}>
      <MeshDistortMaterial
        color="#7c3aed"
        attach="material"
        distort={0.35}
        speed={1.5}
        roughness={0.2}
        metalness={0.8}
        emissive="#4c1d95"
        emissiveIntensity={0.4}
        wireframe
      />
    </Sphere>
  );
}
export default RotatingEarth;
