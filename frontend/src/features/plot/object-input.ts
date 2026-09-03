import { z } from "zod";
import type { Plot } from "@/types/domain";

const metric = (label: string, allowZero = false) =>
  z
    .string()
    .trim()
    .min(1, `${label} обязательно`)
    .refine(
      (value) =>
        Number.isFinite(Number(value)) && (allowZero ? Number(value) >= 0 : Number(value) > 0),
      allowZero ? `${label} не может быть отрицательным` : `${label} должно быть больше нуля`,
    )
    .transform(Number);

const signedMetric = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} обязательно`)
    .refine((value) => Number.isFinite(Number(value)), `${label} должно быть числом`)
    .transform(Number);

export function createObjectSchema(plot: Pick<Plot, "width" | "length">) {
  return z
    .object({
      type: z.enum(["building", "garden_bed", "tree", "terrace", "stairs", "utility", "custom"]),
      geometry: z.enum(["footprint", "polyline", "polygon"]).default("footprint"),
      name: z.string().trim().min(1, "Название обязательно"),
      x: metric("X", true),
      y: metric("Y", true),
      width: metric("Ширина"),
      length: metric("Длина"),
      height: metric("Высота", true),
      z: z.string().default("0").pipe(signedMetric("Z")),
      points: z
        .string()
        .trim()
        .default("[]")
        .transform((value, context) => {
          try {
            const points: unknown = JSON.parse(value);
            if (!Array.isArray(points)) throw new Error();
            return points as Array<{ x: number; y: number; z: number }>;
          } catch {
            context.addIssue({ code: "custom", message: "Точки должны быть JSON-массивом" });
            return z.NEVER;
          }
        }),
      properties: z
        .string()
        .trim()
        .default("{}")
        .transform((value, context) => {
          try {
            const properties: unknown = JSON.parse(value);
            if (!properties || typeof properties !== "object" || Array.isArray(properties))
              throw new Error();
            return properties as Record<string, unknown>;
          } catch {
            context.addIssue({ code: "custom", message: "Свойства должны быть JSON-объектом" });
            return z.NEVER;
          }
        }),
    })
    .superRefine((value, context) => {
      if (value.geometry === "footprint" && value.x + value.width > plot.width) {
        context.addIssue({
          code: "custom",
          path: ["width"],
          message: "Объект выходит за ширину участка",
        });
      }
      if (value.geometry === "footprint" && value.y + value.length > plot.length) {
        context.addIssue({
          code: "custom",
          path: ["length"],
          message: "Объект выходит за длину участка",
        });
      }
    });
}

export type ObjectFormValues = z.input<ReturnType<typeof createObjectSchema>>;
export type ObjectFormOutput = z.output<ReturnType<typeof createObjectSchema>>;
