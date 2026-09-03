import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { errorDetails } from "@/lib/api";

export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
) {
  const entries = Object.entries(errorDetails(error));
  if (entries.length === 0) {
    setError("root.server", { message: error instanceof Error ? error.message : "Ошибка запроса" });
    return;
  }
  for (const [field, message] of entries) setError(field as Path<T>, { message });
}
