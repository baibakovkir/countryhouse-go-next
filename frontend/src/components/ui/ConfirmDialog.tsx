"use client";

import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "@/components/ui/Button";

interface ConfirmDialogProps {
  title: string;
  description: string;
  triggerLabel?: string;
  onConfirm(): void;
}

export function ConfirmDialog({
  title,
  description,
  triggerLabel = "Удалить",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger render={<Button type="button" variant="danger" />}>
        {triggerLabel}
      </AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm" />
        <AlertDialog.Viewport className="fixed inset-0 z-50 grid place-items-center p-4">
          <AlertDialog.Popup className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl outline-none">
            <AlertDialog.Title className="text-xl font-bold text-slate-950">
              {title}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </AlertDialog.Description>
            <div className="mt-6 flex justify-end gap-3">
              <AlertDialog.Close render={<Button type="button" variant="secondary" />}>
                Отмена
              </AlertDialog.Close>
              <AlertDialog.Close
                render={<Button type="button" variant="danger" onClick={onConfirm} />}
              >
                Удалить
              </AlertDialog.Close>
            </div>
          </AlertDialog.Popup>
        </AlertDialog.Viewport>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
