import { collect, date, money, required, type FieldErrors } from "@/lib/validation";
import type { CreateTimelineTask } from "@/types/domain";

export function readTaskInput(form: HTMLFormElement): CreateTimelineTask {
  const data = new FormData(form);
  const plannedBudget = String(data.get("plannedBudget"));
  return {
    title: String(data.get("title")).trim(),
    dueDate: String(data.get("dueDate")),
    plannedBudget: plannedBudget || null,
    currency: "RUB",
    description: String(data.get("description")).trim(),
  };
}

export function validateTaskInput(form: HTMLFormElement): FieldErrors {
  const data = new FormData(form);
  const plannedBudget = String(data.get("plannedBudget"));
  return collect([
    ["title", required(String(data.get("title")), "Название")],
    ["dueDate", date(String(data.get("dueDate")))],
    ["plannedBudget", plannedBudget ? money(plannedBudget, true) : undefined],
  ]);
}
