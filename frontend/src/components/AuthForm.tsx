"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FieldError } from "@/components/FieldError";
import { errorDetails } from "@/lib/api";
import { collect, email, password, type FieldErrors } from "@/lib/validation";
import { useAuthStore } from "@/stores/auth-store";

type AuthMode = "login" | "register";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { status, login, register, loading, error: apiError } = useAuthStore();
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    if (status === "authenticated") router.replace("/plots");
  }, [status, router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = validateAuthForm(event.currentTarget, mode);
    setErrors(next);
    if (Object.keys(next).length > 0) {
      event.currentTarget.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      return;
    }
    const data = new FormData(event.currentTarget);
    const input = {
      email: String(data.get("email")).trim().toLowerCase(),
      password: String(data.get("password")),
    };
    const authenticate = mode === "login" ? login : register;
    await authenticate(input)
      .then(() => router.replace("/plots"))
      .catch((error) => setErrors(errorDetails(error)));
  }

  return (
    <form noValidate onSubmit={submit} className="panel w-full max-w-md space-y-4">
      <h1 className="text-2xl font-bold">{mode === "login" ? "Вход" : "Регистрация"}</h1>
      {apiError && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{apiError}</p>}
      <AuthFields mode={mode} errors={errors} setErrors={setErrors} />
      <button className="button w-full" disabled={loading}>
        {mode === "login" ? "Войти" : "Создать аккаунт"}
      </button>
      <AuthFooter mode={mode} />
    </form>
  );
}

function validateAuthForm(form: HTMLFormElement, mode: AuthMode): FieldErrors {
  const data = new FormData(form);
  const rawPassword = String(data.get("password"));
  const passwordError = validatePassword(rawPassword, mode);
  const confirmationError =
    mode === "register" && String(data.get("confirmation")) !== rawPassword
      ? "Пароли не совпадают"
      : undefined;
  return collect([
    ["email", email(String(data.get("email")))],
    ["password", passwordError],
    ["confirmation", confirmationError],
  ]);
}

function validatePassword(value: string, mode: AuthMode) {
  if (mode === "register") return password(value);
  return value ? undefined : "Введите пароль";
}

function AuthFields({
  mode,
  errors,
  setErrors,
}: {
  mode: AuthMode;
  errors: FieldErrors;
  setErrors(value: FieldErrors | ((old: FieldErrors) => FieldErrors)): void;
}) {
  function passwordError(value: string) {
    if (mode === "register") return password(value) ?? "";
    return value ? "" : "Введите пароль";
  }
  return (
    <>
      <label className="field">
        Email
        <input
          className="input"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          onBlur={(event) =>
            setErrors((old) => ({ ...old, email: email(event.target.value) ?? "" }))
          }
        />
        <FieldError message={errors.email} />
      </label>
      <label className="field">
        Пароль
        <input
          className="input"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          aria-invalid={Boolean(errors.password)}
          onBlur={(event) =>
            setErrors((old) => ({ ...old, password: passwordError(event.target.value) }))
          }
        />
        <FieldError message={errors.password} />
      </label>
      {mode === "register" && (
        <label className="field">
          Повторите пароль
          <input
            className="input"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmation)}
          />
          <FieldError message={errors.confirmation} />
        </label>
      )}
    </>
  );
}

function AuthFooter({ mode }: { mode: AuthMode }) {
  if (mode === "login")
    return (
      <p className="text-sm text-slate-600">
        Нет аккаунта?{" "}
        <Link className="text-emerald-700 underline" href="/register">
          Зарегистрироваться
        </Link>
      </p>
    );
  return (
    <p className="text-sm text-slate-600">
      Уже есть аккаунт?{" "}
      <Link className="text-emerald-700 underline" href="/login">
        Войти
      </Link>
    </p>
  );
}
