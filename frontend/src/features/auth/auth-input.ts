import { z } from "zod";

const email = z.string().trim().toLowerCase().email("Введите корректный email").max(254);
export const createAuthSchema = (register: boolean) =>
  z
    .object({
      email,
      password: z
        .string()
        .min(register ? 12 : 1, register ? "Минимум 12 символов" : "Введите пароль"),
      confirmation: z.string(),
    })
    .superRefine((value, context) => {
      if (register && new TextEncoder().encode(value.password).length > 72) {
        context.addIssue({
          code: "custom",
          path: ["password"],
          message: "Пароль не должен превышать 72 байта",
        });
      }
      if (register && value.password !== value.confirmation) {
        context.addIssue({
          code: "custom",
          path: ["confirmation"],
          message: "Пароли не совпадают",
        });
      }
    });

export type AuthFormValues = z.input<ReturnType<typeof createAuthSchema>>;
