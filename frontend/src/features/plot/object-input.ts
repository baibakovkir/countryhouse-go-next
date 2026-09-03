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

const pointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  z: z.number().finite(),
});

function minimumPointCount(geometry: "footprint" | "polyline" | "polygon") {
  if (geometry === "polygon") return 3;
  if (geometry === "polyline") return 2;
  return 0;
}

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
            return z.array(pointSchema).parse(points);
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
      const minimumPoints = minimumPointCount(value.geometry);
      if (value.points.length < minimumPoints) {
        context.addIssue({
          code: "custom",
          path: ["points"],
          message: `Добавьте минимум ${minimumPoints} точки`,
        });
      }
      for (const point of value.points) {
        if (point.x < 0 || point.y < 0 || point.x > plot.width || point.y > plot.length) {
          context.addIssue({
            code: "custom",
            path: ["points"],
            message: "Все точки должны быть в границах участка",
          });
          break;
        }
      }
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
