import {
  collect,
  nonNegative,
  required,
  type FieldErrors,
  validateObjectBounds,
} from "@/lib/validation";
import type { CreatePlotObject, Plot, PlotObjectType } from "@/types/domain";

export function readObjectInput(form: HTMLFormElement): CreatePlotObject {
  const data = new FormData(form);
  return {
    type: String(data.get("type")) as PlotObjectType,
    name: String(data.get("name")).trim(),
    x: Number(data.get("x")),
    y: Number(data.get("y")),
    z: 0,
    width: Number(data.get("width")),
    length: Number(data.get("length")),
    height: Number(data.get("height")),
  };
}

export function validateObjectInput(form: HTMLFormElement, plot: Plot): FieldErrors {
  const data = new FormData(form);
  return {
    ...collect([
      ["name", required(String(data.get("name")), "Название")],
      ["height", nonNegative(String(data.get("height")), "Высота")],
    ]),
    ...validateObjectBounds(
      {
        x: String(data.get("x")),
        y: String(data.get("y")),
        width: String(data.get("width")),
        length: String(data.get("length")),
      },
      plot,
    ),
  };
}
