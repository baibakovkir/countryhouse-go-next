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

export function toScreenY(y: number, objectLength: number, plotLength: number, scale: number, padding: number): number {
  return padding + (plotLength - y - objectLength) * scale;
}

