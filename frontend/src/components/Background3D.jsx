import { useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Sparkles } from '@react-three/drei';
import { SolarSystemScene, GasGiantScene, NebulaFieldScene, TwinPlanetScene } from './UniverseScenes';
const SCENES = [SolarSystemScene, GasGiantScene, NebulaFieldScene, TwinPlanetScene];
function DriftingCamera() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    camera.position.x = Math.sin(t * 0.03) * 2;
    camera.position.y = 3 + Math.cos(t * 0.02) * 0.5;
    camera.lookAt(0, 0, 0);
  });
  return null;
}
function Background3D() {
  const Scene = useMemo(() => {
    const idx = Math.floor(Math.random() * SCENES.length);
    return SCENES[idx];
  }, []);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -2, background: '#020207' }}>
      <Canvas camera={{ position: [0, 3, 16], fov: 55 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 8, 5]} intensity={0.5} color="#ffffff" />
        <Stars radius={250} depth={100} count={10000} factor={5} saturation={0.2} fade speed={0.5} />
        <Sparkles count={100} scale={[30, 15, 30]} size={2} speed={0.25} color="#c4b5fd" opacity={0.5} />
        <Scene />
        <DriftingCamera />
      </Canvas>
    </div>
  );
}
export default Background3D;
