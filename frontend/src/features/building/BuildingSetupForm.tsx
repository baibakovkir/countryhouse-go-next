"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/FormField";
import { SelectField } from "@/components/ui/SelectField";
import type {
  BuildingConfig,
  BuildingKind,
  CreateBuildingFloor,
  SaveBuildingConfig,
} from "@/types/domain";

const schema = z.object({
  kind: z.enum(["house", "garage", "bathhouse", "outbuilding", "custom"]),
  roofType: z.enum(["gable", "hip", "flat", "shed"]),
  wallMaterial: z.enum(["wood", "brick", "block", "siding", "custom"]),
  floorCount: z.coerce.number().int().min(1).max(5),
  floorHeight: z.coerce.number().positive().max(10),
});
type Values = z.input<typeof schema>;
type Output = z.output<typeof schema>;
const options = {
  kind: [
    { value: "house", label: "Дом" },
    { value: "garage", label: "Гараж" },
    { value: "bathhouse", label: "Баня" },
    { value: "outbuilding", label: "Хозблок" },
    { value: "custom", label: "Другое" },
  ],
  roofType: [
    { value: "gable", label: "Двускатная" },
    { value: "hip", label: "Вальмовая" },
    { value: "flat", label: "Плоская" },
    { value: "shed", label: "Односкатная" },
  ],
  wallMaterial: [
    { value: "wood", label: "Дерево" },
    { value: "brick", label: "Кирпич" },
    { value: "block", label: "Блок" },
    { value: "siding", label: "Сайдинг" },
    { value: "custom", label: "Другой" },
  ],
};

// eslint-disable-next-line max-lines-per-function, complexity
export function BuildingSetupForm({
  current,
  loading,
  onSave,
}: {
  current: BuildingConfig | null;
  loading: boolean;
  onSave(config: SaveBuildingConfig, floors: CreateBuildingFloor[]): Promise<void>;
}) {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values, unknown, Output>({
    resolver: zodResolver(schema),
    defaultValues: {
      kind: current?.kind ?? "house",
      roofType: current?.roofType ?? "gable",
      wallMaterial: current?.wallMaterial ?? "wood",
      floorCount: current?.floors.length || 1,
      floorHeight: current?.floors[0]?.height ?? 2.8,
    },
  });
  const submit = handleSubmit(async (value) =>
    onSave(
      {
        kind: value.kind,
        roofType: value.roofType,
        wallMaterial: value.wallMaterial,
        properties: {},
      },
      Array.from({ length: value.floorCount }, (_, index) => ({
        level: index + 1,
        name: index === 0 ? "Первый этаж" : `${index + 1}-й этаж`,
        height: value.floorHeight,
      })),
    ),
  );
  return (
    <form className="panel mx-auto max-w-2xl space-y-5" onSubmit={submit} noValidate>
      <div>
        <p className="eyebrow">Настройка строения</p>
        <h1 className="text-2xl font-bold">Каким будет здание?</h1>
        <p className="mt-2 text-slate-600">
          Выберите назначение — мы предложим подходящие элементы и внешний вид.
        </p>
      </div>
      <Controller
        name="kind"
        control={control}
        render={({ field }) => (
          <SelectField
            label="Назначение"
            value={field.value}
            options={options.kind}
            onChange={field.onChange}
          />
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          name="roofType"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Крыша"
              value={field.value}
              options={options.roofType}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          name="wallMaterial"
          control={control}
          render={({ field }) => (
            <SelectField
              label="Материал фасада"
              value={field.value}
              options={options.wallMaterial}
              onChange={field.onChange}
            />
          )}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Количество этажей"
          type="number"
          min="1"
          max="5"
          error={errors.floorCount?.message}
          {...register("floorCount")}
        />
        <TextField
          label="Высота этажа, м"
          inputMode="decimal"
          error={errors.floorHeight?.message}
          {...register("floorHeight")}
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        Создать планы этажей
      </Button>
    </form>
  );
}
export const buildingKindLabel = (kind: BuildingKind) =>
  options.kind.find((item) => item.value === kind)?.label ?? "Строение";
