import { z } from "zod";

const positiveNumber = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} обязательно`)
    .refine(
      (value) => Number.isFinite(Number(value)) && Number(value) > 0,
      `${label} должно быть больше нуля`,
    )
    .transform(Number);

export const plotSchema = z.object({
  name: z.string().trim().min(1, "Название обязательно"),
  width: positiveNumber("Ширина"),
  length: positiveNumber("Длина"),
});

export type PlotFormValues = z.input<typeof plotSchema>;
export type PlotFormOutput = z.output<typeof plotSchema>;
