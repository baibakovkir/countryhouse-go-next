import type { BuildingKind, FloorElementCategory } from "@/types/domain";

export interface CatalogItem {
  key: string;
  label: string;
  category: FloorElementCategory;
  kinds: BuildingKind[];
  width: number;
  length: number;
  height: number;
}
const all: BuildingKind[] = ["house", "garage", "bathhouse", "outbuilding", "custom"];
export const buildingCatalog: CatalogItem[] = [
  { key: "room", label: "Комната", category: "room", kinds: all, width: 3, length: 3, height: 0 },
  {
    key: "wall",
    label: "Стена",
    category: "wall",
    kinds: all,
    width: 3,
    length: 0.15,
    height: 2.7,
  },
  {
    key: "door",
    label: "Дверь",
    category: "opening",
    kinds: all,
    width: 0.9,
    length: 0.15,
    height: 2.1,
  },
  {
    key: "window",
    label: "Окно",
    category: "opening",
    kinds: all,
    width: 1.4,
    length: 0.12,
    height: 1.4,
  },
  {
    key: "stairs",
    label: "Лестница",
    category: "equipment",
    kinds: all,
    width: 1,
    length: 3,
    height: 2.8,
  },
  {
    key: "kitchen",
    label: "Кухонная зона",
    category: "furniture",
    kinds: ["house"],
    width: 2.4,
    length: 0.6,
    height: 0.9,
  },
  {
    key: "bathroom",
    label: "Санузел",
    category: "room",
    kinds: ["house", "bathhouse"],
    width: 2,
    length: 2,
    height: 0,
  },
  {
    key: "garage_door",
    label: "Гаражные ворота",
    category: "opening",
    kinds: ["garage"],
    width: 3,
    length: 0.2,
    height: 2.4,
  },
  {
    key: "parking",
    label: "Машиноместо",
    category: "room",
    kinds: ["garage"],
    width: 3,
    length: 6,
    height: 0,
  },
  {
    key: "workbench",
    label: "Верстак",
    category: "furniture",
    kinds: ["garage", "outbuilding"],
    width: 1.8,
    length: 0.7,
    height: 0.9,
  },
  {
    key: "steam_room",
    label: "Парная",
    category: "room",
    kinds: ["bathhouse"],
    width: 2.5,
    length: 2.5,
    height: 0,
  },
  {
    key: "sauna_stove",
    label: "Печь",
    category: "equipment",
    kinds: ["bathhouse"],
    width: 0.8,
    length: 0.8,
    height: 1.2,
  },
  {
    key: "sauna_bench",
    label: "Полок",
    category: "furniture",
    kinds: ["bathhouse"],
    width: 2,
    length: 0.7,
    height: 0.8,
  },
  {
    key: "drain",
    label: "Слив",
    category: "utility",
    kinds: ["bathhouse", "garage"],
    width: 0.25,
    length: 0.25,
    height: 0,
  },
  {
    key: "custom",
    label: "Свой элемент",
    category: "custom",
    kinds: all,
    width: 1,
    length: 1,
    height: 1,
  },
];
export const catalogFor = (kind: BuildingKind) =>
  buildingCatalog.filter((item) => item.kinds.includes(kind));
