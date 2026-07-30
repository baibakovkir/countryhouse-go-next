export type FieldErrors = Record<string, string>;

const moneyPattern = /^(0|[1-9][0-9]{0,11})(\.[0-9]{1,2})?$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function required(value: string, label = "Поле"): string | undefined {
  return value.trim() ? undefined : `${label} обязательно`;
}

export function email(value: string): string | undefined {
  if (!emailPattern.test(value.trim().toLowerCase()) || value.length > 254) {
    return "Введите корректный email";
  }
}

export function password(value: string): string | undefined {
  if (value.length < 12) return "Минимум 12 символов";
  if (new TextEncoder().encode(value).length > 72) return "Пароль не должен превышать 72 байта";
}

export function positive(value: string, label = "Значение"): string | undefined {
  if (value.trim() === "" || !Number.isFinite(Number(value)) || Number(value) <= 0) {
    return `${label} должно быть больше нуля`;
  }
}

export function nonNegative(value: string, label = "Значение"): string | undefined {
  if (value.trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0) {
    return `${label} не может быть отрицательным`;
  }
}

export function money(value: string, allowZero = false): string | undefined {
  if (moneyPattern.test(value) && (allowZero || Number(value) !== 0)) return;
  return allowZero
    ? "Введите сумму от 0 с точностью до копеек"
    : "Введите сумму больше 0 с точностью до копеек";
}

export function date(value: string): string | undefined {
  const parsed = new Date(`${value}T00:00:00Z`);
  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value;
  return valid ? undefined : "Введите корректную дату";
}

export function collect(entries: Array<[string, string | undefined]>): FieldErrors {
  return Object.fromEntries(
    entries.filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

export function validateObjectBounds(
  values: { x: string; y: string; width: string; length: string },
  plot: { width: number; length: number },
): FieldErrors {
  const errors = collect([
    ["x", nonNegative(values.x, "X")],
    ["y", nonNegative(values.y, "Y")],
    ["width", positive(values.width, "Ширина")],
    ["length", positive(values.length, "Длина")],
  ]);
  if (!errors.x && !errors.width && Number(values.x) + Number(values.width) > plot.width) {
    errors.width = "Объект выходит за ширину участка";
  }
  if (!errors.y && !errors.length && Number(values.y) + Number(values.length) > plot.length) {
    errors.length = "Объект выходит за длину участка";
  }
  return errors;
}
