import { describe, expect, it } from "vitest";
import { expenseSchema } from "@/features/expenses/expense-input";
import { createObjectSchema } from "@/features/plot/object-input";
import { plotSchema } from "@/features/plot/plot-input";
import { taskSchema } from "@/features/timeline/task-input";

describe("form schemas", () => {
  it("normalizes plot values", () => {
    expect(plotSchema.parse({ name: "  Сад ", width: "20", length: "30.5" })).toEqual({
      name: "Сад",
      width: 20,
      length: 30.5,
    });
  });

  it("keeps money exact and rejects invalid precision", () => {
    expect(
      expenseSchema.parse({
        category: "Материалы",
        amount: "1250.50",
        date: "2026-09-03",
        plotObjectId: "",
        description: "",
      }).amount,
    ).toBe("1250.50");
    expect(
      expenseSchema.safeParse({
        category: "Материалы",
        amount: "1.999",
        date: "2026-09-03",
        plotObjectId: "",
        description: "",
      }).success,
    ).toBe(false);
  });

  it("validates object bounds", () => {
    const result = createObjectSchema({ width: 10, length: 10 }).safeParse({
      type: "building",
      name: "Дом",
      x: "9",
      y: "0",
      width: "2",
      length: "2",
      height: "3",
    });
    expect(result.success).toBe(false);
  });

  it("allows an optional planned budget", () => {
    expect(
      taskSchema.parse({
        title: "Полить",
        dueDate: "2026-09-03",
        plannedBudget: "",
        description: "",
      }).plannedBudget,
    ).toBeNull();
  });
});
