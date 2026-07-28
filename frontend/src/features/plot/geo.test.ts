import { describe, expect, it } from "vitest";
import { calculateScale, toScreenX, toScreenY } from "./geo";

describe("plot geometry", () => {
  it("fits a plot into a padded viewport", () => {
    expect(calculateScale(10, 20, { width: 600, height: 600, padding: 50 })).toBe(25);
  });

  it("uses a bottom-left metric origin", () => {
    expect(toScreenX(2, 10, 20)).toBe(40);
    expect(toScreenY(0, 2, 10, 10, 20)).toBe(100);
  });
});

