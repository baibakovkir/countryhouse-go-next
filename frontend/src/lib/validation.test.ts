import { describe, expect, it } from "vitest";
import { date, email, money, password, validateObjectBounds } from "./validation";

describe("input validation", () => {
  it("validates authentication fields", () => { expect(email("owner@example.com")).toBeUndefined(); expect(email("invalid")).toBeTruthy(); expect(password("short")).toBeTruthy(); expect(password("correct horse battery staple")).toBeUndefined(); });
  it("validates exact money and dates", () => { expect(money("12500.00")).toBeUndefined(); expect(money("0")).toBeTruthy(); expect(money("1.234")).toBeTruthy(); expect(date("2026-02-29")).toBeTruthy(); expect(date("2026-02-28")).toBeUndefined(); });
  it("validates object footprint", () => { expect(validateObjectBounds({ x: "9", y: "0", width: "2", length: "1" }, { width: 10, length: 10 }).width).toBeTruthy(); expect(validateObjectBounds({ x: "1", y: "1", width: "2", length: "2" }, { width: 10, length: 10 })).toEqual({}); });
});
