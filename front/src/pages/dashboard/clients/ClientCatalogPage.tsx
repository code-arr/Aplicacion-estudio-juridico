import { useCatalogStore } from "@/store/useCatalogStore";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@components/ui/card";
import type { ItemType, Section } from "@/types/Catalog";

const ClientCatalogPage = () => {
  const { categoryId } = useParams();
  const { categories, sections, itemTypes } = useCatalogStore();
  const [actualCategoryName, setActualCategoryName] = useState("");
  const [categorySections, setCategorySections] = useState<Section[]>([]);
  const [actualSection, setActualSection] = useState<Section | null>(null);
  const [sectionItemTypes, setSectionItemTypes] = useState<ItemType[]>([]);

  const handleActualSection = (section: Section | null) => {
    if (actualSection === section) setActualSection(null);
    else setActualSection(section);
  };

  useEffect(() => {
    if (actualSection !== null) {
      const sectionItemTypes = itemTypes.filter(
        (itemType) => itemType.sectionId === actualSection?.id
      );
      setSectionItemTypes(sectionItemTypes);
    }
  }, [itemTypes, actualSection]);

  useEffect(() => {
    const categorySections = sections.filter(
      (section) => section.categoryId === categoryId
    );
    setCategorySections(categorySections);
  }, [sections, categoryId]);

  useEffect(() => {
    const category = categories.find((category) => {
      return category.id === categoryId;
    });

    if (category === undefined) {
      setActualCategoryName("");
    } else setActualCategoryName(category?.name);
  }, [categories, categoryId]);
  return (
    <div>
      <Card className="w-2/4 my-5 mb-8 place-self-center border-gray-200 shadow-sm cursor-default">
        <CardHeader>
          <CardTitle className="capitalize text-center text-3xl">
            {actualCategoryName}
          </CardTitle>
        </CardHeader>
      </Card>

      {actualSection ? (
        <Card
          onClick={() => handleActualSection(null)}
          className="w-2/4 my-5 mb-8 place-self-center border-gray-200 shadow-sm cursor-pointer"
        >
          <CardHeader>
            <CardTitle className="capitalize text-center">
              {actualSection.name}
            </CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex flex-wrap justify-center gap-6 px-4">
          {categorySections.map((section) => (
            <Card
              id={section.id}
              onClick={() => handleActualSection(section)}
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
      )}

      {actualSection && (
        <div className="flex flex-wrap justify-center gap-5 px-4">
          {sectionItemTypes.map((itemType) => (
            <Card
              id={itemType.id}
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
      )}
    </div>
  );
};

export default ClientCatalogPage;
