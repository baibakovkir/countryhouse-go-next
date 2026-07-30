import { collect, date, money, required, type FieldErrors } from "@/lib/validation";
import type { CreateExpense } from "@/types/domain";

export function readExpenseInput(form: HTMLFormElement): CreateExpense {
  const data = new FormData(form);
  const plotObjectId = String(data.get("plotObjectId"));
  return {
    plotObjectId: plotObjectId || null,
    category: String(data.get("category")).trim(),
    amount: String(data.get("amount")),
    currency: "RUB",
    date: String(data.get("date")),
    description: String(data.get("description")).trim(),
  };
}

export function validateExpenseInput(form: HTMLFormElement): FieldErrors {
  const data = new FormData(form);
  return collect([
    ["category", required(String(data.get("category")), "Категория")],
    ["amount", money(String(data.get("amount")))],
    ["date", date(String(data.get("date")))],
  ]);
}
