import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import RotatingEarth from './RotatingEarth';
function Background3D() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#a855f7" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#3b82f6" />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <RotatingEarth />
      </Canvas>
    </div>
  );
}
export default Background3D;
