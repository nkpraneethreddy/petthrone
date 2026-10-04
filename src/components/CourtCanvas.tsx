"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, RoundedBox, Sparkles } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { RankedPet } from "@/lib/types";
import { dollars } from "@/lib/money";
import { sizedPhoto } from "@/lib/photos";

type Palette = { velvet: string; velvetDark: string; trim: string; glow: string };

const PALETTES: Record<1 | 2 | 3, Palette> = {
  1: { velvet: "#0E7A5C", velvetDark: "#0A5A44", trim: "#D08A5B", glow: "#19D3A2" },
  2: { velvet: "#3F6E8C", velvetDark: "#2E5570", trim: "#B9C7D3", glow: "#1AA3C4" },
  3: { velvet: "#C4452F", velvetDark: "#9E3524", trim: "#D08A5B", glow: "#FF7A5C" },
};

const FLASH_GLOW = "#E23D2B";
const PHOTO_W = 1;
const PHOTO_H = 1.1;

type SlotTransform = { pos: [number, number, number]; scale: number; rotY: number };

function slotTransform(rank: number): SlotTransform {
  if (rank === 1) return { pos: [0, 1.58, -0.18], scale: 1, rotY: 0 };
  if (rank === 2) return { pos: [-3.13, 0.87, 0.4], scale: 0.62, rotY: 0.3 };
  return { pos: [3.13, 0.87, 0.4], scale: 0.62, rotY: -0.3 };
}

function easeOutBounce(x: number) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
}

function roundedRectGeometry(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ShapeGeometry(s, 12);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - x) / w, (pos.getY(i) - y) / h);
  }
  uv.needsUpdate = true;
  return g;
}

function archShape(w: number, h: number) {
  const hw = w / 2;
  const shoulder = h - hw * 1.15;
  const s = new THREE.Shape();
  s.moveTo(-hw, 0);
  s.lineTo(hw, 0);
  s.lineTo(hw, shoulder);
  s.quadraticCurveTo(hw, shoulder + hw * 0.95, 0, h);
  s.quadraticCurveTo(-hw, shoulder + hw * 0.95, -hw, shoulder);
  s.lineTo(-hw, 0);
  return s;
}

function archGeometry(w: number, h: number, depth: number) {
  return new THREE.ExtrudeGeometry(archShape(w, h), {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 4,
    curveSegments: 28,
  });
}

function crownGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.38, 0);
  s.lineTo(0.38, 0);
  s.lineTo(0.42, 0.34);
  s.lineTo(0.2, 0.14);
  s.lineTo(0, 0.42);
  s.lineTo(-0.2, 0.14);
  s.lineTo(-0.42, 0.34);
  s.lineTo(-0.38, 0);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
  });
  g.center();
  return g;
}

const PHOTO_GEO = roundedRectGeometry(PHOTO_W, PHOTO_H, 0.12);
const FRAME_GEO = roundedRectGeometry(PHOTO_W + 0.08, PHOTO_H + 0.08, 0.15);
const OUTLINE_GEO = roundedRectGeometry(PHOTO_W + 0.16, PHOTO_H + 0.16, 0.18);

function useTextures(urls: string[]) {
  const key = urls.join("|");
  const [textures, setTextures] = useState<(THREE.Texture | null)[]>([]);
  useEffect(() => {
    let alive = true;
    const loader = new THREE.TextureLoader();
    Promise.all(
      key.split("|").map(
        (u) =>
          new Promise<THREE.Texture | null>((resolve) =>
            loader.load(
              u,
              (t) => {
                t.colorSpace = THREE.SRGBColorSpace;
                resolve(t);
              },
              undefined,
              () => resolve(null),
            ),
          ),
      ),
    ).then((list) => {
      if (alive) setTextures(list);
    });
    return () => {
      alive = false;
    };
  }, [key]);
  return textures;
}

function applyCover(tex: THREE.Texture, aspect: number) {
  const img = tex.image as { width?: number; height?: number } | undefined;
  if (!img?.width || !img?.height) return;
  const imgAspect = img.width / img.height;
  tex.repeat.set(1, 1);
  tex.offset.set(0, 0);
  if (imgAspect > aspect) {
    tex.repeat.x = aspect / imgAspect;
    tex.offset.x = (1 - tex.repeat.x) / 2;
  } else {
    tex.repeat.y = imgAspect / aspect;
    tex.offset.y = (1 - tex.repeat.y) / 2;
  }
}

