import { useCallback, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import type { Category, ItemType, Section } from "@/types/Catalog";
import type { ClientItem } from "@/types/ClientItem";
import {
  useCatalogStore,
  selectCategories,
  selectSections,
  selectItemTypes,
} from "@/store/useCatalogStore";
import {
  selectClientItems,
  selectClientItemsByClientId,
  useClientItemStore,
} from "@/store/useClientItemStore";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import EmptyArray from "@/components/shared/EmptyArray";
import ItemCard from "@/components/items/ItemCard";

const ClientCatalogPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId } = useParams<{ categoryId: string }>();
  const categories = useCatalogStore(selectCategories);
  const sections = useCatalogStore(selectSections);
  const itemTypes = useCatalogStore(selectItemTypes);
  const itemsByClient = useClientItemStore(selectClientItemsByClientId); //Despues cambiar por selectClientItemsByClientId

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

  const categorySections = useMemo<Section[] | null>(() => {
    return sections.filter((s) => String(s.categoryId) === categoryId) ?? null;
  }, [sections, categoryId]);

  const categoryClientItems = useMemo<ClientItem[] | null>(() => {
    return (
      itemsByClient.filter((i) => String(i.categoryId) === categoryId) ?? null
    );
  }, [itemsByClient, categoryId]);

  const selectedSection = useMemo<Section | null>(
    () =>
      categorySections?.find((s) => String(s.id) === selectedSectionId) ?? null,
    [categorySections, selectedSectionId]
  );

  const sectionItemTypes = useMemo<ItemType[] | null>(
    () =>
      selectedSection
        ? itemTypes.filter(
            (it) => String(it.sectionId) === String(selectedSection.id)
          )
        : null,
    [itemTypes, selectedSection]
  );

  const sectionClientItems = useMemo<ClientItem[] | null>(
    () =>
      selectedSectionId
        ? itemsByClient.filter((i) => i.sectionId === selectedSectionId)
        : null,
    [itemsByClient, selectedSectionId]
  );

  const selectedItemType = useMemo<ItemType | null>(
    () =>
      sectionItemTypes?.find((it) => String(it.id) === selectedItemTypeId) ??
      null,
    [sectionItemTypes, selectedItemTypeId]
  );

  const clientItemsByType = useMemo<ClientItem[] | null>(
    () =>
      selectedItemTypeId
        ? itemsByClient.filter((i) => i.itemTypeId === selectedItemTypeId)
        : null,
    [itemsByClient, selectedItemTypeId]
  );

  const handleToggleSection = useCallback((sectionId: string | null) => {
    setSelectedSectionId((prev) => (prev === sectionId ? null : sectionId));
    setSelectedItemTypeId(null);
  }, []);

  const handleToggleItemType = useCallback((itemTypeId: string | null) => {
    setSelectedItemTypeId((prev) => (prev === itemTypeId ? null : itemTypeId));
  }, []);

  console.log(location.pathname);

  const handleViewDetails = (item: ClientItem) => {
    navigate(`/dashboard/item/${item.id}`, {
      state: { prevRoute: location.pathname },
    });
  };

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
  console.log("Secciones: " + typeof categorySections);
  console.log("Tipos: " + sectionItemTypes);
  console.log("Items: " + clientItemsByType);

  return (
    <div>
      <Card className="w-2/4 my-5 mb-8 place-self-center border-gray-200 shadow-sm cursor-default">
        <CardHeader>
          <CardTitle className="capitalize text-center text-3xl">
            {category?.name}
          </CardTitle>
        </CardHeader>
      </Card>

      {categoryClientItems && categoryClientItems.length > 0 ? (
        <div className="grid grid-cols-1 pr-10 gap-4">
          {categoryClientItems.map((item) => {
            return (
              <ItemCard
                key={item.id}
                item={item}
                onViewDetails={handleViewDetails}
              />
            );
          })}
        </div>
      ) : categorySections?.length === 0 ? (
        <EmptyArray
          title="No hay ítems aún"
          subtitle="Todavía no se cargaron ítems para esta categoría."
        />
      ) : null}

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
      ) : categorySections ? (
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
      ) : categoryClientItems?.length === 0 ? (
        <EmptyArray
          title="No hay secciones en esta categoría"
          subtitle="Probá con otra categoría o creá una nueva sección."
        />
      ) : null}

      {sectionClientItems && sectionClientItems.length > 0 ? (
        <div className="grid grid-cols-1 pr-10 gap-4">
          {sectionClientItems.map((item) => {
            return (
              <ItemCard
                key={item.id}
                item={item}
                onViewDetails={handleViewDetails}
              />
            );
          })}
        </div>
      ) : sectionItemTypes?.length === 0 ? (
        <EmptyArray
          title="No hay ítems aún"
          subtitle="Todavía no se cargaron ítems para esta sección."
        />
      ) : null}

      {selectedSection &&
      !selectedItemType &&
      sectionClientItems?.length === 0 &&
      sectionItemTypes ? (
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
      ) : sectionClientItems?.length === 0 && sectionItemTypes?.length === 0 ? (
        <EmptyArray
          title="Esta sección no tiene tipos"
          subtitle="Agregá un tipo para empezar a cargar ítems."
        />
      ) : null}

      {selectedItemType ? (
        <Card
          role="button"
          tabIndex={0}
          onClick={() => handleToggleItemType(null)}
          className="w-2/4 my-5 mb-8 place-self-center border-gray-200 shadow-sm cursor-pointer"
        >
          <CardHeader>
            <CardTitle className="capitalize text-center text-xl">
              {selectedItemType.name}
            </CardTitle>
          </CardHeader>
        </Card>
      ) : null}

      {selectedItemType ? (
        clientItemsByType && clientItemsByType.length > 0 ? (
          <div className="grid grid-cols-1 pr-10 gap-4">
            {clientItemsByType.map((item) => {
              return (
                <ItemCard
                  key={item.id}
                  item={item}
                  onViewDetails={handleViewDetails}
                />
              );
            })}
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
