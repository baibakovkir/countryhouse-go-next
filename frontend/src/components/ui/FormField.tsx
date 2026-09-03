"use client";

import { Field } from "@base-ui/react/field";
import type { ComponentProps } from "react";

type ControlProps = ComponentProps<typeof Field.Control>;

interface FieldShellProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

export function FieldShell({ label, error, children }: FieldShellProps) {
  return (
    <Field.Root className="flex flex-col gap-1.5" invalid={Boolean(error)}>
      <Field.Label className="text-sm font-medium text-slate-700">{label}</Field.Label>
      {children}
      <Field.Error match={Boolean(error)} className="text-xs font-medium text-red-600">
        {error}
      </Field.Error>
    </Field.Root>
  );
}

export function TextField({
  label,
  error,
  className = "",
  ...props
}: ControlProps & Omit<FieldShellProps, "children">) {
  return (
    <FieldShell label={label} error={error}>
      <Field.Control className={`ui-input ${className}`} aria-invalid={Boolean(error)} {...props} />
    </FieldShell>
  );
}

export function TextAreaField({
  label,
  error,
  className = "",
  ...props
}: Omit<ControlProps, "render"> & Omit<FieldShellProps, "children">) {
  return (
    <FieldShell label={label} error={error}>
      <Field.Control
        render={<textarea />}
        className={`ui-input min-h-24 resize-y ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </FieldShell>
  );
}
