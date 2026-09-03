"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import type { Mesh } from "three";
import { cameraDistance, objectWorldPosition } from "@/features/plot/geo3d";
import type { Plot, PlotObject } from "@/types/domain";

interface Plot3DSceneProps {
  plot: Plot;
  selectedObjectId: string | null;
  onSelect(id: string): void;
}

const colors: Partial<Record<PlotObject["type"], string>> = {
  building: "#64748b",
  garden_bed: "#a16207",
  tree: "#15803d",
  terrace: "#b45309",
  stairs: "#475569",
  utility: "#0f766e",
  custom: "#7c3aed",
};

export function Plot3DScene({ plot, selectedObjectId, onSelect }: Plot3DSceneProps) {
  const distance = cameraDistance(plot);
  const gridSize = Math.max(plot.width, plot.length);
  return (
    <div
      className="h-[620px] min-h-[440px] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-sky-50 to-emerald-50"
      aria-label="Трёхмерный план участка"
    >
      <Canvas
        camera={{
          position: [distance * 0.75, distance, distance * 0.75],
          fov: 42,
          near: 0.1,
          far: distance * 10,
        }}
        shadows
      >
        <color attach="background" args={["#f0f9ff"]} />
        <ambientLight intensity={1.4} />
        <directionalLight
          position={[distance, distance * 1.5, distance]}
          intensity={2.2}
          castShadow
        />
        <TerrainSurface plot={plot} />
        <gridHelper
          args={[gridSize, Math.max(2, Math.ceil(gridSize)), "#94a3b8", "#cbd5e1"]}
          position={[0, 0.01, 0]}
        />
        {plot.objects.map((object) => (
          <SceneObject
            key={object.id}
            object={object}
            plot={plot}
            selected={selectedObjectId === object.id}
            onSelect={onSelect}
          />
        ))}
        <OrbitControls
          makeDefault
          target={[0, 0, 0]}
          minDistance={Math.max(3, distance * 0.2)}
          maxDistance={distance * 3}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>
    </div>
  );
}

function terrainHeight(x: number, y: number, plot: Plot) {
  const points = plot.terrainPoints ?? [];
  if (points.length === 0) return 0;
  let weighted = 0;
  let weights = 0;
  for (const point of points) {
    const distanceSquared = (x - point.x) ** 2 + (y - point.y) ** 2;
    if (distanceSquared < 0.0001) return point.z;
    const weight = 1 / distanceSquared;
    weighted += point.z * weight;
    weights += weight;
  }
  return weighted / weights;
}

function TerrainSurface({ plot }: { plot: Plot }) {
  const mesh = useRef<Mesh>(null);
  useLayoutEffect(() => {
    const geometry = mesh.current?.geometry;
    const positions = geometry?.attributes.position;
    if (!geometry || !positions) return;
    for (let index = 0; index < positions.count; index++) {
      const plotX = positions.getX(index) + plot.width / 2;
      const plotY = plot.length / 2 - positions.getY(index);
      positions.setZ(index, terrainHeight(plotX, plotY, plot));
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }, [plot]);
  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[plot.width, plot.length, 32, 32]} />
      <meshStandardMaterial color="#d1fae5" />
    </mesh>
  );
}

function SceneObject({
  object,
  plot,
  selected,
  onSelect,
}: {
  object: PlotObject;
  plot: Plot;
  selected: boolean;
  onSelect(id: string): void;
}) {
  const renderedHeight = Math.max(object.height, object.type === "garden_bed" ? 0.25 : 1);
  const position = objectWorldPosition(object, plot, renderedHeight);
  position[1] += terrainHeight(object.x + object.width / 2, object.y + object.length / 2, plot);
  const select = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(object.id);
  };

  if (object.type === "tree") {
    const radius = Math.max(0.25, Math.min(object.width, object.length) / 3);
    return (
      <group position={position} onClick={select}>
        <mesh position={[0, -renderedHeight * 0.25, 0]} castShadow>
          <cylinderGeometry args={[radius * 0.28, radius * 0.36, renderedHeight * 0.5, 12]} />
          <meshStandardMaterial color="#854d0e" />
        </mesh>
        <mesh position={[0, renderedHeight * 0.2, 0]} castShadow>
          <sphereGeometry args={[radius, 20, 14]} />
          <meshStandardMaterial
            color={selected ? "#34d399" : colors.tree}
            emissive={selected ? "#065f46" : "#000000"}
          />
        </mesh>
        <ObjectLabel name={object.name} y={renderedHeight / 2 + radius + 0.25} />
      </group>
    );
  }
  return (
    <group position={position} onClick={select}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[object.width, renderedHeight, object.length]} />
        <meshStandardMaterial
          color={selected ? "#10b981" : (colors[object.type] ?? "#64748b")}
          emissive={selected ? "#064e3b" : "#000000"}
        />
      </mesh>
      <ObjectLabel name={object.name} y={renderedHeight / 2 + 0.3} />
    </group>
  );
}

function ObjectLabel({ name, y }: { name: string; y: number }) {
  return (
    <Html position={[0, y, 0]} center distanceFactor={12}>
      <span className="whitespace-nowrap rounded-full bg-slate-950/80 px-2 py-1 text-xs font-semibold text-white">
        {name}
      </span>
    </Html>
  );
}
