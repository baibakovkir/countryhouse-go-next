import { describe, expect, it } from "vitest";
import {
  calculateScale,
  clampObjectPosition,
  screenToMeters,
  snapToGrid,
  toScreenX,
  toScreenY,
} from "./geo";

describe("plot geometry", () => {
  it("fits a plot into a padded viewport", () => {
    expect(calculateScale(10, 20, { width: 600, height: 600, padding: 50 })).toBe(25);
  });

  it("uses a bottom-left metric origin", () => {
    expect(toScreenX(2, 10, 20)).toBe(40);
    expect(toScreenY(0, 2, 10, 10, 20)).toBe(100);
  });

  it("snaps and clamps dragged object positions", () => {
    expect(snapToGrid(2.49, 1)).toBe(2);
    expect(clampObjectPosition(19, -2, 4, 3, 20, 10)).toEqual({ x: 16, y: 0 });
  });

  it("converts pointer coordinates using SVG bounds", () => {
    expect(
      screenToMeters(
        150,
        120,
        { left: 50, top: 20, width: 200, height: 100 },
        { width: 900, height: 620 },
      ),
    ).toEqual({ x: 450, y: 620 });
  });
});
