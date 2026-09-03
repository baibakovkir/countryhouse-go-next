export interface Viewport {
  width: number;
  height: number;
  padding: number;
}

export function calculateScale(plotWidth: number, plotLength: number, viewport: Viewport): number {
  const availableWidth = viewport.width - viewport.padding * 2;
  const availableHeight = viewport.height - viewport.padding * 2;
  return Math.min(availableWidth / plotWidth, availableHeight / plotLength);
}

export function toScreenX(x: number, scale: number, padding: number): number {
  return padding + x * scale;
}

export function toScreenY(
  y: number,
  objectLength: number,
  plotLength: number,
  scale: number,
  padding: number,
): number {
  return padding + (plotLength - y - objectLength) * scale;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function snapToGrid(value: number, gridStep: number): number {
  if (!Number.isFinite(gridStep) || gridStep <= 0) return value;
  return Math.round(value / gridStep) * gridStep;
}

export function clampObjectPosition(
  x: number,
  y: number,
  objectWidth: number,
  objectLength: number,
  plotWidth: number,
  plotLength: number,
): { x: number; y: number } {
  return {
    x: clamp(x, 0, Math.max(0, plotWidth - objectWidth)),
    y: clamp(y, 0, Math.max(0, plotLength - objectLength)),
  };
}

export function screenToMeters(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  viewBox: Pick<Viewport, "width" | "height">,
): { x: number; y: number } {
  return {
    x: ((clientX - rect.left) / rect.width) * viewBox.width,
    y: ((clientY - rect.top) / rect.height) * viewBox.height,
  };
}
