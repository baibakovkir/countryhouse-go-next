"use client";

import { Select } from "@base-ui/react/select";
import { FieldShell } from "@/components/ui/FormField";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectFieldProps {
  label: string;
  value: string;
  options: SelectOption[];
  error?: string;
  disabled?: boolean;
  onChange(value: string): void;
}

export function SelectField({
  label,
  value,
  options,
  error,
  disabled,
  onChange,
}: SelectFieldProps) {
  return (
    <FieldShell label={label} error={error}>
      <Select.Root
        value={value}
        items={options}
        disabled={disabled}
        onValueChange={(next) => onChange(next ?? "")}
      >
        <Select.Trigger className="ui-input flex w-full items-center justify-between text-left">
          <Select.Value />
          <Select.Icon className="text-slate-400">⌄</Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner className="z-50 outline-none" sideOffset={6}>
            <Select.Popup className="max-h-72 min-w-[var(--anchor-width)] overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl outline-none">
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="flex cursor-default items-center justify-between rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-emerald-50 data-[selected]:font-semibold data-[selected]:text-emerald-800"
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator>✓</Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </FieldShell>
  );
}