function Crown({
  color,
  y,
  scale = 1,
  dropKey = 0,
}: {
  color: string;
  y: number;
  scale?: number;
  dropKey?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const start = useRef(-10);
  const clock = useThree((s) => s.clock);
  const geo = useMemo(() => crownGeometry(), []);

  useEffect(() => {
    if (dropKey) start.current = clock.elapsedTime;
  }, [dropKey, clock]);

  useFrame(({ clock: c }) => {
    if (!ref.current || !mat.current) return;
    const t = c.elapsedTime;
    const age = t - start.current;
    const drop = age < 1.3 ? (1 - easeOutBounce(age / 1.3)) * 2.4 : 0;
    ref.current.position.y = y + Math.sin(t * 1.8) * 0.07 + drop;
    ref.current.rotation.y = Math.sin(t * 0.9) * 0.4;
    mat.current.emissiveIntensity = 0.9 + Math.sin(t * 3) * 0.4;
  });

  return (
    <group ref={ref} position={[0, y, 0]} scale={scale}>
      <mesh geometry={geo} castShadow>
        <meshStandardMaterial
          ref={mat}
          color={color}
          emissive={color}
          metalness={0.4}
          roughness={0.25}
          toneMapped={false}
        />
      </mesh>
      {[-0.42, 0, 0.42].map((x, i) => (
        <mesh key={x} position={[x, i === 1 ? 0.24 : 0.16, 0]}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
      ))}
      <pointLight color={color} intensity={2} distance={3} />
    </group>
  );
}

function Throne({
  palette,
  position,
  rotY = 0,
  scale = 1,
  flash = false,
  bounceKey = 0,
  crownScale = 1,
}: {
  palette: Palette;
  position: [number, number, number];
  rotY?: number;
  scale?: number;
  flash?: boolean;
  bounceKey?: number;
  crownScale?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const start = useRef(-10);
  const clock = useThree((s) => s.clock);

  const outerArch = useMemo(() => archGeometry(1.8, 2.7, 0.1), []);
  const velvetArch = useMemo(() => archGeometry(1.62, 2.52, 0.14), []);
  const panelTrim = useMemo(() => archGeometry(1.18, 1.98, 0.02), []);
  const panelArch = useMemo(() => archGeometry(1.08, 1.88, 0.03), []);

  useEffect(() => {
    if (bounceKey) start.current = clock.elapsedTime;
  }, [bounceKey, clock]);

  useFrame(({ clock: c }) => {
    if (!group.current) return;
    const age = c.elapsedTime - start.current;
    const pop = age < 0.9 ? Math.sin(age * Math.PI * 4) * (1 - age / 0.9) * 0.07 : 0;
    group.current.scale.setScalar(scale * (1 + pop));
  });

  const velvet = flash ? "#B32619" : palette.velvet;
  const velvetDark = flash ? "#8A1B12" : palette.velvetDark;
  const glow = flash ? FLASH_GLOW : palette.glow;

  const velvetMat = <meshStandardMaterial color={velvet} roughness={0.55} metalness={0.05} />;
  const trimMat = (
    <meshStandardMaterial
      color={palette.trim}
      roughness={0.35}
      metalness={0.35}
      emissive={palette.trim}
      emissiveIntensity={0.15}
    />
  );

  return (
    <group ref={group} position={position} rotation={[0, rotY, 0]} scale={scale}>
      {[
        [-0.8, 0.45],
        [0.8, 0.45],
        [-0.8, -0.45],
        [0.8, -0.45],
      ].map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <RoundedBox args={[0.16, 0.44, 0.16]} radius={0.05} position={[0, 0.22, 0]} castShadow>
            {velvetMat}
          </RoundedBox>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.06, 16]} />
            {trimMat}
          </mesh>
        </group>
      ))}

      <RoundedBox args={[1.94, 0.08, 1.24]} radius={0.03} position={[0, 0.42, 0]}>
        {trimMat}
      </RoundedBox>
      <RoundedBox args={[1.9, 0.28, 1.2]} radius={0.1} position={[0, 0.55, 0]} castShadow receiveShadow>
        {velvetMat}
      </RoundedBox>
      <RoundedBox args={[1.6, 0.14, 0.95]} radius={0.07} position={[0, 0.74, 0.05]} castShadow>
        <meshStandardMaterial color={velvetDark} roughness={0.7} />
      </RoundedBox>

      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.0, 0, 0]}>
          <RoundedBox args={[0.22, 0.55, 0.3]} radius={0.08} position={[0, 0.9, 0.35]} castShadow>
            {velvetMat}
          </RoundedBox>
          <mesh position={[0, 1.2, 0.02]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <capsuleGeometry args={[0.14, 0.9, 8, 20]} />
            {velvetMat}
          </mesh>
          <mesh position={[0, 1.2, 0.62]}>
            <torusGeometry args={[0.1, 0.028, 12, 28]} />
            {trimMat}
          </mesh>
        </group>
      ))}

      <group position={[0, 0.45, 0]}>
        <mesh geometry={outerArch} position={[0, -0.05, -0.8]} castShadow>
          {trimMat}
        </mesh>
        <mesh geometry={velvetArch} position={[0, 0, -0.74]} castShadow receiveShadow>
          {velvetMat}
        </mesh>
        <mesh geometry={panelTrim} position={[0, 0.34, -0.58]}>
          {trimMat}
        </mesh>
        <mesh geometry={panelArch} position={[0, 0.39, -0.57]}>
          <meshStandardMaterial color={velvetDark} roughness={0.6} />
        </mesh>
        <mesh position={[0, 2.62, -0.62]}>
          <octahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      </group>

      <Crown color={glow} y={3.65} scale={crownScale} dropKey={bounceKey} />
    </group>
  );
}

