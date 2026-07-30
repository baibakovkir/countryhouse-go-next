export type FieldErrors = Record<string, string>;
const moneyPattern = /^(0|[1-9][0-9]{0,11})(\.[0-9]{1,2})?$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const required = (value: string, label = "Поле"): string | undefined => value.trim() ? undefined : `${label} обязательно`;
export const email = (value: string): string | undefined => !emailPattern.test(value.trim().toLowerCase()) || value.length > 254 ? "Введите корректный email" : undefined;
export const password = (value: string): string | undefined => value.length < 12 ? "Минимум 12 символов" : new TextEncoder().encode(value).length > 72 ? "Пароль не должен превышать 72 байта" : undefined;
export const positive = (value: string, label = "Значение"): string | undefined => value.trim() === "" || !Number.isFinite(Number(value)) || Number(value) <= 0 ? `${label} должно быть больше нуля` : undefined;
export const nonNegative = (value: string, label = "Значение"): string | undefined => value.trim() === "" || !Number.isFinite(Number(value)) || Number(value) < 0 ? `${label} не может быть отрицательным` : undefined;
export const money = (value: string, allowZero = false): string | undefined => !moneyPattern.test(value) || (!allowZero && Number(value) === 0) ? allowZero ? "Введите сумму от 0 с точностью до копеек" : "Введите сумму больше 0 с точностью до копеек" : undefined;
export const date = (value: string): string | undefined => { const parsed = new Date(`${value}T00:00:00Z`); return !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value ? "Введите корректную дату" : undefined; };
export function collect(entries: Array<[string, string | undefined]>): FieldErrors { return Object.fromEntries(entries.filter((entry): entry is [string, string] => Boolean(entry[1]))); }
export function validateObjectBounds(values: { x: string; y: string; width: string; length: string }, plot: { width: number; length: number }): FieldErrors {
  const errors = collect([["x", nonNegative(values.x, "X")], ["y", nonNegative(values.y, "Y")], ["width", positive(values.width, "Ширина")], ["length", positive(values.length, "Длина")]]);
  if (!errors.x && !errors.width && Number(values.x) + Number(values.width) > plot.width) errors.width = "Объект выходит за ширину участка";
  if (!errors.y && !errors.length && Number(values.y) + Number(values.length) > plot.length) errors.length = "Объект выходит за длину участка";
  return errors;
}
