export function StatusMessage({ error, loading }: { error: string | null; loading: boolean }) {
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  if (loading) return <p className="text-sm text-slate-500">Загрузка…</p>;
  return null;
}