function Portrait({
  pet,
  flash,
  onSelect,
}: {
  pet: RankedPet;
  flash: boolean;
  onSelect?: () => void;
}) {
  const photos = useMemo(
    () =>
      (pet.photos && pet.photos.length > 0 ? pet.photos : [pet.photoUrl || "/seed/bean.svg"]).map((url) =>
        sizedPhoto(url, 480),
      ),
    [pet.photos, pet.photoUrl],
  );
  const textures = useTextures(photos);
  const group = useRef<THREE.Group>(null);
  const flipper = useRef<THREE.Group>(null);
  const photoMat = useRef<THREE.MeshBasicMaterial>(null);
  const outlineMat = useRef<THREE.MeshBasicMaterial>(null);
  const idx = useRef(0);
  const flip = useRef({ start: -10, swapped: true });
  const hovered = useRef(false);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const seed = useMemo(() => Math.random() * 10, []);
  const target = slotTransform(pet.rank);
  const isKing = pet.rank === 1;
  const palette = pet.rank <= 3 ? PALETTES[pet.rank as 1 | 2 | 3] : null;
  const outlineColor = isKing && flash ? FLASH_GLOW : palette ? palette.glow : "#ffffff";

  useEffect(() => {
    const t = textures[idx.current] ?? textures.find(Boolean);
    if (photoMat.current && t) {
      applyCover(t, PHOTO_W / PHOTO_H);
      photoMat.current.map = t;
      photoMat.current.color.set("#ffffff");
      photoMat.current.needsUpdate = true;
    }
  }, [textures]);

  useEffect(() => {
    if (photos.length < 2) return;
    const iv = setInterval(
      () => {
        flip.current = { start: performance.now() / 1000, swapped: false };
      },
      isKing ? 3200 : 5000 + Math.random() * 2500,
    );
    return () => clearInterval(iv);
  }, [photos.length, isKing]);

  useFrame((state, dt) => {
    const g = group.current;
    const f = flipper.current;
    if (!g || !f) return;
    const k = 1 - Math.pow(0.02, dt);
    tmp.set(...target.pos);
    const dist = g.position.distanceTo(tmp);
    g.position.lerp(tmp, k);
    const targetScale = target.scale * (hovered.current ? 1.07 : 1);
    g.scale.setScalar(g.scale.x + (targetScale - g.scale.x) * k);
    g.rotation.y += (target.rotY - g.rotation.y) * k;

    const t = state.clock.elapsedTime;
    f.position.y = Math.sin(t * 2 + seed) * 0.03 + Math.min(dist, 3) * 0.35;

    const p = (performance.now() / 1000 - flip.current.start) / 0.7;
    if (p >= 0 && p < 1) {
      f.rotation.y = Math.sin(p * Math.PI) * (Math.PI / 2);
      if (p > 0.5 && !flip.current.swapped) {
        flip.current.swapped = true;
        idx.current = (idx.current + 1) % photos.length;
        const tx = textures[idx.current];
        if (tx && photoMat.current) {
          applyCover(tx, PHOTO_W / PHOTO_H);
          photoMat.current.map = tx;
          photoMat.current.needsUpdate = true;
        }
      }
    } else {
      f.rotation.y = 0;
    }

    if (outlineMat.current && isKing) {
      outlineMat.current.opacity = 0.75 + Math.sin(t * 3) * 0.25;
    }
  });

  return (
    <group
      ref={group}
      position={target.pos}
      scale={target.scale}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        hovered.current = true;
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        hovered.current = false;
        document.body.style.cursor = "";
      }}
    >
      <group ref={flipper} rotation={[-0.06, 0, 0]}>
        <mesh geometry={OUTLINE_GEO} position={[0, 0, -0.02]}>
          <meshBasicMaterial
            ref={outlineMat}
            color={outlineColor}
            transparent
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh geometry={FRAME_GEO} position={[0, 0, -0.01]}>
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={PHOTO_GEO}>
          <meshBasicMaterial ref={photoMat} color="#eef5f2" toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function SlotLabel({ pet }: { pet: RankedPet }) {
  const t = slotTransform(pet.rank);
  const position: [number, number, number] =
    pet.rank === 1 ? [0, 0.05, 1.4] : [t.pos[0], 0.02, t.pos[2] + 0.9];
  const tone =
    pet.rank === 1
      ? "bg-emerald text-white"
      : pet.rank === 2
        ? "bg-steel text-white"
        : pet.rank === 3
          ? "bg-copper text-white"
          : "bg-white text-ink";

  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full border border-white/70 px-2.5 py-1 shadow-lg ${tone} ${
          pet.rank === 1 ? "text-sm" : "text-[10px]"
        }`}
      >
        <span className="font-black">#{pet.rank}</span>
        <span className="font-[family-name:var(--font-display)] font-bold">{pet.name}</span>
        <span className="opacity-80">{dollars(pet.totalCents)}</span>
      </div>
    </Html>
  );
}

function PulseRings({ color }: { color: string }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(({ clock }) => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      const p = (clock.elapsedTime * 0.45 + i / 3) % 1;
      m.scale.setScalar(1 + p * 1.8);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.4;
    });
  });
  return (
    <group position={[0, 0.02, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => void (refs.current[i] = m)}>
          <ringGeometry args={[1.6, 1.66, 96]} />
          <meshBasicMaterial color={color} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function LightRays({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(-0.22, 6);
    s.lineTo(0.22, 6);
    s.lineTo(0, 0);
    return new THREE.ShapeGeometry(s);
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.z = clock.elapsedTime * 0.08;
  });
  return (
    <group ref={ref} position={[0, 2.2, -1.6]}>
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={i} geometry={geo} rotation={[0, 0, (i * Math.PI * 2) / 12]}>
          <meshBasicMaterial color={color} transparent opacity={0.08} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Halo({ color }: { color: string }) {
  const a = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (a.current) a.current.opacity = 0.45 + Math.sin(clock.elapsedTime * 1.5) * 0.15;
  });
  return (
    <group position={[0, 0.1, -2.4]}>
      <mesh>
        <torusGeometry args={[3.6, 0.035, 12, 140, Math.PI]} />
        <meshBasicMaterial ref={a} color={color} transparent toneMapped={false} />
      </mesh>
      <mesh>
        <torusGeometry args={[3.95, 0.015, 12, 140, Math.PI]} />
        <meshBasicMaterial color="#1AA3C4" transparent opacity={0.35} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.05]}>
        <circleGeometry args={[3.6, 96, 0, Math.PI]} />
        <meshBasicMaterial color={color} transparent opacity={0.05} depthWrite={false} />
      </mesh>
    </group>
  );
}

function Confetti({ trigger }: { trigger: number }) {
  const COUNT = 180;
  const mesh = useRef<THREE.InstancedMesh>(null);
  const clock = useThree((s) => s.clock);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const settled = useRef(false);
  const sim = useRef<{
    start: number;
    parts: { p: THREE.Vector3; v: THREE.Vector3; r: THREE.Euler; s: number }[];
  }>({ start: -100, parts: [] });

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    const palette = ["#0F8F6B", "#1AA3C4", "#E23D2B", "#D08A5B", "#19D3A2"];
    const c = new THREE.Color();
    for (let i = 0; i < COUNT; i++) {
      c.set(palette[i % palette.length]);
      m.setColorAt(i, c);
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);

  useEffect(() => {
    if (!trigger) return;
    settled.current = false;
    sim.current.start = clock.elapsedTime;
    sim.current.parts = Array.from({ length: COUNT }, () => ({
      p: new THREE.Vector3((Math.random() - 0.5) * 0.6, 3.6, (Math.random() - 0.5) * 0.6),
      v: new THREE.Vector3((Math.random() - 0.5) * 7, 2.5 + Math.random() * 4.5, (Math.random() - 0.2) * 4),
      r: new THREE.Euler(Math.random() * 6, Math.random() * 6, 0),
      s: 0.05 + Math.random() * 0.06,
    }));
  }, [trigger, clock]);

  useFrame((state, dt) => {
    const m = mesh.current;
    if (!m || settled.current) return;
    const age = state.clock.elapsedTime - sim.current.start;
    const active = age < 4;
    if (!active) settled.current = true;
    for (let i = 0; i < COUNT; i++) {
      const pt = sim.current.parts[i];
      if (!active || !pt) {
        dummy.scale.setScalar(0);
      } else {
        pt.v.y -= 5.5 * dt;
        pt.v.multiplyScalar(0.985);
        pt.p.addScaledVector(pt.v, dt);
        pt.r.x += dt * 6;
        pt.r.y += dt * 4;
        dummy.position.copy(pt.p);
        dummy.rotation.copy(pt.r);
        dummy.scale.set(pt.s, pt.s * 1.7, pt.s);
      }
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  );
}

function SwayingStage({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.25) * 0.06;
  });
  return <group ref={ref}>{children}</group>;
}

export function CourtCanvas({
  pets,
  flash,
  onSelectPet,
}: {
  pets: RankedPet[];
  flash: boolean;
  onSelectPet?: (pet: RankedPet) => void;
}) {
  const [burst, setBurst] = useState(0);
  const [dark, setDark] = useState(false);
  const [awake, setAwake] = useState(true);
  const top = pets.slice(0, 3);
  const kingGlow = flash ? FLASH_GLOW : PALETTES[1].glow;

  useEffect(() => {
    const sync = () => setDark(document.documentElement.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (flash) setBurst((b) => b + 1);
  }, [flash]);

  useEffect(() => {
    const onVis = () => setAwake(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <Canvas
      shadows
      frameloop={awake ? "always" : "demand"}
      dpr={[1, 1.25]}
      camera={{ position: [0, 2.2, 7.6], fov: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      className="cursor-grab active:cursor-grabbing"
    >
      <color attach="background" args={[dark ? "#14201c" : "#fbfdfc"]} />
      <ambientLight intensity={dark ? 0.55 : 0.9} />
      <hemisphereLight args={[dark ? "#9aafa6" : "#ffffff", dark ? "#14201c" : "#dff3ec", 0.8]} />
      <directionalLight
        position={[5, 10, 7]}
        intensity={2}
        castShadow
        shadow-mapSize={[512, 512]}
      />
      <spotLight
        position={[0, 8, 3]}
        angle={0.42}
        penumbra={0.7}
        intensity={flash ? 90 : 55}
        color={kingGlow}
      />
      <pointLight position={[0, 2.2, -1.4]} color={kingGlow} intensity={6} distance={6} />

      <SwayingStage>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[16, 64]} />
          <meshStandardMaterial color={dark ? "#14201c" : "#fbfdfc"} roughness={0.9} />
        </mesh>

        <Halo color={kingGlow} />
        <LightRays color={kingGlow} />

        <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.65, 0.18, 64]} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.025, 12, 96]} />
          <meshBasicMaterial color={kingGlow} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.005, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[2.3, 64]} />
          <meshBasicMaterial color={kingGlow} transparent opacity={0.1} depthWrite={false} />
        </mesh>
        <PulseRings color={kingGlow} />

        <Throne
          palette={PALETTES[1]}
          position={[0, 0.18, 0]}
          flash={flash}
          bounceKey={burst}
          crownScale={1.15}
        />
        <Throne palette={PALETTES[2]} position={[-3.1, 0, 0.5]} rotY={0.3} scale={0.62} crownScale={0.8} />
        <Throne palette={PALETTES[3]} position={[3.1, 0, 0.5]} rotY={-0.3} scale={0.62} crownScale={0.8} />

        {top.map((pet) => (
          <Portrait key={pet.id} pet={pet} flash={flash} onSelect={() => onSelectPet?.(pet)} />
        ))}
        {top.map((pet) => (
          <SlotLabel key={`label-${pet.id}`} pet={pet} />
        ))}

        <Sparkles count={28} scale={[8, 4, 5]} position={[0, 2.5, 0]} size={2.5} speed={0.3} opacity={0.55} color="#19D3A2" />
        <Confetti trigger={burst} />
      </SwayingStage>

      <OrbitControls
        target={[0, 1.5, 0]}
        enablePan={false}
        minDistance={5}
        maxDistance={13}
        maxPolarAngle={Math.PI / 2.08}
        minPolarAngle={Math.PI / 5}
        minAzimuthAngle={-Math.PI / 3}
        maxAzimuthAngle={Math.PI / 3}
        enableDamping
        dampingFactor={0.06}
      />
    </Canvas>
  );
}
