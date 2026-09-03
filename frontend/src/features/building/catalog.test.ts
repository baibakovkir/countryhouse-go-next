import { describe, expect, it } from "vitest";
import { catalogFor } from "./catalog";

describe("building catalog", () => {
  it("always includes doors and windows", () => {
    for (const kind of ["house", "garage", "bathhouse", "outbuilding", "custom"] as const) {
      expect(catalogFor(kind).map((item) => item.key)).toEqual(
        expect.arrayContaining(["door", "window"]),
      );
    }
  });

  it("offers purpose-specific equipment", () => {
    expect(catalogFor("garage").map((item) => item.key)).toContain("garage_door");
    expect(catalogFor("bathhouse").map((item) => item.key)).toEqual(
      expect.arrayContaining(["steam_room", "sauna_stove", "sauna_bench"]),
    );
    expect(catalogFor("house").map((item) => item.key)).not.toContain("garage_door");
  });
});
