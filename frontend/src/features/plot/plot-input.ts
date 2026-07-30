import { collect, positive, required, type FieldErrors } from "@/lib/validation";
import type { CreatePlot } from "@/types/domain";

export function readPlotInput(form: HTMLFormElement): CreatePlot {
  const data = new FormData(form);
  return {
    name: String(data.get("name")).trim(),
    width: Number(data.get("width")),
    length: Number(data.get("length")),
  };
}

export function validatePlotInput(form: HTMLFormElement): FieldErrors {
  const data = new FormData(form);
  return collect([
    ["name", required(String(data.get("name")), "Название")],
    ["width", positive(String(data.get("width")), "Ширина")],
    ["length", positive(String(data.get("length")), "Длина")],
  ]);
}
