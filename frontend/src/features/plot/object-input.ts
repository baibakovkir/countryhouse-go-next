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

export function createObjectSchema(plot: Pick<Plot, "width" | "length">) {
  return z
    .object({
      type: z.enum(["building", "garden_bed", "tree"]),
      name: z.string().trim().min(1, "Название обязательно"),
      x: metric("X", true),
      y: metric("Y", true),
      width: metric("Ширина"),
      length: metric("Длина"),
      height: metric("Высота", true),
      z: z.literal(0).default(0),
    })
    .superRefine((value, context) => {
      if (value.x + value.width > plot.width) {
        context.addIssue({
          code: "custom",
          path: ["width"],
          message: "Объект выходит за ширину участка",
        });
      }
      if (value.y + value.length > plot.length) {
        context.addIssue({
          code: "custom",
          path: ["length"],
          message: "Объект выходит за длину участка",
        });
      }
    });
}

export type ObjectFormValues = {
  type: "building" | "garden_bed" | "tree";
  name: string;
  x: string;
  y: string;
  width: string;
  length: string;
  height: string;
  z?: 0;
};
export type ObjectFormOutput = z.output<ReturnType<typeof createObjectSchema>>;
