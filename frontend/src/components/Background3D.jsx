import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import RotatingEarth from './RotatingEarth';
function DriftingCamera() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.05) * 1.5;
    camera.position.y = Math.cos(t * 0.04) * 0.8;
    camera.lookAt(0, 0, 0);
  });
  return null;
}
function Background3D() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.8} color="#a855f7" />
        <pointLight position={[-10, -8, -10]} intensity={1.2} color="#3b82f6" />
        <pointLight position={[0, 5, -15]} intensity={0.8} color="#ec4899" />
        <Stars radius={150} depth={80} count={6000} factor={4} saturation={0} fade speed={1} />
        <RotatingEarth />
        <DriftingCamera />
      </Canvas>
    </div>
  );
}
export default Background3D;
