import { useCallback, useMemo, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import type { Category, ItemType, Section } from "@/types/Catalog";
import type { ClientItem } from "@/types/ClientItem";
import {
  useCatalogStore,
  selectCategories,
  selectSections,
  selectItemTypes,
} from "@/store/useCatalogStore";
import {
  selectClientItemsByClientId,
  useClientItemStore,
} from "@/store/useClientItemStore";
import { Card, CardHeader, CardTitle } from "@components/ui/card";
import EmptyArray from "@components/shared/EmptyArray";

const ClientCatalogPage = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const categories = useCatalogStore(selectCategories);
  const sections = useCatalogStore(selectSections);
  const itemTypes = useCatalogStore(selectItemTypes);
  const itemsByClient = useClientItemStore(selectClientItemsByClientId);

  // Estado mínimo: solo lo que el usuario elige
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const [selectedItemTypeId, setSelectedItemTypeId] = useState<string | null>(
    null
  );

  // Derivados por memo (sin useEffect)
  const category = useMemo(
    () => categories.find((c) => String(c.id) === categoryId),
    [categories, categoryId]
  );

  const categorySections = useMemo<Section[]>(
    () => sections.filter((s) => String(s.categoryId) === categoryId),
    [sections, categoryId]
  );

  const selectedSection = useMemo<Section | null>(
    () =>
      categorySections.find((s) => String(s.id) === selectedSectionId) ?? null,
    [categorySections, selectedSectionId]
  );

  const sectionItemTypes = useMemo<ItemType[]>(
    () =>
      selectedSection
        ? itemTypes.filter(
            (it) => String(it.sectionId) === String(selectedSection.id)
          )
        : [],
    [itemTypes, selectedSection]
  );

  const selectedItemType = useMemo<ItemType | null>(
    () =>
      sectionItemTypes.find((it) => String(it.id) === selectedItemTypeId) ??
      null,
    [sectionItemTypes, selectedItemTypeId]
  );

  const clientItemsByType = useMemo(
    () =>
      selectedItemTypeId
        ? itemsByClient.filter((i) => i.itemTypeId === selectedItemTypeId)
        : [],
    [itemsByClient, selectedItemTypeId]
  );

  const handleToggleSection = useCallback((sectionId: string | null) => {
    setSelectedSectionId((prev) => (prev === sectionId ? null : sectionId));
    setSelectedItemTypeId(null);
  }, []);

  const handleToggleItemType = useCallback((itemTypeId: string | null) => {
    setSelectedItemTypeId((prev) => (prev === itemTypeId ? null : itemTypeId));
  }, []);

  //ANALIZAR

  /*

  const handleKeyActivate = (e: React.KeyboardEvent, sectionId: string | null) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggleSection(sectionId);
    }
  }; 
  */

  if (!category) {
    return (
      <div className="w-full max-w-3xl mx-auto my-8 text-center">
        <p className="text-sm text-gray-500">
          La categoría no existe o no está disponible.
        </p>
        {/* <Button onClick={() => navigate(-1)}>Volver</Button> */}
      </div>
    );
  }

  return (
    <div>
      <Card className="w-2/4 my-5 mb-8 place-self-center border-gray-200 shadow-sm cursor-default">
        <CardHeader>
          <CardTitle className="capitalize text-center text-3xl">
            {category?.name}
          </CardTitle>
        </CardHeader>
      </Card>

      {selectedSection ? (
        <Card
          role="button"
          tabIndex={0}
          onClick={() => handleToggleSection(null)}
          className="w-2/4 my-5 mb-8 place-self-center border-gray-200 shadow-sm cursor-pointer"
        >
          <CardHeader>
            <CardTitle className="capitalize text-center">
              {selectedSection.name}
            </CardTitle>
          </CardHeader>
        </Card>
      ) : categorySections.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-6 px-4">
          {categorySections.map((section) => (
            <Card
              key={section.id}
              role="button"
              tabIndex={0}
              onClick={() => handleToggleSection(section.id)}
              className="w-52 h-40 place-self-center place-content-center border-gray-200 shadow-sm cursor-pointer"
            >
              <CardHeader>
                <CardTitle className="capitalize text-center">
                  {section.name}
                </CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyArray
          title="No hay secciones en esta categoría"
          subtitle="Probá con otra categoría o creá una nueva sección."
        />
      )}

      {selectedSection ? (
        sectionItemTypes.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-5 px-4">
            {sectionItemTypes.map((itemType) => (
              <Card
                key={itemType.id}
                role="button"
                tabIndex={0}
                onClick={() => handleToggleItemType(itemType.id)}
                className="w-52 h-36 place-self-center place-content-center border-gray-200 shadow-sm cursor-pointer"
              >
                <CardHeader>
                  <CardTitle className="capitalize text-center text-xl">
                    {itemType.name}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyArray
            title="Esta sección no tiene tipos"
            subtitle="Agregá un tipo para empezar a cargar ítems."
          />
        )
      ) : null}

      {selectedItemType ? (
        clientItemsByType.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-5 px-4">
            {clientItemsByType.map((item) => (
              <NavLink key={item.id} to={`/item/${item.id}`}>
                <Card
                  role="button"
                  tabIndex={0}
                  className="w-52 h-36 place-self-center place-content-center border-gray-200 shadow-sm cursor-pointer"
                >
                  <CardHeader>
                    <CardTitle className="capitalize text-center text-xl">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </NavLink>
            ))}
          </div>
        ) : (
          <EmptyArray
            title="No hay ítems en este tipo"
            subtitle="Todavía no se cargaron ítems para este tipo."
          />
        )
      ) : null}
    </div>
  );
};

export default ClientCatalogPage;
