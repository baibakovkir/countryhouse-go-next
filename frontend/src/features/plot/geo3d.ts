import type { PlotObject } from "@/types/domain";

export function objectWorldPosition(
  object: Pick<PlotObject, "x" | "y" | "z" | "width" | "length" | "height">,
  plot: { width: number; length: number },
  renderedHeight = object.height,
): [number, number, number] {
  return [
    object.x + object.width / 2 - plot.width / 2,
    object.z + renderedHeight / 2,
    object.y + object.length / 2 - plot.length / 2,
  ];
}

export function cameraDistance(plot: { width: number; length: number }) {
  return Math.max(plot.width, plot.length, 10) * 1.15;
}
