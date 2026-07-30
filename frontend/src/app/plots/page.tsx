"use client";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FieldError } from "@/components/FieldError";
import { errorDetails } from "@/lib/api";
import { StatusMessage } from "@/components/StatusMessage";
import { collect, positive, required, type FieldErrors } from "@/lib/validation";
import { useAuthStore } from "@/stores/auth-store";
import { useDataStore } from "@/stores/data-store";

export default function PlotsPage() {
  const router=useRouter();const status=useAuthStore((s)=>s.status);const {plots,loading,error,loadPlots,createPlot,updatePlot,deletePlot}=useDataStore();const [editing,setEditing]=useState<string|null>(null);const [errors,setErrors]=useState<FieldErrors>({});
  useEffect(()=>{if(status==="unauthenticated")router.replace("/login");if(status==="authenticated")void loadPlots();},[status,router,loadPlots]);
  function values(form:HTMLFormElement){const data=new FormData(form);return{name:String(data.get("name")).trim(),width:Number(data.get("width")),length:Number(data.get("length"))}}
  function validate(form:HTMLFormElement){const data=new FormData(form);const next=collect([["name",required(String(data.get("name")),"Название")],["width",positive(String(data.get("width")),"Ширина")],["length",positive(String(data.get("length")),"Длина")]]);setErrors(next);return Object.keys(next).length===0}
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!validate(event.currentTarget))return;const created=await createPlot(values(event.currentTarget)).catch((error)=>{setErrors(errorDetails(error));return null});if(created)router.push(`/plots/${created.id}/plan`)}
  async function save(event:FormEvent<HTMLFormElement>,id:string){event.preventDefault();if(!validate(event.currentTarget))return;await updatePlot(id,values(event.currentTarget)).then(()=>setEditing(null)).catch((error)=>setErrors(errorDetails(error)))}
  async function remove(id:string,name:string){if(confirm(`Удалить участок «${name}» и все связанные данные?`))await deletePlot(id).catch(()=>undefined)}
  if(status!=="authenticated")return <p>Проверка авторизации…</p>;
  return <div className="space-y-5"><div><h1 className="text-3xl font-bold">Мои участки</h1><p className="mt-1 text-slate-600">Создавайте и открывайте независимые планы.</p></div><StatusMessage error={error} loading={loading}/><form onSubmit={submit} onBlur={(e)=>{if(e.target instanceof HTMLInputElement)validate(e.currentTarget)}} noValidate className="panel grid gap-3 md:grid-cols-[1fr_160px_160px_auto]"><label className="field">Название<input className="input" name="name" aria-invalid={Boolean(errors.name)}/><FieldError message={errors.name}/></label><label className="field">Ширина, м<input className="input" name="width" inputMode="decimal"/><FieldError message={errors.width}/></label><label className="field">Длина, м<input className="input" name="length" inputMode="decimal"/><FieldError message={errors.length}/></label><button className="button self-end" disabled={loading}>Создать</button></form><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{plots.map((plot)=>editing===plot.id?<form key={plot.id} onSubmit={(e)=>void save(e,plot.id)} className="panel space-y-3"><input className="input w-full" name="name" defaultValue={plot.name}/><div className="grid grid-cols-2 gap-2"><input className="input" name="width" defaultValue={plot.width}/><input className="input" name="length" defaultValue={plot.length}/></div><div className="flex gap-2"><button className="button">Сохранить</button><button type="button" className="input" onClick={()=>setEditing(null)}>Отмена</button></div></form>:<article key={plot.id} className="panel"><h2 className="text-xl font-semibold">{plot.name}</h2><p className="mt-1 text-slate-500">{plot.width} × {plot.length} м</p><div className="mt-4 flex flex-wrap gap-2"><Link className="button" href={`/plots/${plot.id}/plan`}>Открыть</Link><button className="input" onClick={()=>setEditing(plot.id)}>Изменить</button><button className="input text-red-700" onClick={()=>void remove(plot.id,plot.name)}>Удалить</button></div></article>)}</div>{plots.length===0&&!loading&&<p className="text-slate-500">Участков пока нет.</p>}</div>;
}
