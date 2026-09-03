"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { type FieldErrors, type UseFormRegister, useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";
import { createAuthSchema, type AuthFormValues } from "@/features/auth/auth-input";
import { applyServerErrors } from "@/lib/forms";
import { useAuthStore } from "@/stores/auth-store";

type AuthMode = "login" | "register";
const copy = {
  login: {
    title: "Вход",
    submit: "Войти",
    lead: "Нет аккаунта? ",
    link: "Зарегистрироваться",
    href: "/register",
    autoComplete: "current-password",
  },
  register: {
    title: "Регистрация",
    submit: "Создать аккаунт",
    lead: "Уже есть аккаунт? ",
    link: "Войти",
    href: "/login",
    autoComplete: "new-password",
  },
} as const;

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const { status, login, register, loading, error: apiError } = useAuthStore();
  const isRegistration = mode === "register";
  const text = copy[mode];
  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(createAuthSchema(isRegistration)),
    defaultValues: { email: "", password: "", confirmation: "" },
    mode: "onBlur",
  });

  useEffect(() => {
    if (status === "authenticated") router.replace("/plots");
  }, [status, router]);

  const submit = handleSubmit(async ({ email, password }) => {
    const authenticate = isRegistration ? register : login;
    await authenticate({ email, password })
      .then(() => router.replace("/plots"))
      .catch((error) => applyServerErrors(error, setError));
  });

  return (
    <form noValidate onSubmit={submit} className="panel w-full max-w-md space-y-4">
      <div>
        <p className="eyebrow">Планировщик участка</p>
        <h1 className="mt-1 text-2xl font-bold">{text.title}</h1>
      </div>
      {(apiError || errors.root?.server?.message) && (
        <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {errors.root?.server?.message ?? apiError}
        </p>
      )}
      <AuthFields
        register={field}
        errors={errors}
        confirmation={isRegistration}
        autoComplete={text.autoComplete}
      />
      <Button className="w-full" disabled={loading}>
        {text.submit}
      </Button>
      <p className="text-sm text-slate-600">
        {text.lead}
        <Link className="font-semibold text-emerald-700 underline" href={text.href}>
          {text.link}
        </Link>
      </p>
    </form>
  );
}

function AuthFields({
  register,
  errors,
  confirmation,
  autoComplete,
}: {
  register: UseFormRegister<AuthFormValues>;
  errors: FieldErrors<AuthFormValues>;
  confirmation: boolean;
  autoComplete: string;
}) {
  return (
    <>
      <TextField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        label="Пароль"
        type="password"
        autoComplete={autoComplete}
        error={errors.password?.message}
        {...register("password")}
      />
      {confirmation && (
        <TextField
          label="Повторите пароль"
          type="password"
          autoComplete="new-password"
          error={errors.confirmation?.message}
          {...register("confirmation")}
        />
      )}
    </>
  );
}
