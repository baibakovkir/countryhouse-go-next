import { describe, expect, it } from "vitest";
import { cameraDistance, objectWorldPosition } from "./geo3d";

describe("3D plot transforms", () => {
  it("centers metric coordinates around the plot", () => {
    expect(
      objectWorldPosition(
        { x: 4, y: 8, z: 0, width: 2, length: 4, height: 3 },
        { width: 10, length: 20 },
      ),
    ).toEqual([0, 1.5, 0]);
  });

  it("fits small and large plots", () => {
    expect(cameraDistance({ width: 4, length: 5 })).toBe(11.5);
    expect(cameraDistance({ width: 20, length: 10 })).toBe(23);
  });
});
