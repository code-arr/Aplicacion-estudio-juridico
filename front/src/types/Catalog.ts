// Estructura general
export interface Category {
  id: string;
  name: string;
}

export interface Section {
  id: string;
  name: string;
  categoryId: string;
}

export interface ItemType {
  id: string;
  name: string;
  sectionId: string;
}
