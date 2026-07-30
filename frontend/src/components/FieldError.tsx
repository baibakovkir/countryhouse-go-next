export function FieldError({ message }: { message?: string }) { return message ? <span className="text-xs font-normal text-red-700" role="alert">{message}</span> : null; }
