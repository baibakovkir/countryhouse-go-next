import { z } from "zod";

const moneyPattern = /^(0|[1-9][0-9]{0,11})(\.[0-9]{1,2})?$/;

export const expenseSchema = z.object({
  category: z.string().trim().min(1, "Категория обязательна"),
  amount: z
    .string()
    .regex(moneyPattern, "Введите сумму больше 0 с точностью до копеек")
    .refine((value) => Number(value) > 0, "Введите сумму больше 0 с точностью до копеек"),
  date: z.iso.date("Введите корректную дату"),
  plotObjectId: z.string().transform((value) => value || null),
  description: z.string().trim(),
  currency: z.literal("RUB").default("RUB"),
});

export type ExpenseFormValues = z.input<typeof expenseSchema>;
export type ExpenseFormOutput = z.output<typeof expenseSchema>;
