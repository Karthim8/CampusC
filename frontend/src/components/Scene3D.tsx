import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

const STAGES = {
  HERO: { position: [0, 0, 8], lookAt: [0, 0, 0] },
  ANNOUNCEMENTS: { position: [-5, 2, 6], lookAt: [0, 0, 0] },
  FEATURES: { position: [4, -2, 5], lookAt: [0, 0, 0] }
};

function CameraController({ scrollProgress }: { scrollProgress: number }) {
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const targetLook = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    let start, end, lookStart, lookEnd, t;

    if (scrollProgress < 0.5) {
      t = scrollProgress * 2;
      start = new THREE.Vector3(...STAGES.HERO.position as [number, number, number]);
      end = new THREE.Vector3(...STAGES.ANNOUNCEMENTS.position as [number, number, number]);
      lookStart = new THREE.Vector3(...STAGES.HERO.lookAt as [number, number, number]);
      lookEnd = new THREE.Vector3(...STAGES.ANNOUNCEMENTS.lookAt as [number, number, number]);
    } else {
      t = (scrollProgress - 0.5) * 2;
      start = new THREE.Vector3(...STAGES.ANNOUNCEMENTS.position as [number, number, number]);
      end = new THREE.Vector3(...STAGES.FEATURES.position as [number, number, number]);
      lookStart = new THREE.Vector3(...STAGES.ANNOUNCEMENTS.lookAt as [number, number, number]);
      lookEnd = new THREE.Vector3(...STAGES.FEATURES.lookAt as [number, number, number]);
    }

    targetPos.copy(start).lerp(end, t);
    targetLook.copy(lookStart).lerp(lookEnd, t);

    state.camera.position.lerp(targetPos, 0.05);
    state.camera.lookAt(targetLook);
  });
  return null;
}

function CollegeBuilding({ scrollProgress }: { scrollProgress: number }) {
  const ref = useRef<THREE.Group>(null!);

  useFrame((state) => {
    // Rotation logic
    ref.current.rotation.y = state.clock.elapsedTime * 0.15 + scrollProgress * Math.PI * 2;

    // Smooth entry from bottom
    const targetY = scrollProgress < 0.2 ? -5 + (scrollProgress * 25) : 0;
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, targetY, 0.05);
  });

  return (
    <group ref={ref} position={[0, -5, 0]}>
      {/* Main Base */}
      <mesh position={[0, 1.25, 0]}>
        <boxGeometry args={[4, 2.5, 3]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Pillars */}
      {[[-1.8, 1, 1.6], [1.8, 1, 1.6], [-0.6, 1, 1.6], [0.6, 1, 1.6]].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <cylinderGeometry args={[0.15, 0.15, 2.5, 12]} />
          <meshStandardMaterial color="#ffffff" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* Roof Pediment */}
      <mesh position={[0, 3, 1.4]} rotation={[0, 0, 0]}>
        <coneGeometry args={[2.5, 1, 4]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>

      {/* Modern Glass Center */}
      <mesh position={[0, 1.5, 0.1]}>
        <boxGeometry args={[1.5, 3.5, 3.1]} />
        <meshPhysicalMaterial color="#34d399" transmission={0.9} roughness={0} metalness={0.5} thickness={1} />
      </mesh>

      {/* Windows glow */}
      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[(i % 4 - 1.5) * 0.8, 1.5 + (Math.floor(i / 4) * 1) - 0.5, 1.51]}>
          <planeGeometry args={[0.3, 0.5]} />
          <meshBasicMaterial color="#34d399" transparent opacity={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function FlyingNotes({ scrollProgress }: { scrollProgress: number }) {
  const count = 40;
  const noteData = useMemo(() => {
    return [...Array(count)].map(() => ({
      startPos: new THREE.Vector3((Math.random() - 0.5) * 15, -10, (Math.random() - 0.5) * 5),
      speed: 0.2 + Math.random() * 0.5,
      rotationSpeed: (Math.random() - 0.5) * 0.1,
      id: Math.random()
    }));
  }, []);

  const ref = useRef<THREE.Group>(null!);

  useFrame((state) => {
    const isNotePhase = scrollProgress > 0.3 && scrollProgress < 0.8;
    const opacity = isNotePhase ? 0.8 : 0;

    ref.current.children.forEach((child, i) => {
      const data = noteData[i];
      const mesh = child as THREE.Mesh;
      const material = mesh.material as THREE.MeshBasicMaterial;

      material.opacity = THREE.MathUtils.lerp(material.opacity, opacity, 0.1);

      if (isNotePhase) {
        const t = (scrollProgress - 0.3) / 0.5;
        mesh.position.y = data.startPos.y + (t * 25 * data.speed);
        mesh.rotation.x += data.rotationSpeed;
        mesh.rotation.z += data.rotationSpeed * 0.5;
        mesh.position.x += Math.sin(state.clock.elapsedTime + data.id) * 0.01;
      }
    });
  });

  return (
    <group ref={ref}>
      {noteData.map((note, i) => (
        <mesh key={i} position={note.startPos}>
          <planeGeometry args={[0.3, 0.4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

function BackgroundParticles() {
  const count = 200;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  }, []);

  const ref = useRef<THREE.Points>(null!);
  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    ref.current.rotation.x = state.clock.elapsedTime * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#10b981" transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

const Scene3D = ({ scrollProgress = 0 }: { scrollProgress?: number }) => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 8], fov: 60 }}>
        <fog attach="fog" args={["#0a0a0a", 5, 20]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#10b981" />
        <spotLight position={[-10, 20, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />

        <CameraController scrollProgress={scrollProgress} />

        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
          <CollegeBuilding scrollProgress={scrollProgress} />
        </Float>

        <FlyingNotes scrollProgress={scrollProgress} />
        <BackgroundParticles />
      </Canvas>
    </div>
  );
};

export default Scene3D;
