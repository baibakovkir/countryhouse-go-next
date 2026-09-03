import { z } from "zod";

const moneyPattern = /^(0|[1-9][0-9]{0,11})(\.[0-9]{1,2})?$/;

export const taskSchema = z.object({
  title: z.string().trim().min(1, "Название обязательно"),
  dueDate: z.iso.date("Введите корректную дату"),
  plannedBudget: z
    .string()
    .refine((value) => !value || moneyPattern.test(value), "Введите сумму с точностью до копеек")
    .transform((value) => value || null),
  description: z.string().trim(),
  currency: z.literal("RUB").default("RUB"),
});

export type TaskFormValues = z.input<typeof taskSchema>;
export type TaskFormOutput = z.output<typeof taskSchema>;
