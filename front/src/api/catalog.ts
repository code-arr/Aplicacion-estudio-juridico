import type { Category, Section, ItemType } from "@/types/Catalog";
import axios from "./axios";

export const getCatalogData = async (): Promise<{
  categories: Category[];
  sections: Section[];
  itemTypes: ItemType[];
}> => {
  const categories = (await axios.get("/category/getAll")).data;
  const sections = (await axios.get("/section/getAll")).data;
  const itemTypes = (await axios.get("/itemType/getAll")).data;
  return { categories, sections, itemTypes };
};
