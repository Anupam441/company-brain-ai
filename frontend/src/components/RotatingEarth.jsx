import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
function Planet({ position, size, color, speed, distort }) {
  const ref = useRef();
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * speed;
    }
  });
  return (
    <Sphere ref={ref} args={[size, 48, 48]} position={position}>
      <MeshDistortMaterial
        color={color}
        distort={distort}
        speed={1.2}
        roughness={0.3}
        metalness={0.7}
        emissive={color}
        emissiveIntensity={0.35}
        wireframe
      />
    </Sphere>
  );
}
function RotatingEarth() {
  return (
    <>
      <Planet position={[0, 0, 0]} size={2.2} color="#7c3aed" speed={0.15} distort={0.35} />
      <Planet position={[-5.5, 2, -4]} size={0.7} color="#3b82f6" speed={0.3} distort={0.5} />
      <Planet position={[5, -2.5, -3]} size={1.1} color="#ec4899" speed={0.2} distort={0.4} />
      <Planet position={[3.5, 3, -6]} size={0.5} color="#22d3ee" speed={0.4} distort={0.6} />
    </>
  );
}
export default RotatingEarth;
